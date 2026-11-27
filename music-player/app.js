/* =========================================================
 * 我的音乐 · 纯静态音乐播放器
 * ---------------------------------------------------------
 * 模块划分：
 *   1. 数据层      —— 分类与歌曲数据
 *   2. 状态管理    —— 当前分类 / 队列 / 索引 / 播放状态
 *   3. DOM 引用    —— 统一缓存节点
 *   4. 工具函数    —— 时间格式化 / 封面绘制 / 转义
 *   5. 播放控制    —— 播放 / 暂停 / 上一首 / 下一首 / 进度 / 音量
 *   6. 渲染层      —— 分类卡片 / 歌曲列表 / 播放条 / 详情页
 *   7. 事件绑定    —— 统一注册交互
 *   8. 初始化
 * 无任何外部依赖，纯原生实现。
 * ========================================================= */
(function () {
  'use strict';

  /* =======================================================
   * 1. 数据层
   * ===================================================== */

  // ================= 数据来源：resource/playlist.txt =================
  // 分类不再靠目录区分，而是由文本清单记录「分类 + 文件路径」。
  // 想加歌 / 调分类：只改 resource/playlist.txt，无需改动本文件。
  const PLAYLIST_FILE = 'resource/playlist.txt';

  // 已知分类的视觉样式（图标 / 描述 / 主题渐变）；清单里出现的新分类走兜底样式
  const CATEGORY_STYLE = {
    '流行':   { icon: '🎤', desc: '热门金曲 · 循环上头', theme: 'linear-gradient(135deg, #ff6fb5 0%, #a855f7 100%)' },
    '摇滚':   { icon: '🎸', desc: '热血电吉他 · 燃烧吧', theme: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)' },
    '古典':   { icon: '🎻', desc: '古典乐章 · 沉浸时光', theme: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)' },
    '电子':   { icon: '🎧', desc: '合成器浪潮 · 律动心跳', theme: 'linear-gradient(135deg, #00c6ff 0%, #7f00ff 100%)' },
    '轻音乐': { icon: '🌿', desc: '治愈放松 · 静静聆听', theme: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  };

  // 封面渐变池：每首歌按名字哈希取一个，保证同分类也有区分
  const GRADIENTS = [
    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #12c2e9 0%, #c471ed 100%)',
  ];

  function hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function gradientFor(seed) {
    return GRADIENTS[hashStr(String(seed)) % GRADIENTS.length];
  }
  function styleFor(name) {
    return CATEGORY_STYLE[name] || { icon: '🎵', desc: '音乐分类', theme: gradientFor(name) };
  }

  // 解析 resource/playlist.txt：
  //   以 [分类名] 作为分组标题；其下每行一首：
  //   文件路径 [ | 歌名 | 歌手 | 专辑 | 歌词 ]
  //   （只有「文件路径」必填；以 # 开头为注释；歌词换行用 \n 表示）
  function parsePlaylist(text) {
    const categories = [];
    const seenIds = new Set();
    let cur = null;

    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;

      const sec = line.match(/^\[(.+)\]$/);
      if (sec) {
        const name = sec[1].trim();
        let cat = categories.find((c) => c.name === name);
        if (!cat) {
          const st = styleFor(name);
          cat = { id: name, name: name, icon: st.icon, desc: st.desc, theme: st.theme, songs: [] };
          categories.push(cat);
        }
        cur = cat;
        return;
      }

      // 兜底：没有分类标题时归入「未分类」
      if (!cur) {
        let cat = categories.find((c) => c.name === '未分类');
        if (!cat) {
          const st = styleFor('未分类');
          cat = { id: '未分类', name: '未分类', icon: st.icon, desc: st.desc, theme: st.theme, songs: [] };
          categories.push(cat);
        }
        cur = cat;
      }

      const parts = line.split('|').map((s) => s.trim());
      const path = parts[0];
      if (!path) return;

      // 取文件名（去目录、去扩展名）作为默认歌名 / id 基
      let base = path.substring(path.lastIndexOf('/') + 1);
      const dot = base.lastIndexOf('.');
      if (dot > 0) base = base.substring(0, dot);

      let id = base;
      let n = 1;
      while (seenIds.has(id)) { id = base + '-' + (n++); }
      seenIds.add(id);

      cur.songs.push({
        id: id,
        title: parts[1] || base,
        artist: parts[2] || '未知歌手',
        album: parts[3] || '',
        lyrics: (parts[4] || '').replace(/\\n/g, '\n'),
        src: path,
        cover: gradientFor(base + id),
      });
    });

    return categories.filter((c) => c.songs.length > 0);
  }

  // 运行期由清单构建的分类数据（初始化时异步加载）
  let CATEGORIES = [];

  // 音频扩展名（用于识别资源目录里的音频文件）
  const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac|aac|opus|wma|aiff?)$/i;

  // 播放列表是“可选”的：读不到不算错误，返回空字符串即可
  async function fetchPlaylistText() {
    try {
      const res = await fetch(PLAYLIST_FILE + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return '';
      return await res.text();
    } catch (e) {
      return '';
    }
  }

  // 获取音频目录里的所有音频文件名：
  //   1) 优先 serve.py 的 /api/list（实时扫描，真正“自动识别新增文件”）
  //   2) 退回构建期生成的静态清单 resource/audio-list.json（GitHub Pages 等纯静态托管）
  async function fetchAudioList() {
    try {
      const res = await fetch('api/list?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        if (j && Array.isArray(j.audio)) return j.audio.slice();
      }
    } catch (e) { /* 没有后端接口，忽略 */ }
    try {
      const res = await fetch('resource/audio-list.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const j = await res.json();
        if (j && Array.isArray(j.audio)) return j.audio.slice();
      }
    } catch (e) { /* 没有静态清单，忽略 */ }
    return [];
  }

  // 由音频文件名构造一首歌（未在清单里登记时使用）
  function songFromFile(fileName, usedIds) {
    const base = fileName.replace(/\.[^.]+$/, '');
    let id = base;
    let n = 1;
    while (usedIds.has(id)) id = base + '-' + (n++);
    usedIds.add(id);
    return {
      id: id,
      title: base,
      artist: '未知歌手',
      album: '',
      lyrics: '',
      src: 'resource/' + fileName,
      cover: gradientFor(base + id),
    };
  }

  // 组装分类：清单（可选） + 资源目录里未被清单引用的音频（→ 未分组）
  function buildCategories(playlistText, audioFiles) {
    let cats = playlistText ? parsePlaylist(playlistText) : [];

    const usedIds = new Set();
    const referenced = new Set();
    cats.forEach(function (c) {
      c.songs.forEach(function (song) {
        usedIds.add(song.id);
        referenced.add(song.src.substring(song.src.lastIndexOf('/') + 1));
      });
    });

    const ungrouped = [];
    (audioFiles || []).forEach(function (fn) {
      if (!AUDIO_EXT.test(fn)) return;
      if (referenced.has(fn)) return;
      ungrouped.push(songFromFile(fn, usedIds));
    });

    if (ungrouped.length) {
      cats.push({
        id: '\u672a\u5206\u7ec4',
        name: '\u672a\u5206\u7ec4',
        icon: '\ud83d\udce5',
        desc: '\u8d44\u6e90\u76ee\u5f55\u4e2d\u672a\u7f16\u5165\u6e05\u5355\u7684\u97f3\u9891',
        theme: gradientFor('\u672a\u5206\u7ec4'),
        songs: ungrouped,
      });
    }
    return cats;
  }

  /* ---- 本地分组覆盖层：支持“新建分组”和“移动”在纯静态环境也能持久化 ---- */
  const OVERLAY_KEY = 'mp-groups-v1';
  function readOverlay() {
    try {
      const o = JSON.parse(localStorage.getItem(OVERLAY_KEY));
      if (o && typeof o === 'object') {
        return {
          groups: Array.isArray(o.groups) ? o.groups : [],
          assign: (o.assign && typeof o.assign === 'object') ? o.assign : {},
        };
      }
    } catch (e) {}
    return { groups: [], assign: {} };
  }
  function writeOverlay(o) {
    try { localStorage.setItem(OVERLAY_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function ensureCategory(name) {
    let cat = CATEGORIES.find(function (c) { return c.name === name; });
    if (!cat) {
      const st = styleFor(name);
      cat = { id: name, name: name, icon: st.icon, desc: st.desc, theme: st.theme, songs: [] };
      CATEGORIES.push(cat);
    }
    return cat;
  }
  function moveSongBySrc(src, toName) {
    let song = null;
    CATEGORIES.forEach(function (c) {
      const idx = c.songs.findIndex(function (s2) { return s2.src === src; });
      if (idx >= 0) { if (!song) song = c.songs[idx]; c.songs.splice(idx, 1); }
    });
    if (song) ensureCategory(toName).songs.push(song);
  }
  function applyOverlay() {
    const o = readOverlay();
    o.groups.forEach(function (g) { ensureCategory(g); });
    Object.keys(o.assign).forEach(function (src) { moveSongBySrc(src, o.assign[src]); });
  }
  function createGroup(name) {
    name = String(name == null ? '' : name).trim();
    if (!name) { toast('\u8bf7\u8f93\u5165\u5206\u7ec4\u540d\u79f0'); return false; }
    if (CATEGORIES.some(function (c) { return c.name === name; })) { toast('\u5df2\u5b58\u5728\u540c\u540d\u5206\u7ec4'); return false; }
    const o = readOverlay();
    if (o.groups.indexOf(name) === -1) o.groups.push(name);
    writeOverlay(o);
    ensureCategory(name);
    renderCategories();
    toast('\u5df2\u521b\u5efa\u5206\u7ec4\u300c' + name + '\u300d');
    return true;
  }

  /* =======================================================
   * 2. 状态管理
   * ===================================================== */
  const state = {
    currentCategoryId: null, // 当前分类 id
    queue: [],               // 当前分类歌曲队列（逐个播放的范围）
    currentIndex: -1,        // 当前歌曲在 queue 中的索引
    isPlaying: false,        // 是否正在播放
    volume: 0.8,             // 音量 0~1
    lastVolume: 0.8,         // 静音前的音量
    seeking: false,          // 是否正在拖动进度条
  };

  /* =======================================================
   * 3. DOM 引用
   * ===================================================== */
  const $ = (id) => document.getElementById(id);
  const dom = {
    audio: $('audioEl'),

    // 视图
    categoriesView: $('categoriesView'),
    songsView: $('songsView'),
    categoriesGrid: $('categoriesGrid'),
    songsList: $('songsList'),
    songsViewTitle: $('songsViewTitle'),
    songsViewSubtitle: $('songsViewSubtitle'),
    backToCategoriesBtn: $('backToCategoriesBtn'),

    // 播放条
    miniTrackInfo: $('miniTrackInfo'),
    miniCover: $('miniCover'),
    miniTitle: $('miniTitle'),
    miniArtist: $('miniArtist'),
    prevBtn: $('prevBtn'),
    playPauseBtn: $('playPauseBtn'),
    nextBtn: $('nextBtn'),
    progressBar: $('progressBar'),
    volumeBar: $('volumeBar'),
    muteBtn: $('muteBtn'),
    curTime: $('curTime'),
    durTime: $('durTime'),

    // 详情页
    nowPlayingView: $('nowPlayingView'),
    closeNowPlayingBtn: $('closeNowPlayingBtn'),
    npCover: $('npCover'),
    npCategory: $('npCategory'),
    npTitle: $('npTitle'),
    npArtist: $('npArtist'),
    npAlbum: $('npAlbum'),
    npLyrics: $('npLyrics'),
    npProgressBar: $('npProgressBar'),
    npCurTime: $('npCurTime'),
    npDurTime: $('npDurTime'),
    npPrevBtn: $('npPrevBtn'),
    npPlayPauseBtn: $('npPlayPauseBtn'),
    npNextBtn: $('npNextBtn'),

    // 移动分类
    miniMoveBtn: $('miniMoveBtn'),
    npMoveBtn: $('npMoveBtn'),
    moveModal: $('moveModal'),
    moveSongTitle: $('moveSongTitle'),
    moveCategoryList: $('moveCategoryList'),
    moveCancelBtn: $('moveCancelBtn'),
  };

  /* =======================================================
   * 4. 工具函数
   * ===================================================== */

  // SVG 图标（用 currentColor 自动跟随文字颜色）
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.29-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zm3 7 9 7V5z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM6 5v14l9-7z"/></svg>',
    volume:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4zm15.5.5-1.4-1.4L16 10.2l-2.1-2.1-1.4 1.4L14.6 12l-2.1 2.1 1.4 1.4L16 13.4l2.1 2.1 1.4-1.4L17.4 12z"/></svg>',
    move: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 7h10l-2.3-2.3L16 3.3 20.7 8 16 12.7l-1.3-1.4L17 9H7V7zm10 10H7l2.3 2.3L8 20.7 3.3 16 8 11.3l1.3 1.4L7 15h10v2z"/></svg>',
  };

  // 秒 -> m:ss
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 取标题第一个字符作为封面字母
  function firstChar(str) {
    const chars = Array.from(String(str || '♪').trim());
    return chars.length ? chars[0] : '♪';
  }

  // 为封面元素上色 + 写入首字母
  function paintCover(el, song) {
    if (!el || !song) return;
    el.style.backgroundImage = song.cover;
    el.innerHTML = `<span class="cover__letter">${escapeHtml(firstChar(song.title))}</span>`;
  }

  // 让 range 滑块的“已填充”部分显示强调色
  function setRangeFill(rangeEl, percent) {
    if (!rangeEl) return;
    const p = Math.max(0, Math.min(100, percent));
    rangeEl.style.background = `linear-gradient(90deg, var(--accent) ${p}%, rgba(255,255,255,0.16) ${p}%)`;
  }

  function findCategory(id) {
    return CATEGORIES.find((c) => c.id === id) || null;
  }

  function getCurrentCategoryName() {
    const cat = findCategory(state.currentCategoryId);
    return cat ? cat.name : '';
  }

  function findSongInQueue(songId) {
    return state.queue.findIndex((s) => s.id === songId);
  }

  /* =======================================================
   * 5. 播放控制
   * ===================================================== */

  // 播放队列中指定索引（自动首尾循环）
  function playAt(index) {
    if (!state.queue.length) return;
    const len = state.queue.length;
    state.currentIndex = ((index % len) + len) % len;

    const song = state.queue[state.currentIndex];
    dom.audio.src = song.src;
    dom.audio.currentTime = 0;

    updateTrackInfo(song);
    updateActiveRow();
    updateProgressUI(0, 0, 0);

    const p = dom.audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // 某些浏览器在用户手势前阻止自动播放，静默处理即可
      });
    }
  }

  function togglePlay() {
    if (!state.queue.length) return;
    if (state.currentIndex === -1) {
      playAt(0);
      return;
    }
    if (dom.audio.paused) {
      const p = dom.audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      dom.audio.pause();
    }
  }

  // 下一首：仅在当前分类队列内循环
  function next() {
    if (!state.queue.length) return;
    if (state.currentIndex === -1) {
      playAt(0);
      return;
    }
    playAt(state.currentIndex + 1);
  }

  // 上一首：仅在当前分类队列内循环；播放超过 3 秒则回到开头
  function prev() {
    if (!state.queue.length) return;
    if (state.currentIndex === -1) {
      playAt(0);
      return;
    }
    if (dom.audio.currentTime > 3) {
      dom.audio.currentTime = 0;
      return;
    }
    playAt(state.currentIndex - 1);
  }

  function setVolume(v) {
    v = Math.max(0, Math.min(1, v));
    state.volume = v;
    if (v > 0) state.lastVolume = v;
    dom.audio.volume = v;
    dom.volumeBar.value = String(v);
    setRangeFill(dom.volumeBar, v * 100);
    dom.muteBtn.innerHTML = v === 0 ? ICON.mute : ICON.volume;
  }

  function toggleMute() {
    if (dom.audio.volume > 0) {
      setVolume(0);
    } else {
      setVolume(state.lastVolume || 0.8);
    }
  }

  /* =======================================================
   * 6. 渲染层
   * ===================================================== */

  // 渲染分类卡片
  function renderCategories() {
    dom.categoriesGrid.innerHTML = '';
    CATEGORIES.forEach((cat) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'category-card';
      card.style.background = cat.theme;
      card.innerHTML = `
        <span class="category-card__icon">${cat.icon}</span>
        <span class="category-card__name">${escapeHtml(cat.name)}</span>
        <span class="category-card__desc">${escapeHtml(cat.desc)}</span>
        <span class="category-card__count">${cat.songs.length} 首</span>
      `;
      card.addEventListener('click', () => openCategory(cat.id));
      dom.categoriesGrid.appendChild(card);
    });
  }

  // 进入某个分类（渲染歌曲列表视图）
  function openCategory(id) {
    const cat = findCategory(id);
    if (!cat) return;

    // 记录正在播放的歌曲，进入新分类时尽量保留其索引
    const playingSong =
      state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;

    state.currentCategoryId = id;
    state.queue = cat.songs.slice();
    state.currentIndex = playingSong ? findSongInQueue(playingSong.id) : -1;

    renderSongs(cat);
    showView('songs');
    updateActiveRow();
  }

  // 渲染歌曲列表
  function renderSongs(cat) {
    dom.songsViewTitle.textContent = cat.name;
    dom.songsViewSubtitle.textContent = `${cat.songs.length} 首歌曲 · 按分类逐个播放`;

    dom.songsList.innerHTML = '';
    cat.songs.forEach((song, i) => {
      const li = document.createElement('li');
      li.className = 'song-row';
      li.dataset.songId = song.id;
      li.innerHTML = `
        <span class="song-row__index">${String(i + 1).padStart(2, '0')}</span>
        <span class="song-row__cover cover" data-cover></span>
        <span class="song-row__meta">
          <span class="song-row__title">${escapeHtml(song.title)}</span>
          <span class="song-row__artist">${escapeHtml(song.artist)} · ${escapeHtml(song.album)}</span>
        </span>
        <span class="song-row__move" data-move title="移动到其他分类">⇄</span>
        <span class="song-row__play">▶</span>
      `;
      paintCover(li.querySelector('[data-cover]'), song);

      const moveEl = li.querySelector('[data-move]');
      if (moveEl) {
        moveEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openMoveModal(song);
        });
      }

      li.addEventListener('click', () => {
        const idx = findSongInQueue(song.id);
        playAt(idx);
        openNowPlaying();
      });
      dom.songsList.appendChild(li);
    });
  }

  // 高亮当前播放行 / 更新行内播放图标
  function updateActiveRow() {
    const cur = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
    dom.songsList.querySelectorAll('.song-row').forEach((row) => {
      const isActive = !!cur && row.dataset.songId === cur.id;
      row.classList.toggle('is-active', isActive);
      const playEl = row.querySelector('.song-row__play');
      if (playEl) playEl.textContent = isActive && state.isPlaying ? '❚❚' : '▶';
    });
  }

  // 更新播放条 + 详情页的歌曲信息
  function updateTrackInfo(song) {
    if (!song) return;
    paintCover(dom.miniCover, song);
    paintCover(dom.npCover, song);

    dom.miniTitle.textContent = song.title;
    dom.miniArtist.textContent = song.artist;

    dom.npTitle.textContent = song.title;
    dom.npArtist.textContent = song.artist;
    dom.npAlbum.textContent = song.album;
    const songCat = categoryOfSong(song.src);
    dom.npCategory.textContent = songCat ? songCat.name : getCurrentCategoryName();

    renderLyrics(song.lyrics);
  }

  // 渲染歌词
  function renderLyrics(text) {
    const lines = String(text || '')
      .split('\n')
      .filter((l) => l.trim() !== '');
    dom.npLyrics.innerHTML = lines
      .map((line) => `<p class="lyrics-line">${escapeHtml(line)}</p>`)
      .join('');
  }

  // 同步播放/暂停按钮图标 + 唱片旋转状态
  function syncPlayUI() {
    const playing = state.isPlaying;
    dom.playPauseBtn.innerHTML = playing ? ICON.pause : ICON.play;
    dom.npPlayPauseBtn.innerHTML = playing ? ICON.pause : ICON.play;
    dom.nowPlayingView.classList.toggle('is-playing', playing);
    updateActiveRow();
  }

  // 通知外层容器（门户 shell）当前是否正在播放；独立打开时 window.parent===window，不发消息
  function postPlayState(playing) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'mp-playing', playing: !!playing }, '*');
      }
    } catch (e) {}
  }

  // 统一更新进度条与时间（播放条 + 详情页两处同步）
  function updateProgressUI(percent, cur, dur) {
    dom.progressBar.value = String(percent);
    dom.npProgressBar.value = String(percent);
    setRangeFill(dom.progressBar, percent);
    setRangeFill(dom.npProgressBar, percent);

    const curText = formatTime(cur);
    const durText = formatTime(dur);
    dom.curTime.textContent = curText;
    dom.npCurTime.textContent = curText;
    dom.durTime.textContent = durText;
    dom.npDurTime.textContent = durText;
  }

  // 视图切换（分类 / 歌曲列表）
  function showView(name) {
    if (name === 'categories') {
      dom.categoriesView.classList.remove('is-hidden');
      dom.songsView.classList.add('is-hidden');
    } else {
      dom.categoriesView.classList.add('is-hidden');
      dom.songsView.classList.remove('is-hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 打开播放详情页
  function openNowPlaying() {
    dom.nowPlayingView.classList.remove('is-hidden');
    dom.nowPlayingView.setAttribute('aria-hidden', 'false');
    dom.nowPlayingView.classList.toggle('is-playing', state.isPlaying);
  }

  // 关闭播放详情页
  function closeNowPlaying() {
    dom.nowPlayingView.classList.add('is-hidden');
    dom.nowPlayingView.setAttribute('aria-hidden', 'true');
  }

  /* =======================================================
   * 7. 事件绑定
   * ===================================================== */

  // 进度条拖动 / 点击跳转（播放条与详情页共用）
  function bindProgressBar(bar) {
    bar.addEventListener('pointerdown', () => {
      state.seeking = true;
    });
    bar.addEventListener('input', () => {
      const dur = dom.audio.duration || 0;
      const percent = parseFloat(bar.value) || 0;
      const t = (percent / 100) * dur;
      setRangeFill(bar, percent);
      dom.curTime.textContent = formatTime(t);
      dom.npCurTime.textContent = formatTime(t);
    });
    const commit = () => {
      const dur = dom.audio.duration || 0;
      if (dur > 0) {
        dom.audio.currentTime = ((parseFloat(bar.value) || 0) / 100) * dur;
      }
      state.seeking = false;
    };
    bar.addEventListener('change', commit);
    bar.addEventListener('pointerup', commit);
  }

  function bindEvents() {
    // 返回分类
    dom.backToCategoriesBtn.addEventListener('click', () => showView('categories'));

    // 播放条控制
    dom.playPauseBtn.addEventListener('click', togglePlay);
    dom.prevBtn.addEventListener('click', prev);
    dom.nextBtn.addEventListener('click', next);

    // 点击播放条歌曲信息 -> 打开详情页
    dom.miniTrackInfo.addEventListener('click', () => {
      if (state.currentIndex >= 0) openNowPlaying();
    });

    // 详情页控制
    dom.npPlayPauseBtn.addEventListener('click', togglePlay);
    dom.npPrevBtn.addEventListener('click', prev);
    dom.npNextBtn.addEventListener('click', next);
    dom.closeNowPlayingBtn.addEventListener('click', closeNowPlaying);

    // 进度条
    bindProgressBar(dom.progressBar);
    bindProgressBar(dom.npProgressBar);

    // 音量
    dom.volumeBar.addEventListener('input', () => {
      setVolume(parseFloat(dom.volumeBar.value) || 0);
    });
    dom.muteBtn.addEventListener('click', toggleMute);

    // 移动分类：播放条 / 详情页的"移动"按钮
    const openMoveForCurrent = () => {
      const cur = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
      if (cur) openMoveModal(cur);
      else toast('还没有正在播放的歌曲');
    };
    dom.miniMoveBtn.addEventListener('click', openMoveForCurrent);
    dom.npMoveBtn.addEventListener('click', openMoveForCurrent);
    dom.moveCancelBtn.addEventListener('click', closeMoveModal);
    const moveBackdrop = dom.moveModal.querySelector('[data-close]');
    if (moveBackdrop) moveBackdrop.addEventListener('click', closeMoveModal);

    // 新建分组
    const cgBtn = document.getElementById('createGroupBtn');
    if (cgBtn) cgBtn.addEventListener('click', openCreateGroupModal);
    const cgModal = document.getElementById('createGroupModal');
    if (cgModal) {
      const cgCancel = document.getElementById('createGroupCancel');
      if (cgCancel) cgCancel.addEventListener('click', closeCreateGroupModal);
      const cgBackdrop = cgModal.querySelector('[data-close-cg]');
      if (cgBackdrop) cgBackdrop.addEventListener('click', closeCreateGroupModal);
      const cgConfirm = document.getElementById('createGroupConfirm');
      if (cgConfirm) cgConfirm.addEventListener('click', confirmCreateGroup);
      const cgInput = document.getElementById('createGroupInput');
      if (cgInput) cgInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); confirmCreateGroup(); }
      });
    }

    // 音频事件
    dom.audio.addEventListener('play', () => {
      state.isPlaying = true;
      syncPlayUI();
      postPlayState(true);
    });
    dom.audio.addEventListener('pause', () => {
      state.isPlaying = false;
      syncPlayUI();
      postPlayState(false);
    });

    // 响应外层容器的状态查询（用于切换标签后同步“音乐播放中”提示）
    window.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'mp-query-state') postPlayState(state.isPlaying);
    });
    dom.audio.addEventListener('timeupdate', () => {
      if (state.seeking) return;
      const dur = dom.audio.duration || 0;
      const cur = dom.audio.currentTime || 0;
      const percent = dur ? (cur / dur) * 100 : 0;
      updateProgressUI(percent, cur, dur);
    });
    dom.audio.addEventListener('loadedmetadata', () => {
      const dur = dom.audio.duration || 0;
      updateProgressUI(0, dom.audio.currentTime || 0, dur);
    });
    dom.audio.addEventListener('ended', () => {
      next();
    });

    // 音频加载/播放出错时给出提示（常见原因：文件路径写错或文件不存在）
    dom.audio.addEventListener('error', () => {
      const cur = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
      console.warn('[音乐] 无法加载音频：', cur ? cur.src : '(未知)');
      dom.miniArtist.textContent = '音频加载失败，请检查文件路径';
    });

    // 键盘快捷键（Esc：先关移动弹窗，再关详情页）
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const cgm = document.getElementById('createGroupModal');
      if (cgm && !cgm.classList.contains('is-hidden')) { closeCreateGroupModal(); return; }
      if (!dom.moveModal.classList.contains('is-hidden')) { closeMoveModal(); return; }
      if (!dom.nowPlayingView.classList.contains('is-hidden')) closeNowPlaying();
    });
  }

  /* =======================================================
   * 7.5 移动歌曲到其他分类
   * ===================================================== */
  let currentMoveSong = null;
  let toastTimer = null;

  // 找到某首歌（按 src）所属的分类
  function categoryOfSong(src) {
    for (const c of CATEGORIES) {
      if (c.songs.some((s) => s.src === src)) return c;
    }
    return null;
  }

  // 轻量 toast 提示
  function toast(msg) {
    let el = document.getElementById('appToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'appToast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2200);
  }

  // 打开"移动到分类"弹窗
  function openMoveModal(song) {
    if (!song) return;
    currentMoveSong = song;
    dom.moveSongTitle.textContent = song.title;
    const from = categoryOfSong(song.src);
    const others = CATEGORIES.filter((c) => !from || c.name !== from.name);
    dom.moveCategoryList.innerHTML = '';
    if (others.length === 0) {
      dom.moveCategoryList.innerHTML = '<p class="modal__empty">没有其他分类可移动</p>';
    } else {
      others.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'modal__cat';
        b.style.background = c.theme;
        b.innerHTML = '<span class="modal__cat-icon">' + c.icon + '</span><span>' + escapeHtml(c.name) + '</span>';
        b.addEventListener('click', () => doMove(song, c.name));
        dom.moveCategoryList.appendChild(b);
      });
    }
    dom.moveModal.classList.remove('is-hidden');
    dom.moveModal.setAttribute('aria-hidden', 'false');
  }

  function closeMoveModal() {
    dom.moveModal.classList.add('is-hidden');
    dom.moveModal.setAttribute('aria-hidden', 'true');
    currentMoveSong = null;
  }

  // 新建分组弹窗
  function openCreateGroupModal() {
    const m = document.getElementById('createGroupModal');
    const inp = document.getElementById('createGroupInput');
    if (!m) return;
    if (inp) inp.value = '';
    m.classList.remove('is-hidden');
    m.setAttribute('aria-hidden', 'false');
    if (inp) setTimeout(function () { inp.focus(); }, 30);
  }
  function closeCreateGroupModal() {
    const m = document.getElementById('createGroupModal');
    if (!m) return;
    m.classList.add('is-hidden');
    m.setAttribute('aria-hidden', 'true');
  }
  function confirmCreateGroup() {
    const inp = document.getElementById('createGroupInput');
    if (createGroup(inp ? inp.value : '')) closeCreateGroupModal();
  }

  // 内存中把歌曲从原分类移到目标分类
  function moveInMemory(song, toName) {
    const from = categoryOfSong(song.src);
    const to = CATEGORIES.find((c) => c.name === toName);
    if (!from || !to || from === to) return;
    from.songs = from.songs.filter((s) => s.src !== song.src);
    to.songs.push(song);
  }

  // 重建当前分类的播放队列（尽量保留正在播放的那首的索引）
  function rebuildQueueForCurrentCategory() {
    const cat = CATEGORIES.find((c) => c.id === state.currentCategoryId);
    if (!cat) return;
    const playing = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
    const playingId = playing ? playing.id : null;
    state.queue = cat.songs.slice();
    state.currentIndex = playingId ? findSongInQueue(playingId) : -1;
  }

  // 重新渲染当前视图（分类页或歌曲列表）
  function rerenderCurrentView() {
    if (!dom.categoriesView.classList.contains('is-hidden')) {
      renderCategories();
    } else if (!dom.songsView.classList.contains('is-hidden')) {
      const cat = CATEGORIES.find((c) => c.id === state.currentCategoryId);
      if (cat) { renderSongs(cat); updateActiveRow(); }
      else showView('categories');
    }
  }

  // 执行移动：本地覆盖层持久化（静态托管也生效） + 尝试写回 playlist.txt（serve.py 的 /api/move）
  async function doMove(song, toName) {
    const from = categoryOfSong(song.src);
    if (!from || from.name === toName) { closeMoveModal(); return; }
    // 1) 本地持久化：记住这首歌归属到目标分组（刷新后仍有效）
    const o = readOverlay();
    o.assign[song.src] = toName;
    writeOverlay(o);
    // 2) 尽力写回 playlist.txt（仅 serve.py 后端可用时）
    try {
      await fetch('api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: song.src, from: from.name, to: toName }),
      });
    } catch (e) { /* 静态托管没有后端接口，交给本地覆盖层 */ }
    // 3) 界面同步移动
    moveInMemory(song, toName);
    rebuildQueueForCurrentCategory();
    rerenderCurrentView();
    const cur = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
    if (cur && cur.src === song.src) updateTrackInfo(cur);
    closeMoveModal();
    toast('已移动到「' + toName + '」');
  }

  /* =======================================================
   * 8. 初始化
   * ===================================================== */
  async function init() {
    // 预置按钮图标（不依赖数据）
    dom.playPauseBtn.innerHTML = ICON.play;
    dom.npPlayPauseBtn.innerHTML = ICON.play;
    dom.prevBtn.innerHTML = ICON.prev;
    dom.nextBtn.innerHTML = ICON.next;
    dom.npPrevBtn.innerHTML = ICON.prev;
    dom.npNextBtn.innerHTML = ICON.next;
    dom.muteBtn.innerHTML = ICON.volume;
    dom.miniMoveBtn.innerHTML = ICON.move;
    dom.npMoveBtn.innerHTML = ICON.move;

    // 初始音量与进度
    setVolume(state.volume);
    updateProgressUI(0, 0, 0);

    // 先绑定事件：即使清单加载失败，播放条控件也可用
    bindEvents();

    // 读取：播放列表（可选） + 资源目录音频（自动识别） + 本地分组覆盖
    try {
      const both = await Promise.all([fetchPlaylistText(), fetchAudioList()]);
      CATEGORIES = buildCategories(both[0], both[1]);
      applyOverlay();
      // 未分组若已空则不显示（避免空分类干扰）
      CATEGORIES = CATEGORIES.filter(function (c) {
        return !(c.name === '\u672a\u5206\u7ec4' && c.songs.length === 0);
      });
      if (!CATEGORIES.length) {
        dom.categoriesGrid.innerHTML =
          '<p class="load-error">\u8fd8\u6ca1\u6709\u53ef\u64ad\u653e\u7684\u97f3\u4e50\u3002\u628a\u97f3\u9891\u6587\u4ef6\u653e\u8fdb resource/ \u76ee\u5f55\u5373\u53ef\u81ea\u52a8\u51fa\u73b0\u5728\u300c\u672a\u5206\u7ec4\u300d\uff0c\u6216\u5728 resource/playlist.txt \u4e2d\u767b\u8bb0\u5206\u7c7b\u3002</p>';
      } else {
        renderCategories();
      }
    } catch (e) {
      dom.categoriesGrid.innerHTML =
        '<p class="load-error">加载失败：' +
        escapeHtml(e && e.message ? e.message : String(e)) + '</p>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
