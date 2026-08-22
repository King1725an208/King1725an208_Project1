import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPackageRegistry, createMemoryStorage } from '../src/engine/package-registry.js';

const builtinPkg = {
  meta: { id: 'builtin-1', title: '内置包' },
  chapters: [],
  nodes: [{ id: 'root', title: '根', year: -500, chapter: 'c1', role: 'trunk', children: [] }],
};

const anotherBuiltin = {
  meta: { id: 'builtin-2', title: '第二个内置包' },
  chapters: [],
  nodes: [{ id: 'r2', title: '根2', year: -200, chapter: 'c1', role: 'trunk', children: [] }],
};

const importedPkg = {
  meta: { id: 'imported-1', title: '外部包' },
  chapters: [],
  nodes: [{ id: 'ri', title: '外部根', year: 100, chapter: 'c1', role: 'trunk', children: [] }],
};

const makeRegistry = (storage) =>
  createPackageRegistry({ builtin: { 'builtin-1': builtinPkg, 'builtin-2': anotherBuiltin }, storage });

test('activate 内置包：返回深拷贝的 pkg 与可用的 store，不修改原始 builtin', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  const { pkg, store } = reg.activate('builtin-1');
  assert.ok(pkg, '应返回 pkg');
  assert.ok(store, '应返回 store');
  assert.equal(pkg.meta.id, 'builtin-1');
  assert.notEqual(pkg, builtinPkg, 'pkg 应为深拷贝，不是原始对象引用');
  assert.notEqual(pkg.nodes[0], builtinPkg.nodes[0], '节点也应深拷贝');
});

test('activate 后通过 store 编辑不影响原始 builtin 数据', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  const { store } = reg.activate('builtin-1');
  store.updateNode('root', { title: '被修改了' });
  assert.equal(builtinPkg.nodes[0].title, '根', '原始 builtin 不应被修改');
});

test('activate 未注册的 id 返回 null', () => {
  const reg = makeRegistry(createMemoryStorage());
  assert.equal(reg.activate('nonexistent'), null);
});

test('activate 后 lastId 被持久化到 storage', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  reg.activate('builtin-2');
  assert.equal(storage.getItem('kt:lastPackage'), 'builtin-2');
  assert.equal(reg.getLastId(), 'builtin-2');
});

test('重新 activate 时恢复 localStorage 中的编辑草稿（而非原始 builtin）', () => {
  const storage = createMemoryStorage();
  const reg1 = makeRegistry(storage);
  const { store } = reg1.activate('builtin-1');
  store.updateNode('root', { title: '编辑后的标题' });

  // 新 registry 实例模拟页面刷新
  const reg2 = makeRegistry(storage);
  const { pkg } = reg2.activate('builtin-1');
  assert.equal(pkg.nodes[0].title, '编辑后的标题', '应从 storage 恢复编辑草稿');
});

test('clearEdited 后 activate 恢复原始 builtin 数据', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  const { store } = reg.activate('builtin-1');
  store.updateNode('root', { title: '编辑后' });
  assert.ok(reg.hasEdited('builtin-1'));

  reg.clearEdited('builtin-1');
  assert.ok(!reg.hasEdited('builtin-1'));
  const { pkg } = reg.activate('builtin-1');
  assert.equal(pkg.nodes[0].title, '根', '清除草稿后应恢复原始 builtin');
});

test('registerImported 后 activate 能找到该包，且已导入列表持久化', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  assert.ok(!reg.has('imported-1'));
  reg.registerImported(importedPkg);
  assert.ok(reg.has('imported-1'));
  const { pkg } = reg.activate('imported-1');
  assert.equal(pkg.meta.title, '外部包');

  // 新实例应能从 storage 恢复已导入字典
  const reg2 = makeRegistry(storage);
  assert.ok(reg2.has('imported-1'));
  const { pkg: pkg2 } = reg2.activate('imported-1');
  assert.equal(pkg2.meta.title, '外部包');
});

test('getAll 返回 builtin 和 imported 字典供 UI 渲染切换器', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  reg.registerImported(importedPkg);
  const { builtin, imported } = reg.getAll();
  assert.ok(builtin['builtin-1'], '内置包应存在');
  assert.ok(builtin['builtin-2'], '第二个内置包应存在');
  assert.ok(imported['imported-1'], '已导入包应存在');
});

test('编辑已导入包后持久化，重新激活恢复草稿', () => {
  const storage = createMemoryStorage();
  const reg = makeRegistry(storage);
  reg.registerImported(importedPkg);
  const { store } = reg.activate('imported-1');
  store.updateNode('ri', { title: '外部包被编辑' });

  const reg2 = makeRegistry(storage);
  const { pkg } = reg2.activate('imported-1');
  assert.equal(pkg.nodes[0].title, '外部包被编辑');
});

test('storage 适配器可替换：使用自定义 key 前缀正常工作', () => {
  const storage = createMemoryStorage();
  const reg = createPackageRegistry({
    builtin: { 'builtin-1': builtinPkg },
    storage,
    keys: { imported: 'custom:imported', last: 'custom:last', editedPrefix: 'custom:edited:' },
  });
  const { store } = reg.activate('builtin-1');
  store.updateNode('root', { title: '自定义key' });
  assert.equal(storage.getItem('custom:last'), 'builtin-1');
  assert.ok(storage.getItem('custom:edited:builtin-1') !== null);
});