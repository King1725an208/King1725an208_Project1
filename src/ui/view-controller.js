/* ============================================================
 * viewController — 视图控制深模块
 * 职责：fitToScreen / zoomToNode / initialView / LOD 级别
 * 对外接口窄，内部封装变换计算与 D3 过渡细节。
 * 纯几何计算 computeFitTransform 独立导出，可脱离浏览器单测。
 * ============================================================ */

/**
 * 纯函数：计算"树干居中 + 全览/指定缩放"的变换矩阵参数。
 * 以主干（x=0）为对称轴，横向留白左右对称。
 */
export function computeFitTransform(positions, w, h, scale) {
  if (!positions.length) return null;
  const maxAbsX = Math.max(...positions.map((p) => Math.abs(p.x)), 200) + 180;
  const y0 = Math.min(...positions.map((p) => p.y)) - 90;
  const y1 = Math.max(...positions.map((p) => p.y)) + 110;
  const yc = (y0 + y1) / 2;
  const k = scale === 'fit'
    ? Math.min(w / (2 * maxAbsX), h / (y1 - y0)) * 0.94
    : scale;
  return { k, tx: w / 2, ty: h / 2 - yc * k };
}

/**
 * 纯函数：计算聚焦到单个节点的变换参数。
 */
export function computeNodeTransform(pos, w, h, k = 1) {
  return { k, tx: w / 2 - pos.x * k, ty: h / 2 - pos.y * k };
}

/**
 * 根据缩放级别返回 LOD 档位：'overview' | 'medium' | 'detail'
 * 纯函数，可单测。
 */
export function computeLodLevel(k) {
  if (k < 0.55) return 'overview';
  if (k < 0.9) return 'medium';
  return 'detail';
}

/**
 * 创建视图控制器。
 */
export function createViewController({ svg, zoom, viewport, getPosById }) {
  function viewportSize() {
    const node = svg.node();
    return { w: node.clientWidth, h: node.clientHeight };
  }

  function applyTransform(t, duration = 700) {
    if (!t) return;
    const transform = d3.zoomIdentity.translate(t.tx, t.ty).scale(t.k);
    svg.transition().duration(duration).ease(d3.easeCubicOut)
      .call(zoom.transform, transform);
  }

  function currentPositions() {
    return [...getPosById().values()];
  }

  /** 根据当前节点位置设置拖拽边界，防止树被拖出视口 */
  function setBounds(positions) {
    if (!positions.length) return;
    const pad = 400;
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    zoom.translateExtent([[minX, minY], [maxX, maxY]]);
  }

  /** 设置 LOD 档位 class 与反向缩放变量（概览时主干文字保持可读） */
  function applyLod(k) {
    const level = computeLodLevel(k);
    viewport
      .classed('zoom-overview', level === 'overview')
      .classed('zoom-medium', level === 'medium')
      .classed('zoom-detail', level === 'detail');
    // 反向缩放因子：概览时放大文字以补偿整体缩小
    const rev = level === 'overview' ? 1 / k : 1;
    viewport.style('--revk', rev.toFixed(3));
  }

  // 首屏：整棵树全览居中
  function initialView() {
    const { w, h } = viewportSize();
    applyTransform(computeFitTransform(currentPositions(), w, h, 'fit'));
  }

  // 复位：整棵树全览
  function fitToScreen() {
    const { w, h } = viewportSize();
    applyTransform(computeFitTransform(currentPositions(), w, h, 'fit'));
  }

  // 聚焦到节点（放大到可读级别）
  function zoomToNode(id) {
    const p = getPosById().get(id);
    if (!p) return;
    const { w, h } = viewportSize();
    applyTransform(computeNodeTransform(p, w, h, 1.3), 650);
  }

  return { initialView, fitToScreen, zoomToNode, setBounds, applyLod };
}