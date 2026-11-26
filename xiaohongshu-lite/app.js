/* 陪读小喵 · 小红书轻量版
   单页、离线、无网络请求；存档走容器 Storage（window.xhs），不可用时只保留内存态。 */
(function () {
  'use strict';

  /* ---------------- 存储 ---------------- */
  const KEY = 'pdm.lite.v1';
  const $ = function (id) { return document.getElementById(id); };

  const storage = {
    load: function (cb) {
      const xhs = window.xhs;
      if (!xhs || typeof xhs.getStorage !== 'function') { cb(''); return; }
      let done = false;
      const finish = function (v) { if (!done) { done = true; cb(v || ''); } };
      try {
        const p = xhs.getStorage({
          key: KEY,
          success: function (res) { finish(res && res.data); },
          fail: function () { finish(''); }
        });
        if (p && typeof p.then === 'function') {
          p.then(function (res) { finish(res && res.data); })['catch'](function () { finish(''); });
        }
      } catch (e) { finish(''); }
    },
    save: function (text) {
      const xhs = window.xhs;
      if (!xhs || typeof xhs.setStorage !== 'function') return;
      try {
        const p = xhs.setStorage({ key: KEY, data: text });
        if (p && typeof p['catch'] === 'function') p['catch'](function () {});
      } catch (e) {}
    }
  };

  function dateKey(ts) {
    const d = ts ? new Date(ts) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function defState() {
    return {
      fish: 0, minutes: 0, day: dateKey(), todayMinutes: 0, days: [],
      outfit: 'default', owned: ['default'], fishCounts: {}, bait: false
    };
  }

  function normalizeState() {
    if (!S.owned || !Array.isArray(S.owned)) S.owned = ['default'];
    if (S.owned.indexOf('default') < 0) S.owned.unshift('default');
    if (!S.outfit) S.outfit = 'default';
    if (!S.fishCounts || typeof S.fishCounts !== 'object') S.fishCounts = {};
    S.bait = !!S.bait;
  }

  let S = defState();
  let ready = false;

  function save() {
    if (!ready) return;
    storage.save(JSON.stringify(S));
  }

  function rolloverDay() {
    const t = dateKey();
    if (S.day !== t) { S.day = t; S.todayMinutes = 0; save(); }
  }

  function levelOf(minutes) { return Math.floor(minutes / 60) + 1; }

  function streakOf() {
    const set = {};
    S.days.forEach(function (d) { set[d] = true; });
    let k = dateKey();
    if (!set[k]) {
      const y = dateKey(Date.now() - 86400000);
      if (!set[y]) return 0;
      k = y;
    }
    let n = 0;
    let cur = new Date(k + 'T00:00:00');
    while (set[dateKey(cur.getTime())]) {
      n++;
      cur = new Date(cur.getTime() - 86400000);
    }
    return n;
  }

  /* ---------------- 通用 UI ---------------- */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function openModal(html) {
    $('modalCard').innerHTML = html;
    $('modal').classList.remove('hidden');
  }
  function closeModal() { $('modal').classList.add('hidden'); }

  function switchScreen(name) {
    document.querySelectorAll('.tab').forEach(function (b) {
      b.classList.toggle('on', b.dataset.screen === name);
    });
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.toggle('active', s.id === 'screen-' + name);
    });
    if (name === 'fish') { layoutPond(); syncCastBtn(); }
    if (name === 'shop') { normalizeState(); renderShop(); }
    if (name === 'dex') { normalizeState(); renderDex(); }
  }

  function refreshHeader() {
    $('fishCount').textContent = S.fish;
    $('levelText').textContent = 'Lv.' + levelOf(S.minutes);
    $('meta').textContent = '今日 ' + S.todayMinutes + ' 分钟 · 连续 ' + streakOf() + ' 天';
  }

  /* ---------------- 小猫 ---------------- */
  const CATS = {
    idle: 'assets/cat/cat_idle.png',
    read: 'assets/cat/cat_read.png',
    cheer: 'assets/cat/cat_cheer.png',
    sleep: 'assets/cat/cat_sleep.png',
    surprise: 'assets/cat/cat_surprise.png',
    sad: 'assets/cat/cat_sad.png',
    pat: 'assets/cat/cat_pat.png',
    fish: 'assets/cat/cat_fish.png',
    yawn: 'assets/cat/cat_yawn.png',
    curious: 'assets/cat/cat_curious.png',
    blink: 'assets/cat/cat_blink.png',
    pj: 'assets/cat/cat_pj.png',
    academy: 'assets/cat/cat_academy.png',
    festival: 'assets/cat/cat_festival.png',
    rain: 'assets/cat/cat_rain.png',
    scarf: 'assets/cat/cat_scarf.png'
  };
  const preload = {};
  Object.keys(CATS).forEach(function (k) {
    const img = new Image();
    img.src = CATS[k];
    preload[k] = img;
  });

  let catTimer = 0;
  function baseMood() {
    const s = timer.session;
    if (!s) return 'idle';
    return s.pausedAt ? 'sleep' : 'read';
  }
  const BASE_MOODS = { idle: 1, read: 1, sleep: 1, curious: 1, blink: 1 };
  function setCat(mood) {
    const img = $('cat');
    let key = mood;
    if (S.outfit !== 'default' && BASE_MOODS[mood] && CATS[S.outfit]) key = S.outfit;
    img.src = CATS[key] || CATS.idle;
    img.classList.toggle('sleep', mood === 'sleep');
  }
  function flashCat(mood, ms) {
    setCat(mood);
    clearTimeout(catTimer);
    catTimer = setTimeout(function () { setCat(baseMood()); }, ms || 2000);
  }

  let blinkTimer = 0;
  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(function () {
      const src = $('cat').src;
      let back = '';
      if (src.indexOf('cat_idle') >= 0) back = 'idle';
      else if (src.indexOf('cat_read') >= 0) back = 'read';
      else if (src.indexOf('cat_curious') >= 0) back = 'curious';
      if (back) {
        setCat('blink');
        setTimeout(function () { setCat(back); }, 140);
      }
      scheduleBlink();
    }, 2600 + Math.random() * 3200);
  }

  /* ---------------- 专注计时 ---------------- */
  const timer = { session: null, selMin: 25, iv: 0 };

  function remainSec() {
    const s = timer.session;
    if (!s) return timer.selMin * 60;
    const now = s.pausedAt || Date.now();
    return Math.max(0, s.durSec - (now - s.startedAt - s.pausedMs) / 1000);
  }

  function fmt(sec) {
    const t = Math.max(0, Math.ceil(sec));
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }

  function renderTimer() {
    const s = timer.session;
    const timeEl = $('timeText');
    timeEl.textContent = s ? fmt(remainSec()) : String(timer.selMin).padStart(2, '0') + ':00';
    timeEl.classList.toggle('dim', !s);
    $('bar').style.width = (s ? Math.min(100, (1 - remainSec() / s.durSec) * 100) : 0) + '%';
    if (s) $('stateText').textContent = s.pausedAt ? '已暂停 · 小喵在等你回来' : '小猫在认真陪读';
  }

  function resetTimerUI() {
    $('btnStart').disabled = false;
    $('btnStart').textContent = '开始陪读';
    $('btnPause').classList.add('hidden');
    $('btnPause').textContent = '暂停';
    $('btnStop').classList.add('hidden');
    $('chips').classList.remove('locked');
    $('stateText').textContent = '小喵在等你开始';
  }

  function startSession() {
    if (timer.session) return;
    const min = timer.selMin;
    timer.session = { durSec: min * 60, startedAt: Date.now(), pausedMs: 0, pausedAt: 0 };
    $('btnStart').disabled = true;
    $('btnStart').textContent = '专注中…';
    $('btnPause').classList.remove('hidden');
    $('btnStop').classList.remove('hidden');
    $('chips').classList.add('locked');
    setCat('read');
    $('stateText').textContent = '小猫在认真陪读';
    toast(min + ' 分钟，开始啦');
    clearInterval(timer.iv);
    timer.iv = setInterval(tick, 250);
    renderTimer();
  }

  function tick() {
    if (!timer.session) return;
    if (!timer.session.pausedAt && remainSec() <= 0) { finish(true); return; }
    renderTimer();
  }

  function togglePause() {
    const s = timer.session;
    if (!s) return;
    if (s.pausedAt) {
      s.pausedMs += Date.now() - s.pausedAt;
      s.pausedAt = 0;
      $('btnPause').textContent = '暂停';
      setCat('read');
    } else {
      s.pausedAt = Date.now();
      $('btnPause').textContent = '继续';
      setCat('sleep');
    }
    renderTimer();
  }

  function finish(completed) {
    const s = timer.session;
    if (!s) return;
    const active = ((s.pausedAt || Date.now()) - s.startedAt - s.pausedMs) / 1000;
    let minutes = completed ? Math.round(s.durSec / 60) : Math.floor(active / 60);
    minutes = Math.max(0, Math.min(minutes, s.durSec / 60));

    timer.session = null;
    clearInterval(timer.iv);
    resetTimerUI();
    renderTimer();

    if (minutes < 1) {
      setCat('idle');
      refreshHeader();
      toast('这次只坐了一小会儿，小猫下次还等你');
      return;
    }

    rolloverDay();
    const today = dateKey();
    S.fish += minutes;
    S.minutes += minutes;
    S.todayMinutes += minutes;
    if (S.days.indexOf(today) < 0) S.days.push(today);
    save();

    if (!completed) flashCat('sad', 4200);
    else if (minutes >= 45) flashCat('yawn', 3600);
    else flashCat('cheer', 4200);
    refreshHeader();
    showReward(minutes, minutes, completed);
  }

  function showReward(minutes, gained, completed) {
    openModal(
      '<h2>' + (completed ? '陪读完成' : '这次先到这里') + '</h2>' +
      '<p class="sub">' + minutes + ' 分钟 · 连续 ' + streakOf() + ' 天</p>' +
      '<div class="rows">' +
      '<div class="row"><span>专注时长</span><b>' + minutes + ' 分钟</b></div>' +
      '<div class="row"><span>获得小鱼干</span><b>+' + gained + '</b></div>' +
      '<div class="row"><span>今日累计</span><b>' + S.todayMinutes + ' 分钟</b></div>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn primary" data-act="again">再来一轮</button>' +
      '<button class="btn ghost" data-act="fish">去鱼塘</button>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:8px">' +
      '<button class="btn ghost" data-act="share">生成分享卡</button>' +
      '<button class="btn ghost" data-act="close">收下</button>' +
      '</div>'
    );
  }

  /* ---------------- 分享卡 ---------------- */
  let shareKind = 'report';
  function openShare(kind) {
    shareKind = kind === 'fish' ? 'fish' : 'report';
    openModal(
      '<h2>' + (shareKind === 'fish' ? '今天的鱼篓' : '今日战报') + '</h2>' +
      '<p class="sub">截图保存，写笔记时可以直接用</p>' +
      '<div class="share-box"><canvas id="shareCanvas"></canvas></div>' +
      '<div class="share-hint">长按图片或直接截图保存</div>' +
      '<div class="modal-actions"><button class="btn ghost" data-act="close">关闭</button></div>'
    );
    drawShare();
  }

  function drawShare() {
    const cv = $('shareCanvas');
    if (!cv) return;
    const W = 600, H = 800;
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFF7EC');
    g.addColorStop(1, '#FBE6D4');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    c.textAlign = 'center';
    c.fillStyle = '#5B4A42';
    c.font = '700 30px "PingFang SC", sans-serif';
    c.fillText(shareKind === 'fish' ? '陪读小喵 · 今日鱼获' : '陪读小喵 · 今日战报', W / 2, 84);

    const img = shareKind === 'fish' ? preload.fish : preload.idle;
    if (img && img.complete && img.naturalWidth) {
      c.drawImage(img, W / 2 - 150, 128, 300, 300);
    }

    if (shareKind === 'fish') {
      c.fillStyle = '#5B4A42';
      c.font = '700 62px "PingFang SC", sans-serif';
      c.fillText(P.caught.length + ' 条鱼', W / 2, 520);
      c.fillStyle = '#9C8A7E';
      c.font = '400 24px "PingFang SC", sans-serif';
      const names = P.caught.slice(0, 4).map(function (sp) { return sp.name; }).join(' · ');
      c.fillText(names || '这次空军，小猫下次再努力', W / 2, 566);
      c.fillText('换到 ' + P.total + ' 小鱼干 · 累计 ' + S.fish, W / 2, 606);
    } else {
      c.fillStyle = '#5B4A42';
      c.font = '700 62px "PingFang SC", sans-serif';
      c.fillText(S.todayMinutes + ' 分钟', W / 2, 520);
      c.fillStyle = '#9C8A7E';
      c.font = '400 24px "PingFang SC", sans-serif';
      c.fillText('累计 ' + S.minutes + ' 分钟 · 连续 ' + streakOf() + ' 天 · 小鱼干 ' + S.fish, W / 2, 568);
    }

    c.fillStyle = '#C4705A';
    c.font = '500 22px "PingFang SC", sans-serif';
    c.fillText('小猫一直陪着你', W / 2, 690);
  }

  /* ---------------- 鱼塘 ---------------- */
  const RARITY = { common: '普通', rare: '稀有', epic: '史诗', legend: '传说' };

  const SPECIES = [
    { id: 'crucian', name: '小鲫鱼', value: 1, w: 26, rarity: 'common' },
    { id: 'loach', name: '小泥鳅', value: 1, w: 20, rarity: 'common' },
    { id: 'bighead', name: '胖头鱼', value: 2, w: 16, rarity: 'common' },
    { id: 'koi', name: '锦鲤', value: 3, w: 12, rarity: 'rare' },
    { id: 'mandarin', name: '鳜鱼', value: 4, w: 8, rarity: 'rare' },
    { id: 'silver', name: '银鲴鱼', value: 4, w: 7, rarity: 'rare' },
    { id: 'puffer', name: '河豚', value: 5, w: 5, rarity: 'epic' },
    { id: 'lantern', name: '灯笼鱼', value: 6, w: 4, rarity: 'epic' },
    { id: 'butterfly', name: '蝴蝶鱼', value: 6, w: 3, rarity: 'epic' },
    { id: 'arowana', name: '金龙鱼', value: 8, w: 2, rarity: 'legend' },
    { id: 'sturgeon', name: '中华鲟', value: 10, w: 1.2, rarity: 'legend' },
    { id: 'moon', name: '月光鱼', value: 12, w: 0.8, rarity: 'legend' }
  ];

  const OUTFITS = [
    { id: 'default', name: '素色', price: 0, desc: '原本的样子' },
    { id: 'pj', name: '睡衣', price: 30, desc: '准备睡觉的柔软' },
    { id: 'academy', name: '学院服', price: 60, desc: '认真学习的小猫' },
    { id: 'festival', name: '节日装', price: 90, desc: '过节才舍得穿' },
    { id: 'rain', name: '小雨衣', price: 120, desc: '下雨也陪你出门' },
    { id: 'scarf', name: '蓝围巾', price: 150, desc: '冬天也不怕冷' }
  ];

  const BAIT = { id: 'bait', name: '高级鱼饵', price: 200, desc: '永久提高稀有鱼出现概率' };

  const P = { phase: 'idle', casts: 3, biteAt: 0, biteUntil: 0, nextAt: 0, caught: [], total: 0 };

  const cv = $('pond');
  const ctx = cv.getContext('2d');
  let pW = 0, pH = 0, pdpr = 1;

  function layoutPond() {
    const box = cv.parentNode.getBoundingClientRect();
    if (box.width < 10 || box.height < 10) return;
    pdpr = Math.min(2, window.devicePixelRatio || 1);
    pW = box.width;
    pH = box.height;
    cv.width = Math.round(pW * pdpr);
    cv.height = Math.round(pH * pdpr);
  }

  function tip(msg) { $('fishTip').textContent = msg; }

  function syncCasts() {
    const box = $('casts');
    box.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const it = document.createElement('i');
      if (i < P.casts) it.className = 'on';
      box.appendChild(it);
    }
  }

  function syncCastBtn() {
    const b = $('btnCast');
    if (P.phase === 'idle') {
      b.textContent = P.casts > 0 ? '抛竿' : '没鱼竿啦';
      b.disabled = P.casts <= 0;
      tip(P.casts > 0 ? '还剩 ' + P.casts + ' 杆 · 浮标沉下去的一瞬间收竿' : '这一轮的鱼竿用完啦');
    } else if (P.phase === 'waiting') {
      b.textContent = '等鱼儿咬钩…';
      b.disabled = true;
      tip('浮标静静漂着，等鱼儿过来…');
    } else if (P.phase === 'bite') {
      b.textContent = '收竿！';
      b.disabled = false;
      tip('咬钩了！现在收竿');
    } else {
      b.textContent = '准备下一杆…';
      b.disabled = true;
    }
  }

  function resetPond() {
    P.phase = 'idle';
    P.casts = 3;
    P.caught = [];
    P.total = 0;
    syncCasts();
    syncCastBtn();
  }

  function rollSpecies() {
    let total = 0;
    SPECIES.forEach(function (s) {
      const boost = S.bait && (s.rarity === 'epic' || s.rarity === 'legend') ? 2 : 1;
      total += s.w * boost;
    });
    let x = Math.random() * total;
    for (let i = 0; i < SPECIES.length; i++) {
      const sp = SPECIES[i];
      const boost = S.bait && (sp.rarity === 'epic' || sp.rarity === 'legend') ? 2 : 1;
      x -= sp.w * boost;
      if (x <= 0) return sp;
    }
    return SPECIES[SPECIES.length - 1];
  }

  function cast() {
    if (P.phase !== 'idle' || P.casts <= 0) return;
    P.casts -= 1;
    P.phase = 'waiting';
    P.biteAt = performance.now() + 1100 + Math.random() * 1600;
    syncCasts();
    syncCastBtn();
  }

  function reel() {
    if (P.phase === 'waiting') { miss('收早了，鱼儿被吓跑了'); return; }
    if (P.phase !== 'bite') return;
    const sp = rollSpecies();
    P.caught.push(sp);
    P.total += sp.value;
    S.fish += sp.value;
    S.fishCounts[sp.id] = (S.fishCounts[sp.id] | 0) + 1;
    save();
    refreshHeader();
    toast('钓到' + sp.name + ' +' + sp.value + ' 鱼干');
    P.phase = 'idle';
    syncCasts();
    syncCastBtn();
    if (P.casts <= 0) setTimeout(showPondResult, 480);
  }

  function miss(msg) {
    P.phase = 'recover';
    P.nextAt = performance.now() + 850;
    toast(msg);
    syncCastBtn();
  }

  function showPondResult() {
    const rows = P.caught.map(function (sp) {
      return '<div class="row"><span>' + sp.name + '</span><b>+' + sp.value + '</b></div>';
    }).join('');
    openModal(
      '<h2>鱼篓 · ' + P.caught.length + ' 条</h2>' +
      '<p class="sub">这一轮换到 ' + P.total + ' 条小鱼干</p>' +
      '<div class="rows">' + (rows || '<div class="row"><span>这次空军啦</span><b>下次再来</b></div>') + '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn primary" data-act="fishAgain">再钓一轮</button>' +
      '<button class="btn ghost" data-act="fishHome">回小屋</button>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:8px">' +
      '<button class="btn ghost" data-act="shareFish">生成分享卡</button>' +
      '</div>'
    );
  }

  function updatePond(now) {
    if (P.phase === 'waiting' && now >= P.biteAt) {
      P.phase = 'bite';
      P.biteUntil = now + 1100;
      syncCastBtn();
    } else if (P.phase === 'bite' && now >= P.biteUntil) {
      miss('收竿慢了一点点');
    } else if (P.phase === 'recover' && now >= P.nextAt) {
      P.phase = 'idle';
      syncCastBtn();
    }
  }

  function drawPond(now) {
    const c = ctx;
    c.setTransform(pdpr, 0, 0, pdpr, 0, 0);

    const g = c.createLinearGradient(0, 0, 0, pH);
    g.addColorStop(0, '#EAF6F0');
    g.addColorStop(0.3, '#D9EDEA');
    g.addColorStop(1, '#8CCFD3');
    c.fillStyle = g;
    c.fillRect(0, 0, pW, pH);

    c.fillStyle = 'rgba(255,241,214,.92)';
    c.beginPath();
    c.arc(pW * 0.78, pH * 0.16, Math.min(34, pW * 0.09), 0, Math.PI * 2);
    c.fill();

    c.fillStyle = 'rgba(160,200,178,.5)';
    c.beginPath();
    c.moveTo(0, pH * 0.36);
    c.quadraticCurveTo(pW * 0.3, pH * 0.22, pW * 0.62, pH * 0.36);
    c.quadraticCurveTo(pW * 0.86, pH * 0.44, pW, pH * 0.34);
    c.lineTo(pW, pH * 0.48);
    c.lineTo(0, pH * 0.48);
    c.closePath();
    c.fill();

    c.strokeStyle = 'rgba(255,255,255,.35)';
    c.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const y = pH * 0.54 + i * 18 + Math.sin(now / 900 + i) * 3;
      c.beginPath();
      c.moveTo(pW * 0.08, y);
      c.quadraticCurveTo(pW * 0.5, y + 7, pW * 0.92, y);
      c.stroke();
    }

    const fx = pW * 0.5;
    const baseY = pH * 0.6;
    let fy = baseY + Math.sin(now / 620) * 4;
    if (P.phase === 'bite') fy = baseY + 16 + Math.sin(now / 70) * 3;

    c.strokeStyle = 'rgba(90,74,62,.45)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(pW * 0.94, pH * 0.16);
    c.quadraticCurveTo(pW * 0.82, pH * 0.42, fx, fy - 12);
    c.stroke();

    c.fillStyle = '#EF9B80';
    c.beginPath();
    c.arc(fx, fy, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#FFFDF8';
    c.beginPath();
    c.arc(fx, fy - 4, 4.4, Math.PI, 0);
    c.fill();

    const span = P.phase === 'bite' ? 360 : 1700;
    const rt = (now % span) / span;
    c.strokeStyle = 'rgba(255,255,255,' + (0.55 * (1 - rt)).toFixed(3) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(fx, fy + 8, 10 + rt * 40, 4 + rt * 13, 0, 0, Math.PI * 2);
    c.stroke();

    if (P.phase === 'bite') {
      c.fillStyle = '#D9523F';
      c.font = '700 22px "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillText('!', fx, fy - 22);
    }
  }

  function pondLoop(ts) {
    requestAnimationFrame(pondLoop);
    if (!$('screen-fish').classList.contains('active')) return;
    if (!pW) layoutPond();
    if (!pW) return;
    const now = ts || performance.now();
    updatePond(now);
    drawPond(now);
  }

  /* ---------------- 商店 & 图鉴 ---------------- */
  let dexKind = 'fish';

  function renderShop() {
    const grid = $('shopGrid');
    if (!grid) return;
    const sf = $('shopFish');
    if (sf) sf.textContent = S.fish;
    let html = '';
    OUTFITS.forEach(function (o) {
      if (o.id === 'default') return;
      const owned = S.owned.indexOf(o.id) >= 0;
      const on = S.outfit === o.id;
      html += '<div class="card">' +
        '<img src="' + CATS[o.id] + '" alt="' + o.name + '">' +
        '<div class="nm">' + o.name + '</div>' +
        '<div class="rb">' + o.desc + '</div>' +
        '<button class="cta' + (on ? ' on' : '') + '" data-buy="' + o.id + '">' +
        (on ? '正在穿' : (owned ? '换上' : '购买 · ' + o.price)) + '</button></div>';
    });
    html += '<div class="card">' +
      '<div class="nm" style="margin-top:44px">' + BAIT.name + '</div>' +
      '<div class="rb">' + BAIT.desc + '</div>' +
      '<button class="cta' + (S.bait ? ' on' : '') + '" data-buy="bait">' +
      (S.bait ? '已拥有' : '购买 · ' + BAIT.price) + '</button></div>';
    grid.innerHTML = html;
  }

  function renderDex() {
    const grid = $('dexGrid');
    if (!grid) return;
    const note = $('dexNote');
    let html = '';
    if (dexKind === 'fish') {
      let got = 0;
      SPECIES.forEach(function (sp) {
        const n = S.fishCounts[sp.id] | 0;
        const locked = n <= 0;
        if (!locked) got++;
        html += '<div class="card' + (locked ? ' locked' : '') + '">' +
          '<div class="nm" style="margin-top:40px">' + (locked ? '未发现' : sp.name) + '</div>' +
          '<div class="rb">' + RARITY[sp.rarity] + ' · ' + sp.value + ' 鱼干</div>' +
          '<div class="rb">' + (locked ? '继续抛竿试试' : '已钓到 ' + n + ' 条') + '</div></div>';
      });
      if (note) note.textContent = '已点亮 ' + got + ' / ' + SPECIES.length + ' 种鱼';
    } else {
      OUTFITS.forEach(function (o) {
        const owned = S.owned.indexOf(o.id) >= 0;
        html += '<div class="card' + (owned ? '' : ' locked') + '">' +
          '<img src="' + CATS[o.id] + '" alt="' + o.name + '">' +
          '<div class="nm">' + o.name + '</div>' +
          '<div class="rb">' + (owned ? (S.outfit === o.id ? '正在穿' : '已拥有') : '未解锁 · ' + o.price + ' 鱼干') + '</div></div>';
      });
      if (note) note.textContent = '已收集 ' + S.owned.length + ' / ' + OUTFITS.length + ' 套衣服';
    }
    grid.innerHTML = html;
  }

  function buyOrWear(id) {
    if (id === 'bait') {
      if (S.bait) { toast('高级鱼饵已经在用了'); return; }
      if (S.fish < BAIT.price) { toast('还差 ' + (BAIT.price - S.fish) + ' 条小鱼干'); return; }
      S.fish -= BAIT.price;
      S.bait = true;
      save();
      refreshHeader();
      renderShop();
      toast('买到高级鱼饵，稀有鱼更好钓了');
      return;
    }
    let o = null;
    for (let i = 0; i < OUTFITS.length; i++) if (OUTFITS[i].id === id) o = OUTFITS[i];
    if (!o) return;
    if (S.owned.indexOf(id) >= 0) {
      S.outfit = id;
      save();
      setCat(baseMood());
      renderShop();
      renderDex();
      toast('换上了' + o.name);
      return;
    }
    if (S.fish < o.price) { toast('还差 ' + (o.price - S.fish) + ' 条小鱼干'); return; }
    S.fish -= o.price;
    S.owned.push(id);
    S.outfit = id;
    save();
    refreshHeader();
    setCat(baseMood());
    renderShop();
    renderDex();
    toast('买下了' + o.name);
  }

  /* ---------------- 事件 ---------------- */
  $('cat').addEventListener('click', function () {
    flashCat('pat', 1800);
  });

  let lastTouch = Date.now();
  document.addEventListener('pointerdown', function () {
    lastTouch = Date.now();
    if (!timer.session && $('cat').src.indexOf('cat_curious') >= 0) setCat('idle');
  });
  setInterval(function () {
    if (timer.session) return;
    if (!$('screen-focus').classList.contains('active')) return;
    if (Date.now() - lastTouch < 9000) return;
    if ($('cat').src.indexOf('cat_curious') >= 0) return;
    setCat('curious');
  }, 4000);

  $('chips').addEventListener('click', function (e) {
    const b = e.target.closest('button');
    if (!b || timer.session) return;
    timer.selMin = Number(b.dataset.min) || 25;
    document.querySelectorAll('#chips button').forEach(function (x) {
      x.classList.toggle('on', x === b);
    });
    renderTimer();
  });

  $('btnStart').addEventListener('click', startSession);
  $('btnPause').addEventListener('click', togglePause);
  $('btnStop').addEventListener('click', function () {
    if (!timer.session) return;
    openModal(
      '<h2>提前结束吗</h2>' +
      '<p class="sub">已经专注的分钟数会算进记录，小猫不会生气。</p>' +
      '<div class="modal-actions">' +
      '<button class="btn primary" data-act="stopYes">结束这次陪读</button>' +
      '<button class="btn ghost" data-act="close">继续专注</button>' +
      '</div>'
    );
  });

  $('btnCast').addEventListener('click', function () {
    if (P.phase === 'idle') cast();
    else reel();
  });
  $('btnFishHome').addEventListener('click', function () { switchScreen('focus'); });

  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () { switchScreen(b.dataset.screen); });
  });

  $('dexSeg').addEventListener('click', function (e) {
    const b = e.target.closest('button');
    if (!b) return;
    dexKind = b.dataset.dex === 'cloth' ? 'cloth' : 'fish';
    document.querySelectorAll('#dexSeg button').forEach(function (x) {
      x.classList.toggle('on', x === b);
    });
    renderDex();
  });

  document.addEventListener('click', function (e) {
    const b = e.target.closest('[data-buy]');
    if (b) buyOrWear(b.dataset.buy);
  });

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'close') {
      closeModal();
      if (shareKind === 'fish' && P.casts <= 0) showPondResult();
    }
    else if (act === 'stopYes') { closeModal(); finish(false); }
    else if (act === 'again') { closeModal(); startSession(); }
    else if (act === 'fish') { closeModal(); switchScreen('fish'); }
    else if (act === 'share') openShare('report');
    else if (act === 'shareFish') openShare('fish');
    else if (act === 'fishAgain') { closeModal(); resetPond(); }
    else if (act === 'fishHome') {
      closeModal();
      const caught = P.total > 0;
      resetPond();
      switchScreen('focus');
      flashCat(caught ? 'fish' : 'sad', 2600);
    }
  });

  $('modal').addEventListener('click', function (e) {
    if (e.target === $('modal')) closeModal();
  });

  window.addEventListener('resize', layoutPond);

  /* ---------------- 启动 ---------------- */
  normalizeState();
  setCat('idle');
  layoutPond();
  requestAnimationFrame(pondLoop);
  scheduleBlink();
  storage.load(function (raw) {
    if (raw && typeof raw === 'object') {
      S = Object.assign(defState(), raw);
    } else if (typeof raw === 'string' && raw) {
      try { S = Object.assign(defState(), JSON.parse(raw)); } catch (e) {}
    }
    normalizeState();
    ready = true;
    rolloverDay();
    refreshHeader();
    renderTimer();
    syncCasts();
    syncCastBtn();
    setCat(baseMood());
    renderShop();
    renderDex();
  });
})();
