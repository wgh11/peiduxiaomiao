/* ============ 陪读小喵 · paper: 每日论文精读 ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const core = PDM.core;

  /* ---------------------------------------------------------
     每日论文数据
     · 默认按「一年中的第几天 % 篇数」轮换，天然每天不同
     · 预留线上更新：把 papers/daily.json 放到站点根目录，
       结构同下方单篇（title / source / mins / sections / quiz），
       页面加载时会自动拉取并覆盖当天内容
     --------------------------------------------------------- */
  const PAPERS = [
    {
      id: 'rt2',
      title: 'RT-2：把机器人动作当成一种语言',
      source: 'Google DeepMind · 2023',
      mins: 8,
      sections: [
        { h: '一句话概括', p: 'RT-2 把「动作」也编码成 token，让一个在互联网图文上训好的视觉-语言模型，直接输出机器人该做的动作。' },
        { h: '关键做法', p: '把机械臂的连续动作离散成有限个动作 token，和文字 token 放进同一个词表。于是「看图 → 说话」的模型，自然学会了「看图 → 动手」。' },
        { h: '意义与局限', p: '最大价值是<span class="hl">把互联网知识迁移到机器人</span>，泛化明显变好；代价是推理慢、动作精度有限，而且仍需大量机器人示教数据。' }
      ],
      quiz: [
        { q: 'RT-2 把机器人动作表示成什么？', opts: ['连续的力矩值', '离散化的动作 token', '一段自然语言描述', '一张关键帧图片'], a: 1, exp: '动作被离散成 token，与文本共享同一个词表，这是它成立的前提。' },
        { q: 'RT-2 最主要的收益是？', opts: ['推理速度更快', '复用互联网视觉语言知识、泛化更好', '完全不需要机器人数据', '动作精度达到工业级'], a: 1, exp: 'VLM 预训练带来的语义理解，让新物体、新指令的泛化提升。' },
        { q: '下列哪一项不是 RT-2 的主要代价？', opts: ['推理较慢', '动作精度有限', '仍需机器人示教数据', '完全无法理解自然语言'], a: 3, exp: '它恰恰擅长理解自然语言指令，这不构成代价。' }
      ]
    },
    {
      id: 'openx',
      title: 'Open X-Embodiment：让机器人共享一份数据',
      source: '21 家机构联合 · 2023',
      mins: 7,
      sections: [
        { h: '要解决的问题', p: '每家实验室的机器人、数据格式、任务都不同，导致数据无法复用，模型很难泛化到新场景。' },
        { h: '做法', p: '把 22 种机器人、上百万条轨迹统一成一套格式（Open X-Embodiment），再训练 RT-X 系列模型，验证<span class="hl">跨本体正迁移</span>。' },
        { h: '结论与局限', p: '在别的机器人上学到的技能，能明显提升本体的成功率。局限在于不同形态之间差异仍然很大，统一格式只是第一步。' }
      ],
      quiz: [
        { q: 'Open X-Embodiment 解决的核心问题是？', opts: ['机器人硬件太贵', '数据格式与本体碎片化、无法复用', '模型参数太小', '缺少仿真环境'], a: 1, exp: '统一格式让跨机构、跨本体的数据可以先攒起来再训练。' },
        { q: '实验观察到的关键现象是？', opts: ['跨本体负迁移', '跨本体正迁移', '完全没有迁移', '必须同款机器人才有效'], a: 1, exp: '多本体数据合训，反而提升了单个本体的成功率。' },
        { q: '该工作的主要局限是？', opts: ['数据集规模太小', '不同机器人形态差异仍然很大', '只在仿真中验证', '没有开源'], a: 1, exp: '格式统一不等于能力通用，形态差异仍是难点。' }
      ]
    },
    {
      id: 'diffusion',
      title: 'Diffusion Policy：用扩散模型生成动作',
      source: 'Columbia / MIT · 2023',
      mins: 8,
      sections: [
        { h: '核心思路', p: '把「生成一段动作序列」当成「生成一张图」：用扩散模型从噪声一步步去噪，得到未来若干步的动作。' },
        { h: '为什么有效', p: '同一个场景往往有多种合理动作，扩散模型能表达这种<span class="hl">多模态分布</span>，而不是像回归那样把几种动作平均成一个「四不像」。' },
        { h: '代价', p: '多次去噪带来较高延迟，实时控制需要蒸馏或减少采样步数；对高频控制任务还要额外优化。' }
      ],
      quiz: [
        { q: 'Diffusion Policy 把动作生成类比成？', opts: ['图像分类', '图像生成的去噪过程', '文本翻译', '强化学习的价值迭代'], a: 1, exp: '动作序列被当作「图像」来去噪生成。' },
        { q: '相比直接回归，它的优势是？', opts: ['一定更快', '能表达多模态的动作分布', '不需要训练数据', '不需要视觉输入'], a: 1, exp: '多峰动作分布是回归容易失败、扩散擅长的地方。' },
        { q: '它的主要工程代价是？', opts: ['模型太小', '推理延迟较高', '无法处理视觉输入', '只能用于仿真'], a: 1, exp: '迭代去噪的采样成本高，实时性需要专门优化。' }
      ]
    },
    {
      id: 'pi0',
      title: 'π0：一个模型控制多种机器人',
      source: 'Physical Intelligence · 2024',
      mins: 9,
      sections: [
        { h: '目标', p: '用一个通用策略模型 π0，跨不同机器人本体、不同任务做统一控制，向「机器人基础模型」迈进。' },
        { h: '方法', p: '在 VLM 基础上加一个<span class="hl">流匹配</span>的动作专家头，输出连续动作块；用大规模跨本体数据预训练，再针对具体任务微调。' },
        { h: '看点与难点', p: '流匹配比扩散采样更快，更适合高频控制，同时保留预训练带来的语义泛化。难点仍是数据与硬件的碎片化。' }
      ],
      quiz: [
        { q: 'π0 的动作输出采用什么方式？', opts: ['离散 token 分类', '流匹配生成连续动作', '查表匹配', '传统 PID 控制'], a: 1, exp: '流匹配（flow matching）直接回归连续动作块。' },
        { q: '相比扩散策略，流匹配的优势之一是？', opts: ['采样更快', '完全不需要数据', '不需要视觉输入', '只能做单任务'], a: 0, exp: '更少的采样步数换来更低延迟。' },
        { q: 'π0 追求的方向是？', opts: ['专用单任务机器人', '跨本体的通用机器人基础模型', '纯仿真环境', '纯语音助手'], a: 1, exp: '它瞄准的是可跨本体复用的机器人基础模型。' }
      ]
    }
  ];

  /* ---------------- 今日选题 ---------------- */
  function dayIndex() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.floor((d - start) / 86400000);
  }

  let current = null;
  let currentLessonId = null;

  /* 每日论文只当天生成，跨天后错题本会找不到课程定义，
     因此把最近几天的课程缓存到本地，重新打开时注册回题库。 */
  const PKEY = 'peiduxiaomiao.paper.lessons.v1';

  function registerLesson(lesson) {
    const all = PDM.quiz.all || [];
    if (all.some(l => l.id === lesson.id)) return;
    PDM.quiz.addLesson(lesson);
  }

  function cacheLesson(lesson) {
    try {
      const arr = JSON.parse(localStorage.getItem(PKEY) || '[]');
      const list = Array.isArray(arr) ? arr : [];
      if (!list.some(l => l && l.id === lesson.id)) list.push(lesson);
      while (list.length > 14) list.shift();
      localStorage.setItem(PKEY, JSON.stringify(list));
    } catch (e) {}
  }

  function loadCached() {
    try {
      const arr = JSON.parse(localStorage.getItem(PKEY) || '[]');
      if (Array.isArray(arr)) arr.forEach(l => { if (l && l.id && l.quiz) registerLesson(l); });
    } catch (e) {}
  }

  function buildLesson(p, dateKey) {
    return {
      id: 'paper_' + p.id + '_' + dateKey,
      title: p.title,
      tag: '论文精读',
      domainId: 'ai',
      domainName: 'AI 科技',
      cards: p.sections.map(s => ({ h: s.h, p: s.p })),
      quiz: p.quiz
    };
  }

  function apply(p) {
    current = p;
    const lesson = buildLesson(p, core.dateKey());
    currentLessonId = lesson.id;
    registerLesson(lesson);
    cacheLesson(lesson);
    if (PDM.quiz.state.mode === 'map') PDM.quiz.render();
  }

  loadCached();
  apply(JSON.parse(JSON.stringify(PAPERS[dayIndex() % PAPERS.length])));

  /* ---------------- 视图 ---------------- */
  function cardHTML() {
    if (!current) return '';
    return '<button class="qz-daily" data-act="paper">' +
        '<div class="qzd-top"><span class="qzd-badge">今日论文</span><span class="qzd-min">约 ' + current.mins + ' 分钟</span></div>' +
        '<div class="qzd-title">' + current.title + '</div>' +
        '<div class="qzd-sub">' + current.source + ' · ' + current.sections.length + ' 段精读 + ' + current.quiz.length + ' 题</div>' +
        '<div class="qzd-go">开始今天的精读 →</div>' +
      '</button>';
  }

  function open() {
    if (!currentLessonId) return;
    PDM.quiz.open(currentLessonId);
  }

  /* ---------------- 预留：线上每日更新 ---------------- */
  function update(json) {
    if (json && json.title && json.sections && json.quiz) apply(json);
  }

  function sync() {
    try {
      fetch('papers/daily.json', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (data) update(data); })
        .catch(() => {});
    } catch (e) {}
  }
  sync();

  PDM.paper = { cardHTML: cardHTML, open: open, update: update, sync: sync, today: function () { return current; } };
})(window.PDM);
