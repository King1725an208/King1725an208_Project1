/**
 * 统一树遍历深模块
 *
 * 接口：walk(nodes, fn)
 *
 * 内部封装：
 * - 深度优先递归遍历
 * - node.children 为空/非数组/缺失的边界保护
 * - 遍历深度、祖先链、路径追踪
 * - 遍历中途中断（fn 返回 false 即停止整棵树遍历）
 *
 * @param {Array}    nodes 根节点数组（null/undefined/非数组安全，等价于空树）
 * @param {function} fn    回调 (node, context) => false|void
 *   context = { depth, index, parent, parentArray, ancestors, path }
 *   - depth:       当前深度（根层为 0）
 *   - index:       在父级 children 数组中的下标
 *   - parent:      父节点（根层为 null）
 *   - parentArray: 包含当前节点的数组（根层即为传入的 nodes）
 *   - ancestors:   祖先节点数组（从根到父，根层为空数组）
 *   - path:        从根到当前节点的下标路径（如 [0, 2, 1]）
 *   返回 false 可中断整个遍历。
 */
export function walk(nodes, fn) {
  const root = Array.isArray(nodes) ? nodes : [];

  function traverse(arr, parent, ancestors, path, depth) {
    for (let i = 0; i < arr.length; i++) {
      const node = arr[i];
      if (node == null || typeof node !== 'object') continue;

      const ctx = {
        depth,
        index: i,
        parent,
        parentArray: arr,
        ancestors,
        path: [...path, i],
      };

      if (fn(node, ctx) === false) return false;

      const children = node.children;
      if (Array.isArray(children) && children.length > 0) {
        if (traverse(children, node, [...ancestors, node], ctx.path, depth + 1) === false) {
          return false;
        }
      }
    }
    return true;
  }

  traverse(root, null, [], [], 0);
}