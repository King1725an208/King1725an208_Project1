/* ============================================================
 * viewController — 视图控制深模块
 * 职责：fitToScreen / zoomToNode / initialView
 * 对外接口窄（3 个方法），内部封装变换计算与 D3 过渡细节。
 * 纯几何计算 computeFitTransform 独立导出，可脱离浏览器单测。
 * ============================================================ */

/**
 * 纯函数：计算"树干居中 + 全览/指定缩放"的变换矩阵参数。
 * 以主干（x=0）为对称轴，横向留白左右对称。
 *
 * @param {Array<{x:number,y:number}>} positions - 所有节点位置
 * @param {number} w - 视口宽度
 * @param {number} h - 视口高度
 * @param {number|'fit'} scale - 数值缩放或 'fit' 自动全览
 * @returns {{k:number, tx:number, ty:number}|null}
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
 * 纯函数：计算聚焦到单个节点的变换参数（1:1 缩放，节点居中）。
 *
 * @param {{x:number,y:number}} pos
 * @param {number} w
 * @param {number} h
 * @returns {{k:number, tx:number, ty:number}}
 */
export function computeNodeTransform(pos, w, h) {
  return { k: 1.0, tx: w / 2 - pos.x, ty: h / 2 - pos.y };
}

/**
 * 创建视图控制器。
 *
 * @param {object}   opts
 * @param {Selection} opts.svg     - D3 selection of the root <svg>
 * @param {object}   opts.zoom     - d3.zoom() behavior
 * @param {function():Map} opts.getPosById - 返回当前 posById 的 getter
 * @returns {{ initialView():void, fitToScreen():void, zoomToNode(id:string):void }}
 */
export function createViewController({ svg, zoom, getPosById }) {
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

  // 首屏：可读缩放（0.95）+ 树干居中
  function initialView() {
    const { w, h } = viewportSize();
    applyTransform(computeFitTransform(currentPositions(), w, h, 0.95));
  }

  // 复位：整棵树全览
  function fitToScreen() {
    const { w, h } = viewportSize();
    applyTransform(computeFitTransform(currentPositions(), w, h, 'fit'));
  }

  // 聚焦到节点（1:1）
  function zoomToNode(id) {
    const p = getPosById().get(id);
    if (!p) return;
    const { w, h } = viewportSize();
    applyTransform(computeNodeTransform(p, w, h), 650);
  }

  return { initialView, fitToScreen, zoomToNode };
}