/* ============ 陪读小喵 · app: timer / rewards / ads / share ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const core = PDM.core;
  const $ = id => document.getElementById(id);
  const ui = PDM.ui;

  const app = {
    selMin: 25,
    session: null,
    speed: 1,
    cat: { state: 'idle', label: '小喵在等你开始' },
    catNextAt: 0,
    awaySleepUntil: 0,
    celebrateUntil: 0,
    petUntil: 0,
    eatUntil: 0,
    playUntil: 0,
    napUntil: 0,
    behaviorAt: 0,
    eatPending: false,
    W: 0,
    H: 0,
    dpr: 1,
    lastFrame: 0,
    adCallback: null,
    adTimer: 0,
    reward: null,
    rewarded: false,
    tipTimer: 0,
    settling: false,
    decorMode: false,
    drag: null,
    decorUndo: [],
    lastTouched: null,
    debug: false,
    bubbleAt: 0,
    bubbleTimer: 0,
    justFinishedAt: 0,
    todoDraft: [],
    todoOpen: false
  };

  const TODO_KEY = 'pdm.todos.v1';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function randOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  const CAT_LABEL = {
    idle: '小喵在旁边安静坐着',
    read: '小喵在认真看书',
    doze: '小喵有点困了…',
    stretch: '小喵伸了个懒腰',
    cheer: '小喵在给你加油',
    celebrate: '小喵开心地转圈圈',
    sleep: '小猫睡着了（你离开了一会儿）',
    wash: '小喵在洗脸',
    pet: '小喵眯起眼睛呼噜呼噜',
    eat: '小喵在吃零食',
    play: '小喵追着毛线球玩',
    nap: '小猫找了个地方趴下打盹'
  };

  /* ---------------- canvas ---------------- */
  function setupCanvas() {
    const canvas = $('room');
    const wrap = $('stageWrap');
    function resize() {
      const r = wrap.getBoundingClientRect();
      if (r.width < 20 || r.height < 20) return;
      app.W = r.width;
      app.H = r.height;
      app.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(app.W * app.dpr);
      canvas.height = Math.round(app.H * app.dpr);
      if (PDM.room3d && PDM.room3d.isAvailable()) PDM.room3d.resize(app.W, app.H);
    }
    // 3D 小屋（WebGL 不可用或 ?flat=1 时回退 2D）
    const flat = /(?:\?|&)flat=1/.test(location.search);
    app.use3d = false;
    if (!flat && PDM.room3d) {
      try {
        app.use3d = PDM.room3d.init($('room3d'), wrap);
      } catch (e) {
        app.use3d = false;
      }
      if (app.use3d) {
        PDM.room3d.setActive(true);
        wrap.classList.add('mode3d');
      }
    }
    resize();
    const hb = $('btnCatHouse');
    if (hb) hb.classList.toggle('hidden', false);
    const rb = $('btnRotate');
    if (rb) rb.classList.toggle('hidden', !app.use3d);
    const tl = $('btnTurnLeft');
    const tr = $('btnTurnRight');
    if (tl) tl.classList.toggle('hidden', !app.use3d);
    if (tr) tr.classList.toggle('hidden', !app.use3d);
    const bp = $('btnBlueprint');
    if (bp) bp.classList.toggle('hidden', !app.use3d);
    // 2D 回退也保留互动栏，方便喂食和摸摸
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(wrap);
    }
    requestAnimationFrame(loop);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    if (ts - app.lastFrame < 33) return;
    app.lastFrame = ts;
    const screen = document.getElementById('screen-home');
    if (!screen || !screen.classList.contains('active')) return;
    if (!app.W) { setupCanvas(); return; }
    if (app.use3d && PDM.room3d && PDM.room3d.isActive()) {
      PDM.room3d.render(ts / 1000, {
        t: ts / 1000,
        catState: app.cat.state,
        outfit: core.state().outfit,
        access: core.state().accessories,
        level: core.levelInfo().level,
        focus: !!app.session
      });
      return;
    }
    const canvas = $('room');
    const ctx = canvas.getContext('2d');
    ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0);
    ctx.clearRect(0, 0, app.W, app.H);
    PDM.room.drawRoom(ctx, app.W, app.H, {
      t: ts / 1000,
      catState: app.cat.state,
      outfit: core.state().outfit,
      access: core.state().accessories,
      equipped: core.state().equipped,
      level: core.levelInfo().level
    });
  }

  function setCatState(state) {
    app.cat.state = state;
    ui.refreshHeader();
    const label = state === 'idle' && !app.session ? '小喵在等你开始' : (CAT_LABEL[state] || '');
    app.cat.label = label;
    const txt = $('catStateText');
    if (txt) txt.textContent = label;
    const dot = $('stateDot');
    if (dot) {
      dot.classList.toggle('focus', !!app.session && state !== 'sleep');
      dot.classList.toggle('sleep', state === 'sleep');
    }
  }

  function pickCatState(now) {
    const focusing = !!app.session;
    const pool = focusing
      ? [['read', 9000], ['read', 11000], ['cheer', 5000], ['stretch', 4000], ['wash', 5000], ['doze', 6000], ['idle', 5000]]
      : [['idle', 8000], ['idle', 10000], ['wash', 4500], ['stretch', 4000], ['read', 8000], ['idle', 6000]];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setCatState(pick[0]);
    app.catNextAt = now + pick[1];
  }

  function tickCat(now) {
    if (!document.hidden && now > app.bubbleAt) {
      app.bubbleAt = now + 30000 + Math.random() * 30000;
      showBubble(bubbleLine());
    }
    ['petUntil', 'eatUntil', 'playUntil', 'napUntil'].forEach(k => {
      if (app[k] && now > app[k]) {
        app[k] = 0;
        setCatState(app.session ? 'read' : 'idle');
      }
    });
    if (app.petUntil > now) {
      if (app.cat.state !== 'pet') setCatState('pet');
      return;
    }
    if (app.eatUntil > now) {
      if (app.cat.state !== 'eat') setCatState('eat');
      return;
    }
    if (app.playUntil > now) {
      if (app.cat.state !== 'play') setCatState('play');
      return;
    }
    if (app.napUntil > now) {
      if (app.cat.state !== 'nap') setCatState('nap');
      return;
    }
    if (app.awaySleepUntil > now) {
      if (app.cat.state !== 'sleep') setCatState('sleep');
      return;
    }
    if (app.celebrateUntil > now) {
      if (app.cat.state !== 'celebrate') setCatState('celebrate');
      return;
    }
    if (!app.session && now > app.behaviorAt) maybeFurniture(now);
    if (now > app.catNextAt) pickCatState(now);
  }

  function maybeFurniture(now) {
    if (!app.use3d || !PDM.room3d || !PDM.room3d.itemPos) return;
    const cands = [];
    const ch = core.state().catHouse || {};
    if (PDM.room3d.catHouseSpot) {
      cands.push({
        house: true, dur: 12000,
        tip: ch.tier >= 2 ? '小猫钻进阳光花房晒太阳' : ch.tier >= 1 ? '小猫溜回原木双层的小阁楼' : '小猫钻回纸箱猫屋趴下'
      });
    }
    if (core.isPlaced('fl_bed')) cands.push({ id: 'fl_bed', dur: 15000, tip: '小猫窝进云朵猫窝，团成一团' });
    if (core.isPlaced('fl_cushion')) cands.push({ id: 'fl_cushion', dur: 9000, tip: '小猫趴在鱼鱼坐垫上打盹' });
    if (!cands.length) { app.behaviorAt = now + 14000; return; }
    if (Math.random() < 0.35) { app.behaviorAt = now + 12000; return; }
    const c = cands[Math.floor(Math.random() * cands.length)];
    const p = c.house ? PDM.room3d.catHouseSpot() : PDM.room3d.itemPos(c.id);
    if (!p) { app.behaviorAt = now + 14000; return; }
    app.behaviorAt = now + c.dur + 10000;
    PDM.room3d.moveCatTo(p.x, c.house ? p.z : p.z + .12, () => {
      app.napUntil = performance.now() + c.dur;
      setCatState('nap');
      app.cat.label = c.tip;
      const txt = $('catStateText');
      if (txt) txt.textContent = c.tip;
      showStageTip(c.tip, 2400);
    });
  }

  // 专注结束后，小猫会自己走回猫屋
  function sendCatHomeLater(delay) {
    if (!app.use3d || !PDM.room3d || !PDM.room3d.catHouseSpot) return;
    clearTimeout(app.catHomeTimer);
    app.catHomeTimer = setTimeout(() => {
      if (app.session) return;
      const ch = core.state().catHouse || {};
      const p = PDM.room3d.catHouseSpot();
      const tip = ch.tier >= 2 ? '小猫钻进阳光花房晒太阳' : ch.tier >= 1 ? '小猫溜回原木双层的小阁楼' : '小猫钻回纸箱猫屋趴下';
      app.behaviorAt = performance.now() + 20000;
      PDM.room3d.moveCatTo(p.x, p.z, () => {
        app.napUntil = performance.now() + 12000;
        setCatState('nap');
        app.cat.label = tip;
        const txt = $('catStateText');
        if (txt) txt.textContent = tip;
        showStageTip(tip, 2400);
      });
    }, delay || 7400);
  }

  /* ---------------- timer ---------------- */
  const SESSION_KEY = 'peiduxiaomiao.session.v1';
  let lastSessionSave = 0;

  function currentStudyMode() {
    const st = core.state();
    return st.settings && st.settings.studyMode === 'strict' ? 'strict' : 'free';
  }

  function updateModeUI() {
    const mode = currentStudyMode();
    document.querySelectorAll('#studyModes button').forEach(b => {
      b.classList.toggle('on', b.dataset.mode === mode);
    });
    const hint = $('modeHint');
    if (hint) {
      hint.textContent = mode === 'strict'
        ? '严格专注：离开界面继续计时，但只按在场时间结算'
        : '自由学习：离开界面时计时自动暂停';
    }
    const box = $('studyModes');
    if (box) box.classList.toggle('locked', !!app.session);
  }

  function setStudyMode(mode) {
    if (app.session) return;
    const st = core.state();
    st.settings.studyMode = mode === 'strict' ? 'strict' : 'free';
    st.settings.modeChosen = true;
    core.save();
    updateModeUI();
    ui.toast(mode === 'strict' ? '严格专注：离开继续计时，但只按在场时间结算' : '自由学习：离开界面自动暂停', 2200);
  }

  function presenceElapsedMs(s, now) {
    const t = now || Date.now();
    const end = s.pausedAt ? s.pausedAt : t;
    const paused = s.pausedMs || 0;
    const hiddenNow = (s.hiddenAt && !s.pausedAt) ? Math.max(0, end - s.hiddenAt) : 0;
    return Math.max(0, end - s.startedAt - paused - (s.awayMs || 0) - hiddenNow);
  }

  function activeElapsedMs(s, now) {
    // 严格模式计时不暂停；自由模式只统计在场时间
    if (s.mode === 'strict') {
      const t = now || Date.now();
      const end = s.pausedAt ? s.pausedAt : t;
      return Math.max(0, end - s.startedAt - (s.pausedMs || 0));
    }
    return presenceElapsedMs(s, now);
  }

  function persistSession() {
    const s = app.session;
    if (!s) {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      return;
    }
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        v: 2,
        durationSec: s.durationSec,
        startedAt: s.startedAt,
        awayMs: s.awayMs,
        mode: s.mode,
        left: s.left,
        tag: s.tag || '',
        pausedMs: s.pausedMs || 0,
        pausedAt: s.pausedAt || 0,
        breakShown: s.breakShown || 0,
        hiddenAt: s.hiddenAt || 0,
        todos: Array.isArray(s.todos) ? s.todos : [],
        savedAt: Date.now()
      }));
    } catch (e) {}
  }

  function clearSessionStore() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function sessionRemainSec() {
    const s = app.session;
    if (!s) return 0;
    return Math.max(0, s.durationSec - activeElapsedMs(s) / 1000 * app.speed);
  }

  function restoreSession() {
    let raw = null;
    try { raw = localStorage.getItem(SESSION_KEY); } catch (e) { return; }
    if (!raw) return;
    let s = null;
    try { s = JSON.parse(raw); } catch (e) { clearSessionStore(); return; }
    if (!s || !s.durationSec || !s.startedAt) { clearSessionStore(); return; }
    const savedAt = s.savedAt || Date.now();
    if (Date.now() - savedAt > 6 * 3600 * 1000) { clearSessionStore(); return; }
    if (!s.mode) s.mode = 'free';
    s.pausedMs = s.pausedMs || 0;
    s.pausedAt = s.pausedAt || 0;
    s.tag = s.tag || '';
    s.breakShown = s.breakShown || 0;
    if (!Array.isArray(s.todos)) s.todos = [];
    if (!s.pausedAt) {
      // 严格模式也记录离开时长；自由模式用于暂停，严格模式仅用于展示
      s.awayMs = (s.awayMs || 0) + Math.max(0, Date.now() - savedAt);
      s.hiddenAt = document.hidden ? Date.now() : 0;
    } else {
      s.hiddenAt = 0;
    }
    s.left = !!s.left;
    app.session = s;
    $('screen-home').classList.add('focusing');
    $('btnStart').disabled = true;
    $('btnStart').textContent = '专注中…';
    $('btnStop').classList.remove('hidden');
    $('durationChips').classList.add('locked');
    syncPauseBtn();
    updateModeUI();
    setCatState(s.pausedAt ? 'idle' : 'read');
    app.catNextAt = performance.now() + 9000;
    updateTimerUI();
    renderTodos();
    if (!s.pausedAt && sessionRemainSec() <= 0) {
      finishSession(true);
    } else {
      persistSession();
      ui.toast(s.pausedAt ? '已恢复上次的进度，当前是暂停状态' : '已恢复上次的专注进度', 2200);
    }
  }

  function syncPauseBtn() {
    const b = $('btnPause');
    if (!b) return;
    const s = app.session;
    b.classList.toggle('hidden', !s);
    b.textContent = s && s.pausedAt ? '继续专注' : '暂停';
    b.classList.toggle('on', !!(s && s.pausedAt));
  }

  function togglePause() {
    const s = app.session;
    if (!s) return;
    if (s.pausedAt) {
      s.pausedMs = (s.pausedMs || 0) + Math.max(0, Date.now() - s.pausedAt);
      s.pausedAt = 0;
      s.hiddenAt = document.hidden ? Date.now() : 0;
      app.awaySleepUntil = 0;
      setCatState('read');
      ui.toast('继续专注，小猫也打起精神了', 2000);
    } else {
      s.pausedAt = Date.now();
      s.hiddenAt = 0;
      setCatState('idle');
      ui.toast('已暂停计时，小猫陪你休息一下', 2200);
    }
    syncPauseBtn();
    updateTimerUI();
    persistSession();
    core.logEvent('focus_pause', { paused: !!s.pausedAt });
  }

  function updateTimerUI() {
    if (PDM.fishing) PDM.fishing.syncEntry();
    const s = app.session;
    const timeEl = $('timeText');
    const subEl = $('timeSub');
    const bar = $('progressBar');
    if (!s) {
      const mm = String(app.selMin).padStart(2, '0');
      timeEl.textContent = mm + ':00';
      timeEl.classList.add('dim');
      const sum = core.logSummary();
      subEl.textContent = sum.today > 0
        ? '今日已专注 ' + sum.today + ' 分钟 · 连续 ' + sum.streak + ' 天'
        : '选一个时长，开始今天的陪读';
      bar.style.width = '0%';
      document.title = '陪读小喵 · 学习自习室桌宠';
      return;
    }
    const remain = sessionRemainSec();
    const pct = Math.min(100, (1 - remain / s.durationSec) * 100);
    timeEl.classList.remove('dim');
    timeEl.textContent = core.fmtClock(remain);
    if (s.pausedAt) {
      subEl.textContent = '已暂停 · 点「继续专注」接着计时';
      bar.style.width = pct + '%';
      document.title = '已暂停 · 陪读小喵';
      return;
    }
    const tagTxt = s.tag ? ' · ' + s.tag : '';
    if (s.awayMs > 3000) {
      subEl.textContent = s.mode === 'strict'
        ? '严格专注 · 计时继续，离开不计奖励'
        : '小猫打了会儿盹 · 离开时间已自动暂停';
    } else {
      const est = Math.round(s.durationSec / 60 * 2 * 1.25);
      subEl.textContent = '小猫在认真陪读 · 完成可得约 ' + est + ' 条小鱼干' +
        tagTxt + (s.mode === 'strict' ? ' · 离开仍计时' : '');
    }
    bar.style.width = pct + '%';
    document.title = core.fmtClock(remain) + ' · 陪读小喵';
    if (remain <= 0) finishSession(true);
  }

  function currentTag() {
    const el = $('taskTag');
    const v = el ? el.value : (core.state().settings.lastTag || '阅读');
    return v || '阅读';
  }

  function startSession() {
    if (app.session) return;
    const min = app.selMin;
    const tag = currentTag();
    const todos = app.todoDraft
      .map(t => String(t || '').trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(t => ({ text: t, done: false }));
    app.session = {
      durationSec: min * 60,
      startedAt: Date.now(),
      awayMs: 0,
      hiddenAt: document.hidden ? Date.now() : 0,
      pausedMs: 0,
      pausedAt: 0,
      breakShown: 0,
      tag: tag,
      left: false,
      mode: currentStudyMode(),
      todos: todos
    };
    const st = core.state();
    st.settings.lastTag = tag;
    core.clearBreak();
    persistSession();
    core.logEvent('focus_start', { minutes: min, mode: app.session.mode, tag: tag });
    core.save();
    $('screen-home').classList.add('focusing');
    $('btnStart').disabled = true;
    $('btnStart').textContent = '专注中…';
    $('btnStop').classList.remove('hidden');
    $('durationChips').classList.add('locked');
    syncPauseBtn();
    updateModeUI();
    app.awaySleepUntil = 0;
    app.napUntil = 0;
    app.behaviorAt = performance.now() + 20000;
    app.celebrateUntil = 0;
    setCatState('read');
    app.catNextAt = performance.now() + 9000;
    renderTodos();
    if (PDM.audio) PDM.audio.ensure();
    showBubble(randOf(['那就开始吧，我陪你。', '坐好啦，我们开始。', '这一轮我安静陪着。']));
    app.bubbleAt = performance.now() + 30000 + Math.random() * 30000;
    showStageTip('小猫坐好了，开始陪读吧', 2600);
    updateTimerUI();
    ui.toast(app.session.mode === 'strict'
      ? '严格专注开始 · 离开也计时，但只按在场时间结算'
      : '自由学习开始 · 离开界面会自动暂停', 2400);
  }

  function finishSession(completed) {
    if (!app.session) return;
    const s = app.session;
    // 严格专注继续计时，但发奖只按在场时长；自由学习离开暂停
    const presenceSec = presenceElapsedMs(s) / 1000 * app.speed;
    const calcSec = presenceSec;
    let minutes = completed
      ? Math.round(Math.min(calcSec, s.durationSec) / 60)
      : Math.floor(calcSec / 60 + 0.0001);
    minutes = Math.max(0, Math.min(minutes, s.durationSec / 60));
    const awaySec = Math.min(Math.round(s.durationSec), Math.round((s.awayMs + (s.hiddenAt && !s.pausedAt ? Math.max(0, Date.now() - s.hiddenAt) : 0)) / 1000 * app.speed));

    app.session = null;
    clearSessionStore();
    $('screen-home').classList.remove('focusing');
    $('btnStart').disabled = false;
    $('btnStart').textContent = '开始陪读';
    $('btnStop').classList.add('hidden');
    $('btnPause').classList.add('hidden');
    $('durationChips').classList.remove('locked');
    updateModeUI();
    app.celebrateUntil = performance.now() + 7000;
    setCatState('celebrate');
    app.catNextAt = performance.now() + 7500;
    app.justFinishedAt = performance.now();
    showBubble(randOf(BUBBLE.finish));
    renderTodos();

    if (minutes < 1) {
      core.logEvent('focus_partial', { minutes: 0, away: awaySec });
      core.save();
      updateTimerUI();
      ui.toast(awaySec > 60 ? '离开太久，这轮没有计入奖励' : '这次只坐了一小会儿，小猫下次还等你', 2400);
      return;
    }
    // 真正记入本轮后，才清空待办草稿（误触开始再结束不会丢）
    app.todoDraft = [];
    saveTodoDraft();
    renderTodos();

    // 这一轮专注结束，可以休息一下去鱼塘
    core.startBreak();

    // 结算期间先压住成就 toast，统一放进结算卡
    let summary;
    app.settling = true;
    try {
      summary = core.commitSession({
        minutes: minutes,
        awaySec: awaySec,
        tag: s.tag || '',
        completed: completed
      });
    } finally {
      app.settling = false;
    }
    summary.completed = completed;
    summary.mode = s.mode;
    summary.tag = s.tag || '';
    summary.snacks = 0;
    if (completed && minutes >= 15) {
      core.addSnack(1);
      summary.snacks = 1;
      updatePetBar();
    }
    app.reward = summary;
    app.rewarded = false;
    updateTimerUI();
    refreshAll();
    showReward(summary);
    if (PDM.audio) PDM.audio.playSfx('ding');
    sendCatHomeLater(7400);
    // 第一次真正完成陪读，预告每天门口信箱的小纸条
    if ((core.state().sessions || []).length === 1) {
      setTimeout(() => showBubble('明天回来，记得看看门口的小信箱～'), 3200);
    }
  }

  function showReward(sum) {
    const st = core.state();
    const canDouble = sum.total > 0 && st.adDoubleDate !== core.dateKey();
    const doubleAmt = Math.round(sum.total * 0.5);
    const lines = [];
    lines.push('<div class="reward-line"><span>专注 ' + sum.minutes + ' 分钟</span><b>+' + sum.baseRaw + '</b></div>');
    if (sum.completeBonus > 0) lines.push('<div class="reward-line bonus"><span>完整完成本轮 +25%</span><b>+' + sum.completeBonus + '</b></div>');
    if (sum.foodBonus > 0) lines.push('<div class="reward-line bonus"><span>猫鱼条加成</span><b>+' + sum.foodBonus + '</b></div>');
    if (sum.moodBonus > 0) lines.push('<div class="reward-line bonus"><span>心情加成</span><b>+' + sum.moodBonus + '</b></div>');
    if (sum.snacks > 0) lines.push('<div class="reward-line bonus"><span>猫鱼条</span><b>+' + sum.snacks + '</b></div>');
    if (sum.first > 0) lines.push('<div class="reward-line bonus"><span>今天第一次专注</span><b>+' + sum.first + '</b></div>');
    if (sum.s3 > 0) lines.push('<div class="reward-line bonus"><span>连续打卡 3 天</span><b>+' + sum.s3 + '</b></div>');
    if (sum.s7 > 0) lines.push('<div class="reward-line bonus"><span>连续打卡 7 天</span><b>+' + sum.s7 + '</b></div>');
    if (sum.s14 > 0) lines.push('<div class="reward-line bonus"><span>连续打卡 14 天</span><b>+' + sum.s14 + '</b></div>');
    if (sum.s30 > 0) lines.push('<div class="reward-line bonus"><span>连续打卡 30 天</span><b>+' + sum.s30 + '</b></div>');
    if (sum.awaySec > 30) {
      lines.push('<div class="reward-line dim"><span>离开 ' + Math.round(sum.awaySec / 60) + ' 分钟</span><b>' + (sum.mode === 'strict' ? '不计入' : '已暂停') + '</b></div>');
    }
    if (sum.levelUp) {
      lines.push('<div class="reward-line bonus"><span>小屋升级</span><b>Lv.' + sum.levelAfter.level + ' ' + sum.levelAfter.name + '</b></div>');
      (sum.unlocks || []).forEach(u => {
        lines.push('<div class="reward-line bonus"><span>Lv.' + u.level + ' 新解锁</span><b>' + u.unlock + '</b></div>');
      });
    }
    (sum.achievements || []).forEach(a => {
      lines.push('<div class="reward-line bonus"><span>成就 · ' + a.name + '</span><b>' + (a.reward > 0 ? '+' + a.reward + ' 鱼干' : '达成') + '</b></div>');
    });
    (sum.newComics || []).forEach(c => {
      lines.push('<div class="reward-line bonus"><span>解锁番外《' + c.title + '》</span><b>去图鉴</b></div>');
    });
    const note = sum.awaySec > 30
      ? (sum.mode === 'strict'
        ? '严格专注：离开界面计时继续，但离开的时间不计奖励。'
        : '自由学习：离开界面时计时自动暂停，离开的时间不计奖励。')
      : (canDouble ? '看一次广告，本次奖励额外 +50%，每天一次。' : '今天的小鱼干收好啦，明天再来陪小喵。');

    $('rewardBody').innerHTML =
      '<div class="reward-art" style="display:flex;justify-content:center;margin-bottom:2px"><canvas id="rewardCat" style="width:104px;height:104px"></canvas></div>' +
      '<div class="reward-title">' + (sum.completed ? '陪读完成，' : '这次先到这里，') + '<span>辛苦啦</span></div>' +
      '<div class="reward-sub">' + sum.minutes + ' 分钟 · 小猫一直陪着你 · 连续 ' + sum.streak + ' 天</div>' +
      '<div class="reward-amount">' + ui.icon('fish') + '+' + sum.total + '</div>' +
      '<div class="reward-lines">' + lines.join('') + '</div>' +
      '<div class="reward-note">' + note + '</div>' +
      '<div class="reward-actions">' +
      '<button class="btn primary" data-action="closeReward">收下小鱼干</button>' +
      (canDouble ? '<button class="btn ghost" data-action="adDouble">看广告 · 额外 +' + doubleAmt + '（+50%）</button>' : '') +
      '<button class="btn ghost" data-action="goFishing">休息一下 · 去鱼塘</button>' +
      '</div>';
    $('rewardWrap').classList.add('show');
    const canvas = $('rewardCat');
    if (canvas) {
      const size = 104, dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      PDM.art.drawCat(ctx, size / 2, size * 0.94, 0.66, { state: 'celebrate', outfit: core.state().outfit, t: 2.1 });
      const oc = core.state().outfit;
      const src = (oc === 'pj' || oc === 'academy' || oc === 'festival')
        ? 'assets/cat/cat_' + oc + '.png'
        : 'assets/cat/cat_cheer.png';
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, -size * .02, -size * .1, size * 1.04, size * 1.04);
        // 精灵图之上补画配饰，结算卡也能看到小喵今天戴的东西
        PDM.art.drawAccessoryLayer(ctx, size / 2, size * 0.908, 3.45 * (size * 1.04 / 512), core.state().accessories);
      };
      img.src = src;
    }
  }

  function closeReward() {
    $('rewardWrap').classList.remove('show');
    app.reward = null;
  }

  /* ---------------- ad ---------------- */
  function openAd(desc, onDone) {
    core.logEvent('ad_click', {});
    core.save();
    app.adCallback = onDone;
    $('adDesc').textContent = desc || '看一段短片，帮小喵换更多小鱼干';
    $('adWrap').classList.add('show');
    $('adClaim').disabled = true;
    $('adClaim').textContent = '广告播放中…';
    let left = 5;
    $('adTimer').textContent = left + 's';
    clearInterval(app.adTimer);
    app.adTimer = setInterval(() => {
      left--;
      $('adTimer').textContent = Math.max(0, left) + 's';
      if (left <= 0) {
        clearInterval(app.adTimer);
        $('adClaim').disabled = false;
        $('adClaim').textContent = '领取奖励';
      }
    }, 1000);
  }

  function claimAd() {
    if ($('adClaim').disabled) return;
    $('adWrap').classList.remove('show');
    clearInterval(app.adTimer);
    core.logEvent('ad_complete', {});
    core.save();
    const cb = app.adCallback;
    app.adCallback = null;
    if (cb) cb();
  }

  /* ---------------- share ---------------- */
  function openShare() {
    $('shareWrap').classList.add('show');
    PDM.extras.drawShareCard($('shareCanvas'));
    core.logEvent('share', {});
    core.save();
    refreshAll();
  }

  function openWeekShare() {
    ui.closeModal();
    $('shareWrap').classList.add('show');
    PDM.extras.drawWeekCard($('shareCanvas'));
    core.logEvent('share', { kind: 'week' });
    core.save();
  }

  function saveShare() {
    const canvas = $('shareCanvas');
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '陪读小喵-' + core.dateKey() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      const bonus = core.grantShareReward();
      ui.refreshHeader();
      ui.toast(bonus > 0 ? '图片已开始下载 · 分享奖励 +' + bonus + ' 小鱼干' : '图片已开始下载');
    }, 'image/png');
  }

  function nativeShare() {
    const canvas = $('shareCanvas');
    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], '陪读小喵.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: '今天和小喵一起学习 · 陪读小喵' });
          const bonus = core.grantShareReward();
          ui.refreshHeader();
          if (bonus > 0) ui.toast('分享成功 · 奖励 +' + bonus + ' 小鱼干');
        } catch (e) {}
      } else {
        ui.toast('当前环境不支持系统分享，请用「保存图片」');
      }
    }, 'image/png');
  }

  /* ---------------- stage tip ---------------- */
  function showStageTip(msg, ms) {
    const el = $('stageTip');
    el.textContent = msg;
    el.classList.remove('hidden');
    el.style.opacity = '1';
    clearTimeout(app.tipTimer);
    app.tipTimer = setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.classList.add('hidden'), 300);
    }, ms || 2200);
  }

  /* ---------------- 小猫气泡 ---------------- */
  const BUBBLE = {
    focus: [
      '我就安静趴着，你专心～',
      '这页快看完啦，我陪你。',
      '要不要先喝口水？',
      '你的笔尖沙沙的，好安心。',
      '累了就伸个懒腰，我不走。'
    ],
    focusTag: {
      '英语': ['今天背了几个词呀？', '单词一个一个来，别急。', '背完这组，我陪你歇会儿。'],
      '阅读': ['看到哪一页啦？', '慢慢读，我在旁边。', '这段话有点长，我等你。'],
      '刷题': ['这道题绕，先跳过也行。', '错题我都帮你记着。', '写完这题就喝口水吧。'],
      '写作': ['写累了就伸个懒腰～', '写到哪儿啦，给我看看？', '卡住也正常，先写下一句。'],
      '复习': ['复习完记得给自己一颗小星星。', '昨天的错题今天再看一眼？', '慢慢回顾，记得更牢。'],
      '其他': ['不管学什么，我都在。', '你专心的样子最好看。']
    },
    finish: [
      '辛苦啦！今天也超棒。',
      '先伸个懒腰，喝口水吧。',
      '小猫替你转了个圈～',
      '这一轮收好啦，休息一下。'
    ],
    late: [
      '都这么晚啦，早点睡好不好？',
      '明天再战，我陪你睡。',
      '深夜学习伤眼睛，收一收吧。',
      '我把灯调暗一点，去睡吧。'
    ],
    streak: [
      '已经连续 {n} 天啦，我记得哦。',
      '今天也来啦，我们连着第 {n} 天了！',
      '第 {n} 天，尾巴都翘起来了。'
    ],
    idle: [
      '今天想学点什么呀？',
      '我在这儿等你开始。',
      '摸摸我也可以～',
      '窗户外的光刚刚好。',
      '要不要先坐 25 分钟？'
    ],
    pet: [
      '呼噜呼噜～',
      '再摸一下嘛。',
      '这里最舒服啦。',
      '嘿嘿，你的手好暖。'
    ]
  };

  function bubbleLine() {
    const h = new Date().getHours();
    const st = core.state();
    const s = app.session;
    const streak = core.computeStreak(st);
    // 把倒计时牌和本轮待办念出来
    const cd = core.countdownInfo();
    if (cd.days != null && Math.random() < 0.3) {
      return cd.past
        ? '「' + cd.label + '」已经过去啦，辛苦了。'
        : '离「' + cd.label + '」还有 ' + cd.days + ' 天。';
    }
    if (s && Array.isArray(s.todos)) {
      const left = s.todos.filter(t => !t.done).length;
      if (left > 0 && Math.random() < 0.35) return '这轮还差 ' + left + ' 条，慢慢来。';
    }
    if (h >= 23 || h < 5) {
      if (Math.random() < 0.7) return randOf(BUBBLE.late);
    }
    if (s) {
      const tag = s.tag;
      if (tag && BUBBLE.focusTag[tag] && Math.random() < 0.5) return randOf(BUBBLE.focusTag[tag]);
      return randOf(BUBBLE.focus);
    }
    if (app.justFinishedAt && performance.now() - app.justFinishedAt < 90000 && Math.random() < 0.55) {
      return randOf(BUBBLE.finish);
    }
    if (streak >= 3 && Math.random() < 0.45) return randOf(BUBBLE.streak).replace('{n}', streak);
    return randOf(BUBBLE.idle);
  }

  function showBubble(text) {
    const el = $('catBubble');
    if (!el || !text) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(app.bubbleTimer);
    app.bubbleTimer = setTimeout(() => el.classList.remove('show'), 4400);
  }

  /* ---------------- 本轮待办 ---------------- */
  function loadTodoDraft() {
    let arr = [];
    try {
      const raw = localStorage.getItem(TODO_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) arr = p.slice(0, 3).map(v => String(v == null ? '' : v).slice(0, 30));
      }
    } catch (e) {}
    app.todoDraft = arr;
  }

  function saveTodoDraft() {
    try { localStorage.setItem(TODO_KEY, JSON.stringify(app.todoDraft.slice(0, 3))); } catch (e) {}
  }

  function renderTodos() {
    const box = $('todoBox');
    const list = $('todoList');
    const countEl = $('todoCount');
    const toggle = $('todoToggle');
    if (!box || !list) return;
    const s = app.session;
    const active = !!s;
    box.classList.toggle('active', active);
    if (active) {
      box.classList.add('open');
      const todos = Array.isArray(s.todos) ? s.todos : [];
      if (todos.length) {
        list.innerHTML = todos.map((t, i) =>
          '<button class="todo-item ' + (t.done ? 'done' : '') + '" data-todo="' + i + '" type="button">' +
          '<i>' + (t.done ? '✓' : '○') + '</i><span>' + esc(t.text) + '</span></button>').join('');
        countEl.textContent = todos.filter(t => t.done).length + '/' + todos.length;
      } else {
        list.innerHTML = '<div class="todo-empty">这轮没写待办，专注本身就很棒。</div>';
        countEl.textContent = '';
      }
      return;
    }
    box.classList.toggle('open', !!app.todoOpen);
    const draft = app.todoDraft;
    countEl.textContent = draft.filter(t => String(t || '').trim()).length + '/3';
    if (toggle) toggle.textContent = app.todoOpen ? '收起' : '展开';
    if (!app.todoOpen) { list.innerHTML = ''; return; }
    if (!draft.length) { app.todoDraft.push(''); saveTodoDraft(); }
    const rows = app.todoDraft.map((t, i) =>
      '<div class="todo-edit-row">' +
      '<input class="todo-input" data-todo-in="' + i + '" maxlength="30" placeholder="第 ' + (i + 1) + ' 条要做的事" value="' + esc(t) + '">' +
      '<button class="todo-del" data-action="todoDel" data-idx="' + i + '" type="button" aria-label="删除">×</button>' +
      '</div>').join('');
    const add = app.todoDraft.length < 3
      ? '<button class="todo-add" data-action="todoAdd" type="button">＋ 再加一条</button>' : '';
    list.innerHTML = rows + add;
  }

  function toggleTodo(i) {
    const s = app.session;
    if (!s || !Array.isArray(s.todos) || !s.todos[i]) return;
    const t = s.todos[i];
    t.done = !t.done;
    persistSession();
    renderTodos();
    if (t.done) {
      app.celebrateUntil = performance.now() + 1600;
      setCatState('cheer');
      app.catNextAt = performance.now() + 1900;
      showStageTip('又完成一件，小猫原地欢呼！', 2000);
      showBubble(randOf(['好厉害！又勾掉一件～', '干得漂亮，我替你转圈圈！', '这一条也完成啦！']));
      if (PDM.audio) PDM.audio.playSfx('ding');
    }
  }

  function addTodoRow() {
    if (app.session) return;
    if (app.todoDraft.length >= 3) return;
    app.todoDraft.push('');
    app.todoOpen = true;
    saveTodoDraft();
    renderTodos();
    setTimeout(() => {
      const list = $('todoList');
      if (!list) return;
      const inputs = list.querySelectorAll('.todo-input');
      const el = inputs[inputs.length - 1];
      if (el) el.focus();
    }, 30);
  }

  function delTodoRow(i) {
    if (app.session) return;
    app.todoDraft.splice(i, 1);
    saveTodoDraft();
    renderTodos();
  }

  /* ---------------- 每日离线小事件 ---------------- */
  function yesterdayStats() {
    const y = core.addDays(core.dateKey(), -1);
    const map = {};
    let total = 0;
    (core.state().sessions || []).forEach(s => {
      if (s.date !== y) return;
      const tag = s.tag || '学习';
      map[tag] = (map[tag] || 0) + (s.minutes || 0);
      total += s.minutes || 0;
    });
    const keys = Object.keys(map);
    keys.sort((a, b) => map[b] - map[a]);
    return { min: total, tag: keys.length ? keys[0] : '' };
  }

  function pickWeather() {
    const tod = PDM.room.tod();
    let pool;
    if (tod.night) pool = ['夜里很安静，星星很亮', '窗外的灯一盏一盏暗下去', '风把窗帘吹得轻轻的'];
    else if (tod.dusk) pool = ['傍晚的天有一点橘', '窗外有人慢慢走过', '晚风有一点点凉'];
    else if (tod.key === 'morning') pool = ['清晨的光很软', '窗外有鸟在叫', '今天看起来是个好天气'];
    else pool = ['今天窗外阳光很好', '云慢慢地飘过去', '风把窗帘吹起来了'];
    return randOf(pool);
  }

  function ensureDailyMail() {
    const st = core.state();
    const today = core.dateKey();
    if (st.mail && st.mail.date === today) return;
    const hasHistory = (st.sessions || []).length > 0 || (st.checkins || []).length > 0;
    const y = yesterdayStats();
    const weather = pickWeather();
    const gift = hasHistory ? 3 + Math.floor(Math.random() * 3) : 0;
    let note;
    if (y.min > 0) {
      note = '昨天你学了 ' + y.min + ' 分钟' + (y.tag ? '，大部分在' + y.tag : '') + '。\n我趴在旁边，把尾巴收得整整齐齐。' +
        (y.min >= 60 ? '\n你真厉害。' : '\n今天也一起慢慢来吧。');
    } else if (hasHistory) {
      note = '昨天没见到你，我把你的坐垫拍了拍。\n今天要不要一起坐一会儿？';
    } else {
      note = '喵～我是小喵。\n以后你学习的时候，我就在旁边陪着。';
    }
    st.mail = { date: today, claimed: !hasHistory, gift: gift, tag: y.tag, min: y.min, weather: weather, note: note };
    core.save();
  }

  function updateMailBadge() {
    const b = $('btnMail');
    if (!b) return;
    const m = core.state().mail || {};
    const unread = !!(m.gift > 0 && !m.claimed);
    const weekReady = core.weekLetterData().ready;
    b.classList.toggle('has-mail', unread || weekReady);
  }

  function openMail() {
    const st = core.state();
    const m = st.mail;
    if (!m || m.date !== core.dateKey()) {
      ui.toast('信箱今天还空着，明天再来看看', 2200);
      return;
    }
    const giftHtml = m.gift > 0
      ? '<div class="mail-gift">' + ui.icon('fish') + ' +' + m.gift + ' 小鱼干</div>'
      : '';
    const actions = (m.gift > 0 && !m.claimed)
      ? '<button class="btn primary" data-action="claimMail">收下小礼物</button>' +
        '<button class="btn ghost" data-action="closeModal">等会儿再收</button>'
      : '<button class="btn primary" data-action="closeModal">合上信箱</button>';
    const wk = core.weekLetterData();
    const weekHtml = wk.ready
      ? '<div class="week-letter">' +
        '<div class="wl-head">本周猫咪来信</div>' +
        '<div class="wl-range">' + wk.weekLabel + '</div>' +
        '<div class="wl-row"><span>本周专注</span><b>' + core.fmtMinutes(wk.minutes) + '</b></div>' +
        '<div class="wl-row"><span>最常学的标签</span><b>' + esc(wk.topTag || '还没记录') + '</b></div>' +
        '<div class="wl-row"><span>最晚学习时间</span><b>' + (wk.latest || '—') + '</b></div>' +
        '<div class="wl-row"><span>本周专注天数</span><b>' + wk.days + ' 天</b></div>' +
        '<div class="wl-verdict">' + esc(wk.verdict) + '</div>' +
        '<button class="btn ghost wide" data-action="shareWeek">生成周报图</button>' +
        '</div>'
      : '';
    ui.openModal(
      '<div class="mail-modal">' +
      '<div class="mail-head">门口的小信箱</div>' +
      '<div class="mail-sub">小喵在你不在的时候，偷偷留了一张纸条</div>' +
      '<div class="mail-card">' +
      '<div class="mail-weather">' + esc(m.weather || '') + '</div>' +
      '<div class="mail-hand">' + esc(m.note || '') + '</div>' +
      giftHtml +
      '</div>' +
      weekHtml +
      '<div class="reward-actions">' + actions + '</div>' +
      '</div>');
  }

  function claimMail() {
    const st = core.state();
    const m = st.mail;
    if (!m || m.claimed || !(m.gift > 0)) {
      ui.closeModal();
      return;
    }
    const gift = m.gift;
    core.addBonusFish(gift, 'daily_mail');
    m.claimed = true;
    core.save();
    updateMailBadge();
    refreshAll();
    if (PDM.audio) PDM.audio.playSfx('coin');
    ui.closeModal();
    ui.toast('收下小喵叼来的 ' + gift + ' 条小鱼干，今天也一起加油', 2600);
    showBubble('嘿嘿，小鱼干收好啦～');
  }

  function maybeAutoMail() {
    const st = core.state();
    const m = st.mail;
    if (!m || !st.settings.welcomeDone) return;
    if (m.date !== core.dateKey() || m.claimed || !(m.gift > 0)) return;
    if (document.hidden) return;
    openMail();
  }

  /* ---------------- 环境音混音台 ---------------- */
  function updateSoundBtn() {
    const b = $('btnSound');
    if (!b || !PDM.audio) return;
    const on = PDM.audio.isOn();
    b.classList.toggle('audio-on', on);
    b.innerHTML = '<svg><use href="#' + (on ? 'i-sound' : 'i-mute') + '"/></svg>';
  }

  function openMixer() {
    if (!PDM.audio) { ui.toast('当前环境不支持环境音', 2000); return; }
    const info = PDM.audio.mixerInfo();
    const rows = info.layers.map(l =>
      '<div class="mix-row">' +
      '<span class="mix-name">' + l.name + '</span>' +
      '<input class="mix-slider" type="range" min="0" max="100" step="1" value="' + l.vol + '" data-mix="' + l.id + '">' +
      '<b class="mix-val" id="mixVal-' + l.id + '">' + l.vol + '%</b>' +
      '</div>').join('');
    ui.openSheet('环境音混音台',
      '<div class="mix-master">' +
      '<div><div class="lab">环境音</div><div class="desc">5 条声音可叠加，拖动滑块单独调音量</div></div>' +
      '<div class="switch ' + (info.on ? 'on' : '') + '" data-action="toggleAmbient"></div>' +
      '</div>' +
      '<div class="mix-list">' + rows + '</div>' +
      '<div class="mix-note">点击右上角小喇叭可以随时开关；环境音为实时合成，不额外下载音频，包体更小。</div>' +
      '<div class="set-row mix-sfx" style="margin-top:10px">' +
      '<div><div class="lab">轻音效</div><div class="desc">摸摸咕噜、按钮点击、专注完成叮咚、钓鱼水花、获得鱼干</div></div>' +
      '<div class="switch ' + (info.sfx ? 'on' : '') + '" data-action="toggleSfx"></div>' +
      '</div>' +
      '<p class="tiny" style="margin-top:12px;line-height:1.7">首次打开需要点一下页面，浏览器才允许播放声音。</p>');
  }

  /* ---------------- 房间主题 / 倒计时 / 角落鱼缸 ---------------- */
  function applyTheme() {
    const wrap = $('stageWrap');
    if (!wrap) return;
    const id = core.state().roomTheme;
    wrap.dataset.theme = core.themeById(id) ? id : 'sunny';
  }

  function renderCountdown() {
    const el = $('countdownBoard');
    if (!el) return;
    const c = core.countdownInfo();
    if (!c.label || c.days == null) {
      el.innerHTML = '<span class="cd-empty">＋ 立个目标</span>';
      el.classList.remove('past');
      return;
    }
    el.classList.toggle('past', c.past);
    el.innerHTML = '<span>' + esc(c.label) + '</span><b>' + Math.abs(c.days) + '</b><span>天' + (c.past ? '（已过）' : '') + '</span>';
  }

  function openCountdownSheet() {
    const c = core.countdownInfo();
    ui.openModal(
      '<h2 style="font-size:17px;margin-bottom:6px">书桌上的小立牌</h2>' +
      '<p class="tiny" style="margin-bottom:12px">写一个目标日期，每天一抬头就能看见。</p>' +
      '<input id="cdLabel" class="text-input" maxlength="12" placeholder="比如：考研 / 六级" value="' + esc(c.label || '') + '">' +
      '<input id="cdDate" class="text-input" type="date" value="' + esc(c.date || '') + '" style="margin-top:8px">' +
      '<div class="reward-actions" style="margin-top:14px">' +
      '<button class="btn primary" data-action="saveCountdown">立起来</button>' +
      '<button class="btn ghost" data-action="clearCountdown">清空</button>' +
      '<button class="btn ghost" data-action="closeModal">取消</button></div>');
  }

  function saveCountdown() {
    const label = $('cdLabel') ? $('cdLabel').value : '';
    const date = $('cdDate') ? $('cdDate').value : '';
    if (!label.trim() || !date) {
      ui.toast('写一个名字，再选个日期吧', 2200);
      return;
    }
    core.setCountdown(label, date);
    ui.closeModal();
    renderCountdown();
    ui.toast('小立牌立好了，每天都能看到', 2200);
  }

  function renderTank() {
    const el = $('tankBox');
    if (!el) return;
    const fish = core.tankInfo();
    el.classList.toggle('hidden', !fish.length);
    if (!fish.length) { el.innerHTML = ''; return; }
    const spots = [[6, 22], [22, 30], [38, 21], [12, 38], [34, 38]];
    el.innerHTML = fish.slice(0, 5).map((f, i) => {
      const s = spots[i] || [10, 30];
      return '<i style="left:' + s[0] + 'px;top:' + s[1] + 'px;--c:' + f.color + ';--d:' + (4 + i * 1.3) + 's"></i>';
    }).join('') + '<b>鱼缸</b>';
  }

  function openTankDex() {
    ui.switchScreen('book');
    ui.uiState.bookTab = 'fish';
    ui.renderBook();
  }

  // 达成条件时自动发放配饰 / 主题，并给一个「立即戴上 / 换上」的入口
  function maybeGrantPerks() {
    const added = core.syncPerks();
    if (!added.length) return;
    ui.refreshHeader();
    const names = added.map(x => x.name).join('、');
    // 首次引导还没结束时不打断，只提示
    if (!core.state().settings.welcomeDone) {
      ui.toast('解锁新收藏 · ' + names, 3200);
      return;
    }
    const rows = added.map(x => {
      const isAcc = x.type === 'accessory';
      return '<div class="kv-row"><div><b>' + esc(x.name) + '</b>' +
        '<div class="tiny">' + (isAcc ? '新配饰已放进衣橱' : '新房间主题已解锁') + '</div></div>' +
        '<button class="btn primary small" data-action="' + (isAcc ? 'accItem' : 'themeItem') + '" data-id="' + x.id + '">' +
        (isAcc ? '立即戴上' : '立即换上') + '</button></div>';
    }).join('');
    ui.openModal(
      '<h2 style="font-size:17px;margin-bottom:4px">解锁新收藏</h2>' +
      '<p class="tiny" style="margin-bottom:12px">' + esc(names) + '</p>' +
      '<div class="kv-list">' + rows + '</div>' +
      '<button class="btn ghost wide" style="margin-top:12px" data-action="closeModal">稍后再说</button>');
  }

  /* ---------------- refresh ---------------- */
  function refreshAll() {
    ui.refreshHeader();
    const active = document.querySelector('.screen.active');
    if (!active) return;
    if (active.id === 'screen-shop') ui.renderShop();
    if (active.id === 'screen-book') ui.renderBook();
    if (active.id === 'screen-log') ui.renderLog();
    const st = core.state();
    const chip = $('levelChip');
    if (chip) {
      const lv = core.levelInfo();
      chip.innerHTML = '<span class="level-dot"></span><span id="levelText">Lv.' + lv.level + ' ' + lv.name + '</span>';
    }
    updatePetBar();
    updateGoalChip();
    updateMailBadge();
    renderTodos();
    applyTheme();
    renderCountdown();
    renderTank();
    maybeGrantPerks();
  }

  /* ---------------- welcome ---------------- */
  function showWelcome() {
    $('welcomeWrap').classList.add('show');
    const canvas = $('welcomeCanvas');
    if (canvas) PDM.extras.drawWelcome(canvas);
  }

  function hideWelcome() {
    const st = core.state();
    st.settings.welcomeDone = true;
    core.save();
    $('welcomeWrap').classList.remove('show');
    setCatState('idle');
    app.catNextAt = performance.now() + 6000;
    setTimeout(() => showStageTip('点「开始陪读」，我会安静的', 2600), 500);
    setTimeout(maybeAutoMail, 900);
  }

  /* ---------------- duration / speed ---------------- */
  function selectDuration(min) {
    if (app.session) return;
    app.selMin = min;
    let matched = false;
    document.querySelectorAll('#durationChips button').forEach(b => {
      if (b.dataset.min === 'custom') return;
      const on = Number(b.dataset.min) === min;
      if (on) matched = true;
      b.classList.toggle('on', on);
    });
    const cc = $('chipCustom');
    if (cc) {
      cc.classList.toggle('on', !matched);
      cc.textContent = matched ? '自定义' : min + ' 分钟';
    }
    updateTimerUI();
  }

  function openCustomDuration() {
    if (app.session) return;
    ui.openModal(
      '<h2 style="font-size:17px;margin-bottom:6px">自定义专注时长</h2>' +
      '<p class="tiny" style="margin-bottom:12px">1–180 分钟，按自己的节奏来。</p>' +
      '<input id="customMinInput" class="text-input" type="number" min="1" max="180" step="1" value="' + app.selMin + '">' +
      '<div class="reward-actions" style="margin-top:14px">' +
      '<button class="btn primary" data-action="confirmCustomMin">确定</button>' +
      '<button class="btn ghost" data-action="closeModal">取消</button></div>');
    const inp = $('customMinInput');
    if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 60);
  }

  function exportSave() {
    try {
      const payload = {
        app: 'peiduxiaomiao',
        v: 2,
        exportedAt: new Date().toISOString(),
        save: core.state(),
        keys: {}
      };
      // 主存档之外，把待办、混音台、刷题进度和视角也一起打包
      ['peiduxiaomiao.save.v1', TODO_KEY, 'pdm.audio.v1', 'peiduxiaomiao.quiz.v1', 'pdm.camAz', 'pdm.catHouseRot'].forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (raw != null) payload.keys[k] = raw;
        } catch (e) {}
      });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      a.href = url;
      a.download = 'peiduxiaomiao-save-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      core.logEvent('export_save', {});
      ui.toast('存档、待办、混音与刷题进度已一起导出', 2600);
    } catch (e) {
      ui.toast('导出失败，请换个浏览器再试', 2200);
    }
  }

  function importSave() {
    const inp = $('importFile');
    if (!inp) return;
    const file = inp.files && inp.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(String(reader.result || ''));
        let keys = p && p.keys && typeof p.keys === 'object' ? p.keys : null;
        // 兼容旧版只导出 save 的文件
        if (!keys && p && p.save) keys = { 'peiduxiaomiao.save.v1': JSON.stringify(p.save) };
        if (!keys) throw new Error('bad');
        let n = 0;
        Object.keys(keys).forEach(k => {
          if (typeof keys[k] !== 'string') return;
          if (!/^(peiduxiaomiao\.|pdm\.)/.test(k)) return;
          try { localStorage.setItem(k, keys[k]); n++; } catch (e) {}
        });
        if (!n) throw new Error('empty');
        ui.toast('存档已导入，正在重新载入…', 1800);
        setTimeout(() => location.reload(), 700);
      } catch (e) {
        ui.toast('这个文件看起来不是小喵的存档', 2400);
      } finally {
        inp.value = '';
      }
    };
    reader.readAsText(file);
  }

  function updateSpeedChip() {
    const chip = $('speedChip');
    if (!chip) return;
    chip.classList.toggle('hidden', !app.debug);
    chip.textContent = app.speed > 1 ? '演示 ×' + app.speed : '实时';
    chip.classList.toggle('fast', app.speed > 1);
  }

  function toggleSpeed() {
    if (!app.debug) return;
    if (app.session) {
      ui.toast('专注中不能切换速度，先坐完这一轮吧');
      return;
    }
    app.speed = app.speed > 1 ? 1 : 60;
    // 演示倍速只用于当前调试会话，不写进正式存档
    updateSpeedChip();
    ui.toast(app.speed > 1 ? '演示加速已开启：25 分钟约 25 秒走完' : '已切回真实计时');
    updateTimerUI();
  }

  /* ---------------- events ---------------- */
  function handleAction(action, el) {
    switch (action) {
      case 'buyItem': {
        const r = core.buyItem(el.dataset.id);
        if (!r.ok) {
          ui.toast(r.reason === 'fish' ? '小鱼干还不够，再专注一会儿吧'
            : r.reason === 'fishonly' ? '这件是鱼塘限定，要去鱼塘用鱼获打造'
            : '这个已经在你的小屋里了');
          return;
        }
        ui.toast('买下「' + r.item.name + '」' + (r.autoEquipped ? '，已经摆上去啦' : '，去布置小屋摆上吧'), 2400);
        refreshAll();
        break;
      }
      case 'openDecor': {
        ui.openDecor(el.dataset.slot || null);
        break;
      }
      case 'decorTab': {
        ui.uiState.decorSlot = el.dataset.slot;
        ui.openDecor();
        break;
      }
      case 'decorItem': {
        const id = el.dataset.id;
        const item = core.itemById(id);
        if (!core.isOwned(id)) {
          ui.closeSheet();
          ui.switchScreen('shop');
          ui.toast('先把「' + item.name + '」带回家吧');
          return;
        }
        app.lastTouched = id;
        if (app.decorMode) app.decorUndo.push(JSON.stringify(core.state().layout || {}));
        if (core.isPlaced(id)) {
          core.unplaceItem(id);
          ui.toast('「' + item.name + '」收进柜子啦');
        } else {
          const spot = findFreeSpot(PDM.room.defaultSpot(id), item.slot);
          core.placeItem(id, spot.x, spot.y, spot.k);
          ui.toast('摆好啦，直接拖动就能微调');
        }
        ui.openDecor();
        ui.refreshHeader();
        break;
      }
      case 'decorRotate': {
        rotateCurrent();
        break;
      }
      case 'decorUndo': {
        const snapshot = app.decorUndo.pop();
        if (!snapshot) { ui.toast('还没有可撤销的布置'); return; }
        core.state().layout = JSON.parse(snapshot);
        core.save();
        ui.toast('已撤销上一步布置', 1600);
        break;
      }
      case 'decorDrag': {
        ui.closeSheet();
        setDecorMode(true);
        ui.toast('拖动屋里的物品，摆成你喜欢的样子', 2600);
        break;
      }
      case 'decorDone': {
        setDecorMode(false);
        core.markActivity('decor');
        refreshAll();
        ui.toast('布置完成，小屋更好看啦');
        break;
      }
      case 'goShop': {
        ui.closeSheet();
        ui.switchScreen('shop');
        break;
      }
      case 'buyOutfit': {
        const r = core.buyOutfit(el.dataset.id);
        if (!r.ok) {
          ui.toast(r.reason === 'fish' ? '小鱼干还不够，再专注一会儿吧' : '已经拥有这套了');
          return;
        }
        core.setOutfit(el.dataset.id);
        ui.toast('小喵换上了「' + r.outfit.name + '」');
        refreshAll();
        break;
      }
      case 'buyFood': {
        const r = core.buyFood(el.dataset.id);
        if (!r.ok) {
          ui.toast(r.reason === 'fish' ? '小鱼干还不够，先去专注一会儿吧' : '这份猫粮暂时买不了');
          return;
        }
        updatePetBar();
        ui.toast('买好了「' + r.food.name + '」，小喵已经闻到香味', 2200);
        refreshAll();
        break;
      }
      case 'wearOutfit': {
        core.setOutfit(el.dataset.id);
        const o = core.outfitById(el.dataset.id);
        ui.toast('小喵换上了「' + o.name + '」');
        refreshAll();
        break;
      }
      case 'adItem': {
        const item = core.itemById(el.dataset.id);
        openAd('看完这段模拟广告，小喵就把「' + item.name + '」搬回小屋', () => {
          core.grantItem(item.id, 'ad');
          ui.toast('解锁「' + item.name + '」！已放进小屋', 2400);
          refreshAll();
        });
        break;
      }
      case 'adOutfit': {
        const o = core.outfitById(el.dataset.id);
        openAd('看完这段模拟广告，解锁限定服装「' + o.name + '」', () => {
          core.grantOutfit(o.id, 'ad');
          core.setOutfit(o.id);
          ui.toast('解锁并换上了「' + o.name + '」', 2400);
          refreshAll();
        });
        break;
      }
      case 'adComic': {
        const id = el.dataset.id;
        const comic = core.comicById(id);
        openAd('看完这段模拟广告，提前读到《' + comic.title + '》', () => {
          core.grantComic(id, 'ad');
          ui.closeModal();
          ui.toast('解锁番外《' + comic.title + '》', 2000);
          refreshAll();
          setTimeout(() => ui.openComic(id), 400);
        });
        break;
      }
      case 'comic': {
        ui.openComic(el.dataset.id);
        break;
      }
      case 'makeup': {
        openAd('看完这段模拟广告，补上昨天的打卡，连续天数不断', () => {
          const ok = core.applyMakeup();
          ui.toast(ok ? '补签成功，连续 ' + core.computeStreak(core.state()) + ' 天' : '补签失败，可能已经补过了', 2400);
          refreshAll();
        });
        break;
      }
      case 'toggleSpeed': {
        toggleSpeed();
        ui.openSettings();
        break;
      }
      case 'toggleBreak': {
        const st = core.state();
        st.settings.breakRemind = !(st.settings.breakRemind !== false);
        core.save();
        ui.openSettings();
        ui.toast(st.settings.breakRemind ? '每专注 25 分钟会提醒你休息一下' : '已关闭休息提醒', 2200);
        break;
      }
      case 'exportSave': {
        exportSave();
        break;
      }
      case 'importSave': {
        const inp = $('importFile');
        if (inp) inp.click();
        break;
      }
      case 'confirmCustomMin': {
        const inp = $('customMinInput');
        let v = Math.round(Number(inp ? inp.value : 0));
        if (!v || v < 1 || v > 180) {
          ui.toast('请输入 1–180 之间的分钟数', 2200);
          return;
        }
        ui.closeModal();
        selectDuration(v);
        ui.toast('这次专注 ' + v + ' 分钟', 1800);
        break;
      }
      case 'share': {
        ui.closeSheet();
        openShare();
        break;
      }
      case 'analytics': {
        ui.openAnalytics();
        break;
      }
      case 'resetData': {
        ui.openModal(
          '<h2 style="font-size:17px;margin-bottom:6px">确认重置存档？</h2>' +
          '<p class="tiny" style="line-height:1.7;margin-bottom:14px">会清空小鱼干、家具、服装、打卡和所有记录，小喵会回到最初的纸箱里。</p>' +
          '<div class="reward-actions"><button class="btn primary" data-action="confirmReset">确认重置</button>' +
          '<button class="btn ghost" data-action="closeModal">再想想</button></div>');
        break;
      }
      case 'confirmReset': {
        core.reset();
        app.session = null;
        clearSessionStore();
        try {
          localStorage.removeItem('peiduxiaomiao.quiz.v1');
          localStorage.removeItem(TODO_KEY);
          localStorage.removeItem('pdm.camAz');
          localStorage.removeItem('pdm.catHouseRot');
        } catch (e) {}
        // 待办草稿和混音台一起恢复出厂
        app.todoDraft = [];
        app.todoOpen = false;
        saveTodoDraft();
        if (PDM.audio) {
          PDM.audio.reset();
          updateSoundBtn();
        }
        if (PDM.quiz && PDM.quiz.reset) PDM.quiz.reset();
        if (PDM.room3d && PDM.room3d.resetCamera) PDM.room3d.resetCamera();
        app.selMin = 25;
        app.speed = core.state().settings.speed;
        app.reward = null;
        ui.closeModal();
        ui.closeSheet();
        ui.switchScreen('home');
        $('btnStart').disabled = false;
        $('btnStart').textContent = '开始陪读';
        $('btnStop').classList.add('hidden');
        $('btnPause').classList.add('hidden');
        $('durationChips').classList.remove('locked');
        $('screen-home').classList.remove('focusing');
        const cc = $('chipCustom');
        if (cc) { cc.textContent = '自定义'; cc.classList.remove('on'); }
        document.querySelectorAll('#durationChips button').forEach(b => b.classList.toggle('on', b.dataset.min === '25'));
        updateSpeedChip();
        updateModeUI();
        updatePetBar();
        updateTimerUI();
        refreshAll();
        setCatState('idle');
        ui.toast('存档已重置，小喵重新把纸箱拖出来了');
        break;
      }
      case 'closeModal': {
        ui.closeModal();
        break;
      }
      case 'closeReward': {
        closeReward();
        break;
      }
      case 'goFishing': {
        closeReward();
        ui.closeModal();
        if (PDM.fishing) PDM.fishing.open();
        break;
      }
      case 'adDouble': {
        if (!app.reward || app.rewarded) return;
        const st = core.state();
        const today = core.dateKey();
        if (st.adDoubleDate === today) {
          ui.toast('今天的广告加成已经用过了', 2000);
          return;
        }
        const extra = Math.round(app.reward.total * 0.5);
        openAd('看完这段模拟广告，本次奖励额外 +50%（每天一次）', () => {
          st.adDoubleDate = today;
          core.addBonusFish(extra, 'double');
          core.save();
          app.rewarded = true;
          closeReward();
          refreshAll();
          ui.toast('额外 +' + extra + ' 条小鱼干', 2600);
        });
        break;
      }
      case 'feedFood': {
        ui.closeSheet();
        feedCat(el.dataset.id);
        break;
      }
      case 'goals': {
        openGoals();
        break;
      }
      case 'claimDailyGoals': {
        const r = core.claimDailyGoals();
        if (!r.ok) { ui.toast(r.reason === 'claimed' ? '今天的目标奖励已经领过了' : '还有目标没完成', 2200); break; }
        refreshAll();
        ui.toast('今日目标完成 · +' + r.reward + ' 小鱼干', 2400);
        if (PDM.audio) PDM.audio.playSfx('coin');
        openGoals();
        break;
      }
      case 'claimWeeklyGoal': {
        const r = core.claimWeeklyGoal();
        if (!r.ok) { ui.toast(r.reason === 'claimed' ? '本周奖励已经领过了' : '本周专注天数还不够', 2200); break; }
        refreshAll();
        ui.toast('本周目标完成 · +' + r.reward + ' 小鱼干', 2400);
        if (PDM.audio) PDM.audio.playSfx('coin');
        openGoals();
        break;
      }
      case 'claimMail': {
        claimMail();
        break;
      }
      case 'toggleAmbient': {
        const on = PDM.audio ? PDM.audio.setOn(!PDM.audio.isOn()) : false;
        updateSoundBtn();
        const sw = el.classList.contains('switch') ? el : el.closest('.switch');
        if (sw) sw.classList.toggle('on', on);
        ui.toast(on ? '环境音已开启，可以叠着听' : '环境音已关闭', 1800);
        break;
      }
      case 'toggleSfx': {
        const on = PDM.audio ? PDM.audio.setSfx(!PDM.audio.isSfxOn()) : false;
        const sw = el.classList.contains('switch') ? el : el.closest('.switch');
        if (sw) sw.classList.toggle('on', on);
        ui.toast(on ? '轻音效已开启' : '轻音效已关闭', 1600);
        break;
      }
      case 'catHouseUpgrade': {
        const r = core.upgradeCatHouse();
        if (!r.ok) {
          ui.toast(r.reason === 'max' ? '已经是最高级猫屋' : r.reason === 'level' ? '等级还不够' : r.reason === 'furniture' ? '家具还不够' : r.reason === 'intimacy' ? '亲密度还不够，多陪陪小喵吧' : '小鱼干还不够', 2200);
          break;
        }
        if (PDM.room3d && PDM.room3d.setCatHouseTier) PDM.room3d.setCatHouseTier(r.tier);
        refreshAll();
        ui.toast('小猫屋升级为「' + r.name + '」', 2600);
        openCatHouseSheet();
        break;
      }
      case 'catHouseVisit': {
        ui.closeSheet();
        setTimeout(() => enterCatHouse(), 180);
        break;
      }
      case 'accItem': {
        const id = el.dataset.id;
        const a = core.accessoryById(id);
        if (!a) break;
        const owned = core.state().accessories.owned.indexOf(id) >= 0;
        if (!owned) {
          if (a.how !== 'shop') {
            ui.toast('「' + a.name + '」还没解锁：' + (a.cond || '完成对应条件'), 2600);
            break;
          }
          const r = core.buyAccessory(id);
          if (!r.ok) {
            ui.toast(r.reason === 'fish' ? '小鱼干还不够，再专注一会儿吧' : '这个配饰暂时买不了', 2200);
            break;
          }
          ui.toast('买下「' + a.name + '」并戴上了', 2200);
        } else {
          const r = core.equipAccessory(id);
          ui.toast(r.on ? '小喵戴上了「' + a.name + '」' : '摘下了「' + a.name + '」', 1800);
        }
        ui.closeModal();
        refreshAll();
        if (document.querySelector('#screen-shop.active')) ui.renderShop();
        break;
      }
      case 'themeItem': {
        const id = el.dataset.id;
        const t = core.themeById(id);
        if (!t) break;
        const owned = core.state().themes.indexOf(id) >= 0;
        if (!owned) {
          if (!(t.price > 0)) {
            ui.toast('连续打卡 ' + t.streak + ' 天后会自动解锁', 2400);
            break;
          }
          const r = core.buyTheme(id);
          if (!r.ok) {
            ui.toast(r.reason === 'fish' ? '小鱼干还不够，慢慢攒吧' : '暂时换不了这个主题', 2200);
            break;
          }
          ui.toast('换上了「' + t.name + '」', 2400);
        } else {
          core.equipTheme(id);
          ui.toast('小屋换成了「' + t.name + '」', 2000);
        }
        // 雨夜窗台顺手把细雨的混音推起来
        if (id === 'rainy' && PDM.audio) {
          try {
            const info = PDM.audio.mixerInfo();
            const rain = info.layers.find(l => l.id === 'rain');
            if (rain && rain.vol < 45) PDM.audio.setVolume('rain', 45);
            if (!PDM.audio.isOn()) PDM.audio.setOn(true);
            updateSoundBtn();
          } catch (e) {}
        }
        ui.closeModal();
        refreshAll();
        if (document.querySelector('#screen-shop.active')) ui.renderShop();
        break;
      }
      case 'tankFish': {
        const r = core.setTankFish(el.dataset.id);
        if (!r.ok) {
          ui.toast(r.reason === 'full' ? '鱼缸最多养 5 条，先取出一条吧' : '还没钓到这条鱼', 2200);
          break;
        }
        renderTank();
        if (document.querySelector('#screen-book.active')) ui.renderBook();
        ui.toast(r.in ? '小鱼游进角落的鱼缸里啦' : '小鱼从鱼缸里捞出来了', 1800);
        break;
      }
      case 'openTank': {
        openTankDex();
        break;
      }
      case 'openCountdown': {
        openCountdownSheet();
        break;
      }
      case 'saveCountdown': {
        saveCountdown();
        break;
      }
      case 'clearCountdown': {
        core.setCountdown('', '');
        ui.closeModal();
        renderCountdown();
        ui.toast('小立牌收起来了', 1800);
        break;
      }
      case 'shareWeek': {
        openWeekShare();
        break;
      }
      case 'confirmStop': {
        ui.closeModal();
        finishSession(false);
        break;
      }
      case 'goStart':
      case 'closeWelcome': {
        hideWelcome();
        break;
      }
      default:
        break;
    }
  }

  /* ---------------- 自由摆放 ---------------- */
  function setDecorMode(on) {
    app.decorMode = !!on;
    app.drag = null;
    if (on) app.decorUndo = [];
    if (PDM.room3d && PDM.room3d.setDecorating) PDM.room3d.setDecorating(!!on);
    const bar = $('decorBar');
    if (bar) bar.classList.toggle('hidden', !on);
    const tip = $('stageTip');
    if (tip) tip.classList.add('hidden');
    $('stageWrap').classList.toggle('decorating', !!on);
    const btn = $('btnDecor');
    if (btn) btn.classList.toggle('hidden', !!on);
    const hb = $('btnCatHouse');
    if (hb) hb.classList.toggle('hidden', !!on || (PDM.room3d && PDM.room3d.isFocused && PDM.room3d.isFocused()));
    const rb = $('btnRotate');
    if (rb) rb.classList.toggle('hidden', !app.use3d || !!on);
    const tl = $('btnTurnLeft');
    const tr = $('btnTurnRight');
    if (tl) tl.classList.toggle('hidden', !app.use3d);
    if (tr) tr.classList.toggle('hidden', !app.use3d);
    const bp = $('btnBlueprint');
    if (bp) bp.classList.toggle('hidden', !app.use3d);
  }

  function updateGoalChip() {
    const el = $('goalChip');
    if (!el) return;
    const info = core.goalInfo();
    const d = info.daily;
    const doneCount = [d.focus >= d.focusGoal, d.quiz >= d.quizGoal, d.fish >= d.fishGoal].filter(Boolean).length;
    el.textContent = d.claimed ? '今日目标已完成' : d.done ? '今日目标 · 可领取' : '今日目标 ' + doneCount + '/3';
    el.classList.toggle('ready', d.done && !d.claimed);
  }

  function openGoals() {
    const info = core.goalInfo();
    const d = info.daily, w = info.weekly;
    const row = (name, cur, goal) =>
      '<div class="kv-row"><span>' + name + '</span><b>' + Math.min(cur, goal) + ' / ' + goal + '</b></div>';
    ui.openSheet('今日目标',
      '<div class="panel-head"><h3>今天的小目标</h3><span class="hint">全部完成 +' + d.reward + '</span></div>' +
      row('专注 15 分钟', d.focus, d.focusGoal) +
      row('通过 1 关刷题', d.quiz, d.quizGoal) +
      row('钓到 1 条鱼', d.fish, d.fishGoal) +
      '<button class="btn primary" style="margin-top:10px" data-action="claimDailyGoals" ' + (d.done && !d.claimed ? '' : 'disabled') + '>' +
        (d.claimed ? '今日已领取' : d.done ? '领取 +' + d.reward + ' 鱼干' : '完成后再来领取') + '</button>' +
      '<div class="panel-head" style="margin-top:18px"><h3>本周目标</h3><span class="hint">+ ' + w.reward + '</span></div>' +
      '<div class="kv-row"><span>本周专注 5 天</span><b>' + Math.min(w.days, w.goal) + ' / ' + w.goal + '</b></div>' +
      '<button class="btn ghost" style="margin-top:10px" data-action="claimWeeklyGoal" ' + (w.days >= w.goal && !w.claimed ? '' : 'disabled') + '>' +
        (w.claimed ? '本周已领取' : w.days >= w.goal ? '领取 +' + w.reward + ' 鱼干' : '还差 ' + (w.goal - w.days) + ' 天') + '</button>' +
      '<div class="tiny" style="margin-top:14px;line-height:1.7">每日目标每天 0 点重置；本周目标按周一到周日计算。</div>');
  }

  function updatePetBar() {
    const st = core.state();
    const el = $('snackCount');
    if (el) el.textContent = String(st.snacks || 0);
    const stats = $('petStats');
    if (stats) {
      const lv = core.levelInfo().level;
      stats.classList.toggle('hidden', lv < 2);
      stats.textContent = '心情 ' + Math.round(st.mood || 0) + ' · 亲密 ' + Math.round(st.intimacy || 0);
    }
  }

  function foodToast(id) {
    if (id === 'fish') return '小喵吃掉猫鱼条，下一轮专注 +10% 小鱼干';
    if (id === 'milk') return '小喵喝下牛奶，今天心情不会掉了';
    if (id === 'cookie') return '小喵咬了口饼干，今天钓鱼多 1 杆';
    return '小喵吃得很开心';
  }

  function openFeedSheet() {
    const st = core.state();
    const rows = core.FOODS.map(f => {
      const n = st.foods[f.id] || 0;
      return '<div class="kv-row"><div><b>' + f.name + '</b><div class="tiny">' + f.desc + '</div></div>' +
        '<button class="btn ' + (n > 0 ? 'primary' : 'ghost') + '" data-action="feedFood" data-id="' + f.id + '"' +
        (n > 0 ? '' : ' disabled') + '>' + (n > 0 ? '喂 · 剩 ' + n : '没有') + '</button></div>';
    }).join('');
    ui.openSheet('投喂小喵', '<div class="kv-list">' + rows + '</div>' +
      '<p class="tiny" style="margin-top:10px;line-height:1.7">完成一次专注会得到免费猫鱼条；牛奶和饼干可以在商店补充。</p>');
  }

  function petCat() {
    if (PDM.room3d && app.use3d) PDM.room3d.stopCat();
    app.petUntil = performance.now() + 2600;
    setCatState('pet');
    core.interact('pet');
    updatePetBar();
    if (PDM.audio) PDM.audio.playSfx('purr');
    showBubble(randOf(BUBBLE.pet));
    app.bubbleAt = performance.now() + 26000;
    showStageTip('呼噜呼噜…小喵把头蹭过来', 1900);
  }

  function feedCat(id) {
    if (app.eatPending) return;
    const st = core.state();
    if ((st.snacks || 0) <= 0) {
      ui.toast('完成一次专注，就能拿到免费猫鱼条', 2400);
      return;
    }
    if (!id) {
      openFeedSheet();
      return;
    }
    const fed = core.useFood(id);
    if (!fed) {
      ui.toast('这份零食已经吃完了', 2000);
      return;
    }
    updatePetBar();
    ui.toast(foodToast(fed), 2600);
    if (!app.use3d || !PDM.room3d) {
      app.eatUntil = performance.now() + 2200;
      setCatState('eat');
      showStageTip('小喵吃得很满足', 1600);
      return;
    }
    app.eatPending = true;
    app.eatUntil = 0;
    PDM.room3d.feedSnack(-.12, .36);
    PDM.room3d.moveCatTo(-.14, .28, () => {
      app.eatUntil = performance.now() + 2600;
      setCatState('eat');
      PDM.room3d.clearSnack();
      setTimeout(() => { app.eatPending = false; }, 2800);
    });
    showStageTip('小喵闻到香味，正走过去', 1800);
  }

  function playCat() {
    core.interact('play');
    updatePetBar();
    if (!app.use3d || !PDM.room3d) {
      app.playUntil = performance.now() + 2200;
      setCatState('play');
      showStageTip('毛线球滚起来了', 1600);
      return;
    }
    PDM.room3d.playToy();
    PDM.room3d.moveCatTo(.24, .44, () => {
      app.playUntil = performance.now() + 2600;
      setCatState('play');
      showStageTip('毛线球滚起来了', 1600);
    });
  }

  function rotateCurrent() {
    if (PDM.room3d && PDM.room3d.isFocused()) {
      PDM.room3d.rotateHouse();
      ui.toast('猫屋换了个朝向');
      return;
    }
    const id = (PDM.room3d && PDM.room3d.selected && PDM.room3d.selected()) || app.lastTouched;
    if (!id) { ui.toast('先点一下要旋转的家具'); return; }
    const item = core.itemById(id);
    if (!item) return;
    if (app.decorMode) app.decorUndo.push(JSON.stringify(core.state().layout || {}));
    core.rotateItem(id, 90);
    ui.toast('「' + item.name + '」转了个方向');
  }

  function openCatHouseSheet() {
    const info = core.catHouseInfo();
    const tiers = core.CAT_HOUSE_TIERS.map(t => {
      const cur = t.tier === info.tier;
      const locked = t.tier > info.tier;
      return '<div class="kv-row"><span>' + (cur ? '● ' : locked ? '○ ' : '✓ ') + t.name + '</span><b>' + (cur ? '当前' : locked ? '未解锁' : '已解锁') + '</b></div>';
    }).join('');
    const next = info.next;
    const req = next
      ? '<div class="tiny" style="margin:10px 0;line-height:1.8">升级需要：Lv.' + next.level + ' · 家具 ' + next.furniture + ' 件 · 亲密 ' + next.intimacy + '<br>当前：Lv.' + info.level + ' · 家具 ' + info.furniture + ' 件 · 亲密 ' + Math.round(info.intimacy) + '</div>'
      : '<div class="tiny" style="margin:10px 0">已经是最高级猫屋啦。</div>';
    ui.openSheet('小猫屋', tiers + req +
      (next ? '<button class="btn primary" data-action="catHouseUpgrade" ' + (info.canUpgrade ? '' : 'disabled') + '>升级到「' + next.name + '」</button>' : '') +
      '<button class="btn ghost" style="margin-top:8px" data-action="catHouseVisit">进去看看</button>');
  }

  function enterCatHouse() {
    if (!PDM.room3d || !PDM.room3d.isAvailable()) {
      ui.toast('小猫屋需要 3D 模式才能参观哦');
      return;
    }
    PDM.room3d.focusCatHouse();
    $('btnCatHouse').classList.add('hidden');
    $('btnBackRoom').classList.remove('hidden');
    $('btnDecor').classList.add('hidden');
    $('btnRotate').textContent = '旋转猫屋';
    ui.toast('小喵的小屋，点「返回书屋」回去', 2200);
  }

  function exitCatHouse() {
    if (PDM.room3d) PDM.room3d.resetCamera();
    $('btnCatHouse').classList.remove('hidden');
    $('btnBackRoom').classList.add('hidden');
    $('btnDecor').classList.remove('hidden');
    $('btnRotate').textContent = '旋转';
  }

  // 同一格已有物品时，自动错开一点，避免新物品和旧的完全重叠
  function findFreeSpot(spot, slot) {
    const st = core.state();
    const list = Object.keys(st.layout || {})
      .filter(k => {
        const it = core.itemById(k);
        return it && it.slot === slot;
      })
      .map(k => st.layout[k]);
    const near = (a, x, y) => Math.abs(a.x - x) < .09 && Math.abs(a.y - y) < .09;
    let x = spot.x, y = spot.y, i = 0;
    while (list.some(e => near(e, x, y)) && i < 24) {
      const ang = i * 1.9, r = .07 + i * .018;
      x = Math.max(.08, Math.min(.92, spot.x + Math.cos(ang) * r));
      y = Math.max(.08, Math.min(.92, spot.y + Math.sin(ang) * r));
      i++;
    }
    return { x: x, y: y, k: spot.k };
  }

  function pickPlacement(cx, cy) {
    const list = PDM.room.placements || [];
    let best = null, bestD = Infinity;
    list.forEach(p => {
      const dx = Math.abs(cx - p.x);
      const dy = cy - p.y;
      if (dx > 58 * p.scale) return;
      if (dy < -110 * p.scale || dy > 42 * p.scale) return;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = p; }
    });
    return best;
  }

  function bindDecorDrag() {
    const wrap = $('stageWrap');
    let lastHover = 0;
    if (wrap) {
      wrap.addEventListener('pointermove', e => {
        if (app.use3d && PDM.room3d && PDM.room3d.isActive()) PDM.room3d.setPointer(e.clientX, e.clientY);
      });
    }
    ['room', 'room3d'].forEach(id => {
      const canvas = $(id);
      if (!canvas) return;
      canvas.style.touchAction = 'none';
      const use3d = () => app.use3d && PDM.room3d && PDM.room3d.isActive();

      canvas.addEventListener('pointerdown', e => {
        // 3D 小屋：不用进「自由摆放」也能直接拖家具
        if (use3d()) {
          if (PDM.room3d.pickCat(e.clientX, e.clientY)) {
            petCat();
            e.preventDefault();
            return;
          }
          const prop = PDM.room3d.pickProp(e.clientX, e.clientY);
          if (prop) {
            if (prop === 'bowl') feedCat();
            else playCat();
            e.preventDefault();
            return;
          }
          const hit = PDM.room3d.pick(e.clientX, e.clientY);
          if (hit && app.decorMode) {
            app.lastTouched = hit.id;
            const before = JSON.stringify(core.state().layout || {});
            if (!PDM.room3d.beginDrag(e.clientX, e.clientY)) return;
            app.drag = { id: hit.id, before: before };
            try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
          }
          if (PDM.room3d.pickCatHouse(e.clientX, e.clientY)) {
            enterCatHouse();
            e.preventDefault();
            return;
          }
          // 拖动空白处环绕旋转整个小屋
          PDM.room3d.beginOrbit(e.clientX, e.clientY);
          try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
          canvas.style.cursor = 'grabbing';
          e.preventDefault();
          return;
        }
        if (!app.decorMode) return;
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
        const p = pickPlacement(cx, cy);
        if (!p) return;
        app.drag = { id: p.id, ox: cx - p.x, oy: cy - p.y, before: JSON.stringify(core.state().layout || {}) };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });

      canvas.addEventListener('pointermove', e => {
        if (use3d()) {
          if (PDM.room3d.dragging()) {
            PDM.room3d.moveDrag(e.clientX, e.clientY);
            e.preventDefault();
            return;
          }
          if (PDM.room3d.isOrbiting()) {
            PDM.room3d.moveOrbit(e.clientX, e.clientY);
            e.preventDefault();
            return;
          }
          const now = performance.now();
          if (now - lastHover > 100) {
            lastHover = now;
            const isPet = PDM.room3d.pickCat(e.clientX, e.clientY) || PDM.room3d.pickProp(e.clientX, e.clientY);
            canvas.style.cursor = isPet || PDM.room3d.pickCatHouse(e.clientX, e.clientY) ? 'pointer' : 'grab';
          }
          return;
        }
        if (!app.drag) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) - app.drag.ox) / (app.W || rect.width);
        const y = ((e.clientY - rect.top) - app.drag.oy) / (app.H || rect.height);
        core.setPlacement(app.drag.id, x, y, null, { save: false });
        e.preventDefault();
      });

      const endDrag = e => {
        if (use3d()) {
          if (PDM.room3d.dragging()) {
            PDM.room3d.endDrag();
            if (app.drag && app.drag.before && app.drag.before !== JSON.stringify(core.state().layout || {})) {
              app.decorUndo.push(app.drag.before);
            }
            app.drag = null;
            canvas.style.cursor = 'grab';
            if (e) e.preventDefault();
          } else if (PDM.room3d.isOrbiting()) {
            PDM.room3d.endOrbit();
            canvas.style.cursor = 'grab';
            if (e) e.preventDefault();
          }
          return;
        }
        if (!app.drag) return;
        const before = app.drag.before;
        core.save();
        if (before && before !== JSON.stringify(core.state().layout || {})) app.decorUndo.push(before);
        app.drag = null;
        if (e) e.preventDefault();
      };
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);

      canvas.addEventListener('wheel', e => {
        if (!use3d()) return;
        PDM.room3d.zoomBy(e.deltaY);
        e.preventDefault();
      }, { passive: false });
    });
  }

  function bindStatic() {
    bindDecorDrag();
    $('btnStart').addEventListener('click', startSession);
    $('btnStop').addEventListener('click', () => {
      if (!app.session) return;
      const remain = sessionRemainSec();
      const doneMin = Math.floor((app.session.durationSec - remain) / 60);
      ui.openModal(
        '<h2 style="font-size:17px;margin-bottom:6px">要提前结束吗？</h2>' +
        '<p class="tiny" style="line-height:1.7;margin-bottom:14px">已经专注的 ' + doneMin + ' 分钟会计入记录，' +
        (app.session.mode === 'strict' ? '严格模式离开也继续计时并计入。' : '自由模式离开会自动暂停。') +
        '小猫不会生气。</p>' +
        '<div class="reward-actions"><button class="btn primary" data-action="confirmStop">结束这次陪读</button>' +
        '<button class="btn ghost" data-action="closeModal">继续专注</button></div>');
    });
    $('btnDecor').addEventListener('click', () => ui.openDecor(null));
    $('btnCatHouse').addEventListener('click', openCatHouseSheet);
    $('btnBackRoom').addEventListener('click', exitCatHouse);
    $('btnRotate').addEventListener('click', rotateCurrent);
    $('btnTurnLeft').addEventListener('click', () => {
      if (PDM.room3d && PDM.room3d.rotateRoom) PDM.room3d.rotateRoom(-Math.PI / 2);
    });
    $('btnTurnRight').addEventListener('click', () => {
      if (PDM.room3d && PDM.room3d.rotateRoom) PDM.room3d.rotateRoom(Math.PI / 2);
    });
    $('btnBlueprint').addEventListener('click', () => {
      if (PDM.room3d && PDM.room3d.toggleBlueprint) {
        const on = PDM.room3d.toggleBlueprint();
        ui.toast(on ? '已切换到俯视平面图' : '已回到陪读视角', 1600);
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'r' && e.key !== 'R') return;
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (!app.use3d) return;
      rotateCurrent();
    });
    $('btnSettings').addEventListener('click', () => ui.openSettings());
    $('btnSound').addEventListener('click', openMixer);
    $('btnMail').addEventListener('click', openMail);
    $('todoHead').addEventListener('click', () => {
      if (app.session) return;
      app.todoOpen = !app.todoOpen;
      renderTodos();
    });
    $('todoList').addEventListener('click', e => {
      const item = e.target.closest('[data-todo]');
      if (item) { toggleTodo(Number(item.dataset.todo)); return; }
      if (e.target.closest('[data-action="todoAdd"]')) { addTodoRow(); return; }
      const del = e.target.closest('[data-action="todoDel"]');
      if (del) { delTodoRow(Number(del.dataset.idx)); return; }
    });
    $('todoList').addEventListener('input', e => {
      const inp = e.target.closest('.todo-input');
      if (!inp) return;
      app.todoDraft[Number(inp.dataset.todoIn)] = inp.value.slice(0, 30);
      saveTodoDraft();
      const countEl = $('todoCount');
      if (countEl) countEl.textContent = app.todoDraft.filter(t => String(t || '').trim()).length + '/3';
    });
    document.addEventListener('input', e => {
      const sl = e.target.closest('.mix-slider');
      if (!sl || !PDM.audio) return;
      const id = sl.dataset.mix;
      const v = PDM.audio.setVolume(id, sl.value);
      const val = $('mixVal-' + id);
      if (val) val.textContent = v + '%';
    });
    document.addEventListener('change', e => {
      if (e.target && e.target.id === 'importFile') importSave();
    });
    // 首次手势后再创建 AudioContext，避免浏览器拦截自动播放
    const unlockAudio = () => { if (PDM.audio) PDM.audio.ensure(); };
    document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    // 通用按钮点击音效（宠物按钮自己播呼噜，待办勾选自己播叮咚）
    document.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.pet || b.hasAttribute('data-todo')) return;
      if (PDM.audio) PDM.audio.playSfx('click');
    }, true);
    $('btnShare').addEventListener('click', openShare);
    $('speedChip').addEventListener('click', toggleSpeed);
    $('durationChips').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.min === 'custom') { openCustomDuration(); return; }
      selectDuration(Number(b.dataset.min));
    });
    $('btnPause').addEventListener('click', () => { if (app.session) togglePause(); });
    const tagEl = $('taskTag');
    if (tagEl) {
      tagEl.value = core.state().settings.lastTag || '阅读';
      tagEl.addEventListener('change', () => {
        core.state().settings.lastTag = tagEl.value;
        core.save();
      });
    }
    $('studyModes').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      setStudyMode(b.dataset.mode);
    });
    $('petBar').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.pet === 'pet') petCat();
      else if (b.dataset.pet === 'feed') openFeedSheet();
      else if (b.dataset.pet === 'play') playCat();
    });
    window.addEventListener('pagehide', persistSession);
    $('shopBody').addEventListener('click', () => {});
    $('welcomeStart').addEventListener('click', hideWelcome);
    $('adClaim').addEventListener('click', claimAd);
    $('shareSave').addEventListener('click', saveShare);
    $('shareNative').addEventListener('click', nativeShare);
    $('shareClose').addEventListener('click', () => $('shareWrap').classList.remove('show'));
    $('comicClose').addEventListener('click', ui.closeComic);
    $('comicPrev').addEventListener('click', ui.comicPrev);
    $('comicNext').addEventListener('click', ui.comicNext);
    $('rewardWrap').addEventListener('click', e => {
      if (e.target === $('rewardWrap')) closeReward();
    });
    $('welcomeWrap').addEventListener('click', e => {
      if (e.target === $('welcomeWrap')) hideWelcome();
    });

    document.addEventListener('click', e => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      if (action === 'closeModal' || action === 'confirmReset' || action === 'confirmStop' || action === 'adDouble' || action.startsWith('ad') || action.startsWith('buy') || action.startsWith('decor') || action === 'openDecor' || action === 'comic' || action === 'makeup' || action === 'toggleSpeed' || action === 'toggleBreak' || action === 'exportSave' || action === 'confirmCustomMin' || action === 'share' || action === 'analytics' || action === 'resetData' || action === 'closeReward' || action === 'goShop' || action === 'wearOutfit' || action === 'closeWelcome' || action === 'goStart' || action === 'goFishing' || action === 'goals' || action === 'claimDailyGoals' || action === 'claimWeeklyGoal' || action === 'catHouseUpgrade' || action === 'catHouseVisit' || action === 'feedFood' || action === 'claimMail' || action === 'toggleAmbient' || action === 'toggleSfx' || action === 'accItem' || action === 'themeItem' || action === 'tankFish' || action === 'openTank' || action === 'openCountdown' || action === 'saveCountdown' || action === 'clearCountdown' || action === 'shareWeek' || action === 'importSave') {
        if (el.tagName === 'BUTTON' || el.classList.contains('switch') || el.dataset.action === 'openDecor') e.preventDefault();
        handleAction(action, el);
      }
    });

    document.addEventListener('visibilitychange', () => {
      // 切后台时挂起音频，回来再继续，避免后台一直响
      if (PDM.audio) {
        if (document.hidden) PDM.audio.suspend();
        else PDM.audio.resume();
      }
      if (!app.session) return;
      if (app.session.pausedAt) return;
      if (document.hidden) {
        app.session.hiddenAt = Date.now();
        persistSession();
      } else if (app.session.hiddenAt) {
        const away = Date.now() - app.session.hiddenAt;
        app.session.hiddenAt = 0;
        if (away > 900) {
          app.session.left = true;
          app.session.awayMs += away;
          app.awaySleepUntil = performance.now() + 2600;
          setCatState('sleep');
          ui.toast(app.session.mode === 'strict'
            ? '严格模式：离开的 ' + Math.round(away / 1000) + ' 秒继续计时'
            : '小猫见你离开，先睡了一小会儿', 2400);
          updateTimerUI();
        }
        persistSession();
      }
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    core.load();
    loadTodoDraft();
    app.debug = /(?:\?|&)debug=1(?:&|$)/.test(location.search);
    const savedSpeed = Number(core.state().settings.speed) || 1;
    app.speed = app.debug ? (savedSpeed > 1 ? savedSpeed : 1) : 1;
    // 非调试启动一律真实计时，并清掉旧存档里被演示倍速污染的字段
    if (!app.debug && core.state().settings.speed !== 1) {
      core.state().settings.speed = 1;
      core.save();
    }
    ui.init();
    ensureDailyMail();
    core._onAchievements = list => {
      if (!list || !list.length) return;
      if (app.settling) return; // 结算卡里统一展示
      const names = list.map(a => a.name).join('、');
      const fish = list.reduce((s, a) => s + (a.reward || 0), 0);
      ui.toast('成就达成 · ' + names + (fish > 0 ? ' · +' + fish + ' 鱼干' : ''), 3200);
    };
    setupCanvas();
    bindStatic();
    updateSpeedChip();
    updateModeUI();
    updatePetBar();
    updateSoundBtn();
    updateTimerUI();
    setCatState('idle');
    app.catNextAt = performance.now() + 7000;
    app.bubbleAt = performance.now() + 18000;
    refreshAll();
    renderTodos();
    core.logEvent('open', {});
    core.save();
    restoreSession();
    setInterval(() => {
      if (app.session) {
        updateTimerUI();
        const s = app.session;
        if (!s) { tickCat(performance.now()); return; }
        if (Date.now() - lastSessionSave > 1000) {
          lastSessionSave = Date.now();
          persistSession();
        }
        if (!s.pausedAt && core.state().settings.breakRemind !== false) {
          const activeMin = Math.floor(activeElapsedMs(s) / 60000 * app.speed);
          const nextMark = ((s.breakShown || 0) + 1) * 25;
          if (activeMin >= nextMark && activeMin < nextMark + 25) {
            s.breakShown = (s.breakShown || 0) + 1;
            ui.toast('已经专注 ' + nextMark + ' 分钟，起来活动一下、看看远处吧', 3600);
            setCatState('stretch');
            app.catNextAt = performance.now() + 5200;
          }
        }
      }
      tickCat(performance.now());
    }, 250);
    if (!core.state().settings.welcomeDone) {
      setTimeout(showWelcome, 350);
    } else {
      setTimeout(maybeAutoMail, 1300);
    }
  }

  PDM.app = {
    boot: boot,
    startSession: startSession,
    refreshAll: refreshAll,
    state: app
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.PDM);
