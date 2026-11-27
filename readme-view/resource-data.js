/* 自动生成：由 build-embedded.mjs 扫描 resource/ 生成，用于 file:// 双击本地离线打开。请勿手改；改动 resource/ 后重新运行 node build-embedded.mjs。 */
window.RESOURCE_DATA = {
  "generatedAt": "2026-11-27T07:09:24.662Z",
  "files": [
    {
      "path": "关于本项目.txt",
      "kind": "text",
      "content": "关于本项目\n\n这是一个纯静态的 README 资源查看器示例。\n\n本文件位于 resource 根目录下（没有子文件夹），因此会出现在「根目录」主题分组中。\n其余主题通过一级子文件夹来划分，例如：入门指南、开发手册、设计规范、运维手册。\n\n页面默认会自动读取 resource/ 目录下的所有子目录与文件，并按主题分组展示；\n对于 Markdown 会渲染阅读，对于代码/文本显示代码视图，对于图片直接预览，其它类型提供下载/打开入口。\n"
    },
    {
      "path": "开发手册/后端/api-design.md",
      "kind": "markdown",
      "content": "# API 设计\n\n## 风格\n\n- RESTful，JSON 交互\n- 统一响应结构\n- 资源命名使用复数\n\n## 统一响应示例\n\n~~~json\n{\n  \"code\": 0,\n  \"data\": { \"id\": 1, \"name\": \"demo\" },\n  \"message\": \"ok\"\n}\n~~~\n\n> 错误码从 40000 起：4xxxx 客户端错误，5xxxx 服务端错误。\n\n## 状态码约定\n\n| HTTP | 含义 |\n| :--- | :--- |\n| 200 | 成功 |\n| 400 | 参数错误 |\n| 401 | 未授权 |\n| 500 | 服务器错误 |\n"
    },
    {
      "path": "开发手册/配置示例.json",
      "kind": "text",
      "content": "{\n  \"name\": \"readme-viewer\",\n  \"version\": \"1.0.0\",\n  \"resourceRoot\": \"resource/\",\n  \"theme\": \"auto\",\n  \"features\": [\"tree\", \"search\", \"markdown\", \"images\", \"code-preview\"],\n  \"author\": \"your-team\"\n}\n"
    },
    {
      "path": "开发手册/前端/组件规范.md",
      "kind": "markdown",
      "content": "# 前端组件规范\n\n## 命名约定\n\n- 组件使用帕斯卡命名：`UserCard`\n- 组件文件与组件同名\n- 目录即组件边界\n\n## 推荐目录结构\n\n~~~text\nsrc/\n  components/\n    UserCard/\n      index.jsx\n      style.css\n~~~\n\n## 编码约定\n\n| 项目 | 规范 |\n| :--- | :--- |\n| 缩进 | 2 空格 |\n| 分号 | 必须 |\n| 引号 | 单引号 |\n| 命名 | 语义化、见名知意 |\n\n## 待办\n\n- [x] 统一 ESLint 规则\n- [ ] 补充单元测试\n"
    },
    {
      "path": "开发手册/README.md",
      "kind": "markdown",
      "content": "# 开发手册\n\n本主题汇总开发过程中常用的规范与配置。\n\n## 子目录导航\n\n- [前端规范](前端/组件规范.md)\n- [后端设计](后端/api-design.md)\n\n## 常用命令\n\n~~~bash\nnpm install     # 安装依赖\nnpm run dev     # 启动本地开发\nnpm run build   # 生产构建\n~~~\n\n> 具体配置示例见同级目录下的 `配置示例.json`。\n"
    },
    {
      "path": "入门指南/安装步骤.md",
      "kind": "markdown",
      "content": "# 安装步骤\n\n## 环境要求\n\n- 现代浏览器（Chrome / Edge / Firefox / Safari）\n- 可选：Python 3 或任意静态文件服务器\n\n## 安装流程\n\n1. 获取本项目代码\n2. 用静态服务器打开 `index.html`\n3. 页面会**默认读取 `resource/` 目录**\n\n> 无需数据库、无需后端，纯前端运行；所有文件都在你的浏览器里读取，不会上传。\n\n## 常见问题\n\n- **页面空白？** 请通过 `http(s)://` 打开；直接双击 `file://` 无法读取目录列表，此时会回退到内置示例。\n- **图片不显示？** 确认图片相对路径相对于所在 Markdown 文件是正确的。\n\n~~~js\n// 判断是否为 Markdown 文件的小工具\nconst isMd = (name) => /\\.(md|markdown|mdx)$/i.test(name);\n~~~\n"
    },
    {
      "path": "入门指南/图片/架构图.svg",
      "kind": "image",
      "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNjQwIDMwMCIgZm9udC1mYW1pbHk9IidTZWdvZSBVSScsc2Fucy1zZXJpZiI+CiAgPHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz4KICA8dGV4dCB4PSIzMjAiIHk9IjM0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMGYxNzJhIiBmb250LXNpemU9IjE3IiBmb250LXdlaWdodD0iNzAwIj5SRUFETUUg5p+l55yL5ZmoIMK3IOaVsOaNrua1gTwvdGV4dD4KICA8cmVjdCB4PSIzNiIgeT0iMTIwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjcwIiByeD0iMTAiIGZpbGw9IiNkYmVhZmUiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgeD0iMTExIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMxZTNhOGEiIGZvbnQtc2l6ZT0iMTUiPua1j+iniOWZqDwvdGV4dD4KICA8cmVjdCB4PSIyNDgiIHk9IjUyIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjcwIiByeD0iMTAiIGZpbGw9IiNkY2ZjZTciIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgeD0iMzIzIiB5PSI4NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzE2NjUzNCIgZm9udC1zaXplPSIxNCI+cmVzb3VyY2UvIOebruW9lTwvdGV4dD4KICA8dGV4dCB4PSIzMjMiIHk9IjEwMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzE2NjUzNCIgZm9udC1zaXplPSIxMiI+KOmAkuW9kuivu+WPlik8L3RleHQ+CiAgPHJlY3QgeD0iMjQ4IiB5PSIxODYiIHdpZHRoPSIxNTAiIGhlaWdodD0iNzAiIHJ4PSIxMCIgZmlsbD0iI2ZlZjljMyIgc3Ryb2tlPSIjZWFiMzA4IiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSIzMjMiIHk9IjIxOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzg1NGQwZSIgZm9udC1zaXplPSIxNCI+TWFya2Rvd248L3RleHQ+CiAgPHRleHQgeD0iMzIzIiB5PSIyMzciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4NTRkMGUiIGZvbnQtc2l6ZT0iMTIiPua4suafk+W8leaTjjwvdGV4dD4KICA8cmVjdCB4PSI0NjAiIHk9IjEyMCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSI3MCIgcng9IjEwIiBmaWxsPSIjZmFlOGZmIiBzdHJva2U9IiNhODU1ZjciIHN0cm9rZS13aWR0aD0iMiIvPgogIDx0ZXh0IHg9IjUzNSIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmIyMWE4IiBmb250LXNpemU9IjE1Ij7pmIXor7vnlYzpnaI8L3RleHQ+CiAgPHBhdGggZD0iTTE4NiAxNDggTDI0NiAxMDAiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTE4NiAxNjIgTDI0NiAyMDgiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTM5OCA5MiBMNDU4IDEzMiIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8cGF0aCBkPSJNMzk4IDIxNCBMNDU4IDE3NiIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg=="
    },
    {
      "path": "入门指南/README.md",
      "kind": "markdown",
      "content": "# 入门指南 · 总览\n\n欢迎来到 **Resource 资源库**。本目录下（`resource/`）的所有子目录与文件会被 README 查看器**默认自动读取**，并按「主题 = 一级子目录」分组展示。\n\n![系统架构示意图](图片/架构图.svg)\n\n> 提示：左侧的「主题」对应 `resource/` 下的一级子目录；点开任意文件即可在右侧阅读或预览。\n\n## 你将学到\n\n- 如何浏览与检索资源\n- 各主题目录分别是做什么的\n- 遇到问题的排查入口\n\n## 目录导航\n\n| 主题 | 说明 |\n| :--- | :--- |\n| 入门指南 | 你正在看的这里 |\n| 开发手册 | 前后端开发与配置 |\n| 设计规范 | 色彩与样式令牌 |\n| 运维手册 | 部署与日志 |\n\n## 快速开始\n\n1. 在左侧选择主题分组\n2. 点击具体文件\n3. 顶部搜索框可按「文件名 / 路径 / 正文」筛选\n\n### 一个小例子\n\n~~~bash\n# 本地预览本资源库\npython3 -m http.server 8000\n# 然后浏览器打开 http://localhost:8000\n~~~\n\n## 待办清单\n\n- [x] 默认自动读取 resource 目录\n- [x] 按主题分组、可折叠\n- [ ] 支持更多文件类型预览\n"
    },
    {
      "path": "设计规范/色彩系统.md",
      "kind": "markdown",
      "content": "# 色彩系统\n\n![调色板](assets/palette.svg)\n\n## 主色板\n\n- 主色（Primary）：`#2563eb`\n- 成功（Success）：`#22c55e`\n- 警告（Warning）：`#eab308`\n- 危险（Danger）：`#ef4444`\n\n## 使用原则\n\n1. 正文与背景对比度 ≥ 4.5:1\n2. 主色只用于强调与可交互元素\n3. 大面积背景使用中性色\n\n> 样式令牌详见同级目录 `tokens.css`。\n"
    },
    {
      "path": "设计规范/assets/palette.svg",
      "kind": "image",
      "dataUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgNTIwIDEyMCIgZm9udC1mYW1pbHk9IidTZWdvZSBVSScsc2Fucy1zZXJpZiI+CiAgPHJlY3Qgd2lkdGg9IjUyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNmZmZmZmYiLz4KICA8cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIHJ4PSIxMCIgZmlsbD0iIzI1NjNlYiIvPgogIDx0ZXh0IHg9IjcwIiB5PSIxMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzMzQxNTUiIGZvbnQtc2l6ZT0iMTIiPiMyNTYzZWI8L3RleHQ+CiAgPHJlY3QgeD0iMTQwIiB5PSIyMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4MCIgcng9IjEwIiBmaWxsPSIjMjJjNTVlIi8+CiAgPHRleHQgeD0iMTkwIiB5PSIxMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzMzQxNTUiIGZvbnQtc2l6ZT0iMTIiPiMyMmM1NWU8L3RleHQ+CiAgPHJlY3QgeD0iMjYwIiB5PSIyMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4MCIgcng9IjEwIiBmaWxsPSIjZWFiMzA4Ii8+CiAgPHRleHQgeD0iMzEwIiB5PSIxMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzMzQxNTUiIGZvbnQtc2l6ZT0iMTIiPiNlYWIzMDg8L3RleHQ+CiAgPHJlY3QgeD0iMzgwIiB5PSIyMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4MCIgcng9IjEwIiBmaWxsPSIjZWY0NDQ0Ii8+CiAgPHRleHQgeD0iNDMwIiB5PSIxMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzMzQxNTUiIGZvbnQtc2l6ZT0iMTIiPiNlZjQ0NDQ8L3RleHQ+Cjwvc3ZnPgo="
    },
    {
      "path": "设计规范/tokens.css",
      "kind": "text",
      "content": ":root {\n  --color-primary: #2563eb;\n  --color-success: #22c55e;\n  --color-warning: #eab308;\n  --color-danger: #ef4444;\n  --color-bg: #ffffff;\n  --color-text: #0f172a;\n  --radius: 10px;\n  --space: 8px;\n  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;\n}\n"
    },
    {
      "path": "运维手册/部署说明.md",
      "kind": "markdown",
      "content": "# 部署说明\n\n## 一键部署\n\n~~~bash\nbash scripts/deploy.sh\n~~~\n\n## 上线检查清单\n\n- [x] 静态文件已就绪\n- [ ] 域名解析已生效\n- [ ] HTTPS 证书已配置\n- [ ] 健康检查通过\n\n> 部署日志见同级目录 `最近日志.log`。\n\n## 回滚\n\n~~~bash\ncp -r /var/www/readme-viewer.bak/* /var/www/readme-viewer/\n~~~\n"
    },
    {
      "path": "运维手册/最近日志.log",
      "kind": "text",
      "content": "[2026-11-27 10:00:12] INFO  start deploy\n[2026-11-27 10:00:13] INFO  copy files ok (14 files)\n[2026-11-27 10:00:14] INFO  health check passed\n[2026-11-27 10:00:15] WARN  TLS certificate expiring in 20 days\n[2026-11-27 10:00:16] INFO  deploy finished, status=success\n"
    },
    {
      "path": "运维手册/scripts/deploy.sh",
      "kind": "text",
      "content": "#!/usr/bin/env bash\nset -euo pipefail\n\necho \"Deploying readme-viewer...\"\nTARGET=\"/var/www/readme-viewer\"\nmkdir -p \"$TARGET\"\ncp -r ./* \"$TARGET\"/\necho \"Deploy finished at $(date)\"\n"
    }
  ]
};
