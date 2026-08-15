/* ============================================================
 * 知识树平台 · 渲染与交互层（浏览器）
 * 依赖（打包内联后均为全局）：d3、computeLayout、importThemePackage、
 * exportThemePackage、createTreeStore、searchNodes、confuciusPackage
 * ============================================================ */
(function () {
  'use strict';

  // ---------- 存储键 ----------
  const LS_IMPORTED = 'kt:importedPackages';
  const LS_THEME = 'kt:visualTheme';
  const LS_LAST = 'kt:lastPackage';
  const lsEdited = (id) => `kt:edited:${id}`;

  const $ = (id) => document.getElementById(id);
  const svg = d3.select('#stage');
  const viewport = d3.select('#viewport');

  // ---------- 状态 ----------
  const state = {
    pkgId: null, pkg: null, store: null,
    editMode: false, collapsed: new Set(), hits: new Set(),
    nodeById: new Map(), posById: new Map(),
  };

  // ---------- 主题包注册表（内置 + localStorage 导入） ----------
  const builtin = { [confuciusPackage.meta.id]: confuciusPackage };
  const imported = loadJSON(localStorage.getItem(LS_IMPORTED)) || {};

  function loadJSON(text) { try { return text ? JSON.parse(text) : null; } catch { return null; } }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- 节点索引 ----------
  function reindex() {
    state.nodeById = new Map();
    (function walk(nodes) {
      for (const n of nodes ?? []) { state.nodeById.set(n.id, n); walk(n.children); }
    })(state.pkg.nodes);
  }

  // ---------- 激活主题包（编辑态覆盖优先，FR-E09） ----------
  function activatePackage(id) {
    const base = imported[id] || builtin[id];
    if (!base) return;
    const edited = loadJSON(localStorage.getItem(lsEdited(id)));
    state.pkgId = id;
    state.pkg = edited || JSON.parse(JSON.stringify(base));
    state.store = createTreeStore(state.pkg, localStorage, lsEdited(id));
    state.collapsed = new Set();
    state.hits = new Set();
    reindex();
    renderChrome();
    render();
    initialView();
    localStorage.setItem(LS_LAST, id);
  }

  // ---------- 顶栏与导航（数据驱动，FR-E06/E11） ----------
  function renderChrome() {
    const { meta } = state.pkg;
    $('pkgTitle').textContent = meta.title;
    $('pkgDesc').textContent = meta.description || '';
    document.title = `知识树 · ${meta.title}`;
    $('seal').textContent = (meta.title || '树').slice(-1);

    const switcher = $('pkgSwitcher');
    switcher.innerHTML = '';
    const groups = [['内置', builtin], ['已导入', imported]];
    for (const [label, set] of groups) {
      const ids = Object.keys(set);
      if (!ids.length) continue;
      const og = document.createElement('optgroup');
      og.label = label;
      for (const pid of ids) {
        const opt = document.createElement('option');
        opt.value = pid;
        opt.textContent = (set[pid].meta?.title) || pid;
        og.appendChild(opt);
      }
      switcher.appendChild(og);
    }
    switcher.value = state.pkgId;

    const nav = $('navSelect');
    nav.innerHTML = '<option value="">导航…</option>';
    for (const item of state.pkg.navigation || []) {
      const opt = document.createElement('option');
      opt.value = item.target;
      opt.textContent = item.label;
      nav.appendChild(opt);
    }

    // 章节图例（数据驱动）
    const legend = $('legend');
    legend.innerHTML = '';
    for (const c of state.pkg.chapters || []) {
      const item = document.createElement('span');
      item.className = 'legend-item';
      const dot = document.createElement('i');
      dot.style.background = c.color;
      item.appendChild(dot);
      item.appendChild(document.createTextNode(c.name));
      legend.appendChild(item);
    }
  }

  // ---------- 渲染树（FR-E01/02/04） ----------
  const zoom = d3.zoom().scaleExtent([0.15, 3]).on('zoom', (e) => {
    viewport.attr('transform', e.transform);
  });
  svg.call(zoom);

  function chapterColor(chapterId) {
    const c = (state.pkg.chapters || []).find((x) => x.id === chapterId);
    return c ? c.color : '#888';
  }

  function visibleIds() {
    // 被折叠节点的后代隐藏（自身仍显示，便于再展开）
    const hidden = new Set();
    const markHidden = (nodes, ancestorCollapsed) => {
      for (const n of nodes ?? []) {
        const isCollapsed = state.collapsed.has(n.id);
        if (ancestorCollapsed) hidden.add(n.id);
        markHidden(n.children, ancestorCollapsed || isCollapsed);
      }
    };
    markHidden(state.pkg.nodes, false);
    return hidden;
  }

  function render() {
    const layout = computeLayout(state.pkg);
    state.posById = new Map(layout.positions.map((p) => [p.id, p]));
    const hidden = visibleIds();
    const pos = layout.positions.filter((p) => !hidden.has(p.id));
    const posIds = new Set(pos.map((p) => p.id));
    const links = layout.links.filter((l) => posIds.has(l.from) && posIds.has(l.to));
    const line = (l) => {
      const a = state.posById.get(l.from), b = state.posById.get(l.to);
      if (a.x === 0 && b.x === 0) return `M${a.x},${a.y}L${b.x},${b.y}`;
      const my = (a.y + b.y) / 2;
      return `M${a.x},${a.y}C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
    };
    const isStem = (l) => state.posById.get(l.from).x === 0 && state.posById.get(l.to).x === 0;

    // 连线
    viewport.selectAll('path.link').data(links.filter((l) => !isStem(l)), (l) => l.from + '>' + l.to)
      .join('path').attr('class', 'link').attr('d', line);
    // 主茎（粗线）
    viewport.selectAll('path.stem').data(links.filter(isStem), (l) => l.from + '>' + l.to)
      .join('path').attr('class', 'stem').attr('d', line);

    // 节点
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
    merged.select('circle').attr('fill', (p) => chapterColor(state.nodeById.get(p.id)?.chapter));
    merged.select('text.label')
      .text((p) => state.nodeById.get(p.id)?.title ?? p.id)
      .attr('x', (p) => (p.x === 0 ? 16 : p.x > 0 ? 12 : -12))
      .attr('text-anchor', (p) => (p.x === 0 ? 'start' : p.x > 0 ? 'start' : 'end'));
    merged.select('text.year')
      .text((p) => state.nodeById.get(p.id)?.displayYear ?? state.nodeById.get(p.id)?.year ?? '')
      .attr('x', (p) => (p.x === 0 ? -16 : p.x > 0 ? 12 : -12))
      .attr('text-anchor', (p) => (p.x === 0 ? 'end' : p.x > 0 ? 'start' : 'end'))
      .attr('dy', -12);

    // 折叠钮（仅有 children 的节点）
    merged.select('g.fold-btn').each(function (p) {
      const g = d3.select(this);
      const n = state.nodeById.get(p.id);
      g.selectAll('*').remove();
      if (!n || !(n.children || []).length) return;
      const collapsed = state.collapsed.has(p.id);
      g.attr('transform', 'translate(0,16)');
      g.append('circle').attr('r', 7);
      g.append('text').attr('text-anchor', 'middle').attr('dy', 3).text(collapsed ? '+' : '−');
      g.on('click', (e) => {
        e.stopPropagation();
        collapsed ? state.collapsed.delete(p.id) : state.collapsed.add(p.id);
        render();
      });
    });

    merged.on('click', (e, p) => {
      e.stopPropagation();
      const n = state.nodeById.get(p.id);
      if (n) openDetail(n);
    });

    node.exit().transition().duration(300).style('opacity', 0).remove();

    // 搜索高亮
    viewport.selectAll('g.node')
      .classed('hit', (p) => state.hits.has(p.id))
      .classed('dim', (p) => state.hits.size > 0 && !state.hits.has(p.id));
  }

  // ---------- 视图控制（FR-E02/03） ----------
  // 以主干（x=0）为对称轴计算变换：横向留白左右对称，保证树干真正屏幕居中
  function fitTransform(scale) {
    const pos = [...state.posById.values()];
    if (!pos.length) return null;
    const w = svg.node().clientWidth, h = svg.node().clientHeight;
    const maxAbsX = Math.max(...pos.map((p) => Math.abs(p.x)), 200) + 180;
    const y0 = Math.min(...pos.map((p) => p.y)) - 90, y1 = Math.max(...pos.map((p) => p.y)) + 110;
    const yc = (y0 + y1) / 2;
    const k = scale === 'fit' ? Math.min(w / (2 * maxAbsX), h / (y1 - y0)) * 0.94 : scale;
    return d3.zoomIdentity.translate(w / 2, h / 2 - yc * k).scale(k);
  }

  // 首屏：可读缩放（0.95）+ 树干居中 —— 符合人眼阅读习惯，可再拖拽/滚轮探索
  function initialView() {
    const t = fitTransform(0.95);
    if (t) svg.transition().duration(700).ease(d3.easeCubicOut).call(zoom.transform, t);
  }

  // 复位：整棵树全览
  function fitToScreen() {
    const t = fitTransform('fit');
    if (t) svg.transition().duration(700).ease(d3.easeCubicOut).call(zoom.transform, t);
  }

  function zoomToNode(id) {
    const p = state.posById.get(id);
    if (!p) return;
    const w = svg.node().clientWidth, h = svg.node().clientHeight;
    const t = d3.zoomIdentity.translate(w / 2 - p.x, h / 2 - p.y).scale(1.0);
    svg.transition().duration(650).ease(d3.easeCubicOut).call(zoom.transform, t);
  }

  // ---------- 详情卡（FR-E07，字段按数据存在渲染） ----------
  function openDetail(node) {
    const body = $('detailBody');
    body.innerHTML = '';
    const chip = `<span class="chip" style="background:${chapterColor(node.chapter)}">${(state.pkg.chapters.find((c) => c.id === node.chapter) || {}).name || node.chapter}</span>`;
    const yearText = node.displayYear ?? node.year ?? '';

    if (!state.editMode) {
      body.innerHTML = `
        <div>${chip}<span class="year-badge">${yearText}</span></div>
        <h2>${node.title}</h2>
        ${node.summary ? `<div class="summary">${node.summary}</div>` : ''}
        ${node.excerpt ? `<div class="excerpt">${node.excerpt}</div>` : ''}
        ${(node.quotes || []).length ? '<h3>金句</h3>' + node.quotes.map((q) => `
          <div class="quote-card"><div class="q">「${q.text}」</div><div class="i">${q.interpretation || ''}</div></div>`).join('') : ''}
        ${(node.peopleNotes || []).length ? '<h3>人物</h3>' + node.peopleNotes.map((p) => `
          <div class="person"><b>${p.name}</b>：${p.note}</div>`).join('') : ''}`;
    } else {
      body.innerHTML = `
        <div>${chip}<span class="year-badge">编辑中</span></div>
        <input class="ed" id="edTitle" value="${node.title}">
        <input class="ed" id="edYear" type="number" value="${node.year}" title="年份（数值，用于排序）">
        <input class="ed" id="edDisplayYear" value="${node.displayYear ?? ''}" placeholder="显示用年份（如：前551年）">
        <textarea id="edSummary" placeholder="一句话摘要">${node.summary ?? ''}</textarea>
        <textarea id="edExcerpt" placeholder="原文节选">${node.excerpt ?? ''}</textarea>
        <div class="ed-row">
          <button class="primary" id="edSave">保存</button>
          <button id="edAddChild">＋子节点</button>
          <button class="danger" id="edDelete">删除</button>
        </div>
        <div id="childForm"></div>`;
      $('edSave').onclick = () => {
        const year = Number($('edYear').value);
        if (!$('edTitle').value.trim() || Number.isNaN(year)) { toast('标题与年份（数值）必填'); return; }
        state.store.updateNode(node.id, {
          title: $('edTitle').value.trim(), year,
          displayYear: $('edDisplayYear').value.trim() || undefined,
          summary: $('edSummary').value, excerpt: $('edExcerpt').value,
        });
        afterEdit('已保存');
        openDetail(state.nodeById.get(node.id));
      };
      $('edAddChild').onclick = () => {
        $('childForm').innerHTML = `
          <input class="ed" id="ncTitle" placeholder="子节点标题">
          <input class="ed" id="ncYear" type="number" placeholder="年份（数值）">
          <div class="ed-row"><button class="primary" id="ncSave">创建</button></div>`;
        $('ncSave').onclick = () => {
          const title = $('ncTitle').value.trim();
          const year = Number($('ncYear').value);
          if (!title || Number.isNaN(year)) { toast('子节点标题与年份必填'); return; }
          state.store.addNode(node.id, {
            id: 'n' + Date.now().toString(36), title, year,
            chapter: node.chapter, role: 'branch', children: [],
          });
          afterEdit('子节点已创建');
          openDetail(state.nodeById.get(node.id));
        };
      };
      $('edDelete').onclick = () => {
        if (!confirm(`删除节点「${node.title}」及其全部子节点？`)) return;
        state.store.removeNode(node.id);
        $('detail').classList.remove('open');
        afterEdit('节点已删除');
      };
    }
    $('detail').classList.add('open');
  }

  function afterEdit(msg) {
    reindex();
    render();
    toast(msg);
  }

  // ---------- 事件绑定 ----------
  $('detailClose').onclick = () => $('detail').classList.remove('open');
  $('resetView').onclick = fitToScreen;
  svg.on('click', () => $('detail').classList.remove('open'));

  $('pkgSwitcher').onchange = (e) => activatePackage(e.target.value);
  $('navSelect').onchange = (e) => { if (e.target.value) { zoomToNode(e.target.value); e.target.value = ''; } };

  $('themeSelect').onchange = (e) => {
    document.documentElement.dataset.theme = e.target.value;
    localStorage.setItem(LS_THEME, e.target.value);
  };

  let searchTimer;
  $('searchBox').oninput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const hits = searchNodes(state.pkg, e.target.value);
      state.hits = new Set(hits.map((n) => n.id));
      render();
      if (hits.length && e.target.value.trim()) zoomToNode(hits[0].id);
    }, 250);
  };

  $('editToggle').onclick = () => {
    state.editMode = !state.editMode;
    $('editToggle').classList.toggle('active', state.editMode);
    const hasEdited = !!localStorage.getItem(lsEdited(state.pkgId));
    $('editHint').classList.toggle('show', state.editMode);
    $('restoreBuiltin').style.display = hasEdited ? 'inline' : 'none';
    $('detail').classList.remove('open');
  };

  $('restoreBuiltin').onclick = () => {
    localStorage.removeItem(lsEdited(state.pkgId));
    toast('已恢复内置版本');
    activatePackage(state.pkgId);
  };

  $('exportBtn').onclick = () => {
    const blob = new Blob([exportThemePackage(state.pkg)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.pkgId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('已导出主题包 JSON');
  };

  $('importFile').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importThemePackage(reader.result);
      if (!result.ok) { toast('导入失败：\n' + result.errors.join('\n')); return; }
      const id = result.package.meta.id;
      imported[id] = result.package;
      localStorage.setItem(LS_IMPORTED, JSON.stringify(imported));
      toast(`主题包「${result.package.meta.title}」导入成功`);
      activatePackage(id);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ---------- 启动 ----------
  const savedTheme = localStorage.getItem(LS_THEME) || 'ink';
  document.documentElement.dataset.theme = savedTheme;
  $('themeSelect').value = savedTheme;
  activatePackage(localStorage.getItem(LS_LAST) && (builtin[localStorage.getItem(LS_LAST)] || imported[localStorage.getItem(LS_LAST)])
    ? localStorage.getItem(LS_LAST)
    : confuciusPackage.meta.id);
})();