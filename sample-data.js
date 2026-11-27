/* ============================================================
   sample-data.js — 内置示例数据（开箱即用）
   - files:  示例 Markdown 文件，path 的第一段即为「主题」文件夹
   - assets: 相对路径图片资源（内联 SVG 字符串），运行时转成 blob URL
   ============================================================ */
(function (global) {
  'use strict';

  var files = [
    /* ---------------- 主题：guides ---------------- */
    {
      path: 'guides/README.md',
      content: [
        '# README 查看器使用指南',
        '',
        '欢迎使用 **README 查看器** —— 一个纯前端、可完全离线运行的 Markdown 阅读工具。',
        '它会在浏览器本地读取你选择的文件夹，把其中的 Markdown / README 文件按「主题」分组展示。',
        '',
        '![整体流程示意图](assets/overview.svg)',
        '',
        '> 所有文件都在你的浏览器中读取和渲染，**不会上传到任何服务器**。',
        '',
        '## 主要特性',
        '',
        '- **主题分组**：以顶层子文件夹作为主题，侧边栏可折叠浏览',
        '- **沉浸式阅读**：正文限宽排版，支持明暗主题',
        '- **即时筛选**：搜索文件名、路径，甚至正文内容',
        '- **完整语法**：支持常见 GFM 语法',
        '- **响应式**：手机上侧栏变为可滑出抽屉',
        '',
        '## 快速开始',
        '',
        '1. 点击右上角 **打开文件夹**，或将文件夹直接拖拽到页面上',
        '2. 在左侧选择要阅读的文件',
        '3. 使用顶部搜索框快速定位文件',
        '',
        '### 代码示例',
        '',
        '~~~js',
        'function greet(name) {',
        '  const time = new Date().toLocaleTimeString();',
        '  return `你好，${name}！现在是 ${time}`;',
        '}',
        "console.log(greet('README'));",
        '~~~',
        '',
        '### 支持的能力一览',
        '',
        '| 语法 | 是否支持 | 备注 |',
        '| :--- | :---: | :--- |',
        '| 标题 / 段落 | ✅ | ATX 多级标题 |',
        '| 列表 / 任务列表 | ✅ | 支持嵌套 |',
        '| 代码块 | ✅ | 带语言标签与复制 |',
        '| 表格 | ✅ | 支持对齐 |',
        '| 图片 | ✅ | 相对路径自动解析 |',
        '',
        '## 待办清单',
        '',
        '- [x] 实现 Markdown 解析器',
        '- [x] 支持明暗主题切换',
        '- [ ] 增加目录大纲导航',
        '- [ ] 支持导出为 PDF',
        '',
        '---',
        '',
        '祝你阅读愉快！'
      ].join('\n')
    },
    {
      path: 'guides/getting-started.md',
      content: [
        '# 快速上手',
        '',
        '本篇带你 3 分钟熟悉 README 查看器的常见操作。',
        '',
        '## 一、打开内容',
        '',
        '你可以通过两种方式导入文件：',
        '',
        '1. **选择文件夹**：点击顶栏的「打开文件夹」按钮',
        '2. **拖拽导入**：把整个文件夹拖进页面即可',
        '',
        '> 提示：浏览器出于安全限制，只能读取你主动选择或拖入的目录。',
        '',
        '## 二、认识界面',
        '',
        '| 区域 | 作用 |',
        '| --- | --- |',
        '| 左侧边栏 | 按主题分组的文件树 |',
        '| 顶部搜索 | 按文件名 / 路径 / 正文过滤 |',
        '| 右侧主区 | 沉浸式阅读 Markdown |',
        '',
        '## 三、常用快捷键',
        '',
        '- `Ctrl / Cmd + K`：聚焦搜索框（可自行扩展）',
        '- `Esc`：关闭移动端抽屉',
        '',
        '## 小结',
        '',
        '- [x] 学会导入文件夹',
        '- [x] 认识整体布局',
        '- [ ] 尝试切换暗色主题',
        '',
        '继续阅读下一篇，了解如何组织你的文档主题。'
      ].join('\n')
    },

    /* ---------------- 主题：projects ---------------- */
    {
      path: 'projects/aurora/README.md',
      content: [
        '# Aurora 项目说明',
        '',
        '**Aurora** 是一个面向数据可视化的前端组件库，专注于高性能图表与流畅交互。',
        '',
        '![Aurora 架构](assets/architecture.svg)',
        '',
        '## 简介',
        '',
        'Aurora 采用分层架构，将数据层、渲染层与交互层解耦，开发者可以按需组合。',
        '',
        '## 安装',
        '',
        '~~~bash',
        'npm install @aurora/core',
        '~~~',
        '',
        '## 快速开始',
        '',
        '~~~js',
        "import { Chart } from '@aurora/core';",
        '',
        "const chart = new Chart('#app', {",
        "  type: 'line',",
        '  data: [12, 19, 8, 25, 14],',
        '});',
        'chart.render();',
        '~~~',
        '',
        '## 目录结构',
        '',
        '- `packages/core` —— 核心渲染引擎',
        '- `packages/charts` —— 图表组件',
        '- `packages/themes` —— 主题包',
        '- `docs` —— 文档站',
        '',
        '## 版本路线',
        '',
        '| 版本 | 状态 | 说明 |',
        '| :--- | :--- | :--- |',
        '| 1.0 | 已发布 | 基础图表能力 |',
        '| 1.2 | 进行中 | 新增主题系统 |',
        '| 2.0 | 规划中 | WebGL 渲染 |',
        '',
        '> 本项目仍处于快速迭代阶段，API 可能调整，请关注 Release 说明。'
      ].join('\n')
    },
    {
      path: 'projects/aurora/architecture.md',
      content: [
        '# Aurora 架构设计',
        '',
        '本文介绍 Aurora 的内部模块划分与数据流。',
        '',
        '## 分层结构',
        '',
        '![分层架构图](assets/architecture.svg)',
        '',
        '自上而下分为三层：',
        '',
        '1. **接入层**：负责图表实例创建与配置解析',
        '2. **渲染层**：基于 Canvas / SVG 的绘制管线',
        '3. **数据层**：数据集管理、坐标映射与缩放',
        '',
        '## 数据流',
        '',
        '~~~text',
        '用户配置 → 配置解析 → 数据变换 → 布局计算 → 绘制 → 交互反馈',
        '~~~',
        '',
        '## 关键设计',
        '',
        '> 渲染与交互分离，使同一份数据可以同时输出到屏幕与静态图片。',
        '',
        '- **可插拔渲染器**：Canvas、SVG、WebGL',
        '- **增量更新**：仅重绘脏区域',
        '- **主题无关**：样式通过主题包注入',
        '',
        '## 性能指标',
        '',
        '| 场景 | 帧率 | 数据量 |',
        '| --- | :---: | --- |',
        '| 折线图 | 60 FPS | 10 万点 |',
        '| 散点图 | 55 FPS | 5 万点 |',
        '| 热力图 | 60 FPS | 1024² |',
        '',
        '## 后续工作',
        '',
        '- [x] 完成 Canvas 渲染器',
        '- [ ] 引入 WebGL 后端',
        '- [ ] 支持服务端渲染'
      ].join('\n')
    },

    /* ---------------- 主题：notes ---------------- */
    {
      path: 'notes/javascript-tips.md',
      content: [
        '# JavaScript 实用技巧',
        '',
        '记录一些日常开发中常用的小技巧。',
        '',
        '## 可选链与空值合并',
        '',
        '~~~js',
        "const name = user?.profile?.name ?? '匿名用户';",
        '~~~',
        '',
        '## 数组去重',
        '',
        '~~~js',
        'const unique = [...new Set([1, 2, 2, 3, 3, 3])];',
        'console.log(unique); // [1, 2, 3]',
        '~~~',
        '',
        '## 防抖',
        '',
        '~~~js',
        'function debounce(fn, delay = 300) {',
        '  let timer = null;',
        '  return (...args) => {',
        '    clearTimeout(timer);',
        '    timer = setTimeout(() => fn(...args), delay);',
        '  };',
        '}',
        '~~~',
        '',
        '## 常用方法对照',
        '',
        '| 需求 | 方法 |',
        '| --- | --- |',
        '| 深拷贝 | `structuredClone(obj)` |',
        '| 类型判断 | `Object.prototype.toString.call(x)` |',
        '| 格式化数字 | `(1234.5).toLocaleString()` |',
        '',
        '> 小提示：优先使用标准库能力，减少第三方依赖。',
        '',
        '## 学习清单',
        '',
        '- [x] 掌握可选链',
        '- [x] 掌握防抖节流',
        '- [ ] 了解 `requestIdleCallback`'
      ].join('\n')
    },
    {
      path: 'notes/css-layout.md',
      content: [
        '# CSS 布局笔记',
        '',
        '现代 CSS 布局以 **Flexbox** 与 **Grid** 为核心。',
        '',
        '![常见布局示意](assets/layout.svg)',
        '',
        '## Flexbox 一维布局',
        '',
        '~~~css',
        '.toolbar {',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: space-between;',
        '  gap: 12px;',
        '}',
        '~~~',
        '',
        '## Grid 二维布局',
        '',
        '~~~css',
        '.grid {',
        '  display: grid;',
        '  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));',
        '  gap: 16px;',
        '}',
        '~~~',
        '',
        '## 响应式断点建议',
        '',
        '| 断点 | 宽度 | 典型设备 |',
        '| --- | --- | --- |',
        '| sm | < 640px | 手机 |',
        '| md | 640–1024px | 平板 |',
        '| lg | > 1024px | 桌面 |',
        '',
        '> 使用 `minmax` 与 `auto-fill` 可以减少大量媒体查询。',
        '',
        '## 待整理',
        '',
        '- [x] 整理 Flex 常见用法',
        '- [x] 整理 Grid 常见用法',
        '- [ ] 补充容器查询示例'
      ].join('\n')
    },

    /* ---------------- 主题：about ---------------- */
    {
      path: 'about/README.md',
      content: [
        '# 关于本工具',
        '',
        'README 查看器是一个 **零依赖、纯静态** 的单页应用。',
        '',
        '## 设计初衷',
        '',
        '很多项目把文档拆散在各个子目录里，我们希望有一个轻量工具，',
        '能把它们按主题聚合、安静地读完。',
        '',
        '## 技术栈',
        '',
        '- 原生 HTML / CSS / JavaScript',
        '- 自研轻量 Markdown 解析器',
        '- 无构建步骤、无 CDN 依赖，完全离线',
        '',
        '## 隐私承诺',
        '',
        '- [x] 文件仅在本地读取',
        '- [x] 不上传、不联网',
        '- [x] 刷新后不保留文件内容',
        '',
        '> 选择文件夹只是授权浏览器读取，数据始终留在你的设备上。',
        '',
        '---',
        '',
        'Made with care · 祝你阅读愉快 📖'
      ].join('\n')
    }
  ];

  /* ---------------- 示例图片资源（内联 SVG） ---------------- */

  var overviewSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" font-family="-apple-system,Segoe UI,Roboto,sans-serif">
  <defs>
    <linearGradient id="b1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#7aa7ff"/>
    </linearGradient>
    <linearGradient id="b2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#c4b5fd"/>
    </linearGradient>
    <linearGradient id="b3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0ea5e9"/><stop offset="1" stop-color="#7dd3fc"/>
    </linearGradient>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
      <path d="M0,0 L7,3 L0,6 Z" fill="#94a3b8"/>
    </marker>
  </defs>
  <rect width="720" height="280" fill="#f7f9fc" rx="18"/>
  <text x="360" y="46" text-anchor="middle" font-size="18" font-weight="700" fill="#334155">README 查看器 · 工作流程</text>

  <g>
    <rect x="46" y="98" width="176" height="96" rx="14" fill="url(#b1)"/>
    <text x="134" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff">本地文件夹</text>
    <text x="134" y="165" text-anchor="middle" font-size="12" fill="#e3edff">File API · 完全离线</text>
  </g>
  <line x1="228" y1="146" x2="278" y2="146" stroke="#94a3b8" stroke-width="2.4" marker-end="url(#arrow)"/>

  <g>
    <rect x="286" y="98" width="176" height="96" rx="14" fill="url(#b2)"/>
    <text x="374" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff">Markdown 解析</text>
    <text x="374" y="165" text-anchor="middle" font-size="12" fill="#f0e9ff">自研轻量解析器</text>
  </g>
  <line x1="468" y1="146" x2="518" y2="146" stroke="#94a3b8" stroke-width="2.4" marker-end="url(#arrow)"/>

  <g>
    <rect x="526" y="98" width="150" height="96" rx="14" fill="url(#b3)"/>
    <text x="601" y="140" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff">沉浸阅读</text>
    <text x="601" y="165" text-anchor="middle" font-size="12" fill="#e2f4ff">明暗双主题</text>
  </g>

  <text x="360" y="232" text-anchor="middle" font-size="12" fill="#94a3b8">选择文件夹 → 解析内容 → 舒适阅读</text>
</svg>`;

  var architectureSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 340" font-family="-apple-system,Segoe UI,Roboto,sans-serif">
  <rect width="720" height="340" fill="#f7f9fc" rx="18"/>
  <text x="360" y="44" text-anchor="middle" font-size="18" font-weight="700" fill="#334155">Aurora 分层架构</text>

  <g>
    <rect x="90" y="70" width="540" height="58" rx="12" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5"/>
    <text x="360" y="96" text-anchor="middle" font-size="15" font-weight="700" fill="#1e3a8a">接入层 · Access</text>
    <text x="360" y="116" text-anchor="middle" font-size="12" fill="#3b5bab">图表实例创建 · 配置解析</text>
  </g>

  <g>
    <rect x="90" y="146" width="540" height="58" rx="12" fill="#ede9fe" stroke="#c4b5fd" stroke-width="1.5"/>
    <text x="360" y="172" text-anchor="middle" font-size="15" font-weight="700" fill="#4c1d95">渲染层 · Render</text>
    <text x="360" y="192" text-anchor="middle" font-size="12" fill="#6d28d9">Canvas · SVG · WebGL 绘制管线</text>
  </g>

  <g>
    <rect x="90" y="222" width="540" height="58" rx="12" fill="#cffafe" stroke="#67e8f9" stroke-width="1.5"/>
    <text x="360" y="248" text-anchor="middle" font-size="15" font-weight="700" fill="#155e75">数据层 · Data</text>
    <text x="360" y="268" text-anchor="middle" font-size="12" fill="#0e7490">数据集管理 · 坐标映射 · 缩放</text>
  </g>

  <path d="M360 128 L360 146" stroke="#cbd5e1" stroke-width="2"/>
  <path d="M360 204 L360 222" stroke="#cbd5e1" stroke-width="2"/>
  <text x="360" y="312" text-anchor="middle" font-size="12" fill="#94a3b8">各层解耦，可独立替换与扩展</text>
</svg>`;

  var layoutSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 300" font-family="-apple-system,Segoe UI,Roboto,sans-serif">
  <rect width="720" height="300" fill="#f7f9fc" rx="18"/>
  <text x="360" y="42" text-anchor="middle" font-size="18" font-weight="700" fill="#334155">常见布局：Flexbox 与 Grid</text>

  <text x="150" y="82" text-anchor="middle" font-size="13" font-weight="600" fill="#475569">Flex · 一维</text>
  <rect x="60" y="96" width="180" height="150" rx="12" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1.5"/>
  <rect x="74" y="112" width="44" height="118" rx="8" fill="#818cf8"/>
  <rect x="126" y="112" width="44" height="118" rx="8" fill="#a5b4fc"/>
  <rect x="178" y="112" width="44" height="118" rx="8" fill="#c7d2fe"/>

  <text x="360" y="82" text-anchor="middle" font-size="13" font-weight="600" fill="#475569">Grid · 二维</text>
  <g fill="#38bdf8" opacity="0.9">
    <rect x="288" y="96" width="66" height="44" rx="8" fill="#0ea5e9"/>
    <rect x="364" y="96" width="66" height="44" rx="8" fill="#38bdf8"/>
    <rect x="440" y="96" width="66" height="44" rx="8" fill="#7dd3fc"/>
    <rect x="288" y="150" width="66" height="44" rx="8" fill="#38bdf8"/>
    <rect x="364" y="150" width="66" height="44" rx="8" fill="#7dd3fc"/>
    <rect x="440" y="150" width="66" height="44" rx="8" fill="#0ea5e9"/>
    <rect x="288" y="204" width="66" height="44" rx="8" fill="#7dd3fc"/>
    <rect x="364" y="204" width="66" height="44" rx="8" fill="#0ea5e9"/>
    <rect x="440" y="204" width="66" height="44" rx="8" fill="#38bdf8"/>
  </g>

  <text x="596" y="150" text-anchor="middle" font-size="12" fill="#94a3b8">auto-fill</text>
  <text x="596" y="170" text-anchor="middle" font-size="12" fill="#94a3b8">minmax()</text>
  <text x="596" y="190" text-anchor="middle" font-size="12" fill="#94a3b8">gap</text>
</svg>`;

  var assets = {
    'guides/assets/overview.svg': overviewSvg,
    'projects/aurora/assets/architecture.svg': architectureSvg,
    'notes/assets/layout.svg': layoutSvg
  };

  global.SAMPLE_DATA = { files: files, assets: assets };
})(window);
