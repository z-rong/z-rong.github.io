/* ============================================================
   app.js — README 查看器主逻辑
   - 本地读取文件夹（选择 / 拖拽），不上传任何数据
   - 按顶层子文件夹为主题分组
   - 即时筛选（文件名 / 路径 / 可选正文）
   - Markdown 渲染 + 相对图片解析（blob URL）
   - 明暗主题切换（localStorage）
   - 响应式抽屉、空状态与提示
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- DOM 快捷方法 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---------------- 状态 ---------------- */
  var state = {
    files: [],
    tree: null,
    themes: [],
    activePath: null,
    filter: '',
    searchContent: false,
    collapsed: {},
    blobUrls: {},
    source: 'sample',
    loading: false
  };

  var MOBILE_MAX = 900;
  var isMobile = function () { return window.innerWidth <= MOBILE_MAX; };

  /* ---------------- 工具 ---------------- */
  function normalizePath(p) {
    var parts = String(p).replace(/\\/g, '/').split('/');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var seg = parts[i];
      if (seg === '' || seg === '.') continue;
      if (seg === '..') { out.pop(); continue; }
      out.push(seg);
    }
    return out.join('/');
  }

  function themeOf(path) {
    var idx = path.indexOf('/');
    return idx === -1 ? '根目录' : path.slice(0, idx);
  }

  function baseName(path) {
    return path.split('/').pop();
  }

  function isMarkdownFile(name) {
    if (/\.(md|markdown|mdx)$/i.test(name)) return true;
    if (/^readme(\.[a-z0-9]+)?$/i.test(name)) return true;
    return false;
  }

  /* ---------------- 主题（明暗） ---------------- */
  var THEME_KEY = 'readme-viewer-theme';

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var theme = saved;
    if (theme !== 'light' && theme !== 'dark') {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }

  /* ---------------- UI 反馈 ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function emptyState(opts) {
    return '' +
      '<div class="empty-state">' +
        '<div class="es-icon">' + (opts.icon || '📄') + '</div>' +
        '<h2>' + escapeHtml(opts.title || '') + '</h2>' +
        '<p>' + escapeHtml(opts.desc || '') + '</p>' +
        (opts.actions || '') +
      '</div>';
  }

  /* ---------------- 文件类型 & 默认读取 resource 目录 ---------------- */
  function renderCodeFile(f) {
    var open = f.url ? '<a class="cf-open" href="' + escapeHtml(f.url) + '" target="_blank" rel="noopener">打开原文件 ↗</a>' : '';
    return '<div class="code-file"><div class="code-file-head"><span class="cf-name">' + escapeHtml(f.path) + '</span>' + open + '</div>' +
      '<pre class="code-block"><code>' + escapeHtml(f.content || '') + '</code></pre></div>';
  }

  function renderBinaryNotice(f) {
    var act = f.url ? '<div class="es-actions"><a class="btn btn-open" href="' + escapeHtml(f.url) + '" target="_blank" rel="noopener" download>下载 / 打开文件</a></div>' : '';
    return emptyState({ icon: '\ud83d\udce6', title: '该文件不支持在线预览', desc: f.name + ' 可能是二进制或特殊格式文件，可下载后使用本地应用打开。', actions: act });
  }

  var RESOURCE_ROOT = 'resource/';
  var IMG_EXT = /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i;
  var TEXT_EXT = /\.(txt|text|json|json5|js|mjs|cjs|ts|tsx|jsx|css|scss|less|html?|xml|ya?ml|toml|ini|conf|cfg|properties|gradle|sh|bash|zsh|py|go|rs|java|c|h|cpp|hpp|cs|rb|php|sql|csv|tsv|log|env)$/i;

  function fileKind(name) {
    if (isMarkdownFile(name)) return 'markdown';
    if (IMG_EXT.test(name)) return 'image';
    if (TEXT_EXT.test(name)) return 'text';
    if (/^(dockerfile|makefile|license|licence|changelog)$/i.test(name)) return 'text';
    return 'binary';
  }

  function encodeResourceUrl(rel) {
    return RESOURCE_ROOT + rel.split('/').map(encodeURIComponent).join('/');
  }

  /* ---------------- 默认数据源：GitHub 仓库 z-rong/docs ---------------- */
  var GITHUB_REPO = { owner: 'z-rong', repo: 'docs', branch: 'main' };
  var GH_RAW_BASE = 'https://raw.githubusercontent.com/' + GITHUB_REPO.owner + '/' + GITHUB_REPO.repo + '/' + GITHUB_REPO.branch + '/';
  var JSDP_BASE = 'https://cdn.jsdelivr.net/gh/' + GITHUB_REPO.owner + '/' + GITHUB_REPO.repo + '@' + GITHUB_REPO.branch + '/';
  var JSD_DATA_API = 'https://data.jsdelivr.com/v1/packages/gh/' + GITHUB_REPO.owner + '/' + GITHUB_REPO.repo + '@' + GITHUB_REPO.branch + '?structure=flat';
  var GH_TREE_API = 'https://api.github.com/repos/' + GITHUB_REPO.owner + '/' + GITHUB_REPO.repo + '/git/trees/' + GITHUB_REPO.branch + '?recursive=1';

  function encodeGitHubPath(rel) {
    return rel.split('/').map(encodeURIComponent).join('/');
  }

  // 获取仓库文件路径列表：优先 jsDelivr 数据接口（国内可达性更好），回退 GitHub API
  function fetchGitHubFileList() {
    return fetch(JSD_DATA_API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('jsDelivr data ' + r.status); return r.json(); })
      .then(function (j) {
        var files = (j && j.files) ? j.files : [];
        var paths = files.map(function (f) { return String(f.name || '').replace(/^\/+/, ''); }).filter(Boolean);
        if (!paths.length) throw new Error('jsDelivr 文件列表为空');
        return paths;
      })
      .catch(function (e1) {
        console.warn('[readme-viewer] jsDelivr 列表失败，回退 GitHub API：', e1 && e1.message);
        return fetch(GH_TREE_API, { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('GitHub API ' + r.status); return r.json(); })
          .then(function (j) {
            if (!j || !j.tree) throw new Error('GitHub 目录树为空');
            return j.tree.filter(function (t) { return t.type === 'blob'; }).map(function (t) { return t.path; });
          });
      });
  }

  // 取文本：优先 jsDelivr CDN，失败回退 raw.githubusercontent
  function fetchTextWithFallback(rel) {
    var enc = encodeGitHubPath(rel);
    return fetch(JSDP_BASE + enc, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('jsDelivr ' + r.status); return r.text(); })
      .catch(function () {
        return fetch(GH_RAW_BASE + enc, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.text() : ''; })
          .catch(function () { return ''; });
      });
  }

  // 从 z-rong/docs 读取文件，构建 state.files
  function loadGitHubDocs() {
    return fetchGitHubFileList().then(function (paths) {
      var tasks = [];
      paths.forEach(function (rawPath) {
        var rel = normalizePath(rawPath);
        if (!rel) return;
        var nm = baseName(rel);
        var kind = fileKind(nm);
        var jsUrl = JSDP_BASE + encodeGitHubPath(rel);
        if (kind === 'image') {
          state.blobUrls[rel] = jsUrl;   // 仅用于正文内联图片解析，不显示在文件树
          return;
        }
        if (kind !== 'markdown') return;  // 只读 Markdown/README，其余忽略
        tasks.push(Promise.resolve({ path: rel, name: nm, theme: themeOf(rel), kind: 'markdown', url: jsUrl, _remote: rel }));
      });
      return Promise.all(tasks);
    });
  }

  // 默认加载：先 GitHub docs，失败再回退本地 resource
  function loadDefaultSource() {
    resetForLoad('github');
    loadGitHubDocs()
      .then(function (files) { finalizeResourceFiles(files); })
      .catch(function (err) {
        console.warn('[readme-viewer] GitHub 读取失败，回退本地 resource：', err && err.message);
        loadResourceDir();
      });
  }

  // 递归抓取目录列表（适用于 python -m http.server / nginx autoindex 等返回 HTML 列表的静态服务器）
  function crawlResource() {
    function walk(dirUrl, baseRel) {
      return fetch(dirUrl, { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' @ ' + dirUrl);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('html') === -1) throw new Error('非目录列表: ' + dirUrl);
        return res.text();
      }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var anchors = doc.querySelectorAll('a');
        var fileItems = [], dirItems = [];
        for (var i = 0; i < anchors.length; i++) {
          var raw = anchors[i].getAttribute('href');
          if (!raw) continue;
          if (raw.charAt(0) === '/' || raw.charAt(0) === '#' || raw.indexOf('?') !== -1) continue;
          if (raw === '../' || raw === '..' || raw === '.' || raw === './') continue;
          var isDir = raw.charAt(raw.length - 1) === '/';
          var nm = decodeURIComponent(isDir ? raw.slice(0, -1) : raw);
          if (!nm || nm.charAt(0) === '.') continue;
          if (isDir) dirItems.push({ name: nm, href: raw });
          else fileItems.push({ name: nm });
        }
        var selfFiles = fileItems.map(function (f) {
          return { rel: baseRel ? baseRel + '/' + f.name : f.name };
        });
        var childPromises = dirItems.map(function (d) {
          return walk(dirUrl + d.href, baseRel ? baseRel + '/' + d.name : d.name);
        });
        return Promise.all(childPromises).then(function (children) {
          var all = selfFiles.slice();
          children.forEach(function (c) { all = all.concat(c); });
          return all;
        });
      });
    }
    return walk(RESOURCE_ROOT, '');
  }

  // 清单兜底：读取 resource/.index.json（由 scan-resource.mjs 生成）
  function fetchResourceManifest() {
    return fetch(RESOURCE_ROOT + '.index.json', { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('manifest HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      return (json.files || []).map(function (rel) { return { rel: rel }; });
    });
  }

  // 根据路径清单抓取内容，构造 state.files
  function buildResourceFiles(list) {
    var tasks = [];
    list.forEach(function (item) {
      var rel = normalizePath(item.rel);
      if (!rel) return;
      var nm = baseName(rel);
      var kind = fileKind(nm);
      var url = encodeResourceUrl(rel);
      if (kind === 'image') {
        state.blobUrls[rel] = url;   // 仅用于正文内联图片解析
        return;
      }
      if (kind !== 'markdown') return; // 只读 Markdown/README，其余忽略
      tasks.push(fetch(url, { cache: 'no-store' }).then(function (r) {
        return r.ok ? r.text() : '';
      }).then(function (txt) {
        return { path: rel, name: nm, theme: themeOf(rel), kind: 'markdown', content: txt, url: url };
      }).catch(function () {
        return { path: rel, name: nm, theme: themeOf(rel), kind: 'markdown', content: '', url: url };
      }));
    });
    return Promise.all(tasks);
  }

  function resetForLoad(source) {
    Object.keys(state.blobUrls).forEach(function (k) {
      try { URL.revokeObjectURL(state.blobUrls[k]); } catch (e) {}
    });
    state.blobUrls = {};
    state.source = source;
    state.files = [];
    state.tree = null;
    state.themes = [];
    state.activePath = null;
    state.collapsed = {};
    state.loading = true;
    renderAll();
  }

  // 从构建期生成的 resource-data.js（window.RESOURCE_DATA）构造文件列表（供 file:// 双击离线打开）
  function loadEmbeddedResource() {
    var data = (typeof window !== 'undefined') ? window.RESOURCE_DATA : null;
    if (!data || !data.files || !data.files.length) throw new Error('无内嵌资源数据（请运行 node build-embedded.mjs）');
    var out = [];
    data.files.forEach(function (it) {
      var rel = normalizePath(it.path);
      var nm = baseName(rel);
      var kind = it.kind || fileKind(nm);
      if (kind === 'image') { if (it.dataUrl) state.blobUrls[rel] = it.dataUrl; return; }
      if (kind !== 'markdown') return; // 只读 Markdown/README
      out.push({ path: rel, name: nm, theme: themeOf(rel), kind: 'markdown', content: it.content || '', url: encodeResourceUrl(rel) });
    });
    return out;
  }

  function finalizeResourceFiles(files) {
    if (!files || !files.length) throw new Error('没有可读取的文件');
    state.loading = false;
    state.files = files.sort(function (a, b) { return a.path.localeCompare(b.path, 'zh'); });
    buildTree();
    var _readme = state.files.filter(function (f) { return f.kind === 'markdown' && /^readme\./i.test(f.name); })[0];
    var _md = state.files.filter(function (f) { return f.kind === 'markdown'; })[0];
    state.activePath = (_readme || _md || state.files[0]).path;
    renderAll();
    var _srcLabel = (state.source === 'github')
      ? ('GitHub: ' + GITHUB_REPO.owner + '/' + GITHUB_REPO.repo)
      : 'resource/';
    toast('已从 ' + _srcLabel + ' 读取 ' + state.files.length + ' 个文件');
  }

  function loadResourceDir() {
    resetForLoad('resource');
    var isFile = (typeof location !== 'undefined' && location.protocol === 'file:');

    if (isFile) {
      // file:// 下浏览器禁止读取目录列表，直接使用构建期内嵌数据
      try { finalizeResourceFiles(loadEmbeddedResource()); }
      catch (e) {
        console.warn('[readme-viewer] file:// 且无内嵌数据，回退内置示例：', e && e.message);
        state.loading = false; loadSample();
        toast('本地双击打开需先生成内嵌数据（node build-embedded.mjs），已显示内置示例');
      }
      return;
    }

    crawlResource()
      .then(function (list) {
        if (!list || !list.length) throw new Error('resource 目录为空');
        return buildResourceFiles(list);
      })
      .catch(function (err) {
        console.warn('[readme-viewer] 目录列表不可用，尝试清单：', err && err.message);
        return fetchResourceManifest()
          .then(function (list) {
            if (!list || !list.length) throw new Error('清单为空');
            return buildResourceFiles(list);
          })
          .catch(function (e2) {
            console.warn('[readme-viewer] 清单不可用，尝试内嵌数据：', e2 && e2.message);
            return loadEmbeddedResource();
          });
      })
      .then(function (files) { finalizeResourceFiles(files); })
      .catch(function (err) {
        console.warn('[readme-viewer] 读取 resource 失败，回退内置示例：', err && err.message);
        state.loading = false;
        loadSample();
        toast('未能读取 resource 目录，已显示内置示例');
      });
  }

  /* ---------------- 构建多级目录树 ---------------- */
  function buildTree() {
    var root = { type: 'dir', name: '', path: '', dirs: [], files: [] };
    state.files.forEach(function (f) {
      var segs = f.path.split('/');
      var node = root;
      for (var i = 0; i < segs.length - 1; i++) {
        var dname = segs[i];
        var dpath = segs.slice(0, i + 1).join('/');
        var d = null;
        for (var j = 0; j < node.dirs.length; j++) { if (node.dirs[j].name === dname) { d = node.dirs[j]; break; } }
        if (!d) { d = { type: 'dir', name: dname, path: dpath, dirs: [], files: [] }; node.dirs.push(d); }
        node = d;
      }
      node.files.push(f);
    });
    var collator = (typeof Intl !== 'undefined' && Intl.Collator) ? new Intl.Collator('zh') : null;
    var cmp = function (a, b) { return collator ? collator.compare(a.name, b.name) : a.name.localeCompare(b.name); };
    (function sortNode(n) {
      n.dirs.sort(cmp);
      n.files.sort(cmp);
      n.dirs.forEach(sortNode);
    })(root);
    state.tree = root;
  }

  function getActiveFile() {
    for (var i = 0; i < state.files.length; i++) {
      if (state.files[i].path === state.activePath) return state.files[i];
    }
    return null;
  }

  /* ---------------- 筛选 ---------------- */
  function matchesFilter(f, q) {
    if (!q) return true;
    if (f.path.toLowerCase().indexOf(q) !== -1) return true;
    if (f.name.toLowerCase().indexOf(q) !== -1) return true;
    if (state.searchContent && f.content && f.content.toLowerCase().indexOf(q) !== -1) return true;
    return false;
  }

  function highlight(text, q) {
    var esc = escapeHtml(text);
    if (!q) return esc;
    var safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      var re = new RegExp('(' + safe + ')', 'ig');
      return esc.replace(re, '<mark class="hl">$1</mark>');
    } catch (e) {
      return esc;
    }
  }

  /* ---------------- 渲染：侧栏 ---------------- */
  var CARET_SVG = '<svg class="theme-caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>';
  var FILE_SVG = '<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
  var DIR_SVG = '<svg class="dir-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>';

  function renderTree() {
    var treeEl = $('#fileTree');
    if (!treeEl) return;
    if (!state.tree) { treeEl.innerHTML = ''; return; }
    var q = state.filter.trim().toLowerCase();
    var shown = 0;

    function countFiles(node) {
      var n = node.files.length;
      node.dirs.forEach(function (d) { n += countFiles(d); });
      return n;
    }
    function renderChildren(node) {
      var parts = [];
      // 先目录、后文件 —— 根目录下的文件与顶层目录处于同一级
      node.dirs.forEach(function (d) {
        var inner = renderChildren(d);
        if (!inner) return; // 搜索时该目录无匹配则隐藏
        var collapsed = !!state.collapsed['d:' + d.path] && !q;
        parts.push('<li class="tree-dir' + (collapsed ? ' collapsed' : '') + '" data-dir="' + escapeHtml(d.path) + '">' +
          '<button class="dir-header" type="button" aria-expanded="' + (collapsed ? 'false' : 'true') + '">' +
          CARET_SVG + '<span class="dir-icon">' + DIR_SVG + '</span>' +
          '<span class="dir-name">' + highlight(d.name, q) + '</span>' +
          '<span class="dir-count">' + countFiles(d) + '</span></button>' +
          '<ul class="dir-children">' + inner + '</ul></li>');
      });
      node.files.forEach(function (f) {
        if (!matchesFilter(f, q)) return;
        shown++;
        var active = f.path === state.activePath ? ' active' : '';
        parts.push('<li class="tree-leaf"><button class="file-item' + active + '" type="button" data-path="' + escapeHtml(f.path) + '" title="' + escapeHtml(f.path) + '">' +
          FILE_SVG + '<span class="file-label"><span class="file-name">' + highlight(f.name, q) + '</span></span></button></li>');
      });
      return parts.join('');
    }

    var body = renderChildren(state.tree);
    if (shown === 0) {
      treeEl.innerHTML = '<div class="tree-empty">' +
        (q ? '没有匹配「' + escapeHtml(state.filter) + '」的文件' : '暂无 Markdown 文件') + '</div>';
    } else {
      treeEl.innerHTML = '<ul class="tree-root">' + body + '</ul>';
    }
  }

  /* ---------------- 渲染：正文 ---------------- */
  function resolveImageFor(file, src) {
    var dir = file.path.indexOf('/') !== -1 ? file.path.slice(0, file.path.lastIndexOf('/')) : '';
    var target = normalizePath(dir ? dir + '/' + src : src);
    if (state.blobUrls[target]) return state.blobUrls[target];
    if (state.blobUrls[src]) return state.blobUrls[src];
    return null;
  }

  function bindImageFallback() {
    $$('#content img').forEach(function (img) {
      img.addEventListener('error', function () {
        var span = document.createElement('span');
        span.className = 'img-error';
        span.textContent = '🖼 图片无法显示：' + (img.getAttribute('alt') || '');
        img.parentNode && img.parentNode.replaceChild(span, img);
      });
    });
  }

  // 远程文件按需加载正文（GitHub 源默认不预取全部内容）
  function ensureContent(f, cb) {
    if (f.content !== undefined) { cb(); return; }
    if (f._loading) return;
    f._loading = true;
    fetchTextWithFallback(f._remote || f.path).then(function (txt) {
      f.content = txt; f._loading = false; cb();
    }).catch(function () {
      f.content = ''; f._loading = false; cb();
    });
  }

  function renderContent() {
    var contentEl = $('#content');
    var crumb = $('#breadcrumb');

    if (state.loading) {
      crumb.innerHTML = '';
      contentEl.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>正在读取文件…</p></div>';
      return;
    }

    var f = getActiveFile();
    if (!f) {
      crumb.innerHTML = '';
      if (state.source === 'folder' && state.files.length === 0) {
        contentEl.innerHTML = emptyState({
          icon: '🗂️',
          title: '没有找到 Markdown 文件',
          desc: '这个文件夹里似乎没有 README / .md / .markdown / .mdx 文件，换一个文件夹试试吧。',
          actions: '<div class="es-actions"><label class="btn btn-open" for="folderInput">选择其他文件夹</label></div>'
        });
      } else {
        contentEl.innerHTML = emptyState({
          icon: '📄',
          title: '未选择文件',
          desc: '从左侧文件树中选择一篇 README 开始阅读。'
        });
      }
      return;
    }

    // 面包屑
    var segs = f.path.split('/');
    crumb.innerHTML = segs.map(function (s, i) {
      var cls = i === segs.length - 1 ? 'crumb current' : 'crumb';
      return '<span class="' + cls + '">' + escapeHtml(s) + '</span>';
    }).join('<span class="sep">/</span>');

    var kind = f.kind || 'markdown';

    // 远程文件正文未加载时，先显示加载中再拉取
    if ((kind === 'markdown' || kind === 'text') && f.content === undefined) {
      contentEl.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>正在读取「' + escapeHtml(f.name) + '」…</p></div>';
      ensureContent(f, function () {
        if (state.activePath === f.path) renderContent();
      });
      return;
    }

    if (kind === 'image') {
      contentEl.innerHTML = '<div class="media-view"><img alt="' + escapeHtml(f.name) + '" src="' + escapeHtml(f.url || '') + '"></div>';
    } else if (kind === 'text') {
      contentEl.innerHTML = renderCodeFile(f);
    } else if (kind === 'binary') {
      contentEl.innerHTML = renderBinaryNotice(f);
    } else {
      var html = window.MarkdownRenderer.render(f.content || '', {
        resolveImage: function (src) { return resolveImageFor(f, src); }
      });
      contentEl.innerHTML = html;
      bindImageFallback();
    }
    var main = $('#main');
    if (main) main.scrollTop = 0;
  }

  function updateCounts() {
    var pill = $('#fileCount');
    if (pill) pill.textContent = String(state.files.length);
  }

  function renderAll() {
    renderTree();
    renderContent();
    updateCounts();
  }

  /* ---------------- 选择文件 ---------------- */
  function selectFile(path) {
    state.activePath = path;
    // 展开所有祖先目录，确保选中的文件在树中可见
    var segs = path.split('/');
    for (var i = 1; i < segs.length; i++) {
      state.collapsed['d:' + segs.slice(0, i).join('/')] = false;
    }
    renderTree();
    renderContent();
  }

  /* ---------------- 抽屉（移动端） ---------------- */
  function openDrawer() {
    var sb = $('#sidebar');
    var ov = $('#overlay');
    if (sb) sb.classList.add('open');
    if (ov) ov.classList.add('show');
  }
  function closeDrawer() {
    var sb = $('#sidebar');
    var ov = $('#overlay');
    if (sb) sb.classList.remove('open');
    if (ov) ov.classList.remove('show');
  }
  function toggleDrawer() {
    var sb = $('#sidebar');
    if (sb && sb.classList.contains('open')) closeDrawer();
    else openDrawer();
  }

  /* ---------------- 代码复制 ---------------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  function handleContentClick(e) {
    var btn = e.target.closest ? e.target.closest('.code-copy') : null;
    if (!btn) return;
    var pre = btn.closest('pre');
    var code = pre ? pre.querySelector('code') : null;
    if (!code) return;
    copyText(code.innerText).then(function () {
      btn.textContent = '已复制';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = '复制';
        btn.classList.remove('copied');
      }, 1500);
    }).catch(function () { toast('复制失败，请手动选择'); });
  }

  /* ---------------- 读取：文件夹选择 ---------------- */
  function ingestFiles(rawFiles) {
    // rawFiles: [{ path(含根目录名), file }]
    // 计算需要剥离的公共根目录（通常是被选中的文件夹名）
    var tops = {};
    rawFiles.forEach(function (r) { tops[String(r.path).split('/')[0]] = true; });
    var topKeys = Object.keys(tops);
    var strip = topKeys.length === 1 ? topKeys[0] + '/' : '';

    // 清理旧的 blob URL
    Object.keys(state.blobUrls).forEach(function (k) {
      try { URL.revokeObjectURL(state.blobUrls[k]); } catch (e) {}
    });
    state.blobUrls = {};
    state.source = 'folder';
    state.files = [];
    state.tree = null;
    state.themes = [];
    state.activePath = null;
    state.collapsed = {};
    state.loading = true;
    renderAll();

    var imageExt = /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i;
    rawFiles.forEach(function (r) {
      var rel = (strip && String(r.path).indexOf(strip) === 0) ? String(r.path).slice(strip.length) : String(r.path);
      r.rel = normalizePath(rel);
      if (imageExt.test(r.file.name)) {
        try { state.blobUrls[r.rel] = URL.createObjectURL(r.file); } catch (e) {}
      }
    });

    var mdRaw = rawFiles.filter(function (r) { return isMarkdownFile(r.file.name); });

    Promise.all(mdRaw.map(function (r) {
      return r.file.text().then(function (text) {
        return { path: r.rel, name: r.file.name, theme: themeOf(r.rel), content: text, isSample: false };
      }).catch(function () {
        return { path: r.rel, name: r.file.name, theme: themeOf(r.rel), content: '> ⚠️ 无法读取该文件内容。', isSample: false };
      });
    })).then(function (files) {
      state.loading = false;
      state.files = files.sort(function (a, b) { return a.path.localeCompare(b.path, 'zh'); });
      buildTree();
      if (state.files.length) {
        state.activePath = state.files[0].path;
        renderAll();
        toast('已加载 ' + state.files.length + ' 个文件');
        if (isMobile()) closeDrawer();
      } else {
        state.activePath = null;
        renderAll();
        toast('该文件夹中没有 Markdown 文件');
      }
    }).catch(function () {
      state.loading = false;
      renderAll();
      toast('读取文件失败');
    });
  }

  /* ---------------- 拖拽：递归读取目录 ---------------- */
  function readEntry(entry, prefix) {
    var full = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isFile) {
      return new Promise(function (resolve) {
        entry.file(function (file) { resolve([{ path: full, file: file }]); }, function () { resolve([]); });
      });
    }
    if (entry.isDirectory) {
      var reader = entry.createReader();
      var all = [];
      return new Promise(function (resolve) {
        function readBatch() {
          reader.readEntries(function (batch) {
            if (!batch.length) {
              Promise.all(all.map(function (en) { return readEntry(en, full); })).then(function (res) {
                var flat = [];
                res.forEach(function (l) { flat = flat.concat(l); });
                resolve(flat);
              });
              return;
            }
            all = all.concat(Array.prototype.slice.call(batch));
            readBatch();
          }, function () { resolve([]); });
        }
        readBatch();
      });
    }
    return Promise.resolve([]);
  }

  function handleDrop(items) {
    var entries = [];
    var fallback = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind !== 'file') continue;
      var entry = it.webkitGetAsEntry && it.webkitGetAsEntry();
      if (entry) {
        entries.push(entry);
      } else {
        var f = it.getAsFile && it.getAsFile();
        if (f) fallback.push({ path: f.webkitRelativePath || f.name, file: f });
      }
    }

    if (!entries.length) {
      if (fallback.length) ingestFiles(fallback);
      else toast('未检测到可读取的文件');
      return;
    }

    state.loading = true;
    renderAll();
    Promise.all(entries.map(function (en) { return readEntry(en, ''); })).then(function (results) {
      var raw = [];
      results.forEach(function (list) { raw = raw.concat(list); });
      if (!raw.length) {
        state.loading = false;
        renderAll();
        toast('未检测到可读取的文件');
        return;
      }
      ingestFiles(raw);
    }).catch(function () {
      state.loading = false;
      renderAll();
      toast('读取文件夹失败');
    });
  }

  /* ---------------- 加载内置示例 ---------------- */
  function loadSample() {
    Object.keys(state.blobUrls).forEach(function (k) {
      try { URL.revokeObjectURL(state.blobUrls[k]); } catch (e) {}
    });
    state.blobUrls = {};

    if (window.SAMPLE_DATA && window.SAMPLE_DATA.assets) {
      Object.keys(window.SAMPLE_DATA.assets).forEach(function (k) {
        try {
          var blob = new Blob([window.SAMPLE_DATA.assets[k]], { type: 'image/svg+xml' });
          state.blobUrls[k] = URL.createObjectURL(blob);
        } catch (e) {}
      });
    }

    state.source = 'sample';
    state.files = (window.SAMPLE_DATA ? window.SAMPLE_DATA.files : []).map(function (f) {
      return {
        path: f.path,
        name: baseName(f.path),
        theme: themeOf(f.path),
        content: f.content,
        isSample: true
      };
    });
    state.loading = false;
    buildTree();
    state.activePath = state.files.length ? state.files[0].path : null;
    renderAll();
  }

  /* ---------------- 事件绑定 ---------------- */
  function bindEvents() {
    // 主题切换
    var themeBtn = $('#themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    var reloadBtn = $('#reloadBtn');
    if (reloadBtn) reloadBtn.addEventListener('click', function () { loadDefaultSource(); });

    // 侧栏按钮 / 遮罩
    var menuBtn = $('#menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleDrawer);
    var overlay = $('#overlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // 文件树点击（事件委托）
    var tree = $('#fileTree');
    if (tree) {
      tree.addEventListener('click', function (e) {
        var header = e.target.closest('.dir-header');
        if (header) {
          var li = header.closest('.tree-dir');
          var dpath = li.getAttribute('data-dir');
          state.collapsed['d:' + dpath] = !state.collapsed['d:' + dpath];
          li.classList.toggle('collapsed');
          header.setAttribute('aria-expanded', li.classList.contains('collapsed') ? 'false' : 'true');
          return;
        }
        var item = e.target.closest('.file-item');
        if (item) {
          selectFile(item.getAttribute('data-path'));
          if (isMobile()) closeDrawer();
        }
      });
    }

    // 搜索
    var searchInput = $('#searchInput');
    var searchClear = $('#searchClear');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.filter = searchInput.value;
        if (searchClear) searchClear.hidden = !searchInput.value;
        renderTree();
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          searchInput.value = '';
          state.filter = '';
          if (searchClear) searchClear.hidden = true;
          renderTree();
          searchInput.blur();
        }
      });
    }
    if (searchClear) {
      searchClear.addEventListener('click', function () {
        searchInput.value = '';
        state.filter = '';
        searchClear.hidden = true;
        renderTree();
        searchInput.focus();
      });
    }

    var searchContentToggle = $('#searchContentToggle');
    if (searchContentToggle) {
      searchContentToggle.addEventListener('change', function () {
        state.searchContent = searchContentToggle.checked;
        if (state.filter.trim()) renderTree();
      });
    }

    // 文件夹选择
    var folderInput = $('#folderInput');
    if (folderInput) {
      folderInput.addEventListener('change', function (e) {
        var list = e.target.files;
        if (!list || !list.length) return;
        var raw = [];
        for (var i = 0; i < list.length; i++) {
          var f = list[i];
          raw.push({ path: f.webkitRelativePath || f.name, file: f });
        }
        ingestFiles(raw);
        e.target.value = '';
      });
    }

    // 正文点击（代码复制）
    var contentEl = $('#content');
    if (contentEl) contentEl.addEventListener('click', handleContentClick);

    // 快捷键
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
      if (e.key === 'Escape') {
        closeDrawer();
      }
    });

    // 拖拽
    var dragDepth = 0;
    function hasFiles(e) {
      if (!e.dataTransfer || !e.dataTransfer.types) return false;
      for (var i = 0; i < e.dataTransfer.types.length; i++) {
        if (e.dataTransfer.types[i] === 'Files') return true;
      }
      return false;
    }
    var dropOverlay = $('#dropOverlay');
    window.addEventListener('dragenter', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth++;
      if (dropOverlay) dropOverlay.classList.add('show');
    });
    window.addEventListener('dragover', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    window.addEventListener('dragleave', function (e) {
      if (!hasFiles(e)) return;
      dragDepth--;
      if (dragDepth <= 0) {
        dragDepth = 0;
        if (dropOverlay) dropOverlay.classList.remove('show');
      }
    });
    window.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      if (dropOverlay) dropOverlay.classList.remove('show');
      var items = e.dataTransfer.items;
      if (items && items.length) handleDrop(items);
      else if (e.dataTransfer.files && e.dataTransfer.files.length) {
        var raw = [];
        for (var i = 0; i < e.dataTransfer.files.length; i++) {
          var f = e.dataTransfer.files[i];
          raw.push({ path: f.name, file: f });
        }
        ingestFiles(raw);
      }
    });

    window.addEventListener('resize', function () {
      if (!isMobile()) closeDrawer();
    });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    initTheme();
    bindEvents();
    loadDefaultSource();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
