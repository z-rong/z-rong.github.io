#!/usr/bin/env node
/**
 * scan-resource.mjs — 扫描 resource/ 目录，生成 resource/.index.json 清单。
 * 用途：当部署环境无法提供目录列表（无法运行时递归抓取）时，页面可退回到读取此清单。
 * 用法：node scan-resource.mjs
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'resource';
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue; // 跳过隐藏文件（含 .index.json 本身）
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else files.push(relative(ROOT, p).split(sep).join('/'));
  }
}

walk(ROOT);
files.sort((a, b) => a.localeCompare(b, 'zh'));
writeFileSync(join(ROOT, '.index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2));
console.log(`indexed ${files.length} files -> resource/.index.json`);
console.log(files.join('\n'));
