/* ============================================================
   tabs.js — 顶层标签切换：文件查看 / 音乐播放
   与查看器（app.js）解耦，仅负责显示哪个面板；记住上次选择。
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'zr-active-tab';
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.app-tab'));
  var panels = {
    files: document.getElementById('panel-files'),
    music: document.getElementById('panel-music')
  };

  function activate(name) {
    if (!panels[name]) name = 'files';
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Object.keys(panels).forEach(function (k) {
      if (panels[k]) panels[k].classList.toggle('active', k === name);
    });
    try { localStorage.setItem(KEY, name); } catch (e) {}
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      activate(t.getAttribute('data-tab'));
    });
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  activate(saved === 'music' ? 'music' : 'files');
})();
