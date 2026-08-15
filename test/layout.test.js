import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout } from '../src/engine/layout.js';

// 三根主干节点（乱序给出），验证：顺序保真（按 year）+ 主轴居中 + 阶段等距
const trunkPackage = {
  meta: { id: 't', title: '布局测试' },
  timeline: { startYear: -300, endYear: 600 },
  chapters: [{ id: 'c', name: '章', color: '#000000' }],
  nodes: [
    { id: 'a', title: '中期', year: 100, chapter: 'c', children: [] },
    { id: 'b', title: '最早', year: -200, chapter: 'c', children: [] },
    { id: 'c2', title: '最晚', year: 500, chapter: 'c', children: [] },
  ],
};

test('主干节点按年份升序沿主轴等距排列', () => {
  const layout = computeLayout(trunkPackage);
  const pos = Object.fromEntries(layout.positions.map((p) => [p.id, p]));

  // 主轴：全部 x = 0
  assert.equal(pos.a.x, 0);
  assert.equal(pos.b.x, 0);
  assert.equal(pos.c2.x, 0);

  // 顺序保真：树向上生长 → 年份越小越靠下（y 越大）
  assert.ok(pos.b.y > pos.a.y, '最早节点应在下方');
  assert.ok(pos.a.y > pos.c2.y, '最晚节点应在上方');

  // 阶段等距：相邻主干节点间距相等
  assert.equal(pos.b.y - pos.a.y, pos.a.y - pos.c2.y);
});

test('侧枝节点偏离主轴并与父节点连线', () => {
  const pkg = {
    meta: { id: 't', title: 't' },
    timeline: { startYear: 0, endYear: 300 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      {
        id: 'a', title: '主干', year: 100, chapter: 'c',
        children: [
          { id: 'side', title: '侧枝', year: 120, chapter: 'c', role: 'branch', children: [] },
        ],
      },
    ],
  };
  const layout = computeLayout(pkg);
  const pos = Object.fromEntries(layout.positions.map((p) => [p.id, p]));

  assert.equal(pos.a.x, 0); // 主干在主轴
  assert.notEqual(pos.side.x, 0); // 侧枝偏离主轴
  assert.ok(
    layout.links.some((l) => l.from === 'a' && l.to === 'side'),
    '父子之间应有连线'
  );
});
