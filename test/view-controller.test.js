/**
 * view-controller 纯几何计算单元测试（脱离浏览器，无需 DOM/D3）
 * 覆盖 computeFitTransform / computeNodeTransform 的核心不变量。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeFitTransform, computeNodeTransform } from '../src/ui/view-controller.js';

test('computeFitTransform 对空 positions 返回 null（无可视内容）', () => {
  assert.equal(computeFitTransform([], 1000, 600, 'fit'), null);
  assert.equal(computeFitTransform([], 1000, 600, 1), null);
});

test('computeFitTransform fit 模式：缩放为正且 ≤1，树干水平居中（tx=w/2）', () => {
  const positions = [
    { x: 0, y: -200 }, { x: 300, y: -100 }, { x: 0, y: 0 },
    { x: -250, y: 100 }, { x: 0, y: 200 },
  ];
  const t = computeFitTransform(positions, 1000, 600, 'fit');
  assert.ok(t, '应返回变换');
  assert.ok(t.k > 0 && t.k <= 1, `缩放应在 (0,1]，实际 ${t.k}`);
  assert.equal(t.tx, 500, '树干 x=0 应映射到视口水平中心');
  assert.ok(Number.isFinite(t.ty), 'ty 应为有限数值');
});

test('computeFitTransform fit 模式：所有节点经变换后落在视口可视区域内', () => {
  const positions = [
    { x: 0, y: -500 }, { x: 400, y: -300 }, { x: -400, y: 0 },
    { x: 0, y: 500 }, { x: 200, y: 300 },
  ];
  const w = 1200, h = 800;
  const t = computeFitTransform(positions, w, h, 'fit');
  for (const p of positions) {
    const sx = t.tx + p.x * t.k;
    const sy = t.ty + p.y * t.k;
    // 允许少量留白越界（padding 180/90/110 已计入 bbox），但整体应在合理范围
    assert.ok(sx > -200 && sx < w + 200, `节点 x=${p.x} 屏幕坐标 ${sx} 超出视口`);
    assert.ok(sy > -200 && sy < h + 200, `节点 y=${p.y} 屏幕坐标 ${sy} 超出视口`);
  }
});

test('computeFitTransform 固定缩放模式：k 等于传入值，tx 仍为 w/2', () => {
  const positions = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
  const t = computeFitTransform(positions, 800, 600, 0.95);
  assert.equal(t.k, 0.95, '固定缩放应原样使用');
  assert.equal(t.tx, 400);
});

test('computeFitTransform 纵向居中：ty 使 bbox 几何中心映射到视口中心（计入上下留白）', () => {
  // 留白：上 90 / 下 110；y=-200 → y0=-290, y=200 → y1=310, yc=10
  const positions = [{ x: 0, y: -200 }, { x: 0, y: 200 }];
  const t = computeFitTransform(positions, 1000, 600, 1.0);
  const yc = ((-200 - 90) + (200 + 110)) / 2; // 10
  assert.equal(t.ty, 300 - yc); // 290
});

test('computeNodeTransform 1:1 缩放，节点精确居中', () => {
  const pos = { x: 350, y: -120 };
  const w = 1000, h = 700;
  const t = computeNodeTransform(pos, w, h);
  assert.equal(t.k, 1.0, '聚焦节点应为 1:1 缩放');
  assert.equal(t.tx, w / 2 - pos.x, 'tx 应使节点 x 居中');
  assert.equal(t.ty, h / 2 - pos.y, 'ty 应使节点 y 居中');
  // 验证节点屏幕坐标确实在视口中心
  assert.equal(t.tx + pos.x, w / 2);
  assert.equal(t.ty + pos.y, h / 2);
});

test('computeNodeTransform 对原点节点：tx=w/2, ty=h/2', () => {
  const t = computeNodeTransform({ x: 0, y: 0 }, 800, 600);
  assert.equal(t.tx, 400);
  assert.equal(t.ty, 300);
});

test('computeFitTransform 对单节点树（只有 x=0）也能产生有效变换', () => {
  const t = computeFitTransform([{ x: 0, y: 0 }], 1000, 600, 'fit');
  assert.ok(t);
  assert.ok(t.k > 0);
  assert.equal(t.tx, 500);
});