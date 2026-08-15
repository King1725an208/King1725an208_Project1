import test from 'node:test';
import assert from 'node:assert/strict';
import { searchNodes } from '../src/engine/search.js';

const pkg = {
  meta: { id: 't', title: 't' },
  timeline: { startYear: -600, endYear: 2026 },
  chapters: [{ id: 'c', name: '章', color: '#000000' }],
  nodes: [
    {
      id: 'a', title: '孔子出生', year: -551, chapter: 'c', summary: '生于鲁国陬邑',
      children: [
        { id: 'b', title: '周游列国', year: -497, chapter: 'c', summary: '十四年奔波', children: [] },
      ],
    },
    { id: 'd', title: '罢黜百家', year: -134, chapter: 'c', summary: '独尊儒术', children: [] },
  ],
};

test('搜索命中标题与摘要并返回匹配节点', () => {
  assert.deepEqual(searchNodes(pkg, '孔子').map((n) => n.id), ['a']); // 命中标题
  assert.deepEqual(searchNodes(pkg, '独尊').map((n) => n.id), ['d']); // 命中摘要
  assert.deepEqual(searchNodes(pkg, '奔波').map((n) => n.id), ['b']); // 命中嵌套子节点
});

test('无命中或空关键词返回空数组', () => {
  assert.deepEqual(searchNodes(pkg, '不存在的词'), []);
  assert.deepEqual(searchNodes(pkg, ''), []);
});
