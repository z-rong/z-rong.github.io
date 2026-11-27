#!/usr/bin/env node
/**
 * scan-audio.mjs — 扫描 music-player/resource/ 目录，生成 audio-list.json。
 * 用途：在 GitHub Pages 等“纯静态、无后端”的托管上，播放器靠这份清单自动识别
 *       资源目录里的音频文件（清单里没登记的会出现在「未分组」）。
 * 用法：node music-player/tools/scan-audio.mjs   （往 resource/ 加了音频后重跑一次）
 * 本地用 serve.py 运行时无需本清单——serve.py 的 /api/list 会实时扫描。
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const resDir = join(here, '..', 'resource');
const EXTS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.opus', '.wma', '.aiff', '.aif'];

let names;
try { names = readdirSync(resDir); }
catch (e) { console.error('resource 目录不存在：' + resDir); process.exit(1); }

const audio = names
  .filter((n) => EXTS.includes(n.slice(n.lastIndexOf('.')).toLowerCase()) && statSync(join(resDir, n)).isFile())
  .sort((a, b) => a.localeCompare(b, 'zh'));

writeFileSync(join(resDir, 'audio-list.json'), JSON.stringify({ generatedAt: new Date().toISOString(), audio }, null, 2));
console.log('audio-list.json:', audio.length, 'files');
audio.forEach((f) => console.log('  ' + f));
