/**
 * Confucius 主题包（平台首个示例数据集）
 * 内容来源：《鲁国_孔子_溯源.docx》（作者原创随笔，第一人称）
 * 转换说明：骨架忠实 docx（四章 + 传播十阶段）；仅补充时间锚点与关键人物背景注（Q2）
 * 结构约定：顶层 nodes = 时间主轴（真实=根部 → 传播=主干十阶段 → 接受=树梢），
 *          「记录」章以 role:'branch' 侧枝挂在对应主干节点下（Q3）
 */
export const confuciusPackage = {
  meta: {
    id: 'confucius',
    title: '我心中的孔子',
    description: '从真实的孔丘到传播中的孔子：一个文明两千年的精神史（前551–2026）',
    author: '孔氏七十七代 · 德字辈',
    version: '1.0',
  },
  timeline: { startYear: -551, endYear: 2026 },
  chapters: [
    { id: 'real', name: '真实', color: '#8b6f47' },
    { id: 'record', name: '记录', color: '#4a6fa5' },
    { id: 'spread', name: '传播', color: '#9e2b25' },
    { id: 'accept', name: '接受', color: '#3a7d5d' },
  ],
  navigation: [
    { label: '根 · 真实', target: 'birth' },
    { label: '枝 · 记录', target: 'lunyu' },
    { label: '一 · 周游列国', target: 's1' },
    { label: '二 · 弟子成《论语》', target: 's2' },
    { label: '三 · 独尊儒术', target: 's3' },
    { label: '四 · 玄学佛道', target: 's4' },
    { label: '五 · 宋明理学', target: 's5' },
    { label: '六 · 考据八股', target: 's6' },
    { label: '七 · 打倒孔家店', target: 's7' },
    { label: '八 · 两条道路', target: 's8' },
    { label: '九 · 批林批孔', target: 's9' },
    { label: '十 · 国学复兴', target: 's10' },
    { label: '梢 · 接受', target: 'accept' },
  ],
  nodes: [
    // ── 根部 · 我心中真实的孔子 ──────────────────────────
    {
      id: 'birth', title: '出生', year: -551, displayYear: '前551年',
      chapter: 'real', role: 'root',
      summary: '生于鲁国陬邑。子姓孔氏，名丘字仲尼——"孔子"是他死后才有的叫法',
      excerpt: '他其实不姓孔，姓子。古代姓名是分开的，姓是女生，也就是妈妈那一脉的名字，而氏跟着父系家族。所以孔子是子姓，孔氏，名丘，字仲尼。先秦男子称氏不称姓，当时的人叫他"丘"，或者"仲尼"，弟子敬称"夫子"。"孔子"这个叫法，是他死后才有的。',
      children: [],
    },
    {
      id: 'childhood', title: '三岁丧父', year: -548, displayYear: '前548年',
      chapter: 'real', role: 'root',
      summary: '被家族排挤，随母在贫民区长大，早早当家干活，唯独痴迷礼乐仪式',
      excerpt: '孔子的童年并不富裕，过的生活也比较艰苦。三岁丧父、被家族排挤、随母在贫民区长大、早早当家干活、唯独痴迷礼乐仪式的普通苦孩子。',
      children: [],
    },
    {
      id: 'aspire', title: '十五志于学', year: -536, displayYear: '约前536年',
      chapter: 'real', role: 'root',
      summary: '从小喜欢看书，学习新知识，有举一反三的能力',
      excerpt: '但是从小喜欢看书，学习新的知识，而且有举一反三的能力。',
      quotes: [
        { text: '学而时习之，不亦说乎', interpretation: '学了还要常常练习体会，本身就是快乐' },
      ],
      children: [],
    },
    {
      id: 'teach', title: '私人讲学', year: -522, displayYear: '约前522年',
      chapter: 'real', role: 'root',
      summary: '突破性地私人开学授课：有教无类，因材施教',
      excerpt: '他提出的思想是要教化每一个人，也就是有教无类。对于老百姓要遵纪守法，君子要以身作则，整个国家每一个人都要有德，都要守礼。最值得普通人动容的是，他按照这个理念，严格要求自己，并且突破性地私人开学授课，传播知识，教育每一个普通人。',
      quotes: [
        { text: '有教无类', interpretation: '教育不看出身贵贱，人人都可受教' },
      ],
      children: [],
    },
    {
      id: 'travel', title: '五十五岁启程', year: -497, displayYear: '前497年',
      chapter: 'real', role: 'root',
      summary: '带着思想周游列国，希望找到理念契合的国君',
      excerpt: '他带着自己的思想周游列国，希望找到一个与自己理念契合的国君，去践行他的治国思想。可惜这个思想即使放到现在也是过于美好和理想。',
      children: [],
    },

    // ── 主干 · 被传播的孔子（十阶段） ─────────────────────
    {
      id: 's1', title: '周游列国十四年', year: -497, displayYear: '前497–前484年',
      chapter: 'spread', role: 'trunk',
      summary: '没有一个国君重用他，但为天下苍生奔波的行为本身，就是一次伟大而艰苦卓绝的传播',
      excerpt: '传播的个阶段，是孔子自己在五十五岁开启的列国奔波……这十四年，不为个人利益，为天下苍生，为人民利益而奔波的行为本身，就是一次伟大而艰苦卓绝的传播行为。他形容自己如丧家之犬。',
      quotes: [
        { text: '知其不可而为之', interpretation: '明知做不到也要去做——理想主义者的底色' },
      ],
      children: [],
    },
    {
      id: 'return', title: '归鲁·整理六经', year: -484, displayYear: '前484年',
      chapter: 'real', role: 'root',
      summary: '十四年奔波无果；人生最后五年集中整理、校勘、删订，建立儒家六经教学体系',
      excerpt: '他中年讲学研习、周游搜集文献，人生最后五年返回鲁国，集中完成整理、校勘、删订，建立儒家六经教学体系。',
      children: [],
    },
    {
      id: 'death', title: '逝世', year: -479, displayYear: '前479年',
      chapter: 'real', role: 'root',
      summary: '七十三岁离世。儿子孔鲤已先亡，弟子们主动承担了老师的葬礼',
      excerpt: '最后回到鲁国，成为一位古来稀的老人，七十三岁的时候肉体离开了人世。他不是一个完美的人，会暴躁，会生气，会骂宰予"朽木不可雕也"，会在颜回死时痛哭"天丧予"。',
      quotes: [
        { text: '天丧予！天丧予！', interpretation: '颜回死时孔子的痛哭——他是会哭会骂的真人，不是完美的塑像' },
      ],
      children: [],
    },
    {
      id: 's2', title: '弟子成《论语》', year: -479, displayYear: '前479年起',
      chapter: 'spread', role: 'trunk',
      summary: '守孝三年，弟子追忆夫子言行成书；儒分为八，秦火未绝，秦的短命反成儒家最好的广告',
      excerpt: '守孝三年的时间里，孔子的弟子聚在一起回忆夫子的言行，留下最美好的回忆，首先就是一次带有美好滤镜的传播，但即便此时，也是一次有血有肉的记录。论语这部巨著，本身就足够开放和留白……而秦朝的短命（十五年亡），反而成了儒家最好的广告。',
      children: [
        {
          id: 'lunyu', title: '《论语》成书与流变', year: -479, displayYear: '战国前期',
          chapter: 'record', role: 'branch',
          summary: '弟子及再传弟子的"二手记录"；《鲁论》《齐论》《古论》三版本并行，张禹糅合、郑玄作注',
          excerpt: '《论语》不是孔子写的。书名意为"编纂起来的话语"，成书于战国前期，由孔门弟子及再传弟子共同记录，从诞生起就是"二手记录"……真正的变异不在文本，而在解读。文本是锚，船却往各个方向漂。',
          quotes: [
            { text: '三人行，必有我师焉', interpretation: '每个人都有值得我学的地方' },
            { text: '己所不欲，勿施于人', interpretation: '自己不想要的，也别强加给别人——同理心的底线' },
          ],
          children: [],
        },
        {
          id: 'liujing', title: '六经：孔子的教材', year: -479, displayYear: '春秋末',
          chapter: 'record', role: 'branch',
          summary: '诗、书、礼、乐、易、春秋——孔子的思想源泉与儒家教学体系',
          excerpt: '孔子的思想源泉，来自于他自己参与修订的六经：诗经，最早的诗歌总集，不学诗，无以言；尚书，上古历史汇编；仪礼，古代规矩礼仪，社会礼法；乐经，音乐典籍；周易，预测未来，天文地理；春秋，鲁国编年史。',
          quotes: [
            { text: '不学诗，无以言', interpretation: '不读诗经，连说话都少了底蕴' },
          ],
          children: [],
        },
      ],
    },
    {
      id: 's3', title: '独尊儒术', year: -134, displayYear: '约前134年·汉武帝',
      chapter: 'spread', role: 'trunk',
      summary: '董仲舒"罢黜百家，独尊儒术"——借孔子的壳，把整个大一统社会装进去',
      excerpt: '董仲舒把"仁"变成"三纲五常"，把孔子从"道德导师"升级成"政治神学"的源头——"素王"，没有王位却为汉制法。这是典型的"借壳上市"：借孔子的壳，把整个社会都装进来，为大一统背书。',
      peopleNotes: [
        { name: '董仲舒', note: '西汉儒生，上"天人三策"，推动汉武帝尊儒，儒学官学化的关键人物' },
      ],
      children: [],
    },
    {
      id: 's4', title: '玄学佛道的夹击', year: 220, displayYear: '魏晋–唐',
      chapter: 'spread', role: 'trunk',
      summary: '玄学谈老庄、佛教冲撞忠孝底线；韩愈划道统，李翱偷用禅宗武器',
      excerpt: '儒学没有被打倒，但变成了"面子"——朝堂诏书写儒家，士大夫私下谈老庄……但儒学始终没被推翻，因为它是"操作系统"，佛道只是"应用程序"。李翱写的《复性书》，表面讲儒家心性，实际大量偷用佛教禅宗概念。这是儒学复兴的隐秘线索：正面打不过，就偷偷吸收对方武器。',
      peopleNotes: [
        { name: '韩愈', note: '唐代古文运动领袖，首倡"道统"说，排佛复儒，被贬潮州' },
      ],
      children: [],
    },
    {
      id: 's5', title: '宋明理学', year: 960, displayYear: '宋–明',
      chapter: 'spread', role: 'trunk',
      summary: '给儒学装上哲学引擎：从五经到四书，孔子从道德导师变成洞悉天理的先知',
      excerpt: '宋儒的任务很明确：给儒学装上哲学引擎。周敦颐《太极图说》让儒学终于有了创世记；二程提出"天理"；朱熹把《四书》编定，加上注解，提出"格物致知"。明朝王阳明推到极致："心外无物，心外无理"，"致良知"，"满街皆是圣人"。',
      peopleNotes: [
        { name: '朱熹', note: '南宋理学集大成者，编定《四书》并作注，此后六百年科举的标准答案' },
        { name: '王阳明', note: '明代心学宗师，倡"致良知""知行合一"，把儒学推向心学极致' },
      ],
      children: [
        {
          id: 'sishu', title: '四书：朱熹设计的修身路径', year: 1190, displayYear: '南宋',
          chapter: 'record', role: 'branch',
          summary: '《大学》→《中庸》→《论语》→《孟子》，由浅入深；共同宗旨：内圣外王',
          excerpt: '阅读顺序：《大学》→《中庸》→《论语》→《孟子》，是朱熹设计的由浅入深、循序渐进的修身路径。《大学》给出实践框架；《中庸》提供哲学依据；《论语》是本源准则；《孟子》拓展心性与政治理想。共同宗旨：内圣外王。',
          children: [],
        },
      ],
    },
    {
      id: 's6', title: '考据·八股·礼教', year: 1644, displayYear: '清',
      chapter: 'spread', role: 'trunk',
      summary: '乾嘉考据剥离附会只是学界暗流；八股把孔孟语录压成标准答题素材，礼教渗透基层',
      excerpt: '考题限定四书五经，行文强制遵守固定八股格式，要求"代圣贤立言"，一切义理必须恪守朱熹注解，严禁自创见解……被传播的孔子，成了稳定大一统王朝、驯化士人与百姓的标准化符号。',
      children: [],
    },
    {
      id: 's7', title: '打倒孔家店', year: 1840, displayYear: '1840–1919',
      chapter: 'spread', role: 'trunk',
      summary: '1905 年科举废除斩断制度载体；"打倒孔家店"打的是明清礼教，不是那个周游列国的孔子',
      excerpt: '当时知识分子全力抨击的，并不是春秋那个周游列国、提倡仁与民本的孔子本人；而是明清数百年被皇权不断改造、层层叠加之后的封建礼教。鲁迅写下《狂人日记》，控诉礼教"吃人"。',
      peopleNotes: [
        { name: '康有为', note: '清末维新派领袖，著《孔子改制考》，把孔子塑造成改革先驱以托古改制' },
      ],
      children: [],
    },
    {
      id: 's8', title: '两条道路', year: 1919, displayYear: '民国时期',
      chapter: 'spread', role: 'trunk',
      summary: '激进派主张全盘西化；熊十力、梁漱溟、冯友兰开创现代新儒学',
      excerpt: '此时被传播的孔子，分裂成了两个截然相反的形象：一边是禁锢人性的迂腐枷锁，一边是承载民族精神、等待重新发掘的文明源头。',
      children: [],
    },
    {
      id: 's9', title: '批林批孔', year: 1949, displayYear: '建国前三十年',
      chapter: 'spread', role: 'trunk',
      summary: '特定政治背景下的标签化："没落奴隶主阶级的代表"——又一次被当作舆论斗争的符号',
      excerpt: '在这套叙事中，孔子被标签化为"没落奴隶主阶级的代表"……这是特定时代政治需求塑造出来的孔子形象，是高度简化、工具化的解读，并不等同于纯粹的学术结论。',
      children: [],
    },
    {
      id: 's10', title: '国学复兴', year: 1978, displayYear: '1978–2026',
      chapter: 'spread', role: 'trunk',
      summary: '"两个孔子"的分离；成为中华民族传统文化的源头符号，同时保持理性反思',
      excerpt: '今天我们面对的，正是一个多重形象叠加的孔子：春秋真实的思想家、汉代的素王、宋明洞悉天理的圣人、近代"吃人"的礼教符号、当下中华文明的精神代表。被传播的孔子不是一个人，而是一个空心的容器——统治者装的是合法性，读书人装的是前途，理学家装的是哲学，革命者装的是罪状，当代人装的是文化自信。',
      children: [],
    },

    // ── 树梢 · 我接受的孔子 ─────────────────────────────
    {
      id: 'accept', title: '我接受的孔子', year: 2026, displayYear: '当下',
      chapter: 'accept', role: 'canopy',
      summary: '知其不可而为之的理想主义者；允许"人"有千万种活法的老师；会骂人、会哭、会自嘲的真人',
      excerpt: '我接受的孔子，是一个在礼崩乐坏的时代，知其不可而为之的理想主义者。是一个允许子路勇猛、允许子贡富有、允许颜回贫穷、允许冉有从政的老师——他相信"人"可以有千万种活法，但每一种活法都要对得起"人"这个字。他不是模子里刻出来的君子，他是活出来的自己。',
      quotes: [
        { text: '古之学者为己，今之学者为人', interpretation: '为充实自己而学，不为表演给别人看' },
        { text: '饭疏食饮水，曲肱而枕之，乐亦在其中矣', interpretation: '粗茶淡饭也能自得其乐——安贫乐道' },
        { text: '不怨天，不尤人', interpretation: '不抱怨天，不责怪人，韧性在自己身上' },
      ],
      children: [],
    },
    {
      id: 'echo', title: '如果孔子还活着', year: 2026, displayYear: '尾声',
      chapter: 'accept', role: 'canopy',
      summary: '"吾岂敢知？"——但两千年后，每个中国人心中都有一个属于自己的"孔子"',
      excerpt: '孔子在世时，没有人叫他"孔子"。但两千年后，每一个中国人心中，都有一个属于自己的"孔子"。这大概就是传播最本质的奇迹：不是声音传了多远，而是它在多少人的心里，激起了回声。',
      quotes: [
        { text: '为仁由己，而由人乎哉？', interpretation: '做仁德的事，靠自己，难道靠别人吗？' },
      ],
      children: [],
    },
  ],
};