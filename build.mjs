/**
 * 零依赖打包器：把 引擎模块 + D3 + 主题包 + 渲染层 内联为单文件 index.html（NFR-01）
 * 用法：node build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');

// 剥掉 ESM 语法：源码均为单文件内单行长 import / 前缀式 export，可直接正则处理
const strip = (code) =>
  code
    .replace(/^import\s+[^\n]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+(?=(async\s+)?(function|const|let|var|class)\s)/gm, '')
    .replace(/^export\s*\{[^}]*\};?\s*$/gm, '');

const d3 = read('src/vendor/d3.min.js');
const engine = [
  'src/engine/walk.js',       // walk（统一树遍历深模块，所有引擎模块依赖它）
  'src/engine/schema.js',     // validateThemePackage
  'src/engine/layout.js',     // computeLayout（transfer 无依赖，顺序仅求定义先于使用）
  'src/engine/transfer.js',   // import/exportThemePackage（用 schema）
  'src/engine/tree-store.js', // createTreeStore
  'src/engine/package-registry.js', // createPackageRegistry + storage adapters
  'src/engine/search.js',     // searchNodes
].map((p) => strip(read(p))).join('\n');
const data = strip(read('src/data/confucius.js'));
const ui = [
  'src/ui/render-tree.js',       // renderTree + chapterColor（依赖 walk）
  'src/ui/view-controller.js',   // createViewController + 纯几何计算
].map((p) => strip(read(p))).join('\n');
const app = read('src/ui/app.js');

// 安全检查：内联内容不得含 </script>（会提前闭合 script 标签）
for (const [name, payload] of [['d3', d3], ['engine', engine], ['data', data], ['ui', ui], ['app', app]]) {
  if (payload.toLowerCase().includes('</script')) {
    throw new Error(`${name} 包含 </script> 序列，无法安全内联`);
  }
}

let html = read('src/ui/template.html');
// 用函数式替换，避免载荷中的 $ 特殊序列被 .replace 解释
html = html
  .replace('/*__D3__*/', () => d3)
  .replace('/*__ENGINE__*/', () => engine)
  .replace('/*__DATA__*/', () => data)
  .replace('/*__UI__*/', () => ui)
  .replace('/*__APP__*/', () => app);

for (const marker of ['__D3__', '__ENGINE__', '__DATA__', '__UI__', '__APP__']) {
  if (html.includes(marker)) throw new Error(`占位符未被替换: ${marker}`);
}

writeFileSync('index.html', html);
console.log(`index.html 构建完成：${(html.length / 1024).toFixed(1)} KB`);