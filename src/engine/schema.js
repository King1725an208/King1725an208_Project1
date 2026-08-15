/**
 * 知识树主题包 Schema 校验器（Seam S1）
 * 输入：任意值（待校验的主题包对象）
 * 输出：{ ok: boolean, errors: string[] } —— errors 为可读的中文字段级错误信息
 */
export function validateThemePackage(pkg) {
  const errors = [];

  const title = pkg?.meta?.title;
  if (typeof title !== 'string' || title.trim() === '') {
    errors.push('meta.title 缺失或不是非空字符串');
  }

  // 节点 chapter 必须引用 chapters 中已定义的章节 id（递归遍历整棵树）
  const chapterIds = new Set(
    Array.isArray(pkg?.chapters) ? pkg.chapters.map((c) => c?.id) : []
  );

  const checkNode = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.chapter === 'string' && !chapterIds.has(node.chapter)) {
      errors.push(`${path}.chapter 引用了未定义的章节 "${node.chapter}"`);
    }
    const children = Array.isArray(node.children) ? node.children : [];
    children.forEach((child, i) => checkNode(child, `${path}.children[${i}]`));
  };

  const nodes = Array.isArray(pkg?.nodes) ? pkg.nodes : [];
  nodes.forEach((node, i) => checkNode(node, `nodes[${i}]`));

  return { ok: errors.length === 0, errors };
}
