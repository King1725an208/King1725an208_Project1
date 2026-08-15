# 知识树主题包 · 内容格式说明（SCHEMA）

> 平台（`index.html` 引擎）通过**主题包 JSON**加载知识树内容。任何按本格式编写的 JSON 文件，都可以通过页面顶栏「导入」直接使用，无需修改引擎代码。
> 本说明与引擎校验器（`src/engine/schema.js`）及内置示例《我心中的孔子》（`src/data/confucius.js`）保持一致。

## 1. 顶层结构

```json
{
  "meta":      { "id": "主题唯一ID", "title": "主题名", "description": "简介(可选)", "author": "作者(可选)", "version": "1.0(可选)" },
  "timeline":  { "startYear": -551, "endYear": 2026 },
  "chapters":  [ { "id": "章节ID", "name": "章节名", "color": "#9e2b25" } ],
  "navigation":[ { "label": "跳转项文字", "target": "目标节点id" } ],
  "nodes":     [ /* 节点树，见 §2 */ ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `meta.id` | string | ✅ | 主题包唯一标识（用于存储隔离与切换） |
| `meta.title` | string | ✅ | 主题名（引擎校验：非空字符串，缺失将拒绝导入） |
| `timeline.startYear` / `endYear` | number | ✅ | 时间轴起止年（公元前用负数，如前551年 = `-551`） |
| `chapters` | array | ✅ | 章节/泳道定义，至少 1 个；`color` 为十六进制色值 |
| `navigation` | array | 可选 | 顶栏「导航」下拉项，`target` 指向节点 id |
| `nodes` | array | ✅ | 顶层节点数组 = **时间主轴**（见 §3 布局规则） |

## 2. 节点结构

```json
{
  "id": "birth",
  "title": "出生",
  "year": -551,
  "displayYear": "前551年",
  "chapter": "real",
  "role": "root",
  "summary": "一句话摘要",
  "excerpt": "原文/资料节选（详情卡引用块）",
  "quotes": [ { "text": "金句原文", "interpretation": "白话解读" } ],
  "peopleNotes": [ { "name": "董仲舒", "note": "一两句身份背景" } ],
  "children": []
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 节点唯一标识（导航/编辑/搜索定位用） |
| `title` | string | ✅ | 节点标题 |
| `year` | number | ✅ | 年份数值，**布局排序的唯一依据**（公元前为负） |
| `displayYear` | string | 可选 | 展示用年份文字（缺省时显示 `year` 数值） |
| `chapter` | string | ✅ | 所属章节 id，**必须存在于 `chapters` 中**（引擎校验：引用未定义章节将拒绝导入） |
| `role` | string | 可选 | 枝干角色，见 §3 |
| `summary` / `excerpt` | string | 可选 | 详情卡字段，按存在与否渲染（FR-E07） |
| `quotes` | array | 可选 | 金句卡：`text` 原文 + `interpretation` 解读 |
| `peopleNotes` | array | 可选 | 关键人物背景注 |
| `children` | array | ✅(可为空) | 子节点（递归同构） |

## 3. 布局规则（引擎如何实现"树的高度=时间"）

- **主干（时间主轴）**：顶层 `nodes` 数组。布局按 `year` **升序**、**阶段等距**沿垂直中轴（x=0）排布：年份小在下（根部），年份大在上（树梢）——与数组书写顺序无关，顺序保真由 `year` 保证。
- **侧枝**：`role: "branch"` 的节点不参与主轴，渲染在其父节点侧旁（同父侧枝左右交替），用曲线与父节点相连。
- **role 取值**：`root`（根部段）、`trunk`（主干，缺省值）、`canopy`（树梢）——三者都在主轴上，仅作语义/样式标注；`branch`（侧枝，须放父节点 `children` 内）。
- **章节配色**：节点圆点颜色取 `chapters` 中对应 `color`，三套视觉主题下均保持可区分。

## 4. 最小合法示例

```json
{
  "meta": { "id": "laozi", "title": "老子与道的传播" },
  "timeline": { "startYear": -600, "endYear": 2026 },
  "chapters": [
    { "id": "life", "name": "生平", "color": "#5b8c5a" },
    { "id": "spread", "name": "传播", "color": "#365f8c" }
  ],
  "nodes": [
    { "id": "lz1", "title": "老子出生", "year": -571, "chapter": "life", "children": [] },
    { "id": "lz2", "title": "出关著《道德经》", "year": -485, "chapter": "life", "children": [] },
    { "id": "lz3", "title": "被尊为道教始祖", "year": 142, "chapter": "spread", "children": [] }
  ]
}
```

## 5. 引擎校验规则与错误提示

导入时引擎执行校验，不合法则给出中文字段级错误（不白屏）：

1. `meta.title` 缺失或非非空字符串 → `meta.title 缺失或不是非空字符串`
2. 节点 `chapter` 引用未定义章节 → `nodes[i].chapter 引用了未定义的章节 "xxx"`（递归检查整棵树）
3. 文件不是合法 JSON → `JSON 解析失败：文件不是合法的 JSON 文本`

## 6. 内容生产流程（约定）

1. 作者以 Word/Markdown 等任意形式撰写原始内容；
2. 按本格式转换为主题包 JSON（可手工，或交由 AI 助手转换——内置 Confucius 主题包即由《鲁国_孔子_溯源.docx》转换而来）；
3. 页面「导入」加载验证 → 浏览/编辑 → 「导出」备份；
4. 定稿后可替换 `index.html` 内嵌数据区形成新的内置版本（FR-E13）。