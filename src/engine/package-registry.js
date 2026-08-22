/**
 * 主题包注册与激活深模块（Seam）
 *
 * 对外核心接口：
 *   const registry = createPackageRegistry({ builtin, storage });
 *   registry.activate(id)  → { pkg, store } | null
 *
 * 模块内部吸收全部主题包生命周期逻辑：
 *   1. builtin / imported 字典查找
 *   2. localStorage 编辑草稿读取恢复
 *   3. 数据深拷贝（隔离运行时与原始数据）
 *   4. 创建 treeStore 实例
 *   5. 导入注册、内置恢复、lastId 持久化
 *
 * storage 为 localStorage 兼容适配器（getItem/setItem/removeItem），
 * 可轻易替换为内存版（测试）或 IndexedDB 等其他后端。
 */
import { createTreeStore } from './tree-store.js';

const DEFAULT_KEYS = {
  imported: 'kt:importedPackages',
  last: 'kt:lastPackage',
  editedPrefix: 'kt:edited:',
};

const loadJSON = (text) => {
  try { return text ? JSON.parse(text) : null; }
  catch { return null; }
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export function createPackageRegistry({ builtin = {}, storage, keys = {} }) {
  if (!storage) throw new Error('packageRegistry 需要 storage 适配器');
  const K = { ...DEFAULT_KEYS, ...keys };
  const editedKey = (id) => `${K.editedPrefix}${id}`;

  // 启动时从存储恢复已导入字典
  const imported = loadJSON(storage.getItem(K.imported)) || {};

  return {
    /**
     * 激活指定 id 的主题包：查找 → 恢复草稿 → 深拷贝 → 创建 store
     * @returns {{pkg: object, store: object}|null} 未找到返回 null
     */
    activate(id) {
      const base = imported[id] || builtin[id];
      if (!base) return null;
      const edited = loadJSON(storage.getItem(editedKey(id)));
      const pkg = edited || deepClone(base);
      const store = createTreeStore(pkg, storage, editedKey(id));
      storage.setItem(K.last, id);
      return { pkg, store };
    },

    /**
     * 注册一个导入的主题包（写入内存字典并持久化）
     */
    registerImported(pkg) {
      imported[pkg.meta.id] = pkg;
      storage.setItem(K.imported, JSON.stringify(imported));
    },

    /**
     * @returns {{builtin: object, imported: object}} 供 UI 渲染切换器
     */
    getAll() {
      return { builtin, imported };
    },

    /**
     * @returns {boolean} 该 id 是否存在编辑草稿
     */
    hasEdited(id) {
      return storage.getItem(editedKey(id)) !== null;
    },

    /**
     * 清除指定 id 的编辑草稿（恢复内置版本）
     */
    clearEdited(id) {
      storage.removeItem(editedKey(id));
    },

    /**
     * @returns {string|null} 上次激活的包 id
     */
    getLastId() {
      return storage.getItem(K.last);
    },

    /**
     * 判断 id 是否在内置或已导入字典中
     */
    has(id) {
      return !!(builtin[id] || imported[id]);
    },
  };
}

/**
 * 浏览器 localStorage 适配器
 */
export function createLocalStorageAdapter(ls) {
  return {
    getItem: (k) => ls.getItem(k),
    setItem: (k, v) => ls.setItem(k, v),
    removeItem: (k) => ls.removeItem(k),
  };
}

/**
 * 内存存储适配器（测试用，零 DOM 依赖）
 */
export function createMemoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _dump: () => ({ ...data }),
  };
}