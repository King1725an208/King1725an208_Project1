/* ============================================================
 * 知识树平台 · 薄编排层（浏览器）
 * 职责：维护顶层状态、绑定事件、串联 renderTree + viewController
 * 渲染逻辑见 render-tree.js，视图控制见 view-controller.js
 * ============================================================ */
import { renderTree, chapterColor } from './render-tree.js';
import { createViewController } from './view-controller.js';
import { createPackageRegistry, createLocalStorageAdapter } from '../engine/package-registry.js';

(function () {
  'use strict';

  // ---------- 存储键与工具 ----------
  const LS_THEME = 'kt:visualTheme';
  const $ = (id) => document.getElementById(id);
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ---------- 状态 ----------
  const state = {
    pkgId: null, pkg: null, store: null,
    editMode: false, collapsed: new Set(), hits: new Set(),
    nodeById: new Map(), posById: new Map(),
  };

  // ---------- 主题包注册表（深模块，封装字典查找/存储/深拷贝/store创建） ----------
  const registry = createPackageRegistry({
    builtin: { [confuciusPackage.meta.id]: confuciusPackage },
    storage: createLocalStorageAdapter(localStorage),
  });

  // ---------- D3 容器与视图控制器 ----------
  const svg = d3.select('#stage');
  const viewport = d3.select('#viewport');
  const zoom = d3.zoom().scaleExtent([0.2, 3]).on('zoom', (e) => {
    viewport.attr('transform', e.transform);
    view.applyLod(e.transform.k);
  });
  svg.call(zoom);
  const view = createViewController({ svg, zoom, viewport, getPosById: () => state.posById });

  // ---------- 节点索引 ----------
  const reindex = () => {
    state.nodeById = new Map();
    walk(state.pkg.nodes, (n) => state.nodeById.set(n.id, n));
  };

  // ---------- 树渲染（委托给 renderTree） ----------
  function render() {
    const layout = computeLayout(state.pkg);
    const { posById } = renderTree({
      viewport, pkg: state.pkg, layout,
      nodeById: state.nodeById, collapsed: state.collapsed, hits: state.hits,
      onToggleCollapse: (id) => { state.collapsed.has(id) ? state.collapsed.delete(id) : state.collapsed.add(id); render(); },
      onNodeClick: (n) => { if (!state.editMode) view.zoomToNode(n.id); openDetail(n); },
    });
    state.posById = posById;
    view.setBounds(layout.positions);
  }

  // ---------- 激活主题包（薄调用：registry 处理全部内部逻辑） ----------
  function activatePackage(id) {
    const result = registry.activate(id);
    if (!result) return;
    state.pkgId = id;
    state.pkg = result.pkg;
    state.store = result.store;
    state.collapsed = new Set(); state.hits = new Set();
    reindex(); renderChrome(); render(); view.initialView();
  }

  // ---------- 顶栏与导航（数据驱动） ----------
  function renderChrome() {
    const { meta } = state.pkg;
    $('pkgTitle').textContent = meta.title;
    $('pkgDesc').textContent = meta.description || '';
    document.title = `知识树 · ${meta.title}`;
    $('seal').textContent = (meta.title || '树').slice(-1);
    const switcher = $('pkgSwitcher'); switcher.innerHTML = '';
    const { builtin, imported } = registry.getAll();
    for (const [label, set] of [['内置', builtin], ['已导入', imported]]) {
      const ids = Object.keys(set); if (!ids.length) continue;
      const og = document.createElement('optgroup'); og.label = label;
      for (const pid of ids) {
        const opt = document.createElement('option'); opt.value = pid;
        opt.textContent = set[pid].meta?.title || pid; og.appendChild(opt);
      }
      switcher.appendChild(og);
    }
    switcher.value = state.pkgId;
    const nav = $('navSelect'); nav.innerHTML = '<option value="">导航…</option>';
    for (const item of state.pkg.navigation || []) {
      const opt = document.createElement('option'); opt.value = item.target; opt.textContent = item.label; nav.appendChild(opt);
    }
    const legend = $('legend'); legend.innerHTML = '';
    for (const c of state.pkg.chapters || []) {
      const item = document.createElement('span'); item.className = 'legend-item';
      const dot = document.createElement('i'); dot.style.background = c.color;
      item.appendChild(dot); item.appendChild(document.createTextNode(c.name)); legend.appendChild(item);
    }
  }

  // ---------- 详情卡（字段按数据存在渲染） ----------
  function openDetail(node) {
    const body = $('detailBody'); body.innerHTML = '';
    const chName = (state.pkg.chapters.find((c) => c.id === node.chapter) || {}).name || node.chapter;
    const chip = `<span class="chip" style="background:${chapterColor(state.pkg, node.chapter)}">${chName}</span>`;
    const yearText = node.displayYear ?? node.year ?? '';
    if (!state.editMode) {
      body.innerHTML = `
        <div>${chip}<span class="year-badge">${yearText}</span></div>
        <h2>${node.title}</h2>
        ${node.summary ? `<div class="summary">${node.summary}</div>` : ''}
        ${node.excerpt ? `<div class="excerpt">${node.excerpt}</div>` : ''}
        ${(node.quotes || []).length ? '<h3>金句</h3>' + node.quotes.map((q) => `<div class="quote-card"><div class="q">「${q.text}」</div><div class="i">${q.interpretation || ''}</div></div>`).join('') : ''}
        ${(node.peopleNotes || []).length ? '<h3>人物</h3>' + node.peopleNotes.map((p) => `<div class="person"><b>${p.name}</b>：${p.note}</div>`).join('') : ''}`;
    } else {
      body.innerHTML = `
        <div>${chip}<span class="year-badge">编辑中</span></div>
        <input class="ed" id="edTitle" value="${node.title}">
        <input class="ed" id="edYear" type="number" value="${node.year}" title="年份（数值，用于排序）">
        <input class="ed" id="edDisplayYear" value="${node.displayYear ?? ''}" placeholder="显示用年份（如：前551年）">
        <textarea id="edSummary" placeholder="一句话摘要">${node.summary ?? ''}</textarea>
        <textarea id="edExcerpt" placeholder="原文节选">${node.excerpt ?? ''}</textarea>
        <div class="ed-row"><button class="primary" id="edSave">保存</button><button id="edAddChild">＋子节点</button><button class="danger" id="edDelete">删除</button></div>
        <div id="childForm"></div>`;
      $('edSave').onclick = () => {
        const year = Number($('edYear').value);
        if (!$('edTitle').value.trim() || Number.isNaN(year)) { toast('标题与年份（数值）必填'); return; }
        state.store.updateNode(node.id, { title: $('edTitle').value.trim(), year, displayYear: $('edDisplayYear').value.trim() || undefined, summary: $('edSummary').value, excerpt: $('edExcerpt').value });
        afterEdit('已保存'); openDetail(state.nodeById.get(node.id));
      };
      $('edAddChild').onclick = () => {
        $('childForm').innerHTML = `<input class="ed" id="ncTitle" placeholder="子节点标题"><input class="ed" id="ncYear" type="number" placeholder="年份（数值）"><div class="ed-row"><button class="primary" id="ncSave">创建</button></div>`;
        $('ncSave').onclick = () => {
          const title = $('ncTitle').value.trim(), year = Number($('ncYear').value);
          if (!title || Number.isNaN(year)) { toast('子节点标题与年份必填'); return; }
          state.store.addNode(node.id, { id: 'n' + Date.now().toString(36), title, year, chapter: node.chapter, role: 'branch', children: [] });
          afterEdit('子节点已创建'); openDetail(state.nodeById.get(node.id));
        };
      };
      $('edDelete').onclick = () => {
        if (!confirm(`删除节点「${node.title}」及其全部子节点？`)) return;
        state.store.removeNode(node.id); $('detail').classList.remove('open'); afterEdit('节点已删除');
      };
    }
    $('detail').classList.add('open');
  }

  const afterEdit = (msg) => { reindex(); render(); toast(msg); };

  // ---------- 事件绑定 ----------
  $('detailClose').onclick = () => $('detail').classList.remove('open');
  $('resetView').onclick = view.fitToScreen;
  svg.on('click', () => $('detail').classList.remove('open'));
  $('pkgSwitcher').onchange = (e) => activatePackage(e.target.value);
  $('navSelect').onchange = (e) => { if (e.target.value) { view.zoomToNode(e.target.value); e.target.value = ''; } };
  $('themeSelect').onchange = (e) => { document.documentElement.dataset.theme = e.target.value; localStorage.setItem(LS_THEME, e.target.value); };
  let searchTimer;
  $('searchBox').oninput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const hits = searchNodes(state.pkg, e.target.value);
      state.hits = new Set(hits.map((n) => n.id));
      render();
      if (hits.length && e.target.value.trim()) view.zoomToNode(hits[0].id);
    }, 250);
  };
  $('editToggle').onclick = () => {
    state.editMode = !state.editMode;
    $('editToggle').classList.toggle('active', state.editMode);
    $('editHint').classList.toggle('show', state.editMode);
    $('restoreBuiltin').style.display = registry.hasEdited(state.pkgId) ? 'inline' : 'none';
    $('detail').classList.remove('open');
  };
  $('restoreBuiltin').onclick = () => { registry.clearEdited(state.pkgId); toast('已恢复内置版本'); activatePackage(state.pkgId); };
  $('exportBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportThemePackage(state.pkg)], { type: 'application/json' }));
    a.download = `${state.pkgId}.json`; a.click(); URL.revokeObjectURL(a.href);
    toast('已导出主题包 JSON');
  };
  $('importFile').onchange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importThemePackage(reader.result);
      if (!result.ok) { toast('导入失败：\n' + result.errors.join('\n')); return; }
      registry.registerImported(result.package);
      toast(`主题包「${result.package.meta.title}」导入成功`);
      activatePackage(result.package.meta.id);
    };
    reader.readAsText(file); e.target.value = '';
  };

  // ---------- 启动 ----------
  const savedTheme = localStorage.getItem(LS_THEME) || 'ink';
  document.documentElement.dataset.theme = savedTheme;
  $('themeSelect').value = savedTheme;
  const last = registry.getLastId();
  activatePackage(last && registry.has(last) ? last : confuciusPackage.meta.id);
})();