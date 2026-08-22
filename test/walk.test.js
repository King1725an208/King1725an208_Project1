import test from 'node:test';
import assert from 'node:assert/strict';
import { walk } from '../src/engine/walk.js';

// 构造三层树：
// n1
//   n1-a
//     n1-a-i
//   n1-b
// n2
function sampleTree() {
  return [
    {
      id: 'n1', title: '一级A', children: [
        {
          id: 'n1-a', title: '二级A', children: [
            { id: 'n1-a-i', title: '三级A', children: [] },
          ],
        },
        { id: 'n1-b', title: '二级B' }, // children 缺失
      ],
    },
    { id: 'n2', title: '一级B', children: null }, // children 显式 null
  ];
}

test('walk 深度优先遍历并记录所有节点 id', () => {
  const order = [];
  walk(sampleTree(), (node) => order.push(node.id));
  assert.deepEqual(order, ['n1', 'n1-a', 'n1-a-i', 'n1-b', 'n2']);
});

test('walk 对 nodes=null/undefined/非数组 安全，不抛异常且不访问回调', () => {
  let calls = 0;
  walk(null, () => calls++);
  walk(undefined, () => calls++);
  walk('not-an-array', () => calls++);
  walk(42, () => calls++);
  assert.equal(calls, 0);
});

test('walk 对缺失/null/空数组 children 安全，不抛异常', () => {
  // n1-b 无 children、n2 children 为 null —— 若守卫失效会抛 TypeError
  const order = [];
  walk(sampleTree(), (n) => order.push(n.id));
  assert.ok(order.includes('n1-b'));
  assert.ok(order.includes('n2'));
});

test('walk context.depth 正确反映深度（根层=0）', () => {
  const depths = {};
  walk(sampleTree(), (n, ctx) => { depths[n.id] = ctx.depth; });
  assert.equal(depths['n1'], 0);
  assert.equal(depths['n2'], 0);
  assert.equal(depths['n1-a'], 1);
  assert.equal(depths['n1-b'], 1);
  assert.equal(depths['n1-a-i'], 2);
});

test('walk context.parent 与 context.parentArray 正确', () => {
  const assertions = [];
  walk(sampleTree(), (n, ctx) => {
    if (n.id === 'n1-a-i') {
      assertions.push(ctx.parent.id === 'n1-a');
      assertions.push(Array.isArray(ctx.parentArray));
      assertions.push(ctx.parentArray[ctx.index].id === 'n1-a-i');
    }
    if (n.id === 'n1') {
      assertions.push(ctx.parent === null);
    }
  });
  assert.ok(assertions.every(Boolean));
});

test('walk context.ancestors 为从根到父的祖先链', () => {
  let ancestorIds = null;
  walk(sampleTree(), (n, ctx) => {
    if (n.id === 'n1-a-i') ancestorIds = ctx.ancestors.map((a) => a.id);
  });
  assert.deepEqual(ancestorIds, ['n1', 'n1-a']);
});

test('walk context.path 为下标路径', () => {
  let path = null;
  walk(sampleTree(), (n, ctx) => {
    if (n.id === 'n1-a-i') path = ctx.path;
  });
  assert.deepEqual(path, [0, 0, 0]);
});

test('walk 回调返回 false 中断整个遍历，后续节点均不访问', () => {
  const visited = [];
  walk(sampleTree(), (n) => {
    visited.push(n.id);
    if (n.id === 'n1-a') return false; // 在二级节点处中断
  });
  // n1-a 自身已访问；n1-a-i（其子孙）与 n1-b、n2 均不应访问
  assert.deepEqual(visited, ['n1', 'n1-a']);
});

test('walk 中断时同层后续兄弟也不再访问', () => {
  const visited = [];
  walk(
    [
      { id: 'a', children: [] },
      { id: 'b', children: [] },
      { id: 'c', children: [] },
    ],
    (n) => {
      visited.push(n.id);
      if (n.id === 'b') return false;
    }
  );
  assert.deepEqual(visited, ['a', 'b']);
});

test('walk 遍历过程中通过 context.parentArray 安全删除节点（含其子树）', () => {
  // 模拟 tree-store.removeNode 的用法
  const tree = sampleTree();
  walk(tree, (n, ctx) => {
    if (n.id === 'n1-a') {
      ctx.parentArray.splice(ctx.index, 1);
      return false;
    }
  });
  // n1 的 children 现在只剩 n1-b；n1-a 及其子树 n1-a-i 一并移除
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].id, 'n1-b');
});

test('walk 空数组不访问任何节点', () => {
  let count = 0;
  walk([], () => count++);
  assert.equal(count, 0);
});