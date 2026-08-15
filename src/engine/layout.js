/**
 * 知识树布局引擎（Seam S2）
 * 输入：主题包对象
 * 输出：{ positions: [{ id, x, y }], links: [{ from, to }] }
 * 规则：单时间主轴（x=0）、树向上生长（年份小在下，y 大）、阶段等距
 */

export const STAGE_GAP = 200; // 相邻主干节点纵向间距（px，渲染层可整体缩放）
export const BRANCH_DX = 280; // 侧枝相对父节点的水平偏移

export function computeLayout(pkg) {
  // 第一遍：分出主干链节点与侧枝（role 缺省视为 trunk），并记录侧枝父子关系
  const trunkNodes = [];
  const branchEdges = [];
  const walk = (nodes, parent = null) => {
    for (const node of nodes ?? []) {
      if ((node.role ?? 'trunk') === 'branch') {
        branchEdges.push({ parent, child: node });
      } else {
        trunkNodes.push(node);
      }
      walk(node.children, node);
    }
  };
  walk(pkg?.nodes);

  // 主干：按 year 升序（顺序保真）等距排布（阶段等距），x=0（单时间主轴）
  const sorted = [...trunkNodes].sort((m, n) => m.year - n.year);
  const posById = new Map();
  sorted.forEach((node, index) => {
    posById.set(node.id, { id: node.id, x: 0, y: -(index * STAGE_GAP) });
  });

  // 主干链连线：时间相邻节点依次相连（树干）
  const links = [];
  for (let i = 1; i < sorted.length; i++) {
    links.push({ from: sorted[i - 1].id, to: sorted[i].id });
  }

  // 侧枝：挂父节点侧边，同父侧枝左右交替，与父节点连线
  const branchSeqByParent = new Map();
  for (const { parent, child } of branchEdges) {
    const parentPos = parent ? posById.get(parent.id) : null;
    const seq = branchSeqByParent.get(parent?.id) ?? 0;
    branchSeqByParent.set(parent?.id, seq + 1);
    const dir = seq % 2 === 0 ? 1 : -1;
    posById.set(child.id, {
      id: child.id,
      x: (parentPos?.x ?? 0) + dir * BRANCH_DX,
      y: (parentPos?.y ?? 0) - STAGE_GAP / 2 - seq * 12,
    });
    if (parent) links.push({ from: parent.id, to: child.id });
  }

  return { positions: [...posById.values()], links };
}
