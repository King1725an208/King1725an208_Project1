/* ============================================================
 * renderTree — 树渲染深模块
 * 职责：D3 enter/update/exit 渲染、节点折叠展开、搜索高亮
 * 内部复用 walk 树遍历；对外只暴露一个函数 + chapterColor 工具
 * ============================================================ */
import { walk } from '../engine/walk.js';

/** 根据章节 id 解析颜色（找不到则灰） */
export function chapterColor(pkg, chapterId) {
  const c = (pkg.chapters || []).find((x) => x.id === chapterId);
  return c ? c.color : '#888';
}

/**
 * 渲染知识树到指定 SVG viewport。
 *
 * @param {object}   opts
 * @param {Selection} opts.viewport   - D3 selection of the <g> viewport
 * @param {object}   opts.pkg         - 主题包（含 nodes, chapters）
 * @param {object}   opts.layout      - computeLayout(pkg) 的结果
 * @param {Map}      opts.nodeById    - id → node 索引
 * @param {Set}      opts.collapsed   - 被折叠的节点 id 集合
 * @param {Set}      opts.hits        - 搜索命中的节点 id 集合
 * @param {function(id):void}        opts.onToggleCollapse - 折叠/展开回调
 * @param {function(node):void}      opts.onNodeClick      - 节点点击回调
 * @returns {{ posById: Map }} 位置索引，供视图控制器使用
 */
export function renderTree({
  viewport, pkg, layout, nodeById,
  collapsed, hits,
  onToggleCollapse, onNodeClick,
}) {
  const posById = new Map(layout.positions.map((p) => [p.id, p]));

  // ---------- 折叠可见性：被折叠节点的后代隐藏（自身仍显示） ----------
  const hidden = new Set();
  walk(pkg.nodes, (n, ctx) => {
    if (ctx.ancestors.some((a) => collapsed.has(a.id))) hidden.add(n.id);
  });

  const pos = layout.positions.filter((p) => !hidden.has(p.id));
  const posIds = new Set(pos.map((p) => p.id));
  const links = layout.links.filter((l) => posIds.has(l.from) && posIds.has(l.to));

  const line = (l) => {
    const a = posById.get(l.from), b = posById.get(l.to);
    if (a.x === 0 && b.x === 0) return `M${a.x},${a.y}L${b.x},${b.y}`;
    const my = (a.y + b.y) / 2;
    return `M${a.x},${a.y}C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
  };
  const isStem = (l) => posById.get(l.from).x === 0 && posById.get(l.to).x === 0;

  // ---------- 连线 ----------
  viewport.selectAll('path.link')
    .data(links.filter((l) => !isStem(l)), (l) => l.from + '>' + l.to)
    .join('path').attr('class', 'link').attr('d', line);
  // 主茎（粗线）
  viewport.selectAll('path.stem')
    .data(links.filter(isStem), (l) => l.from + '>' + l.to)
    .join('path').attr('class', 'stem').attr('d', line);

  // ---------- 节点 ----------
  const node = viewport.selectAll('g.node').data(pos, (p) => p.id);
  const enter = node.enter().append('g').attr('class', 'node')
    .attr('transform', (p) => `translate(${p.x},${p.y})`).style('opacity', 0);
  enter.append('circle').attr('r', (p) => (p.x === 0 ? 12 : 8));
  enter.append('text').attr('class', 'label').attr('dy', 4);
  enter.append('text').attr('class', 'year').attr('dy', 4);
  enter.append('g').attr('class', 'fold-btn');

  const merged = enter.merge(node);
  merged.transition().duration(400)
    .attr('transform', (p) => `translate(${p.x},${p.y})`).style('opacity', 1);
  merged.select('circle').attr('fill', (p) => chapterColor(pkg, nodeById.get(p.id)?.chapter));
  merged.select('text.label')
    .text((p) => nodeById.get(p.id)?.title ?? p.id)
    .attr('x', (p) => (p.x === 0 ? 16 : p.x > 0 ? 12 : -12))
    .attr('text-anchor', (p) => (p.x === 0 ? 'start' : p.x > 0 ? 'start' : 'end'));
  merged.select('text.year')
    .text((p) => nodeById.get(p.id)?.displayYear ?? nodeById.get(p.id)?.year ?? '')
    .attr('x', (p) => (p.x === 0 ? -16 : p.x > 0 ? 12 : -12))
    .attr('text-anchor', (p) => (p.x === 0 ? 'end' : p.x > 0 ? 'start' : 'end'))
    .attr('dy', -12);

  // 折叠钮（仅有 children 的节点）
  merged.select('g.fold-btn').each(function (p) {
    const g = d3.select(this);
    const n = nodeById.get(p.id);
    g.selectAll('*').remove();
    if (!n || !(n.children || []).length) return;
    const isCollapsed = collapsed.has(p.id);
    g.attr('transform', 'translate(0,16)');
    g.append('circle').attr('r', 7);
    g.append('text').attr('text-anchor', 'middle').attr('dy', 3).text(isCollapsed ? '+' : '−');
    g.on('click', (e) => {
      e.stopPropagation();
      onToggleCollapse(p.id);
    });
  });

  merged.on('click', (e, p) => {
    e.stopPropagation();
    const n = nodeById.get(p.id);
    if (n) onNodeClick(n);
  });

  node.exit().transition().duration(300).style('opacity', 0).remove();

  // ---------- 搜索高亮 ----------
  viewport.selectAll('g.node')
    .classed('hit', (p) => hits.has(p.id))
    .classed('dim', (p) => hits.size > 0 && !hits.has(p.id));

  return { posById };
}