/**
 * 知识树主题包 Schema 校验器（Seam S1）
 * 输入：任意值（待校验的主题包对象）
 * 输出：{ ok: boolean, errors: string[] } —— errors 为可读的中文字段级错误信息
 */
import { walk } from './walk.js';

export function validateThemePackage(pkg) {
  const errors = [];

  const title = pkg?.meta?.title;
  if (typeof title !== 'string' || title.trim() === '') {
    errors.push('meta.title 缺失或不是非空字符串');
  }

  // 节点 chapter 必须引用 chapters 中已定义的章节 id（walk 递归遍历整棵树）
  const chapterIds = new Set(
    Array.isArray(pkg?.chapters) ? pkg.chapters.map((c) => c?.id) : []
  );

  walk(pkg?.nodes, (node, ctx) => {
    if (typeof node.chapter === 'string' && !chapterIds.has(node.chapter)) {
      // 路径格式：nodes[0]、nodes[0].children[1]、nodes[0].children[1].children[0]
      const pathLabel = `nodes[${ctx.path[0]}]` +
        ctx.path.slice(1).map((i) => `.children[${i}]`).join('');
      errors.push(`${pathLabel}.chapter 引用了未定义的章节 "${node.chapter}"`);
    }
  });

  return { ok: errors.length === 0, errors };
}