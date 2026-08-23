/**
 * 轻量语法检查：只检查 JS 语法是否合法，不检查风格
 * 用法：node lint.mjs
 */
import { readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const p = `${dir}/${name}`;
    if (statSync(p).isDirectory()) {
      files.push(...walk(p));
    } else if (/\.(js|mjs)$/.test(name) && !p.includes('vendor')) {
      files.push(p);
    }
  }
  return files;
}

const targets = [...walk('src'), ...walk('test'), 'build.mjs', 'lint.mjs'];
let failed = 0;

for (const file of targets) {
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
  } catch (e) {
    failed++;
    console.error(`✗ ${file}`);
    console.error(e.stderr?.toString() || e.message);
  }
}

if (failed) {
  console.error(`\n检查 ${targets.length} 个文件，${failed} 个语法错误`);
  process.exit(1);
} else {
  console.log(`✓ lint 通过，${targets.length} 个文件语法全部合法`);
}
