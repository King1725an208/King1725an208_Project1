/**
 * 树搜索（Seam S4）
 * 输入：主题包对象 + 关键词
 * 输出：命中节点数组（标题或摘要包含关键词，深度优先，含嵌套子节点）
 */
import { walk } from './walk.js';

export function searchNodes(pkg, keyword) {
  const kw = (keyword ?? '').trim();
  if (kw === '') return [];

  const hits = [];
  walk(pkg?.nodes, (node) => {
    const haystack = `${node.title ?? ''}\n${node.summary ?? ''}`;
    if (haystack.includes(kw)) hits.push(node);
  });
  return hits;
}