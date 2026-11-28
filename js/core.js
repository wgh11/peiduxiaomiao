/* ============ 陪读小喵 · core data ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';

  const KEY = 'peiduxiaomiao.save.v1';

  /* ---------- date utils ---------- */
  function dateKey(d) {
    const x = d || new Date();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return x.getFullYear() + '-' + m + '-' + day;
  }
  function parseKey(k) {
    const p = k.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function addDays(k, n) {
    const d = parseKey(k);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }
  function daysBetween(a, b) {
    return Math.round((parseKey(b) - parseKey(a)) / 86400000);
  }
  function fmtMin(min) {
    if (!min) return '0';
    if (min < 60) return String(min);
    const h = Math.floor(min / 60), m = min % 60;
    return m ? h + ' 小时 ' + m + ' 分' : h + ' 小时';
  }
  function fmtClock(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  /* ---------- catalog ---------- */
  const SLOTS = [
    { id: 'wall', name: '墙面' },
    { id: 'window', name: '窗户' },
    { id: 'desk', name: '桌面' },
    { id: 'floor', name: '地面' },
    { id: 'ornament', name: '摆件' }
  ];

  const FURNITURE = [
    { id: 'w_photo', name: '照片墙', slot: 'wall', price: 40, desc: '三张拍立得，记录一起学习的日子' },
    { id: 'w_star', name: '星星灯串', slot: 'wall', price: 60, desc: '晚上开灯，整间小屋会暖暖的' },
    { id: 'w_neon', name: '加油霓虹灯', slot: 'wall', price: 90, desc: '粉粉的光，夜里写着「加油」' },
    { id: 'w_calendar', name: '手撕日历', slot: 'wall', price: 28, desc: '每天撕一页，离目标更近一点' },
    { id: 'w_clock', name: '蘑菇咕咕钟', slot: 'wall', price: 0, ad: true, fishCost: { jinli: 2 }, desc: '每到整点，蘑菇里会探出小鸟' },
    { id: 'w_poster', name: '猫咪海报', slot: 'wall', price: 30, desc: '小喵自己挑的，上面写着「加油」' },
    { id: 'wd_curtain', name: '奶油纱帘', slot: 'window', price: 35, desc: '风一吹就轻轻晃，很催眠' },
    { id: 'wd_sill', name: '窗台多肉', slot: 'window', price: 55, desc: '两盆小多肉，晒着太阳慢慢长' },
    { id: 'wd_chime', name: '海风风铃', slot: 'window', price: 75, desc: '晴天的时候会有很轻的响声' },
    { id: 'wd_sticker', name: '星空贴纸', slot: 'window', price: 25, desc: '夜里会发一点点光' },
    { id: 'd_lamp', name: '蘑菇小台灯', slot: 'desk', price: 30, desc: '专注时的暖光来源' },
    { id: 'd_pen', name: '彩虹笔筒', slot: 'desk', price: 25, desc: '笔都朝同一个方向，很整齐' },
    { id: 'd_jar', name: '小鱼干罐', slot: 'desk', price: 65, desc: '藏着舍不得吃的零食' },
    { id: 'd_cocoa', name: '热可可', slot: 'desk', price: 45, desc: '冬天必备，现在还有点烫' },
    { id: 'd_mug', name: '猫咪马克杯', slot: 'desk', price: 22, desc: '杯壁上有一只同款小喵' },
    { id: 'd_books', name: '一摞书', slot: 'desk', price: 48, desc: '最近在读的都堆在这里' },
    { id: 'd_foodbox', name: '小喵餐盒', slot: 'desk', price: 55, desc: '每天开饭前都会自己发出叮的一声' },
    { id: 'fl_rug', name: '甜甜圈地毯', slot: 'floor', price: 30, desc: '踩上去软软的，像甜甜圈' },
    { id: 'fl_bed', name: '云朵猫窝', slot: 'floor', price: 70, desc: '小喵累了就窝在这里打盹' },
    { id: 'fl_shelf', name: '小书架', slot: 'floor', price: 110, desc: '攒了很多书，最上层还空着' },
    { id: 'fl_cushion', name: '鱼鱼坐垫', slot: 'floor', price: 50, desc: '看起来很好吃，但它只是坐垫' },
    { id: 'fl_pouf', name: '针织坐墩', slot: 'floor', price: 42, desc: '软软的一团，靠着很舒服' },
    { id: 'o_plant', name: '小盆栽', slot: 'ornament', price: 25, desc: '每天都在偷偷长高一点点' },
    { id: 'o_maneki', name: '招财喵', slot: 'ornament', price: 0, ad: true, fishCost: { jinlong: 1 }, desc: '举着小爪子，祝你顺利上岸' },
    { id: 'o_globe', name: '星空地球仪', slot: 'ornament', price: 0, ad: true, fishCost: { hetun: 1, jinli: 1 }, desc: '晚上会亮起细碎的星座' },
    { id: 'o_yarn', name: '毛线球', slot: 'ornament', price: 20, desc: '滚到桌脚就再也找不到了' },
    { id: 'o_vase', name: '小陶瓶花', slot: 'ornament', price: 38, desc: '插着两朵不知名的小花' },
    { id: 'o_fishbowl', name: '会游泳的鱼缸', slot: 'ornament', price: 95, desc: '里面的小鱼会跟着小喵一起打瞌睡' },
    { id: 'o_starprojector', name: '星星投影仪', slot: 'ornament', price: 130, desc: '夜里把整面墙变成一小片星空' }
  ];

  const OUTFITS = [
    { id: 'default', name: '奶油小喵', price: 0, desc: '米白色的毛，配珊瑚色小项圈' },
    { id: 'pj', name: '云朵睡衣', price: 80, desc: '浅蓝条纹睡衣，还带一顶睡帽' },
    { id: 'academy', name: '学院风', price: 120, desc: '藏青外套配红色领结，今天很认真' },
    { id: 'festival', name: '节日限定', price: 0, ad: true, desc: '红围巾和毛球帽，冬季限定' },
    { id: 'raincoat', name: '雨天小雨衣', price: 100, desc: '下雨也要去窗边看云' },
    { id: 'chef', name: '小厨师', price: 140, desc: '今天的猫粮由主厨亲自监督' },
    { id: 'wizard', name: '星星魔法师', price: 180, desc: '把困意变成会发光的小星星' },
    { id: 'sailor', name: '学院风水手服', price: 110, desc: '白衣蓝领，红领结端端正正' },
    { id: 'matcha', name: '抹茶绞花毛衣', price: 95, desc: '软软的墨绿毛衣，像刚泡好的茶' },
    { id: 'dino', name: '小恐龙连体睡衣', price: 160, desc: '头上两只小角，走路一摇一摆' },
    { id: 'hoodie', name: '奶油卫衣', price: 130, desc: '口袋里好像还藏着一块饼干' },
    { id: 'cloak', name: '星空小斗篷', price: 180, desc: '披上就会变成夜里的一小片星空' }
  ];

  const FOODS = [
    { id: 'fish', name: '小鱼干', price: 8, amount: 1, desc: '最经典的陪读奖励，小喵一闻就跑过来' },
    { id: 'milk', name: '暖暖牛奶', price: 12, amount: 2, desc: '适合夜晚，喝完会舒服地眯起眼睛' },
    { id: 'cookie', name: '奶油小饼干', price: 15, amount: 2, desc: '学习告一段落时的甜甜奖励' }
  ];

  const ACCESSORIES = [
    { id: 'a_beret', name: '贝雷帽', slot: 'head', price: 45, how: 'shop', desc: '歪戴一点点，今天有点文艺' },
    { id: 'a_bearband', name: '小熊发箍', slot: 'head', how: 'streak7', cond: '连续打卡 7 天', desc: '两只小耳朵，走路会晃' },
    { id: 'a_gradcap', name: '学士帽', slot: 'head', how: 'level4', cond: '等级达到 Lv.4', desc: '为了那一天，先戴上试试' },
    { id: 'a_shades', name: '小墨镜', slot: 'head', how: 'activity', cond: '完成全部互动手册', desc: '小猫也有酷酷的时候' },
    { id: 'a_bucket', name: '奶油渔夫帽', slot: 'head', price: 50, how: 'shop', desc: '帽檐软软的，像刚烤好的面包' },
    { id: 'a_daisy', name: '小雏菊花环', slot: 'head', how: 'streak3', cond: '连续打卡 3 天', desc: '绕着耳朵一圈小小的白花' },
    { id: 'a_bow', name: '粉蝴蝶结', slot: 'head', price: 35, how: 'shop', desc: '轻轻一扎，整只猫都甜起来' },
    { id: 'a_bunny', name: '软萌兔耳发箍', slot: 'head', how: 'level3', cond: '等级达到 Lv.3', desc: '两只长耳朵会跟着步伐轻轻晃' },
    { id: 'a_scarf', name: '红格子围巾', slot: 'neck', price: 60, how: 'shop', desc: '冬天写题的时候最暖' },
    { id: 'a_bell', name: '铃铛项圈', slot: 'neck', how: 'dex5', cond: '鱼图鉴收集 5 种', desc: '走两步就叮当响' },
    { id: 'a_tie', name: '小领结', slot: 'neck', price: 40, how: 'shop', desc: '正式一点，但也只是一点点' },
    { id: 'a_pearl', name: '珍珠小项链', slot: 'neck', how: 'quiz5', cond: '通过 5 关刷题', desc: '三颗圆圆的小珍珠，很矜持' },
    { id: 'a_sunflower', name: '向日葵围兜', slot: 'neck', how: 'dex3', cond: '鱼图鉴收集 3 种', desc: '像把一小块阳光围在胸前' },
    { id: 'a_glasses', name: '圆框金丝眼镜', slot: 'charm', price: 70, how: 'shop', desc: '戴上就像在认真看书' },
    { id: 'a_wings', name: '小天使翅膀', slot: 'charm', how: 'level5', cond: '等级达到 Lv.5', desc: '软软的、小小的，会轻轻扑动' },
    { id: 'a_bag', name: '迷你小书包', slot: 'charm', how: 'quiz1', cond: '通过 1 关刷题', desc: '刚好能装下一本练习本' }
  ];

  const ROOM_THEMES = [
    { id: 'sunny', name: '晴日木屋', price: 0, desc: '默认的小屋，午后阳光刚好' },
    { id: 'rainy', name: '雨夜窗台', price: 180, desc: '窗外落着雨，台灯是暖黄的' },
    { id: 'sakura', name: '樱花书房', price: 0, streak: 14, desc: '连续打卡 14 天解锁，窗外会飘樱花' }
  ];

  const CAT_HOUSE_TIERS = [
    { tier: 0, name: '纸箱猫屋', desc: '小喵最初的小家，装得下它和一条毯子。', level: 1, furniture: 0, intimacy: 0 },
    { tier: 1, name: '原木双层', desc: '多了一层小阁楼和更软的垫子。', level: 3, furniture: 8, intimacy: 20 },
    { tier: 2, name: '阳光花房', desc: '玻璃花房、晒太阳的窗台，还有几盆猫草。', level: 5, furniture: 16, intimacy: 50 }
  ];

  // 猫咪陪伴图鉴：把“看到猫做什么”本身变成可回看的收藏内容
  const ACTIVITIES = [
    { id: 'pet', icon: '♡', name: '蹭蹭手心', desc: '点击小喵摸摸它，短暂进入呼噜状态。' },
    { id: 'feed', icon: '◌', name: '开饭时间', desc: '用猫粮投喂，小喵会走到餐盒边慢慢吃。' },
    { id: 'play', icon: '✦', name: '追毛线球', desc: '点击毛线球，让小喵跑过去玩一会儿。' },
    { id: 'focus', icon: '▤', name: '安静陪读', desc: '开始专注后，小喵会靠近书桌陪你学习。' },
    { id: 'nap', icon: '☾', name: '午后打盹', desc: '离开一会儿，小喵会在猫窝里睡着。' },
    { id: 'fish', icon: '≈', name: '鱼塘收杆', desc: '专注结束后去鱼塘，收集不同稀有度的鱼。' },
    { id: 'dress', icon: '◇', name: '今日换装', desc: '在衣橱里换上不同服装，陪读状态也会改变。' },
    { id: 'room', icon: '□', name: '布置小屋', desc: '调整家具位置，给小喵留一块舒服的活动空间。' }
  ];

  const COMICS = [
    {
      id: 'c1', title: '第一次见面', sub: '它从纸箱里探出头', req: 0, color: '#F3C9A8', prop: 'box',
      panels: [
        '下雨的傍晚，我在自习室门口捡到一个纸箱。<b>里面有一团会呼吸的毛。</b>',
        '它抬起头看我，眼睛圆圆的，像在问：你也要学习吗？',
        '从那天起，我的桌上多了一只小猫，和一条叫「专注」的约定。'
      ]
    },
    {
      id: 'c2', title: '半夜的小鱼干', sub: '罐子为什么会自己响', req: 60, color: '#F6DCA4', prop: 'jar',
      panels: [
        '凌晨一点，厨房传来「咔哒」一声。我打开灯，只看见一只假装睡觉的猫。',
        '小鱼干罐的盖子歪着，地板上还有半条没吃完的。',
        '「明天开始，专心的时候才可以吃。」它居然很认真地点了点头。'
      ]
    },
    {
      id: 'c3', title: '雨天的伞', sub: '今天不想出门', req: 150, color: '#BFD9E6', prop: 'umbrella',
      panels: [
        '雨下得很大，我把书摊开又合上，怎么都学不进去。',
        '小喵叼来一把小小的伞，放在我手边，然后坐进我的外套里。',
        '那天我们谁也没说话，只是听着雨，把一页一页慢慢读完。'
      ]
    },
    {
      id: 'c4', title: '考前的加油', sub: '它比我还紧张', req: 240, color: '#F2B7A6', prop: 'flag',
      panels: [
        '考试前一晚，我把重点抄了三遍，手都在抖。',
        '小喵搬来一块小牌子，上面歪歪扭扭写着「你可以的」。',
        '它把爪子搭在我手背上，于是我又把第四遍抄完了。'
      ]
    },
    {
      id: 'c5', title: '一起看星星', sub: '屋顶上的十分钟', req: 360, color: '#AFBFD8', prop: 'stars',
      panels: [
        '今天终于按时完成计划。小喵把我拽到窗边，指着外面。',
        '城市的灯太亮了，其实看不到几颗星星，但我们还是看了很久。',
        '「明天也一起。」它说。我说好。'
      ]
    },
    {
      id: 'c6', title: '小店的第一天', sub: '番外 · 如果它可以开店', req: 500, color: '#F6CDA0', prop: 'shop',
      panels: [
        '小喵在街角开了一家很小的店，卖热可可和借书卡。',
        '第一位客人是一个考研的女生，它把最亮的台灯让给了她。',
        '打烊的时候它说：今天也有人好好学习了，真好。'
      ]
    }
  ];

  const LEVELS = [
    { name: '初识', min: 0 },
    { name: '熟悉', min: 30 },
    { name: '黏人', min: 90 },
    { name: '默契', min: 180 },
    { name: '守护', min: 300 },
    { name: '家人', min: 480 },
    { name: '心有灵犀', min: 720 },
    { name: '永远陪读', min: 1000 }
  ];

  /* ---------- fishing ---------- */
  const FISHING = {
    castsPerBreak: 3,
    dailySnackCap: 10,
    gear: [
      { id: 'rod', name: '结实钓竿', price: 60, desc: '普通鱼会再给一次机会，更容易碰上稀有鱼' },
      { id: 'lamp', name: '暖光夜灯', price: 120, desc: '挂在船头，稀有和传说鱼更容易靠近' }
    ]
  };

  const RARITY = {
    common: { name: '普通', level: 0, color: '#8C9A88' },
    rare: { name: '稀有', level: 1, color: '#5E8FA8' },
    epic: { name: '史诗', level: 2, color: '#8E6FA8' },
    legend: { name: '传说', level: 3, color: '#D79A3E' }
  };

  const FISH = [
    { id: 'baitiao', name: '白条', rarity: 'common', snacks: 1, weight: 26, color: '#B9CBD4', desc: '最常见的小银鱼' },
    { id: 'jiyu', name: '鲫鱼', rarity: 'common', snacks: 2, weight: 24, color: '#A8B79B', desc: '稳稳当当的一条' },
    { id: 'liyu', name: '鲤鱼', rarity: 'common', snacks: 2, weight: 18, color: '#E2A56B', desc: '尾巴很有力气' },
    { id: 'xiaolongxia', name: '小龙虾', rarity: 'common', snacks: 2, weight: 12, color: '#D97B5A', desc: '举着钳子不肯松手' },
    { id: 'guiyu', name: '鳜鱼', rarity: 'rare', snacks: 3, weight: 9, color: '#8FA98B', desc: '花纹漂亮的贵客' },
    { id: 'luyu', name: '鲈鱼', rarity: 'rare', snacks: 3, weight: 5, color: '#93B7BE', desc: '月光下闪着银光' },
    { id: 'jinli', name: '锦鲤', rarity: 'rare', snacks: 4, weight: 3, color: '#F09A63', desc: '据说会带来好运' },
    { id: 'hetun', name: '河豚', rarity: 'epic', snacks: 5, weight: 1.8, color: '#E8C56B', desc: '气鼓鼓的圆球' },
    { id: 'jinlong', name: '金龙鱼', rarity: 'legend', snacks: 10, weight: 0.7, color: '#F4C04F', desc: '鱼塘里的传说' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first', name: '第一次陪读', desc: '完成 1 次专注', goal: 1, val: s => s.sessions.length },
    { id: 'hour1', name: '一小时的陪伴', desc: '累计专注 60 分钟', goal: 60, val: s => s.growth },
    { id: 'hour5', name: '一下午的专注', desc: '累计专注 300 分钟', goal: 300, val: s => s.growth },
    { id: 'streak3', name: '三日之约', desc: '连续打卡 3 天', goal: 3, val: s => s.bestStreak || 0 },
    { id: 'streak7', name: '七日默契', desc: '连续打卡 7 天', goal: 7, val: s => s.bestStreak || 0 },
    { id: 'furn5', name: '小有所成', desc: '拥有 5 件家具', goal: 5, val: s => s.owned.length },
    { id: 'furn12', name: '温馨小屋', desc: '拥有 12 件家具', goal: 12, val: s => s.owned.length },
    { id: 'furn20', name: '满屋都是你', desc: '集齐 20 件家具', goal: 20, val: s => s.owned.length },
    { id: 'outfit3', name: '衣橱初开', desc: '拥有 3 套服装', goal: 3, val: s => s.ownedOutfits.length },
    { id: 'comic1', name: '故事读者', desc: '读完 1 篇番外', goal: 1, val: s => s.comicsRead.length },
    { id: 'comic6', name: '故事收藏家', desc: '读完 6 篇番外', goal: 6, val: s => s.comicsRead.length },
    { id: 'allcat', name: '满屋都是故事', desc: '集齐全部 42 件收藏', goal: 42, val: s => s.owned.length + s.ownedOutfits.length + s.comics.length }
  ];

  /* ---------- state ---------- */
  function defaultFishing() {
    return {
      breakReady: false,   // 本轮专注结束后是否可以去鱼塘
      granted: false,      // 本轮专注是否已经发过休息资格
      castsLeft: 0,        // 本轮休息还剩几杆
      bag: {},             // 鱼篓：{ 鱼种 id: 数量 }
      caught: {},           // 图鉴累计捕获：兑换后仍保留记录
      day: dateKey(),
      exchanged: 0,        // 今天已兑换的小鱼干
      gear: { rod: false, lamp: false },
      totalFish: 0,
      totalSnacks: 0
    };
  }

  function defaultState() {
    return {
      v: 1,
      fish: 40,
      snacks: 0,
      foods: { fish: 0, milk: 0, cookie: 0 },
      growth: 0,
      checkins: [],
      sessions: [],
      owned: ['fl_rug', 'd_lamp', 'w_poster'],
      equipped: { wall: 'w_poster', window: null, desk: 'd_lamp', floor: 'fl_rug', ornament: null },
      layout: {},
      ownedOutfits: ['default'],
      outfit: 'default',
      accessories: { owned: [], head: null, neck: null, charm: null },
      themes: ['sunny'],
      roomTheme: 'sunny',
      catHouse: { tier: 1, rot: 0.34 },
      comics: ['c1'],
      comicsRead: [],
      achievements: [],
      adUnlocks: [],
      bestStreak: 0,
      streakAwards: [],
      makeupUsed: '',
      settings: { speed: 1, speedSet: false, welcomeDone: false, studyMode: 'free', breakRemind: true, lastTag: '阅读' },
      fishing: defaultFishing(),
      events: [],
      created: new Date().toISOString()
    };
  }

  let memory = null;
  let state = defaultState();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(defaultState(), parsed);
        state.settings = Object.assign({ speed: 1, speedSet: false, welcomeDone: false, breakRemind: true, lastTag: '阅读' }, parsed.settings || {});
        // 旧存档默认值曾为 ×60，未手动切换过的统一回到真实计时
        if (!state.settings.speedSet) state.settings.speed = 1;
        if (!state.settings.studyMode) state.settings.studyMode = 'free';
        if (typeof state.snacks !== 'number' || state.snacks < 0) state.snacks = 0;
        state.foods = Object.assign({ fish: 0, milk: 0, cookie: 0 }, parsed.foods || {});
        state.accessories = Object.assign({ owned: [], head: null, neck: null, charm: null }, parsed.accessories || {});
        state.accessories.owned = Array.isArray(state.accessories.owned) ? state.accessories.owned.filter(id => ACCESSORIES.some(a => a.id === id)) : [];
        state.accessories.head = ACCESSORIES.some(a => a.id === state.accessories.head && a.slot === 'head') ? state.accessories.head : null;
        state.accessories.neck = ACCESSORIES.some(a => a.id === state.accessories.neck && a.slot === 'neck') ? state.accessories.neck : null;
        state.accessories.charm = ACCESSORIES.some(a => a.id === state.accessories.charm && a.slot === 'charm') ? state.accessories.charm : null;
        state.themes = Array.isArray(parsed.themes) ? parsed.themes.filter(id => ROOM_THEMES.some(t => t.id === id)) : ['sunny'];
        if (state.themes.indexOf('sunny') < 0) state.themes.unshift('sunny');
        state.roomTheme = ROOM_THEMES.some(t => t.id === parsed.roomTheme && state.themes.indexOf(t.id) >= 0) ? parsed.roomTheme : 'sunny';
        state.catHouse = Object.assign({ tier: 1, rot: 0.34 }, parsed.catHouse || {});
        state.catHouse.tier = Math.max(1, Math.min(2, Number(state.catHouse.tier) || 1));
        state.catHouse.rot = Number.isFinite(Number(state.catHouse.rot)) ? Number(state.catHouse.rot) : 0.34;
        state.equipped = Object.assign({ wall: null, window: null, desk: null, floor: null, ornament: null }, parsed.equipped || {});
        state.layout = (parsed.layout && typeof parsed.layout === 'object' && !Array.isArray(parsed.layout)) ? parsed.layout : {};
        // 钓鱼存档迁移
        const f = (parsed.fishing && typeof parsed.fishing === 'object' && !Array.isArray(parsed.fishing)) ? parsed.fishing : {};
        state.fishing = Object.assign(defaultFishing(), f);
        state.fishing.gear = Object.assign({ rod: false, lamp: false }, f.gear || {});
        const safeInt = (v, d, max) => {
          const n = Math.floor(Number(v));
          if (!isFinite(n) || n < 0) return d;
          return max != null ? Math.min(max, n) : n;
        };
        const bag = (f.bag && typeof f.bag === 'object' && !Array.isArray(f.bag)) ? f.bag : {};
        state.fishing.bag = {};
        state.fishing.caught = {};
        FISH.forEach(sp => {
          const n = safeInt(bag[sp.id], 0);
          if (n > 0) state.fishing.bag[sp.id] = n;
          const caught = safeInt((f.caught || {})[sp.id], 0);
          if (caught > 0) state.fishing.caught[sp.id] = caught;
        });
        // 旧存档里的 raw 按 1 条白条折算，保证鱼获不丢
        const legacyRaw = safeInt(f.raw, 0);
        if (legacyRaw > 0) {
          state.fishing.bag.baitiao = (state.fishing.bag.baitiao || 0) + legacyRaw;
          state.fishing.caught.baitiao = (state.fishing.caught.baitiao || 0) + legacyRaw;
        }
        state.fishing.castsLeft = safeInt(state.fishing.castsLeft, 0, FISHING.castsPerBreak);
        state.fishing.exchanged = safeInt(state.fishing.exchanged, 0, FISHING.dailySnackCap);
        state.fishing.totalFish = safeInt(state.fishing.totalFish, 0);
        state.fishing.totalSnacks = safeInt(state.fishing.totalSnacks, 0);
        state.fishing.breakReady = !!state.fishing.breakReady;
        state.fishing.granted = !!state.fishing.granted;
        state.fishing.gear.rod = !!state.fishing.gear.rod;
        state.fishing.gear.lamp = !!state.fishing.gear.lamp;
        const today = dateKey();
        if (state.fishing.day !== today) {
          state.fishing.day = today;
          state.fishing.exchanged = 0;
        }
      }
    } catch (e) {
      memory = memory || state;
    }
    syncComicUnlocks(false);
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      memory = state;
    }
  }

  function reset() {
    state = defaultState();
    try { localStorage.removeItem(KEY); } catch (e) {}
    save();
    return state;
  }

  /* ---------- derived ---------- */
  function levelInfo(growth) {
    const g = growth == null ? state.growth : growth;
    let idx = 0;
    for (let i = 0; i < LEVELS.length; i++) if (g >= LEVELS[i].min) idx = i;
    const cur = LEVELS[idx];
    const next = LEVELS[idx + 1] || null;
    return {
      level: idx + 1,
      name: cur.name,
      min: cur.min,
      next: next ? next.min : null,
      nextName: next ? next.name : null,
      progress: next ? (g - cur.min) / (next.min - cur.min) : 1
    };
  }

  function uniqueCheckins(s) {
    return Array.from(new Set(s.checkins)).sort();
  }

  function computeStreak(s, endKey) {
    const set = new Set(s.checkins);
    const today = dateKey();
    let end = endKey;
    if (!end) {
      if (set.has(today)) end = today;
      else if (set.has(addDays(today, -1))) end = addDays(today, -1);
      else return 0;
    }
    let n = 0, k = end;
    while (set.has(k)) { n++; k = addDays(k, -1); }
    return n;
  }

  function bestStreak(s) {
    const days = uniqueCheckins(s);
    let best = 0, run = 0, prev = null;
    days.forEach(k => {
      if (prev && daysBetween(prev, k) === 1) run++; else run = 1;
      prev = k;
      if (run > best) best = run;
    });
    return best;
  }

  function isOwned(id) {
    return state.owned.indexOf(id) >= 0;
  }
  function isAdItem(id) {
    const f = FURNITURE.find(x => x.id === id);
    return !!(f && f.ad);
  }
  function itemById(id) { return FURNITURE.find(x => x.id === id) || null; }
  function outfitById(id) { return OUTFITS.find(x => x.id === id) || null; }
  function comicById(id) { return COMICS.find(x => x.id === id) || null; }

  function equippedTitle(slotId) {
    return state.equipped[slotId] || null;
  }

  /* ---------- log ---------- */
  function logEvent(type, data) {
    state.events.push({ t: Date.now(), d: dateKey(), type: type, data: data || null });
    if (state.events.length > 400) state.events = state.events.slice(-400);
    // 在微信 web-view 中把关键事件交给原生壳；浏览器仍只保留本地记录。
    if (PDM.wxBridge && PDM.wxBridge.log) {
      PDM.wxBridge.log({ type: type, data: data || null, at: Date.now() });
    }
  }

  function eventStats() {
    const ev = state.events;
    const count = t => ev.filter(e => e.type === t).length;
    const opens = ev.filter(e => e.type === 'open');
    const openDays = Array.from(new Set(opens.map(e => e.d))).sort();
    let returned = 0;
    for (let i = 1; i < openDays.length; i++) {
      if (daysBetween(openDays[i - 1], openDays[i]) === 1) returned++;
    }
    const starts = count('focus_start');
    const completes = count('focus_complete');
    return {
      opens: opens.length,
      openDays: openDays.length,
      starts: starts,
      completes: completes,
      completionRate: starts ? Math.round(completes / starts * 100) : 0,
      adClicks: count('ad_click'),
      adCompletes: count('ad_complete'),
      buys: count('buy'),
      shares: count('share'),
      nextDayReturn: openDays.length > 1 ? Math.round(returned / (openDays.length - 1) * 100) : 0,
      recent: ev.slice(-12).reverse()
    };
  }

  function completeActivity(id) {
    if (!ACTIVITIES.some(a => a.id === id)) return false;
    const done = state.events.some(e => e.type === 'activity_complete' && e.data && e.data.id === id);
    if (done) return false;
    logEvent('activity_complete', { id: id });
    state.fish += 2;
    save();
    return true;
  }

  function activityInfo() {
    return ACTIVITIES.map(def => {
      const done = state.events.some(e => e.type === 'activity_complete' && e.data && e.data.id === def.id);
      return { def: Object.assign({}, def, { reward: 2 }), done: done };
    });
  }

  /* ---------- economy ---------- */
  function buyItem(id) {
    const item = itemById(id);
    if (!item || isOwned(id)) return { ok: false, reason: 'owned' };
    if (state.fish < item.price) return { ok: false, reason: 'fish' };
    state.fish -= item.price;
    state.owned.push(id);
    // auto equip if the slot is empty
    if (!state.equipped[item.slot]) state.equipped[item.slot] = id;
    logEvent('buy', { id: id, price: item.price });
    save();
    return { ok: true, item: item, autoEquipped: state.equipped[item.slot] === id };
  }

  function grantItem(id, via) {
    if (isOwned(id)) return false;
    state.owned.push(id);
    if (via === 'ad') state.adUnlocks.push(id);
    const item = itemById(id);
    if (item && !state.equipped[item.slot]) state.equipped[item.slot] = id;
    logEvent('unlock_item', { id: id, via: via });
    save();
    return true;
  }

  function buyOutfit(id) {
    const o = outfitById(id);
    if (!o || state.ownedOutfits.indexOf(id) >= 0) return { ok: false, reason: 'owned' };
    if (o.ad) return { ok: false, reason: 'ad' };
    if (state.fish < o.price) return { ok: false, reason: 'fish' };
    state.fish -= o.price;
    state.ownedOutfits.push(id);
    logEvent('buy_outfit', { id: id, price: o.price });
    save();
    return { ok: true, outfit: o };
  }

  function grantOutfit(id, via) {
    if (state.ownedOutfits.indexOf(id) >= 0) return false;
    state.ownedOutfits.push(id);
    logEvent('unlock_outfit', { id: id, via: via || 'ad' });
    save();
    return true;
  }

  function accessoryById(id) { return ACCESSORIES.find(a => a.id === id) || null; }

  function accessoryUnlockable(a) {
    if (!a) return false;
    if (a.how === 'shop') return true;
    const level = levelInfo().level;
    const streak = computeStreak(state);
    if (a.how === 'level3') return level >= 3;
    if (a.how === 'level4') return level >= 4;
    if (a.how === 'level5') return level >= 5;
    if (a.how === 'streak3') return streak >= 3;
    if (a.how === 'streak7') return streak >= 7;
    if (a.how === 'quiz1') return state.sessions.length > 0;
    if (a.how === 'quiz5') return state.sessions.length >= 5;
    if (a.how === 'activity') return (state.events || []).some(e => e.type === 'activity_all');
    if (a.how === 'dex3' || a.how === 'dex5') {
      const n = bagCount();
      return n >= Number(a.how.slice(3));
    }
    return false;
  }

  function buyAccessory(id) {
    const a = accessoryById(id);
    if (!a || a.how !== 'shop') return { ok: false, reason: 'locked' };
    if (state.accessories.owned.indexOf(id) >= 0) return { ok: false, reason: 'owned' };
    if (state.fish < a.price) return { ok: false, reason: 'fish' };
    state.fish -= a.price;
    state.accessories.owned.push(id);
    logEvent('buy_accessory', { id: id, price: a.price });
    save();
    return { ok: true, accessory: a };
  }

  function toggleAccessory(id) {
    const a = accessoryById(id);
    if (!a) return { ok: false, reason: 'none' };
    if (state.accessories.owned.indexOf(id) < 0) {
      const bought = buyAccessory(id);
      if (!bought.ok) return bought;
    }
    state.accessories[a.slot] = state.accessories[a.slot] === id ? null : id;
    logEvent('accessory', { id: id, slot: a.slot, on: state.accessories[a.slot] === id });
    save();
    return { ok: true, accessory: a, on: state.accessories[a.slot] === id };
  }

  function themeById(id) { return ROOM_THEMES.find(t => t.id === id) || null; }

  function setTheme(id) {
    const t = themeById(id);
    if (!t || state.themes.indexOf(id) < 0) return false;
    state.roomTheme = id;
    logEvent('room_theme', { id: id });
    save();
    return true;
  }

  function catHouseInfo() {
    const tier = Math.max(1, Math.min(CAT_HOUSE_TIERS.length - 1, Number(state.catHouse && state.catHouse.tier) || 1));
    const current = CAT_HOUSE_TIERS[tier];
    const next = CAT_HOUSE_TIERS[tier + 1] || null;
    const lv = levelInfo().level;
    const canUpgrade = !!next && lv >= next.level && state.owned.length >= next.furniture && state.growth >= next.intimacy;
    return { tier: tier, current: current, next: next, canUpgrade: canUpgrade, level: lv, furniture: state.owned.length, intimacy: state.growth };
  }

  function upgradeCatHouse() {
    const info = catHouseInfo();
    if (!info.next) return { ok: false, reason: 'max', info: info };
    if (!info.canUpgrade) return { ok: false, reason: 'locked', info: info };
    state.catHouse.tier = info.next.tier;
    logEvent('cat_house_upgrade', { tier: state.catHouse.tier });
    save();
    return { ok: true, tier: state.catHouse.tier, info: catHouseInfo() };
  }

  function buyTheme(id) {
    const t = themeById(id);
    if (!t || state.themes.indexOf(id) >= 0) return { ok: false, reason: 'owned' };
    if (t.streak && computeStreak(state) < t.streak) return { ok: false, reason: 'locked' };
    if (state.fish < t.price) return { ok: false, reason: 'fish' };
    state.fish -= t.price;
    state.themes.push(id);
    state.roomTheme = id;
    logEvent('buy_theme', { id: id, price: t.price });
    save();
    return { ok: true, theme: t };
  }

  function equipItem(id) {
    const item = itemById(id);
    if (!item || !isOwned(id)) return false;
    state.equipped[item.slot] = state.equipped[item.slot] === id ? null : id;
    logEvent('equip', { id: id, on: state.equipped[item.slot] === id });
    save();
    return true;
  }

  /* ---------- free layout ---------- */
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }
  function isPlaced(id) {
    return !!(state.layout && state.layout[id]);
  }
  // x / y 为 0~1 归一化坐标，k 为相对 u 的缩放，rot 为 90° 步进朝向
  function normalizeRot(v) {
    return ((Math.round(Number(v) / 90) * 90) % 360 + 360) % 360;
  }
  function setPlacement(id, x, y, k, opts) {
    const item = itemById(id);
    if (!item || !isOwned(id)) return false;
    const prev = state.layout[id] || {};
    state.layout[id] = {
      x: clamp01(Number(x)),
      y: clamp01(Number(y)),
      k: k != null ? Math.max(0.35, Math.min(1.8, Number(k))) : (prev.k || 1),
      rot: opts && opts.rot != null ? normalizeRot(opts.rot) : (prev.rot || 0)
    };
    // 兼容旧逻辑：同格最后摆放的视为 equipped
    state.equipped[item.slot] = id;
    if (!opts || opts.save !== false) save();
    return true;
  }
  function placeItem(id, x, y, k) {
    return setPlacement(id, x, y, k);
  }
  function rotateItem(id, step) {
    if (!state.layout || !state.layout[id]) return null;
    const rot = normalizeRot((state.layout[id].rot || 0) + (step || 90));
    state.layout[id].rot = rot;
    save();
    return rot;
  }
  function unplaceItem(id) {
    const item = itemById(id);
    if (!item || !state.layout[id]) return false;
    delete state.layout[id];
    if (state.equipped[item.slot] === id) {
      const alt = Object.keys(state.layout).find(k => {
        const it = itemById(k);
        return it && it.slot === item.slot;
      });
      state.equipped[item.slot] = alt || null;
    }
    save();
    return true;
  }
  // 渲染时给旧存档补坐标（静默写入一次）
  function ensurePlacement(id, x, y, k) {
    if (!state.layout || state.layout[id]) return;
    state.layout[id] = { x: clamp01(Number(x)), y: clamp01(Number(y)), k: k || 1, rot: 0 };
    save();
  }

  function setOutfit(id) {
    if (state.ownedOutfits.indexOf(id) < 0) return false;
    state.outfit = id;
    logEvent('outfit', { id: id });
    save();
    return true;
  }

  function syncComicUnlocks(announce) {
    const added = [];
    COMICS.forEach(c => {
      if (state.comics.indexOf(c.id) < 0 && state.growth >= c.req) {
        state.comics.push(c.id);
        added.push(c);
      }
    });
    if (added.length) {
      added.forEach(c => logEvent('comic_unlock', { id: c.id }));
      save();
    }
    return announce ? added : [];
  }

  function grantComic(id, via) {
    if (state.comics.indexOf(id) >= 0) return false;
    state.comics.push(id);
    logEvent('comic_unlock', { id: id, via: via || 'ad' });
    save();
    return true;
  }

  function nextLockedComic() {
    return COMICS.find(c => state.comics.indexOf(c.id) < 0) || null;
  }

  function markComicRead(id) {
    if (state.comicsRead.indexOf(id) < 0) {
      state.comicsRead.push(id);
      logEvent('comic_read', { id: id });
      completeActivity('comic');
      save();
    }
  }

  function checkAchievements() {
    const done = [];
    ACHIEVEMENTS.forEach(a => {
      const cur = Math.min(a.goal, a.val(state) || 0);
      if (cur >= a.goal && state.achievements.indexOf(a.id) < 0) {
        state.achievements.push(a.id);
        done.push(a);
      }
    });
    if (done.length) {
      done.forEach(a => logEvent('achievement', { id: a.id }));
      save();
    }
    return done;
  }

  function achievementInfo() {
    return ACHIEVEMENTS.map(a => {
      const cur = Math.min(a.goal, a.val(state) || 0);
      return { def: a, cur: cur, done: cur >= a.goal, awarded: state.achievements.indexOf(a.id) >= 0 };
    });
  }

  /* ---------- sessions ---------- */
  function commitSession(opts) {
    const minutes = Math.max(0, Math.floor(opts.minutes || 0));
    const awaySec = Math.max(0, Math.floor(opts.awaySec || 0));
    const today = dateKey();
    const beforeLevel = levelInfo();
    const hadToday = state.checkins.indexOf(today) >= 0;
    const streakBefore = computeStreak(state);
    const firstToday = !hadToday;

    const base = minutes;
    let first = 0, s3 = 0, s7 = 0;

    state.sessions.push({
      date: today,
      minutes: minutes,
      away: awaySec,
      tag: opts.tag || '',
      at: Date.now(),
      completed: !!opts.completed
    });

    if (minutes > 0) {
      if (!hadToday) state.checkins.push(today);
      // streak award bookkeeping: reset milestones if streak broke
      if (hadToday) {
        // same-day extra session: keep awards
      } else {
        const prev = streakBefore > 0 && state.checkins.indexOf(addDays(today, -1)) >= 0;
        if (!prev) state.streakAwards = [];
      }
      if (firstToday) first = 5;
    }

    const streak = computeStreak(state);
    if (streak >= 3 && state.streakAwards.indexOf(3) < 0) { s3 = 10; state.streakAwards.push(3); }
    const milestones = state.streakAwards.slice();
    if (streak >= 7 && milestones.indexOf(7) < 0) { s7 = 20; state.streakAwards.push(7); }

    const total = base + first + s3 + s7;
    state.fish += total;
    state.growth += minutes;
    if (streak > state.bestStreak) state.bestStreak = streak;

    const levelAfter = levelInfo();
    const newComics = syncComicUnlocks(false);
    const newAch = checkAchievements();

    logEvent(opts.completed ? 'focus_complete' : 'focus_partial', {
      minutes: minutes, away: awaySec, total: total, streak: streak, tag: opts.tag || ''
    });
    save();

    return {
      minutes: minutes,
      base: base,
      first: first,
      s3: s3,
      s7: s7,
      total: total,
      awaySec: awaySec,
      streak: streak,
      firstToday: firstToday,
      levelBefore: beforeLevel,
      levelAfter: levelAfter,
      levelUp: levelAfter.level > beforeLevel.level,
      newComics: newComics,
      achievements: newAch
    };
  }

  function addBonusFish(amount, reason) {
    state.fish += Math.max(0, Math.round(amount));
    logEvent('bonus_fish', { amount: amount, reason: reason || '' });
    save();
  }

  function addSnack(n) {
    state.snacks = Math.max(0, (state.snacks || 0) + (n == null ? 1 : n));
    save();
    return state.snacks;
  }

  function useSnack() {
    if (!state.snacks || state.snacks <= 0) return false;
    state.snacks -= 1;
    save();
    return true;
  }

  function buyFood(id) {
    const food = FOODS.find(x => x.id === id);
    if (!food) return { ok: false, reason: 'none' };
    if (state.fish < food.price) return { ok: false, reason: 'fish' };
    state.fish -= food.price;
    state.snacks = Math.max(0, (state.snacks || 0) + food.amount);
    state.foods[id] = Math.max(0, (state.foods[id] || 0) + food.amount);
    logEvent('buy_food', { id: id, amount: food.amount, price: food.price });
    save();
    return { ok: true, food: food };
  }

  function useFood() {
    const id = FOODS.find(x => (state.foods[x.id] || 0) > 0)?.id;
    if (!id) return useSnack();
    state.foods[id] -= 1;
    state.snacks = Math.max(0, (state.snacks || 0) - 1);
    save();
    return id;
  }

  /* ---------- fishing ---------- */
  function fishDaily() {
    const f = state.fishing;
    const today = dateKey();
    if (f.day !== today) {
      f.day = today;
      f.exchanged = 0;
      save();
    }
    return {
      used: f.exchanged,
      cap: FISHING.dailySnackCap,
      left: Math.max(0, FISHING.dailySnackCap - f.exchanged)
    };
  }

  // 暂停 / 提前结束时给一次休息资格；一轮专注只发一次
  function startBreak() {
    const f = state.fishing;
    if (f.granted) return false;
    f.granted = true;
    f.breakReady = true;
    f.castsLeft = FISHING.castsPerBreak;
    logEvent('rest_start', { casts: f.castsLeft });
    save();
    return true;
  }

  // 收竿回家 / 兑换完成后结束这次休息
  function endBreak() {
    const f = state.fishing;
    if (!f.breakReady && !f.castsLeft) return false;
    f.breakReady = false;
    f.castsLeft = 0;
    save();
    return true;
  }

  // 开始新的专注时清空休息入口（不影响鱼篓里的鱼）
  function clearBreak() {
    const f = state.fishing;
    f.breakReady = false;
    f.granted = false;
    f.castsLeft = 0;
    save();
  }

  function canFish() {
    return !!state.fishing.breakReady;
  }

  function fishById(id) {
    return FISH.find(x => x.id === id) || null;
  }

  function rollFish(rng) {
    const r = typeof rng === 'function' ? rng : Math.random;
    const lamp = state.fishing.gear.lamp;
    const list = FISH.map(sp => ({
      sp: sp,
      w: sp.weight * (lamp && sp.rarity !== 'common' ? 2.2 : 1)
    }));
    const total = list.reduce((a, b) => a + b.w, 0);
    let x = r() * total;
    for (let i = 0; i < list.length; i++) {
      x -= list[i].w;
      if (x <= 0) return list[i].sp;
    }
    return list[list.length - 1].sp;
  }

  // hit=false 表示收竿失败，同样消耗一杆；成功后鱼篓里多一条具体鱼种
  function fishCast(hit, rng) {
    const f = state.fishing;
    if (!f.breakReady) return { ok: false, reason: 'rest' };
    if (f.castsLeft <= 0) return { ok: false, reason: 'no_cast' };
    f.castsLeft -= 1;
    if (!hit) {
      logEvent('fish_miss', { left: f.castsLeft });
      save();
      return { ok: true, hit: false, fish: null, left: f.castsLeft };
    }
    const r = typeof rng === 'function' ? rng : Math.random;
    let sp = rollFish(r);
    // 好竿：普通鱼有一次重钓机会，取更好的结果
    if (f.gear.rod && sp.rarity === 'common' && r() < 0.55) {
      const sp2 = rollFish(r);
      if (RARITY[sp2.rarity].level > RARITY[sp.rarity].level) sp = sp2;
    }
    f.bag[sp.id] = (f.bag[sp.id] || 0) + 1;
    f.caught[sp.id] = (f.caught[sp.id] || 0) + 1;
    f.totalFish += 1;
    logEvent('fish_catch', { species: sp.id, rarity: sp.rarity, left: f.castsLeft });
    completeActivity('fish');
    save();
    return { ok: true, hit: true, fish: sp, left: f.castsLeft };
  }

  function bagCount() {
    return Object.keys(state.fishing.bag || {}).reduce((a, k) => a + (state.fishing.bag[k] || 0), 0);
  }

  function fishDex() {
    return FISH.map(sp => Object.assign({}, sp, { caught: Number((state.fishing.caught || {})[sp.id] || 0), bag: Number((state.fishing.bag || {})[sp.id] || 0) }));
  }

  // 兑换某一种鱼；小鱼干按鱼种价值折算，受每日上限约束
  function fishExchangeSpecies(id) {
    const f = state.fishing;
    const sp = fishById(id);
    const have = f.bag[id] || 0;
    if (!sp) return { ok: false, reason: 'none' };
    if (have <= 0) return { ok: false, reason: 'fish' };
    const daily = fishDaily();
    if (daily.left <= 0) return { ok: false, reason: 'cap', snacks: 0 };
    if (daily.left < sp.snacks) return { ok: false, reason: 'cap', snacks: 0, need: sp.snacks, left: daily.left };
    const n = Math.min(have, Math.floor(daily.left / sp.snacks));
    if (n <= 0) return { ok: false, reason: 'cap', snacks: 0 };
    const snacks = n * sp.snacks;
    f.bag[id] -= n;
    if (f.bag[id] <= 0) delete f.bag[id];
    f.exchanged += snacks;
    f.totalSnacks += snacks;
    state.fish += snacks;
    logEvent('fish_exchange', { species: id, count: n, snacks: snacks });
    save();
    return { ok: true, snacks: snacks, count: n, left: daily.left - snacks };
  }

  function rareDecos() {
    return FURNITURE.filter(x => x.fishCost);
  }

  function canCraftRare(id) {
    const item = itemById(id);
    if (!item || !item.fishCost || isOwned(id)) return false;
    return Object.keys(item.fishCost).every(k => (state.fishing.bag[k] || 0) >= item.fishCost[k]);
  }

  // 用指定鱼种兑换稀有装饰
  function craftRare(id) {
    const item = itemById(id);
    if (!item || !item.fishCost) return { ok: false, reason: 'none' };
    if (isOwned(id)) return { ok: false, reason: 'owned' };
    if (!canCraftRare(id)) return { ok: false, reason: 'fish' };
    Object.keys(item.fishCost).forEach(k => {
      state.fishing.bag[k] -= item.fishCost[k];
      if (state.fishing.bag[k] <= 0) delete state.fishing.bag[k];
    });
    grantItem(id, 'fish');
    logEvent('rare_craft', { id: id });
    save();
    return { ok: true, item: item };
  }

  function buyGear(id) {
    const g = FISHING.gear.find(x => x.id === id);
    if (!g) return { ok: false, reason: 'none' };
    if (state.fishing.gear[id]) return { ok: false, reason: 'owned' };
    if (state.fish < g.price) return { ok: false, reason: 'fish' };
    state.fish -= g.price;
    state.fishing.gear[id] = true;
    logEvent('buy_gear', { id: id, price: g.price });
    save();
    return { ok: true, gear: g };
  }

  function gearOwned(id) {
    return !!state.fishing.gear[id];
  }

  /* ---------- records ---------- */
  function minutesOn(key) {
    return state.sessions
      .filter(s => s.date === key)
      .reduce((a, b) => a + b.minutes, 0);
  }

  function logSummary() {
    const today = dateKey();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(today, i - 6);
      days.push({ key: k, minutes: minutesOn(k), isToday: k === today, label: parseKey(k).getMonth() + 1 + '/' + parseKey(k).getDate() });
    }
    let week = 0;
    for (let i = 0; i < 7; i++) week += minutesOn(addDays(today, -i));
    return {
      today: minutesOn(today),
      week: week,
      total: state.growth,
      streak: computeStreak(state),
      days: days
    };
  }

  function calendarData() {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = dateKey();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push({ blank: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      cells.push({
        day: d,
        key: key,
        checked: state.checkins.indexOf(key) >= 0,
        today: key === today,
        future: key > today
      });
    }
    return { year: y, month: m + 1, cells: cells };
  }

  function canMakeup() {
    const y = addDays(dateKey(), -1);
    if (state.checkins.indexOf(y) >= 0) return null;
    if (state.makeupUsed === y) return null;
    const hasOlder = state.checkins.some(k => k < y);
    return hasOlder ? y : null;
  }

  function applyMakeup() {
    const y = addDays(dateKey(), -1);
    if (canMakeup() !== y) return false;
    state.checkins.push(y);
    state.makeupUsed = y;
    const st = computeStreak(state);
    if (st > state.bestStreak) state.bestStreak = st;
    logEvent('makeup', { date: y, streak: st });
    save();
    return true;
  }

  /* ---------- export ---------- */
  PDM.core = {
    KEY: KEY,
    state: () => state,
    load: load,
    save: save,
    reset: reset,
    dateKey: dateKey,
    parseKey: parseKey,
    addDays: addDays,
    daysBetween: daysBetween,
    fmtMin: fmtMin,
    fmtClock: fmtClock,
    SLOTS: SLOTS,
    FURNITURE: FURNITURE,
    OUTFITS: OUTFITS,
    FOODS: FOODS,
    ACCESSORIES: ACCESSORIES,
    ROOM_THEMES: ROOM_THEMES,
    CAT_HOUSE_TIERS: CAT_HOUSE_TIERS,
    ACTIVITIES: ACTIVITIES,
    COMICS: COMICS,
    LEVELS: LEVELS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    FISHING: FISHING,
    FISH: FISH,
    RARITY: RARITY,
    fishById: fishById,
    fishDaily: fishDaily,
    startBreak: startBreak,
    endBreak: endBreak,
    clearBreak: clearBreak,
    canFish: canFish,
    fishCast: fishCast,
    rollFish: rollFish,
    bagCount: bagCount,
    fishDex: fishDex,
    fishExchangeSpecies: fishExchangeSpecies,
    rareDecos: rareDecos,
    canCraftRare: canCraftRare,
    craftRare: craftRare,
    buyGear: buyGear,
    gearOwned: gearOwned,
    levelInfo: levelInfo,
    computeStreak: computeStreak,
    bestStreak: bestStreak,
    isOwned: isOwned,
    isAdItem: isAdItem,
    itemById: itemById,
    outfitById: outfitById,
    comicById: comicById,
    buyItem: buyItem,
    grantItem: grantItem,
    buyOutfit: buyOutfit,
    grantOutfit: grantOutfit,
    accessoryById: accessoryById,
    buyAccessory: buyAccessory,
    toggleAccessory: toggleAccessory,
    themeById: themeById,
    buyTheme: buyTheme,
    setTheme: setTheme,
    catHouseInfo: catHouseInfo,
    upgradeCatHouse: upgradeCatHouse,
    equipItem: equipItem,
    isPlaced: isPlaced,
    placeItem: placeItem,
    unplaceItem: unplaceItem,
    setPlacement: setPlacement,
    ensurePlacement: ensurePlacement,
    rotateItem: rotateItem,
    setOutfit: setOutfit,
    syncComicUnlocks: syncComicUnlocks,
    grantComic: grantComic,
    nextLockedComic: nextLockedComic,
    markComicRead: markComicRead,
    checkAchievements: checkAchievements,
    achievementInfo: achievementInfo,
    commitSession: commitSession,
    addBonusFish: addBonusFish,
    addSnack: addSnack,
    useSnack: useSnack,
    buyFood: buyFood,
    useFood: useFood,
    logEvent: logEvent,
    eventStats: eventStats,
    completeActivity: completeActivity,
    activityInfo: activityInfo,
    logSummary: logSummary,
    calendarData: calendarData,
    canMakeup: canMakeup,
    applyMakeup: applyMakeup,
    minutesOn: minutesOn
  };
})(window.PDM);

