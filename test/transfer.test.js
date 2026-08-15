import test from 'node:test';
import assert from 'node:assert/strict';
import { importThemePackage, exportThemePackage } from '../src/engine/transfer.js';

const validPackage = {
  meta: { id: 'demo', title: '演示' },
  timeline: { startYear: -551, endYear: 2026 },
  chapters: [{ id: 'real', name: '真实', color: '#8a2be2' }],
  nodes: [{ id: 'n1', title: '起点', year: -551, chapter: 'real', children: [] }],
};

test('合法 JSON 文本导入成功，导出后再导入往返一致', () => {
  const imported = importThemePackage(JSON.stringify(validPackage));
  assert.equal(imported.ok, true);

  const roundTripped = importThemePackage(exportThemePackage(imported.package));
  assert.equal(roundTripped.ok, true);
  assert.deepEqual(roundTripped.package, validPackage);
});

test('非法 JSON 文本导入失败并给出可读错误', () => {
  const result = importThemePackage('{ 这不是合法 JSON');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('JSON')));
});

test('JSON 合法但不符合 schema 时导入失败并带 schema 错误', () => {
  const invalidPackage = { meta: { id: 'demo' }, nodes: [] }; // 缺 meta.title
  const result = importThemePackage(JSON.stringify(invalidPackage));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('meta.title')));
});
