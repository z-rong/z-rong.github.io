#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
支持 HTTP Range 的静态文件服务器（纯标准库），并额外提供 /api/move 接口：
把某首歌从 playlist.txt 的一个分类移动到另一个分类（写回文件，真正持久化）。

用法: python3 tools/serve.py [port]      # 默认 8080，根目录为项目目录
"""
import os, re, sys, json, threading, http.server

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
PLAYLIST = os.path.join(ROOT, "resource", "playlist.txt")
_LOCK = threading.Lock()


# ---------- playlist.txt 文本操作 ----------
def _sections(lines):
    """返回 [(分类名, 标题所在行号), ...]"""
    out = []
    for i, l in enumerate(lines):
        t = l.strip()
        if len(t) >= 2 and t[0] == "[" and t[-1] == "]":
            out.append((t[1:-1].strip(), i))
    return out


def _song_src(line):
    """若该行是一首歌，返回其文件路径；否则 None（注释/空行/分组标题都返回 None）"""
    t = line.strip()
    if not t or t.startswith("#"):
        return None
    if t[0] == "[" and t[-1] == "]":
        return None
    return t.split("|")[0].strip()

AUDIO_EXTS = (".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".opus", ".wma", ".aiff", ".aif")


def _audio_files():
    """列出 resource/ 目录下的所有音频文件（实时扫描，供 /api/list 使用）。"""
    d = os.path.join(ROOT, "resource")
    if not os.path.isdir(d):
        return []
    out = []
    for name in sorted(os.listdir(d)):
        if name.lower().endswith(AUDIO_EXTS) and os.path.isfile(os.path.join(d, name)):
            out.append(name)
    return out


def move_song_in_playlist(src, from_cat, to_cat):
    """把 src 指向的歌曲从 from_cat 移动到 to_cat；返回 (ok, msg)。"""
    if not os.path.isfile(PLAYLIST):
        return False, "playlist.txt 不存在"
    with open(PLAYLIST, encoding="utf-8") as f:
        lines = f.read().split("\n")

    secs = _sections(lines)
    if not secs:
        return False, "清单中没有分类"

    # 1) 在源分类里找到这首歌并摘出来
    song_line = None
    for idx, (name, hi) in enumerate(secs):
        if name != from_cat:
            continue
        end = secs[idx + 1][1] if idx + 1 < len(secs) else len(lines)
        for j in range(hi + 1, end):
            if _song_src(lines[j]) == src:
                song_line = lines[j]
                del lines[j]
                break
        break
    if song_line is None:
        return False, "在分类「%s」中没有找到该歌曲" % from_cat

    # 2) 在目标分类末尾插入
    secs = _sections(lines)
    tgt_idx = next((i for i, (n, _) in enumerate(secs) if n == to_cat), None)
    if tgt_idx is None:
        return False, "目标分类「%s」不存在" % to_cat
    _, hi = secs[tgt_idx]
    end = secs[tgt_idx + 1][1] if tgt_idx + 1 < len(secs) else len(lines)
    insert_at = hi + 1
    for j in range(hi + 1, end):
        if _song_src(lines[j]) is not None:
            insert_at = j + 1
    lines.insert(insert_at, song_line)

    # 3) 原子写回
    tmp = PLAYLIST + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    os.replace(tmp, PLAYLIST)
    return True, "ok"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ---------- GET：静态文件 + Range ----------
    def do_GET(self):
        # /api/list —— 实时列出 resource/ 中的音频文件（真正的“自动识别”）
        if self.path.split("?")[0] == "/api/list":
            return self._json(200, {"audio": _audio_files()})
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().do_GET()
        rng = self.headers.get("Range")
        if not rng:
            return super().do_GET()
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        if not m or (m.group(1) == "" and m.group(2) == ""):
            return super().do_GET()
        size = os.path.getsize(path)
        start_s, end_s = m.group(1), m.group(2)
        if start_s == "":
            length = int(end_s); start = max(0, size - length); end = size - 1
        else:
            start = int(start_s)
            end = int(end_s) if end_s != "" else size - 1
        if start >= size:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.end_headers()
            return
        end = min(end, size - 1)
        length = end - start + 1
        ctype = self.guess_type(path)
        self.send_response(206)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(length))
        self.end_headers()
        with open(path, "rb") as f:
            f.seek(start)
            remain = length
            while remain > 0:
                chunk = f.read(min(65536, remain))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remain -= len(chunk)

    # ---------- POST /api/move ----------
    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.split("?")[0] != "/api/move":
            return self._json(404, {"ok": False, "error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
            data = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except Exception:
            return self._json(400, {"ok": False, "error": "bad json"})
        src = (data.get("src") or "").strip()
        frm = (data.get("from") or "").strip()
        to = (data.get("to") or "").strip()
        if not src or not frm or not to:
            return self._json(400, {"ok": False, "error": "缺少参数 src/from/to"})
        if frm == to:
            return self._json(400, {"ok": False, "error": "源分类与目标分类相同"})
        with _LOCK:
            ok, msg = move_song_in_playlist(src, frm, to)
        if ok:
            return self._json(200, {"ok": True})
        return self._json(400, {"ok": False, "error": msg})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
