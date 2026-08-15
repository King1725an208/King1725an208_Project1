/**
 * 主题包导入/导出（Seam S5）
 * importThemePackage: JSON 文本 → { ok, package | errors }
 * exportThemePackage: 主题包对象 → 格式化 JSON 文本（用于备份/分享/固化）
 */
import { validateThemePackage } from './schema.js';

export function importThemePackage(text) {
  let pkg;
  try {
    pkg = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['JSON 解析失败：文件不是合法的 JSON 文本'] };
  }

  const validation = validateThemePackage(pkg);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  return { ok: true, package: pkg };
}

export function exportThemePackage(pkg) {
  return JSON.stringify(pkg, null, 2);
}