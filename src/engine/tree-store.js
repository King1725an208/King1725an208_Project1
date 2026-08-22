/**
 * 树编辑与持久化（Seam S3）
 * createTreeStore(pkg, storage, storageKey)
 *  - pkg：主题包对象（编辑直接作用于该对象，作为运行时单一数据源）
 *  - storage：localStorage 兼容适配器（测试注入内存版）；传 null 则仅内存编辑
 *  - 每次编辑操作后自动持久化（FR-E08/09）
 */
import { walk } from './walk.js';

export function createTreeStore(pkg, storage, storageKey) {
  const findNode = (id) => {
    let found = null;
    walk(pkg.nodes, (node) => {
      if (node.id === id) {
        found = node;
        return false; // 命中，中断遍历
      }
    });
    return found;
  };

  const persist = () => {
    storage?.setItem(storageKey, JSON.stringify(pkg));
  };

  return {
    getPackage: () => pkg,

    addNode(parentId, node) {
      const parent = findNode(parentId);
      if (!parent) throw new Error(`父节点不存在: ${parentId}`);
      if (!Array.isArray(parent.children)) parent.children = [];
      parent.children.push(node);
      persist();
    },

    updateNode(nodeId, patch) {
      const node = findNode(nodeId);
      if (!node) throw new Error(`节点不存在: ${nodeId}`);
      Object.assign(node, patch);
      persist();
    },

    removeNode(nodeId) {
      let removed = false;
      walk(pkg.nodes, (node, ctx) => {
        if (node.id === nodeId) {
          ctx.parentArray.splice(ctx.index, 1);
          removed = true;
          return false; // 连同其子树一起移除，中断遍历
        }
      });
      if (!removed) throw new Error(`节点不存在: ${nodeId}`);
      persist();
    },
  };
}