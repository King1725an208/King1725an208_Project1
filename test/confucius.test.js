import test from 'node:test';
import assert from 'node:assert/strict';
import { confuciusPackage } from '../src/data/confucius.js';
import { validateThemePackage } from '../src/engine/schema.js';

test('Confucius 主题包通过 schema 校验', () => {
  const result = validateThemePackage(confuciusPackage);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('章节为 真实/记录/传播/接受 四章', () => {
  assert.deepEqual(
    confuciusPackage.chapters.map((c) => c.id),
    ['real', 'record', 'spread', 'accept']
  );
});

test('主干包含传播十阶段且顺序与 docx 一致', () => {
  const spreadTitles = confuciusPackage.nodes
    .filter((n) => n.chapter === 'spread')
    .map((n) => n.title);

  assert.deepEqual(spreadTitles, [
    '周游列国十四年',
    '弟子成《论语》',
    '独尊儒术',
    '玄学佛道的夹击',
    '宋明理学',
    '考据·八股·礼教',
    '打倒孔家店',
    '两条道路',
    '批林批孔',
    '国学复兴',
  ]);
});

test('顶层主干节点年份单调不减（顺序保真）', () => {
  const years = confuciusPackage.nodes.map((n) => n.year);
  for (let i = 1; i < years.length; i++) {
    assert.ok(years[i] >= years[i - 1], `年份乱序: ${years[i - 1]} -> ${years[i]}`);
  }
});

test('「记录」以侧枝形式存在且含《论语》节点', () => {
  const findBranches = (nodes, acc = []) => {
    for (const n of nodes ?? []) {
      if (n.role === 'branch') acc.push(n);
      findBranches(n.children, acc);
    }
    return acc;
  };
  const branches = findBranches(confuciusPackage.nodes);
  assert.ok(branches.every((n) => n.chapter === 'record'), '侧枝应全部属于「记录」章');
  assert.ok(branches.some((n) => n.title.includes('论语')), '侧枝中应有《论语》节点');
});