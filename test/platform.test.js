import test from 'node:test';
import assert from 'node:assert/strict';
import { importThemePackage } from '../src/engine/transfer.js';
import { computeLayout } from '../src/engine/layout.js';
import { createTreeStore } from '../src/engine/tree-store.js';
import { searchNodes } from '../src/engine/search.js';

// 第二个主题包：3 节点最小"老子"示例（验证平台性：引擎零改动跑通新主题）
const laoziPackage = {
  meta: { id: 'laozi', title: '老子与道的传播' },
  timeline: { startYear: -600, endYear: 2026 },
  chapters: [
    { id: 'life', name: '生平', color: '#5b8c5a' },
    { id: 'spread', name: '传播', color: '#365f8c' },
  ],
  nodes: [
    { id: 'lz1', title: '老子出生', year: -571, chapter: 'life', children: [] },
    { id: 'lz2', title: '出关著《道德经》', year: -485, chapter: 'life', children: [] },
    { id: 'lz3', title: '被尊为道教始祖', year: 142, chapter: 'spread', children: [] },
  ],
};

test('平台性：第二个主题包不改引擎即可走通 导入→布局→编辑→搜索 全链路', () => {
  // 导入（含 schema 校验）
  const imported = importThemePackage(JSON.stringify(laoziPackage));
  assert.equal(imported.ok, true);

  // 布局
  const layout = computeLayout(imported.package);
  assert.equal(layout.positions.length, 3);
  assert.ok(layout.positions.every((p) => p.x === 0), '三节点均为主干，应在主轴上');

  // 编辑（内存模式，storage 传 null）
  const store = createTreeStore(imported.package, null, 'kt:laozi');
  store.addNode('lz2', {
    id: 'lz2-note', title: '五千言', year: -485, chapter: 'life', children: [],
  });
  assert.equal(
    store.getPackage().nodes.find((n) => n.id === 'lz2').children[0].id,
    'lz2-note'
  );

  // 搜索
  const hits = searchNodes(store.getPackage(), '道德经');
  assert.deepEqual(hits.map((n) => n.id), ['lz2']);
});