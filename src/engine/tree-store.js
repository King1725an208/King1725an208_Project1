/**
 * 树编辑与持久化（Seam S3）
 * createTreeStore(pkg, storage, storageKey)
 *  - pkg：主题包对象（编辑直接作用于该对象，作为运行时单一数据源）
 *  - storage：localStorage 兼容适配器（测试注入内存版）；传 null 则仅内存编辑
 *  - 每次编辑操作后自动持久化（FR-E08/09）
 */
export function createTreeStore(pkg, storage, storageKey) {
  const findNode = (nodes, id) => {
    for (const node of nodes ?? []) {
      if (node.id === id) return node;
      const hit = findNode(node.children, id);
      if (hit) return hit;
    }
    return null;
  };

  const persist = () => {
    storage?.setItem(storageKey, JSON.stringify(pkg));
  };

  return {
    getPackage: () => pkg,

    addNode(parentId, node) {
      const parent = findNode(pkg.nodes, parentId);
      if (!parent) throw new Error(`父节点不存在: ${parentId}`);
      parent.children = Array.isArray(parent.children) ? parent.children : [];
      parent.children.push(node);
      persist();
    },

    updateNode(nodeId, patch) {
      const node = findNode(pkg.nodes, nodeId);
      if (!node) throw new Error(`节点不存在: ${nodeId}`);
      Object.assign(node, patch);
      persist();
    },

    removeNode(nodeId) {
      const removeFrom = (nodes) => {
        if (!Array.isArray(nodes)) return false;
        const index = nodes.findIndex((n) => n.id === nodeId);
        if (index >= 0) {
          nodes.splice(index, 1); // 连同其子树一起移除
          return true;
        }
        return nodes.some((n) => removeFrom(n.children));
      };
      if (!removeFrom(pkg.nodes)) throw new Error(`节点不存在: ${nodeId}`);
      persist();
    },
  };
}
