#!/usr/bin/env node
/**
 * build-embedded.mjs — 扫描 resource/ 目录，把所有文件内联成 resource-data.js。
 * 用途：让页面在 file:// 双击本地打开（浏览器禁止读取目录列表）时也能离线显示 resource 内容。
 * 用法：node build-embedded.mjs   （修改 resource/ 后重新运行即可更新）
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';

const ROOT = 'resource';
const IMG = /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i;
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.ico': 'image/x-icon', '.avif': 'image/avif' };
const TEXT = /\.(txt|text|json|json5|js|mjs|cjs|ts|tsx|jsx|css|scss|less|html?|xml|ya?ml|toml|ini|conf|cfg|properties|gradle|sh|bash|zsh|py|go|rs|java|c|h|cpp|hpp|cs|rb|php|sql|csv|tsv|log|env)$/i;
const isMd = (n) => /\.(md|markdown|mdx)$/i.test(n) || /^readme(\.[a-z0-9]+)?$/i.test(n);
function kindOf(n) {
  if (isMd(n)) return 'markdown';
  if (IMG.test(n)) return 'image';
  if (TEXT.test(n)) return 'text';
  if (/^(dockerfile|makefile|license|licence|changelog)$/i.test(n)) return 'text';
  return 'binary';
}

const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue; // 跳过隐藏文件（含 .index.json）
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      const rel = relative(ROOT, p).split(sep).join('/');
      const k = kindOf(name);
      const buf = readFileSync(p);
      if (k === 'image' || k === 'binary') {
        const mime = MIME[extname(name).toLowerCase()] || 'application/octet-stream';
        files.push({ path: rel, kind: k, dataUrl: `data:${mime};base64,${buf.toString('base64')}` });
      } else {
        files.push({ path: rel, kind: k, content: buf.toString('utf8') });
      }
    }
  }
}
walk(ROOT);
files.sort((a, b) => a.path.localeCompare(b.path, 'zh'));

const header = '/* 自动生成：由 build-embedded.mjs 扫描 resource/ 生成，用于 file:// 双击本地离线打开。请勿手改；改动 resource/ 后重新运行 node build-embedded.mjs。 */\n';
const body = 'window.RESOURCE_DATA = ' + JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2) + ';\n';
writeFileSync('resource-data.js', header + body);
console.log('wrote resource-data.js:', files.length, 'files,', (Buffer.byteLength(header + body) / 1024).toFixed(1), 'KB');
