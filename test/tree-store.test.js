import test from 'node:test';
import assert from 'node:assert/strict';
import { createTreeStore } from '../src/engine/tree-store.js';

// 内存版 storage 适配器：与 localStorage 同接口（getItem/setItem），测试注入用
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
}

const basePackage = {
  meta: { id: 'demo', title: '演示' },
  timeline: { startYear: -551, endYear: 2026 },
  chapters: [{ id: 'c', name: '章', color: '#000000' }],
  nodes: [{ id: 'a', title: '节点A', year: 100, chapter: 'c', children: [] }],
};

test('addNode 把新节点挂到指定父节点并自动持久化', () => {
  const storage = createMemoryStorage();
  const store = createTreeStore(basePackage, storage, 'kt:test');

  store.addNode('a', { id: 'child', title: '子节点', year: 120, chapter: 'c', children: [] });

  const a = store.getPackage().nodes.find((n) => n.id === 'a');
  assert.equal(a.children.length, 1);
  assert.equal(a.children[0].id, 'child');

  // 自动持久化：storage 中已有同一份数据
  const persisted = JSON.parse(storage.getItem('kt:test'));
  assert.equal(persisted.nodes[0].children[0].id, 'child');
});

test('updateNode 修改指定节点字段并持久化', () => {
  const storage = createMemoryStorage();
  const store = createTreeStore(basePackage, storage, 'kt:test');

  store.updateNode('a', { title: '改名了', year: 105 });

  const a = store.getPackage().nodes.find((n) => n.id === 'a');
  assert.equal(a.title, '改名了');
  assert.equal(a.year, 105);

  const persisted = JSON.parse(storage.getItem('kt:test'));
  assert.equal(persisted.nodes[0].title, '改名了');
});

test('removeNode 删除指定节点及其子树并持久化', () => {
  const storage = createMemoryStorage();
  const pkg = {
    meta: { id: 'demo', title: '演示' },
    timeline: { startYear: -551, endYear: 2026 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      {
        id: 'a', title: 'A', year: 100, chapter: 'c',
        children: [{ id: 'child', title: '子', year: 120, chapter: 'c', children: [] }],
      },
      { id: 'b', title: 'B', year: 200, chapter: 'c', children: [] },
    ],
  };
  const store = createTreeStore(pkg, storage, 'kt:test');

  store.removeNode('a');

  assert.deepEqual(store.getPackage().nodes.map((n) => n.id), ['b']);

  const persisted = JSON.parse(storage.getItem('kt:test'));
  assert.deepEqual(persisted.nodes.map((n) => n.id), ['b']);
});
