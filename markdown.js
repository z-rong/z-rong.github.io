/* ============================================================
   markdown.js — 轻量 Markdown 渲染器（原生 JS，零依赖）
   覆盖常用 GFM 语法：标题 / 强调 / 删除线 / 行内代码 / 围栏代码块 /
   引用 / 有序无序列表 / 任务列表 / 表格 / 链接 / 图片 / 分割线。
   对外暴露：window.MarkdownRenderer.render(text, options)
   options.resolveImage(src) -> string(可显示URL) | null(缺失)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- 工具函数 ---------------- */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    var u = String(url).trim();
    if (/^(javascript|vbscript|data:text\/html)/i.test(u)) return '#';
    return u;
  }

  // 解析图片地址：允许 data/http(s)，相对路径交给调用方处理
  function resolveImage(src, options) {
    var s = String(src).trim();
    if (/^data:/i.test(s)) return s;
    if (/^(https?:)?\/\//i.test(s)) return s;
    if (/^blob:/i.test(s)) return s;
    if (options && typeof options.resolveImage === 'function') {
      var r = options.resolveImage(s);
      return r == null ? null : r;
    }
    return s;
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[`*_~\[\]()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .replace(/-+/g, '-') || 'section';
  }

  /* ---------------- 行内解析 ---------------- */

  function renderInline(text, options) {
    options = options || {};
    var store = [];
    function ph(html) {
      var i = store.length;
      store.push(html);
      return '\u0000' + i + '\u0000';
    }

    var s = String(text);

    // 1) 行内代码（最先保护，内容不再解析）
    s = s.replace(/(`+)([\s\S]*?)\1/g, function (m, ticks, code) {
      var c = code.replace(/\n/g, ' ');
      if (c.length >= 2 && c.charAt(0) === ' ' && c.charAt(c.length - 1) === ' ' && c.trim() !== '') {
        c = c.slice(1, -1);
      }
      return ph('<code>' + escapeHtml(c) + '</code>');
    });

    // 2) 图片  ![alt](src "title")
    s = s.replace(/!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)/g, function (m, alt, src, title) {
      var url = resolveImage(src, options);
      if (url == null) {
        return ph('<span class="img-error">🖼 图片缺失：' + escapeHtml(alt || src) + '</span>');
      }
      var t = title ? ' title="' + escapeHtml(title) + '"' : '';
      return ph(
        '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt || '') + '"' + t + ' loading="lazy">'
      );
    });

    // 3) 链接  [text](href "title")
    s = s.replace(/\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)/g, function (m, label, href, title) {
      var url = safeUrl(href);
      var t = title ? ' title="' + escapeHtml(title) + '"' : '';
      var ext = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return ph('<a href="' + escapeHtml(url) + '"' + t + ext + '>' + renderInline(label, options) + '</a>');
    });

    // 4) 自动链接  <https://...>  <mailto:...>
    s = s.replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, function (m, url) {
      return ph(
        '<a href="' + escapeHtml(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(url) + '</a>'
      );
    });

    // 5) 转义剩余原始 HTML
    s = escapeHtml(s);

    // 6) 强调 / 删除线
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([\s\S]+?)__/g, '<strong>$1</strong>');
    s = s.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');
    s = s.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
    s = s.replace(/(?<![\w])_([^_\n]+?)_(?![\w])/g, '<em>$1</em>');

    // 7) 还原占位符
    s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) {
      return store[+i];
    });

    return s;
  }

  /* ---------------- 块级辅助 ---------------- */

  function matchListMarker(line) {
    var m = line.match(/^(\s*)([-*+]|\d{1,9}[.)])\s+/);
    if (!m) return null;
    var indent = m[1].length;
    var marker = m[2];
    var afterMarker = line.slice(indent + marker.length);
    var spaces = (afterMarker.match(/^\s+/) || [' '])[0].length;
    var contentIndent = indent + marker.length + spaces;
    return {
      indent: indent,
      marker: marker,
      ordered: /^\d/.test(marker),
      contentIndent: contentIndent,
      content: line.slice(contentIndent)
    };
  }

  function isHr(line) {
    return /^\s*((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line);
  }

  function isTableSep(line) {
    if (line.indexOf('-') === -1) return false;
    var s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    var cells = s.split('|');
    if (!cells.length) return false;
    return cells.every(function (c) {
      return /^:?-{1,}:?$/.test(c.trim());
    });
  }

  function isBlockStart(line, i, lines) {
    if (/^\s{0,3}(```+|~~~+)/.test(line)) return true;
    if (/^#{1,6}\s/.test(line)) return true;
    if (/^\s*>/.test(line)) return true;
    if (matchListMarker(line)) return true;
    if (isHr(line)) return true;
    if (line.indexOf('|') !== -1 && lines[i + 1] && isTableSep(lines[i + 1])) return true;
    return false;
  }

  /* ---------------- 块级解析 ---------------- */

  function parseTable(lines, start, options) {
    function splitRow(line) {
      var s = line.trim().replace(/^\|/, '').replace(/\|$/, '');
      return s.split('|');
    }
    function alignAttr(a) {
      return a ? ' style="text-align:' + a + '"' : '';
    }

    var headerCells = splitRow(lines[start]);
    var aligns = splitRow(lines[start + 1]).map(function (c) {
      var t = c.trim();
      var left = t.charAt(0) === ':';
      var right = t.charAt(t.length - 1) === ':';
      if (left && right) return 'center';
      if (right) return 'right';
      if (left) return 'left';
      return '';
    });

    var i = start + 2;
    var rows = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && lines[i].indexOf('|') !== -1) {
      rows.push(splitRow(lines[i]));
      i++;
    }

    var html = '<div class="table-wrap"><table><thead><tr>';
    headerCells.forEach(function (c, idx) {
      html += '<th' + alignAttr(aligns[idx]) + '>' + renderInline(c.trim(), options) + '</th>';
    });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>';
      headerCells.forEach(function (_, idx) {
        html += '<td' + alignAttr(aligns[idx]) + '>' + renderInline((r[idx] || '').trim(), options) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return { html: html, next: i };
  }

  function renderListItemBody(itemLines, options) {
    var hasBlank = itemLines.some(function (l) {
      return /^\s*$/.test(l);
    });
    if (hasBlank) return parseBlocks(itemLines, options);

    var k = 0;
    while (k < itemLines.length && !isBlockStart(itemLines[k], k, itemLines)) k++;
    var inlinePart = itemLines.slice(0, k);
    var rest = itemLines.slice(k);
    var html = '';
    if (inlinePart.length) {
      html += renderInline(inlinePart.join('\n'), options).replace(/\n/g, '<br>');
    }
    if (rest.length) html += parseBlocks(rest, options);
    return html;
  }

  function parseList(lines, start, options) {
    var first = matchListMarker(lines[start]);
    var baseIndent = first.indent;
    var ordered = first.ordered;
    var items = [];
    var i = start;
    var n = lines.length;

    while (i < n) {
      var line = lines[i];
      var m = matchListMarker(line);
      if (!m || m.indent !== baseIndent || m.ordered !== ordered) break;

      var contentIndent = m.contentIndent;
      var content = m.content;

      // 任务列表标记 [ ] / [x]
      var task = null;
      var tm = content.match(/^\[([ xX])\]\s+([\s\S]*)$/);
      if (tm) {
        task = tm[1].toLowerCase() === 'x';
        content = tm[2];
      }

      var itemLines = [content];
      i++;

      while (i < n) {
        var raw = lines[i];

        if (/^\s*$/.test(raw)) {
          // 空行：向后看，若还有属于本项的缩进内容则保留
          var j = i + 1;
          while (j < n && /^\s*$/.test(lines[j])) j++;
          if (j < n) {
            var nm = matchListMarker(lines[j]);
            var nextIndent = lines[j].match(/^\s*/)[0].length;
            if (nm && nm.indent <= baseIndent) break;
            if (!nm && nextIndent <= baseIndent) break;
            itemLines.push('');
            i++;
            continue;
          } else {
            i = j;
            break;
          }
        }

        var cm = matchListMarker(raw);
        var indent = raw.match(/^\s*/)[0].length;
        if (cm && cm.indent <= baseIndent) break;
        if (indent <= baseIndent && !cm) break;

        var strip = Math.min(contentIndent, indent);
        itemLines.push(raw.slice(strip));
        i++;
      }

      while (itemLines.length && /^\s*$/.test(itemLines[itemLines.length - 1])) itemLines.pop();
      items.push({ lines: itemLines, task: task });
    }

    var tag = ordered ? 'ol' : 'ul';
    var html = '<' + tag + '>';
    items.forEach(function (it) {
      var body = renderListItemBody(it.lines, options);
      if (it.task !== null) {
        var checked = it.task ? ' checked' : '';
        html += '<li class="task-item"><input type="checkbox" disabled' + checked + '>' + body + '</li>';
      } else {
        html += '<li>' + body + '</li>';
      }
    });
    html += '</' + tag + '>';
    return { html: html, next: i };
  }

  function renderCodeBlock(code, lang) {
    var label = lang ? lang : 'text';
    return (
      '<pre>' +
      '<div class="code-head"><span class="code-lang">' + escapeHtml(label) + '</span>' +
      '<button type="button" class="code-copy">复制</button></div>' +
      '<code class="language-' + escapeHtml(lang || 'text') + '">' + escapeHtml(code) + '</code>' +
      '</pre>'
    );
  }

  function parseBlocks(lines, options) {
    var html = '';
    var i = 0;
    var n = lines.length;

    while (i < n) {
      var line = lines[i];

      // 空行
      if (/^\s*$/.test(line)) {
        i++;
        continue;
      }

      // 围栏代码块
      var fence = line.match(/^\s{0,3}(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/);
      if (fence) {
        var markerChar = fence[1].charAt(0);
        var fenceLen = fence[1].length;
        var lang = fence[2] || '';
        var buf = [];
        i++;
        while (i < n) {
          var close = lines[i].match(/^\s{0,3}(`{3,}|~{3,})\s*$/);
          if (close && close[1].charAt(0) === markerChar && close[1].length >= fenceLen) {
            i++;
            break;
          }
          buf.push(lines[i]);
          i++;
        }
        html += renderCodeBlock(buf.join('\n'), lang);
        continue;
      }

      // ATX 标题
      var h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (h) {
        var lvl = h[1].length;
        var hid = slugify(h[2]);
        html += '<h' + lvl + ' id="' + escapeHtml(hid) + '">' + renderInline(h[2], options) + '</h' + lvl + '>';
        i++;
        continue;
      }

      // 分割线
      if (isHr(line)) {
        html += '<hr>';
        i++;
        continue;
      }

      // 引用
      if (/^\s*>/.test(line)) {
        var qbuf = [];
        while (i < n && /^\s*>/.test(lines[i])) {
          qbuf.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        html += '<blockquote>' + parseBlocks(qbuf, options) + '</blockquote>';
        continue;
      }

      // 表格
      if (line.indexOf('|') !== -1 && i + 1 < n && isTableSep(lines[i + 1])) {
        var tres = parseTable(lines, i, options);
        html += tres.html;
        i = tres.next;
        continue;
      }

      // 列表
      if (matchListMarker(line)) {
        var lres = parseList(lines, i, options);
        html += lres.html;
        i = lres.next;
        continue;
      }

      // 段落（收集到下一个空行或块起始）
      var pbuf = [];
      while (i < n && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i], i, lines)) {
        pbuf.push(lines[i]);
        i++;
      }
      if (pbuf.length === 0) {
        pbuf.push(lines[i]);
        i++;
      }
      var para = renderInline(pbuf.join('\n'), options).replace(/\n/g, '<br>');
      html += '<p>' + para + '</p>';
    }

    return html;
  }

  /* ---------------- 对外接口 ---------------- */

  function renderMarkdown(src, options) {
    if (src == null) return '';
    var text = String(src).replace(/\r\n?/g, '\n');
    return parseBlocks(text.split('\n'), options || {});
  }

  global.MarkdownRenderer = { render: renderMarkdown };
})(window);
