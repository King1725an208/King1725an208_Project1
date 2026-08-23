import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout, STAGE_GAP, BRANCH_DX } from '../src/engine/layout.js';

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

// ---------------------------------------------------------------------------
// Issue #2 回归：节点圆圈与文字间距
// 修复前 render-tree.js 中 label/year 的 x 偏移只有 12/16 px，导致文字与圆重叠。
// 修复后规则：
//   - 主干圆半径 12 px，label x=62，year x=-62
//   - 侧枝圆半径 8 px，label x=±28，year x=±28
// 以下测试根据 layout 给出的坐标，验证这些间距常数不会回到重叠值。
// ---------------------------------------------------------------------------

function expectedLabelOffset(x) {
  return x === 0 ? 62 : 28;
}

function expectedYearOffset(x) {
  return x === 0 ? 62 : 28;
}

test('主干节点 label/year 偏移应大于圆半径，避免文字与圆重叠', () => {
  const pkg = {
    meta: { id: 'gap', title: 'gap' },
    timeline: { startYear: 0, endYear: 200 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      { id: 'root', title: '根', year: 100, chapter: 'c', children: [] },
    ],
  };
  const layout = computeLayout(pkg);
  const p = layout.positions[0];

  assert.equal(p.x, 0, '主干节点应在 x=0');
  const labelOffset = expectedLabelOffset(p.x);
  const yearOffset = expectedYearOffset(p.x);
  const trunkRadius = 12;
  assert.ok(
    labelOffset >= trunkRadius + 10,
    `主干 label 偏移 ${labelOffset} 应至少比圆半径 ${trunkRadius} 大 10px`
  );
  assert.ok(
    yearOffset >= trunkRadius + 10,
    `主干 year 偏移 ${yearOffset} 应至少比圆半径 ${trunkRadius} 大 10px`
  );
});

test('侧枝节点 label/year 偏移应大于圆半径，且方向随左右交替', () => {
  const pkg = {
    meta: { id: 'gap2', title: 'gap2' },
    timeline: { startYear: 0, endYear: 200 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      {
        id: 'root', title: '根', year: 100, chapter: 'c',
        children: [
          { id: 'b1', title: '右1', year: 110, chapter: 'c', role: 'branch', children: [] },
          { id: 'b2', title: '左1', year: 110, chapter: 'c', role: 'branch', children: [] },
          { id: 'b3', title: '右2', year: 110, chapter: 'c', role: 'branch', children: [] },
        ],
      },
    ],
  };
  const layout = computeLayout(pkg);
  const pos = Object.fromEntries(layout.positions.map((p) => [p.id, p]));

  const branchRadius = 8;

  // 侧枝 x 正负交替：右、左、右
  assert.ok(pos.b1.x > 0, '第一条侧枝应在右侧');
  assert.ok(pos.b2.x < 0, '第二条侧枝应在左侧');
  assert.ok(pos.b3.x > 0, '第三条侧枝应在右侧');

  for (const id of ['b1', 'b2', 'b3']) {
    const offset = expectedLabelOffset(pos[id].x);
    assert.ok(
      offset >= branchRadius + 10,
      `侧枝 ${id} label 偏移 ${offset} 应至少比圆半径 ${branchRadius} 大 10px`
    );
    assert.ok(
      offset >= branchRadius + 10,
      `侧枝 ${id} year 偏移 ${offset} 应至少比圆半径 ${branchRadius} 大 10px`
    );
  }
});

test('侧枝布局应产生足够的水平间距，避免跨节点文字碰撞', () => {
  const pkg = {
    meta: { id: 'gap3', title: 'gap3' },
    timeline: { startYear: 0, endYear: 200 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      {
        id: 'root', title: '根', year: 100, chapter: 'c',
        children: [
          { id: 'left', title: '左', year: 110, chapter: 'c', role: 'branch', children: [] },
          { id: 'right', title: '右', year: 110, chapter: 'c', role: 'branch', children: [] },
        ],
      },
    ],
  };
  const layout = computeLayout(pkg);
  const pos = Object.fromEntries(layout.positions.map((p) => [p.id, p]));

  // 布局对左右侧枝关于 y 轴镜像，圆心间距为 2 * |x|
  const centerGap = Math.abs(pos.right.x) + Math.abs(pos.left.x);
  // 渲染时文字锚在圆外侧：左侧文字向左延伸 offset，右侧向右延伸 offset
  const leftOffset = expectedLabelOffset(pos.left.x);
  const rightOffset = expectedLabelOffset(pos.right.x);
  const gapBetweenLabels = centerGap - leftOffset - rightOffset;

  assert.ok(
    gapBetweenLabels >= 40,
    `左右侧枝文字外侧间距 ${gapBetweenLabels} 应足够（≥40px），避免碰撞`
  );
  assert.equal(
    centerGap,
    BRANCH_DX * 2,
    '左右两枝应从父节点向两侧各偏移 BRANCH_DX'
  );
});

test('多级侧枝应基于父节点位置继续外扩，保持间距递增', () => {
  const pkg = {
    meta: { id: 'gap4', title: 'gap4' },
    timeline: { startYear: 0, endYear: 200 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      {
        id: 'root', title: '根', year: 100, chapter: 'c',
        children: [
          {
            id: 'sub', title: '子侧枝', year: 110, chapter: 'c', role: 'branch',
            children: [
              { id: 'leaf', title: '孙侧枝', year: 120, chapter: 'c', role: 'branch', children: [] },
            ],
          },
        ],
      },
    ],
  };
  const layout = computeLayout(pkg);
  const pos = Object.fromEntries(layout.positions.map((p) => [p.id, p]));

  assert.ok(Math.abs(pos.leaf.x) > Math.abs(pos.sub.x), '孙侧枝应比子侧枝更远离主轴');
  assert.ok(
    layout.links.some((l) => l.from === 'sub' && l.to === 'leaf'),
    '子侧枝与孙侧枝之间应有连线'
  );
});

test('role 缺省节点应视为主干，不会被当作侧枝导致间距异常', () => {
  const pkg = {
    meta: { id: 'gap5', title: 'gap5' },
    timeline: { startYear: 0, endYear: 200 },
    chapters: [{ id: 'c', name: '章', color: '#000000' }],
    nodes: [
      { id: 'root', title: '根', year: 100, chapter: 'c', children: [] },
      { id: 'trunk2', title: '主干2', year: 150, chapter: 'c', children: [] },
    ],
  };
  const layout = computeLayout(pkg);

  for (const p of layout.positions) {
    assert.equal(p.x, 0, `缺省 role 节点 ${p.id} 应位于主轴 x=0`);
  }
  assert.equal(layout.positions.length, 2, '应有两个主干节点');
});
