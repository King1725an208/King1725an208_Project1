import test from 'node:test';
import assert from 'node:assert/strict';
import { validateThemePackage } from '../src/engine/schema.js';

// 最小合法主题包：schema 形状的"规格样例"
const minimalPackage = {
  meta: { id: 'demo', title: '演示主题' },
  timeline: { startYear: -551, endYear: 2026 },
  chapters: [{ id: 'real', name: '真实', color: '#8a2be2' }],
  nodes: [
    { id: 'n1', title: '起点', year: -551, chapter: 'real', children: [] },
  ],
};

test('合法的最小主题包通过校验', () => {
  const result = validateThemePackage(minimalPackage);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('缺少 meta.title 时校验失败并指出字段', () => {
  const pkg = {
    meta: { id: 'demo' },
    timeline: { startYear: -551, endYear: 2026 },
    chapters: [{ id: 'real', name: '真实', color: '#8a2be2' }],
    nodes: [{ id: 'n1', title: '起点', year: -551, chapter: 'real', children: [] }],
  };
  const result = validateThemePackage(pkg);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('meta.title')));
});

test('节点引用了未定义的章节时校验失败', () => {
  const pkg = {
    meta: { id: 'demo', title: '演示主题' },
    timeline: { startYear: -551, endYear: 2026 },
    chapters: [{ id: 'real', name: '真实', color: '#8a2be2' }],
    nodes: [{ id: 'n1', title: '起点', year: -551, chapter: 'ghost', children: [] }],
  };
  const result = validateThemePackage(pkg);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('ghost')));
});
