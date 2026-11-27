/* ============ 陪读小喵 · 休息鱼塘（钓鱼小游戏） ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const core = PDM.core;
  const $ = id => document.getElementById(id);
  const F = core.FISHING;
  const TAU = Math.PI * 2;

  const G = {
    open: false,
    phase: 'idle',      // idle | waiting | bite | celebrate | recover | result
    raf: 0,
    t0: 0,
    t: 0,
    W: 0,
    H: 0,
    dpr: 1,
    ctx: null,
    scene: null,
    biteAt: 0,
    biteUntil: 0,
    nextAt: 0,
    lastFish: 0,
    fly: null,
    splash: 0
  };

  const icon = n => PDM.ui.icon(n);

  /* ---------------- 打开 / 关闭 ---------------- */
  function open() {
    const app = PDM.app && PDM.app.state;
    if (app && app.session && !app.session.pausedAt) {
      PDM.ui.toast('先专心坐完这一轮，休息时再来钓鱼');
      return;
    }
    if (!core.canFish()) {
      PDM.ui.toast('完成一轮专注或先暂停，就能去鱼塘休息');
      return;
    }
    if (G.open) return;
    G.open = true;
    G.phase = 'idle';
    G.fly = null;
    $('fishWrap').classList.add('show');
    $('fishWrap').setAttribute('aria-hidden', 'false');
    buildScene();
    layout();
    hideResult();
    if (core.state().fishing.castsLeft <= 0) {
      G.phase = 'result';
      showResult();
    }
    syncHud();
    G.t0 = performance.now();
    G.raf = requestAnimationFrame(loop);
    window.addEventListener('resize', layout);
  }

  function close() {
    if (!G.open) return;
    G.open = false;
    if (G.raf) cancelAnimationFrame(G.raf);
    G.raf = 0;
    G.phase = 'idle';
    G.fly = null;
    hideResult();
    $('fishWrap').classList.remove('show');
    $('fishWrap').setAttribute('aria-hidden', 'true');
    window.removeEventListener('resize', layout);
    syncEntry();
  }

  function leave() {
    core.endBreak();
    close();
    PDM.ui.refreshHeader();
    PDM.ui.toast('小喵收好鱼竿，回小屋啦');
  }

  /* ---------------- 入口 ---------------- */
  function syncEntry() {
    const btn = $('btnFishing');
    if (!btn) return;
    const f = core.state().fishing || {};
    const app = PDM.app && PDM.app.state;
    const resting = !!f.breakReady && (!app || !app.session || app.session.pausedAt);
    btn.classList.toggle('hidden', !resting);
    if (resting) {
      const left = f.castsLeft | 0;
      btn.textContent = left > 0 ? '休息一下 · 去鱼塘' : '去鱼塘兑换小鱼干';
    }
  }

  /* ---------------- 游戏流程 ---------------- */
  function startCast() {
    if (G.phase !== 'idle') return;
    const f = core.state().fishing;
    if (!f.breakReady || f.castsLeft <= 0) return;
    G.phase = 'waiting';
    G.biteAt = performance.now() + 1000 + Math.random() * 1400;
    syncHud();
  }

  function reelIn() {
    if (G.phase !== 'bite') return;
    const r = core.fishCast(true);
    if (!r.ok) {
      G.phase = 'idle';
      syncHud();
      return;
    }
    G.lastFish = r.fish;
    G.fly = { t0: performance.now(), fish: r.fish };
    G.splash = performance.now();
    G.phase = 'celebrate';
    G.nextAt = performance.now() + 1150;
    PDM.ui.refreshHeader();
    floatText(r.fish.name + ' · ' + core.RARITY[r.fish.rarity].name, r.fish.rarity);
    syncHud();
  }

  function miss(msg) {
    if (G.phase === 'result' || G.phase === 'recover') return;
    const r = core.fishCast(false);
    G.phase = 'recover';
    G.nextAt = performance.now() + 950;
    G.splash = performance.now();
    floatText(r && r.free ? '第一次空杆，不耗次数' : (msg || '鱼儿溜走了'), 'miss');
    syncHud();
  }

  function updateGame(ts) {
    if (G.phase === 'waiting' && ts >= G.biteAt) {
      G.phase = 'bite';
      G.biteUntil = ts + 1150;
      syncHud();
    } else if (G.phase === 'bite' && ts >= G.biteUntil) {
      miss('收竿慢了一点点');
    } else if ((G.phase === 'celebrate' || G.phase === 'recover') && ts >= G.nextAt) {
      if (core.state().fishing.castsLeft <= 0) {
        toResult();
      } else {
        G.phase = 'idle';
        syncHud();
      }
    }
  }

  function toResult() {
    G.phase = 'result';
    G.fly = null;
    showResult();
    syncHud();
  }

  function hideResult() {
    $('fishResult').classList.remove('show');
  }

  function fishName(id) {
    const sp = core.fishById(id);
    return sp ? sp.name : id;
  }

  function showResult() {
    const st = core.state();
    const f = st.fishing;
    const daily = core.fishDaily();
    const casts = f.castsLeft | 0;
    const total = core.bagCount();

    const rows = core.FISH.filter(sp => (f.bag[sp.id] || 0) > 0).map(sp => {
      const n = f.bag[sp.id];
      const rate = core.RARITY[sp.rarity];
      const canSell = daily.left >= sp.snacks;
      return '<div class="fr-fish">' +
        '<span class="fish-dot" style="background:' + sp.color + '"></span>' +
        '<div class="fr-fish-info"><b>' + sp.name + '</b>' +
        '<em class="rarity r-' + sp.rarity + '" style="color:' + rate.color + '">' + rate.name + '</em></div>' +
        '<span class="fr-fish-count">×' + n + '</span>' +
        '<span class="fr-fish-val">' + icon('fish') + sp.snacks + '</span>' +
        '<button class="fr-mini" data-sell="' + sp.id + '" ' + (canSell ? '' : 'disabled') + '>兑换</button>' +
        '</div>';
    }).join('');

    const decoRows = core.rareDecos().map(item => {
      const owned = core.isOwned(item.id);
      const req = Object.keys(item.fishCost).map(k => fishName(k) + ' ×' + item.fishCost[k]).join(' + ');
      const meet = core.canCraftRare(item.id);
      let action;
      if (owned) action = '<em class="fr-owned">已拥有</em>';
      else action = '<button class="fr-mini" data-craft="' + item.id + '" ' + (meet ? '' : 'disabled') + '>兑换</button>';
      return '<div class="fr-deco-row"><div class="fr-deco-info"><b>' + item.name + '</b><span>' + req + '</span></div>' + action + '</div>';
    }).join('');

    const empty = total === 0
      ? '<div class="fr-empty">鱼篓空空的，这次鱼儿跑得快。<br>再抛一杆试试吧。</div>'
      : '';
    const sub = total > 0
      ? '钓到的鱼会按品种折算小鱼干，稀有的鱼还能换限定装饰。'
      : '休息一下，下次再来。';

    $('fishResultCard').innerHTML =
      '<div class="fr-badge">' + icon('fish') + '</div>' +
      '<div class="fr-title">' + (total > 0 ? '鱼篓 · ' + total + ' 条' : '这次空军啦') + '</div>' +
      '<div class="fr-sub">' + sub + '</div>' +
      '<div class="fr-rule">今日已兑换 ' + daily.used + ' / ' + daily.cap + ' 小鱼干' + (daily.left > 0 ? '，还能兑换 ' + daily.left + ' 条' : '，明天再来') + '</div>' +
      '<div class="fr-scroll">' +
      '<div class="fr-label">鱼篓</div>' +
      (rows || empty) +
      '<div class="fr-label">稀有装饰</div>' +
      decoRows +
      '</div>' +
      '<div class="fr-actions">' +
      (casts > 0 ? '<button class="btn ghost" data-fr="back">再钓一会儿（剩 ' + casts + ' 杆）</button>' : '') +
      '<button class="btn ghost" data-fr="leave">收好鱼竿回小屋</button>' +
      '</div>';
    $('fishResult').classList.add('show');
  }

  function doSell(id) {
    const r = core.fishExchangeSpecies(id);
    if (!r.ok) {
      PDM.ui.toast(r.reason === 'cap' ? '今天的小鱼干上限不够换这条鱼了' : '鱼篓里没有这种鱼', 2200);
      return;
    }
    PDM.ui.refreshHeader();
    showResult();
    syncHud();
    PDM.ui.toast('卖出 ' + r.count + ' 条' + fishName(id) + '，+' + r.snacks + ' 小鱼干', 2200);
  }

  function doCraft(id) {
    const r = core.craftRare(id);
    if (!r.ok) {
      PDM.ui.toast(r.reason === 'owned' ? '这件装饰已经在小屋里了' : '鱼还不够，再多钓几条吧', 2200);
      return;
    }
    PDM.ui.refreshHeader();
    showResult();
    syncHud();
    PDM.ui.toast('换到了「' + r.item.name + '」，去图鉴看看', 2600);
  }

  function backToFish() {
    hideResult();
    G.phase = 'idle';
    syncHud();
  }

  /* ---------------- HUD ---------------- */
  function syncHud() {
    const st = core.state();
    const f = st.fishing;
    const left = f.castsLeft | 0;
    const daily = core.fishDaily();

    $('fishSnacks').textContent = st.fish;
    $('fishRaw').textContent = '鱼篓 ' + core.bagCount() + ' 条';
    $('fishDaily').textContent = '今日兑换 ' + daily.used + ' / ' + daily.cap;

    const dots = $('fishCasts');
    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i < F.castsPerBreak; i++) {
        const it = document.createElement('i');
        it.className = i < left ? 'on' : (i < F.castsPerBreak ? 'used' : '');
        dots.appendChild(it);
      }
    }

    const tip = $('fishTip');
    const btn = $('btnCast');
    const done = $('btnFishDone');
    if (!tip || !btn) return;
    const total = F.castsPerBreak;
    if (G.phase === 'idle') {
      tip.textContent = left > 0
        ? '还剩 ' + left + ' / ' + total + ' 杆 · 等浮标沉下去的一瞬间收竿'
        : '这一轮的鱼竿收好了';
      btn.textContent = left > 0 ? '抛竿' : '没鱼竿啦';
      btn.disabled = left <= 0;
      btn.classList.remove('urgent');
      if (done) done.disabled = false;
    } else if (G.phase === 'waiting') {
      tip.textContent = '浮标静静漂着，等鱼儿过来…';
      btn.textContent = '等鱼儿咬钩…';
      btn.disabled = true;
      btn.classList.remove('urgent');
      if (done) done.disabled = false;
    } else if (G.phase === 'bite') {
      tip.textContent = '咬钩了！现在收竿';
      btn.textContent = '收竿！';
      btn.disabled = false;
      btn.classList.add('urgent');
    } else if (G.phase === 'celebrate') {
      tip.textContent = G.lastFish
        ? '钓到 ' + G.lastFish.name + ' · ' + core.RARITY[G.lastFish.rarity].name + '，鱼篓更沉了一点'
        : '鱼篓更沉了一点';
      btn.textContent = '收好了';
      btn.disabled = true;
      btn.classList.remove('urgent');
    } else if (G.phase === 'recover') {
      tip.textContent = '这次没抓住机会，下杆再来';
      btn.textContent = '准备下一杆…';
      btn.disabled = true;
      btn.classList.remove('urgent');
    } else {
      tip.textContent = '这一轮先休息到这里';
      btn.textContent = '收竿了';
      btn.disabled = true;
      btn.classList.remove('urgent');
    }

    const gear = $('fishGear');
    if (gear) {
      gear.innerHTML = F.gear.map(g => {
        const owned = core.gearOwned(g.id);
        return '<button class="gear-chip ' + (owned ? 'on' : '') + '" data-gear="' + g.id + '" ' + (owned ? 'disabled' : '') + '>' +
          '<b>' + g.name + '</b>' +
          '<span>' + (owned ? '已装备' : icon('fish') + g.price) + '</span>' +
          '</button>';
      }).join('');
    }
  }

  function floatText(msg, cls) {
    const el = document.createElement('div');
    el.className = 'fish-float' + (cls ? ' ' + cls : '');
    el.textContent = msg;
    el.style.left = (G.W * 0.5) + 'px';
    el.style.top = (G.H * 0.4) + 'px';
    $('fishWrap').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  /* ---------------- 场景 ---------------- */
  function buildScene() {
    let seed = 92731;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    G.scene = {
      pads: [
        { x: 0.11, y: 0.60, r: 0.058, rot: 0.4 },
        { x: 0.2, y: 0.71, r: 0.044, rot: 2.1 },
        { x: 0.87, y: 0.62, r: 0.05, rot: 1.1 },
        { x: 0.8, y: 0.75, r: 0.036, rot: 3.6 },
        { x: 0.05, y: 0.79, r: 0.032, rot: 5.1 }
      ],
      reedsL: Array.from({ length: 7 }, (_, i) => ({ x: 0.015 + i * 0.018, h: 0.18 + rnd() * 0.2, lean: -0.05 + rnd() * 0.1, ph: rnd() * 6 })),
      reedsR: Array.from({ length: 6 }, (_, i) => ({ x: 0.985 - i * 0.019, h: 0.16 + rnd() * 0.22, lean: 0.04 - rnd() * 0.08, ph: rnd() * 6 })),
      flies: Array.from({ length: 11 }, () => ({ x: 0.07 + rnd() * 0.86, y: 0.4 + rnd() * 0.26, ph: rnd() * TAU, r: 0.9 + rnd() * 1.5 })),
      clouds: [
        { x: 0.16, y: 0.13, s: 0.9, a: 0.55, v: 0.004 },
        { x: 0.62, y: 0.09, s: 0.72, a: 0.42, v: 0.006 },
        { x: 0.84, y: 0.2, s: 0.55, a: 0.34, v: 0.003 }
      ]
    };
  }

  function layout() {
    const wrap = $('fishWrap');
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    G.W = r.width;
    G.H = r.height;
    G.dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = $('fishCanvas');
    c.width = Math.round(G.W * G.dpr);
    c.height = Math.round(G.H * G.dpr);
    G.ctx = c.getContext('2d');
  }

  function loop(ts) {
    if (!G.open) return;
    G.raf = requestAnimationFrame(loop);
    if (!G.W) layout();
    if (!G.W) return;
    updateGame(ts);
    draw((ts - G.t0) / 1000);
  }

  /* ---------- 绘制工具 ---------- */
  function ell(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  }
  function fillEll(ctx, x, y, rx, ry, color) {
    ell(ctx, x, y, rx, ry);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw(t) {
    const ctx = G.ctx, W = G.W, H = G.H;
    if (!ctx) return;
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const hor = H * 0.45;

    /* 天空 */
    const sky = ctx.createLinearGradient(0, 0, 0, hor + 24);
    sky.addColorStop(0, '#F9E7CE');
    sky.addColorStop(0.52, '#F6C9A6');
    sky.addColorStop(1, '#EFA78A');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hor + 24);

    /* 太阳 */
    const sx = W * 0.72, sy = H * 0.285, sunR = Math.max(18, W * 0.072);
    const glow = ctx.createRadialGradient(sx, sy, sunR * 0.3, sx, sy, sunR * 5.6);
    glow.addColorStop(0, 'rgba(255, 229, 176, .85)');
    glow.addColorStop(0.36, 'rgba(255, 208, 150, .32)');
    glow.addColorStop(1, 'rgba(255, 208, 150, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, hor + 40);
    fillEll(ctx, sx, sy, sunR, sunR, '#FFE0A6');

    /* 云 */
    drawClouds(ctx, t, W, H);

    /* 远山 */
    ctx.fillStyle = '#CDBCAA';
    ctx.beginPath();
    ctx.moveTo(0, hor + 2);
    ctx.quadraticCurveTo(W * 0.16, hor - H * 0.06, W * 0.34, hor - H * 0.012);
    ctx.quadraticCurveTo(W * 0.53, hor - H * 0.055, W * 0.71, hor - H * 0.018);
    ctx.quadraticCurveTo(W * 0.87, hor - H * 0.05, W, hor - H * 0.02);
    ctx.lineTo(W, hor + 4);
    ctx.lineTo(0, hor + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#AAB2A2';
    ctx.beginPath();
    ctx.moveTo(0, hor + 2);
    for (let i = 0; i <= 12; i++) {
      const x = W * i / 12;
      const y = hor - H * (0.012 + 0.018 * Math.abs(Math.sin(i * 1.7)));
      ctx.quadraticCurveTo(x + W / 24, y, x + W / 12, hor - H * 0.004);
    }
    ctx.lineTo(W, hor + 4);
    ctx.lineTo(0, hor + 4);
    ctx.closePath();
    ctx.fill();

    /* 水面 */
    const water = ctx.createLinearGradient(0, hor, 0, H);
    water.addColorStop(0, '#F2C6A8');
    water.addColorStop(0.16, '#CDB8A8');
    water.addColorStop(0.44, '#8FB0B2');
    water.addColorStop(1, '#456F78');
    ctx.fillStyle = water;
    ctx.fillRect(0, hor, W, H - hor);

    /* 水面光带 */
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 9; i++) {
      const y = hor + 8 + i * (H - hor) / 13;
      const w = Math.max(9, 52 - i * 4.4) * (W / 390);
      const x = sx + Math.sin(t * 0.7 + i * 0.9) * 7;
      ctx.fillStyle = 'rgba(255, 228, 182, .5)';
      ctx.beginPath();
      ctx.ellipse(x, y, w, 2, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    /* 波纹 */
    ctx.save();
    ctx.lineWidth = 1;
    for (let i = 0; i < 13; i++) {
      const y = hor + 14 + i * (H - hor) / 15;
      const ph = t * 0.6 + i * 0.8;
      ctx.strokeStyle = 'rgba(255, 246, 232, ' + (0.05 + 0.045 * (0.5 + 0.5 * Math.sin(ph))) + ')';
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 14) {
        const yy = y + Math.sin(x * 0.03 + ph) * 1.6;
        if (x === -10) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    /* 雾 */
    const mist = ctx.createLinearGradient(0, hor - 12, 0, hor + 26);
    mist.addColorStop(0, 'rgba(255, 246, 232, 0)');
    mist.addColorStop(0.5, 'rgba(255, 246, 232, .26)');
    mist.addColorStop(1, 'rgba(255, 246, 232, 0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, hor - 12, W, 38);

    /* 荷叶 */
    G.scene.pads.forEach(p => drawPad(ctx, p.x * W, p.y * H, p.r * W, p.rot + Math.sin(t * 0.5 + p.rot) * 0.03));

    /* 船与猫 */
    drawBoat(ctx, t);

    /* 萤火虫 */
    drawFlies(ctx, t);

    /* 底部压暗 */
    const vg = ctx.createLinearGradient(0, H * 0.56, 0, H);
    vg.addColorStop(0, 'rgba(18, 38, 44, 0)');
    vg.addColorStop(1, 'rgba(14, 32, 38, .34)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, H * 0.56, W, H * 0.44);
  }

  function drawClouds(ctx, t, W, H) {
    G.scene.clouds.forEach(c => {
      const x = ((c.x + t * c.v) % 1.2 - 0.1) * W;
      const y = c.y * H;
      const s = c.s * (W / 390);
      ctx.save();
      ctx.globalAlpha = c.a;
      ctx.fillStyle = '#FFF7EA';
      fillEll(ctx, x, y, 30 * s, 12 * s, '#FFF7EA');
      fillEll(ctx, x - 18 * s, y + 3 * s, 18 * s, 9 * s, '#FFF7EA');
      fillEll(ctx, x + 20 * s, y + 2 * s, 20 * s, 10 * s, '#FFF7EA');
      ctx.restore();
    });
  }

  function drawPad(ctx, x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, 0.34, TAU - 0.34);
    ctx.closePath();
    ctx.fillStyle = 'rgba(104, 146, 118, .92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(70, 110, 88, .5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230, 245, 224, .3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.2);
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.2, -r * 0.7);
    ctx.stroke();
    if (r > 16) {
      ctx.fillStyle = '#F3B3B8';
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4 + 0.3;
        ell(ctx, Math.cos(a) * 6, Math.sin(a) * 4 - 4, 3.6, 2.4);
        ctx.fill();
      }
      fillEll(ctx, 0, -4, 2.4, 2, '#F7D08A');
    }
    ctx.restore();
  }

  function drawFlies(ctx, t) {
    G.scene.flies.forEach(f => {
      const x = (f.x + Math.sin(t * 0.45 + f.ph) * 0.012) * G.W;
      const y = (f.y + Math.cos(t * 0.62 + f.ph) * 0.012) * G.H;
      const a = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.1 + f.ph));
      const r = f.r * (G.W / 390);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, 'rgba(255, 236, 160, ' + a + ')');
      g.addColorStop(1, 'rgba(255, 236, 160, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, TAU);
      ctx.fill();
    });
  }

  /* ---------- 船 / 猫 ---------- */
  function drawBoat(ctx, t) {
    const W = G.W, H = G.H;
    const u = Math.min(1.16, Math.max(0.8, W / 390));
    const cx = W * 0.46;
    const by = H * 0.665 + Math.sin(t * 1.15) * 2.4 * u;
    const biting = G.phase === 'bite';

    ctx.save();
    ctx.globalAlpha = 0.22;
    fillEll(ctx, cx, by + 12 * u, 92 * u, 12 * u, '#1E3C43');
    ctx.restore();

    /* 船身 */
    ctx.beginPath();
    ctx.moveTo(cx - 88 * u, by - 24 * u);
    ctx.quadraticCurveTo(cx - 64 * u, by + 22 * u, cx, by + 25 * u);
    ctx.quadraticCurveTo(cx + 64 * u, by + 22 * u, cx + 88 * u, by - 24 * u);
    ctx.quadraticCurveTo(cx + 34 * u, by - 7 * u, cx, by - 7 * u);
    ctx.quadraticCurveTo(cx - 34 * u, by - 7 * u, cx - 88 * u, by - 24 * u);
    ctx.closePath();
    ctx.fillStyle = '#6D4C37';
    ctx.fill();
    ctx.strokeStyle = '#4B3325';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    /* 船舷高光 */
    ctx.strokeStyle = '#A27957';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 84 * u, by - 23 * u);
    ctx.quadraticCurveTo(cx, by - 4 * u, cx + 84 * u, by - 23 * u);
    ctx.stroke();

    /* 船舱内部 */
    fillEll(ctx, cx, by - 13 * u, 62 * u, 9 * u, '#4C3527');
    ctx.strokeStyle = 'rgba(160, 118, 84, .45)';
    ctx.lineWidth = 1.2;
    [0.42, 0.68].forEach(k => {
      ctx.beginPath();
      ctx.moveTo(cx - 58 * u, by - 12 * u + k * 8 * u);
      ctx.quadraticCurveTo(cx, by - 2 * u + k * 8 * u, cx + 58 * u, by - 12 * u + k * 8 * u);
      ctx.stroke();
    });

    /* 船头小灯 */
    if (core.gearOwned('lamp')) {
      const lx = cx + 66 * u, ly = by - 26 * u;
      ctx.strokeStyle = '#5B4232';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(lx, by - 14 * u);
      ctx.lineTo(lx, ly - 14 * u);
      ctx.stroke();
      const pulse = 0.8 + 0.2 * Math.sin(t * 3.1);
      const lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 30 * u);
      lg.addColorStop(0, 'rgba(255, 218, 140, ' + (0.8 * pulse) + ')');
      lg.addColorStop(0.4, 'rgba(255, 200, 110, ' + (0.28 * pulse) + ')');
      lg.addColorStop(1, 'rgba(255, 200, 110, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, 30 * u, 0, TAU);
      ctx.fill();
      fillEll(ctx, lx, ly, 5.2 * u, 6.4 * u, '#FFE2A0');
    }

    /* 猫 */
    const catX = cx - 6 * u;
    const catY = by - 15 * u;
    const sc = u * 0.98;
    const pawX = catX + 11 * sc;
    const pawY = catY - 19 * sc;
    const rodTipX = catX + 108 * sc;
    const rodTipY = catY - 118 * sc + (biting ? 6 * sc : Math.sin(t * 1.3) * 1.6 * sc);

    drawCatOnBoat(ctx, catX, catY, sc, t, biting);

    /* 鱼竿 */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7A5A3E';
    ctx.lineWidth = 3.2 * sc;
    ctx.beginPath();
    ctx.moveTo(pawX - 14 * sc, pawY + 6 * sc);
    ctx.quadraticCurveTo(pawX + 40 * sc, pawY - 18 * sc, rodTipX, rodTipY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(226, 194, 152, .7)';
    ctx.lineWidth = 1.2 * sc;
    ctx.beginPath();
    ctx.moveTo(pawX - 6 * sc, pawY + 2 * sc);
    ctx.quadraticCurveTo(pawX + 42 * sc, pawY - 20 * sc, rodTipX, rodTipY);
    ctx.stroke();
    /* 线轮 */
    fillEll(ctx, pawX - 2 * sc, pawY - 2 * sc, 4.4 * sc, 4.4 * sc, '#4E3728');
    fillEll(ctx, pawX - 2 * sc, pawY - 2 * sc, 2 * sc, 2 * sc, '#C79A6D');
    ctx.restore();

    /* 鱼线与浮标 */
    const dip = biting ? 6 * u : Math.sin(t * 2.1) * 1.3 * u;
    const bobX = cx + 152 * u;
    const bobY = by + 6 * u + dip;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 247, 232, .6)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(rodTipX, rodTipY);
    ctx.quadraticCurveTo(rodTipX + (bobX - rodTipX) * 0.55, rodTipY + 26 * u, bobX, bobY - 16 * u);
    ctx.stroke();
    ctx.restore();

    drawBobber(ctx, bobX, bobY, u, t, biting);

    /* 上钩的鱼飞回船 */
    if (G.fly) {
      const p = Math.min(1, (performance.now() - G.fly.t0) / 650);
      const fx = bobX + (catX + 26 * sc - bobX) * p;
      const fy = (bobY - 16 * u) + (catY - 70 * sc - bobY) * p - Math.sin(p * Math.PI) * 56 * u;
      drawFishShape(ctx, fx, fy, sc * (0.9 + 0.2 * Math.sin(p * Math.PI)), Math.sin(p * Math.PI) * 0.5, G.fly.fish && G.fly.fish.color);
      if (p >= 1) G.fly = null;
    }

    /* 水花 */
    if (G.splash && performance.now() - G.splash < 720) {
      const p = (performance.now() - G.splash) / 720;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = 'rgba(255, 246, 230, .8)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(bobX, bobY + 2, 8 + p * 30 * u, 3 + p * 9 * u, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(236, 248, 244, .85)';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.9 + i * 0.3;
        const d = (10 + p * 28) * u;
        fillEll(ctx, bobX + Math.cos(a) * d, bobY + Math.sin(a) * d * 0.55 - p * 14 * u, 2 * u, 2 * u, 'rgba(240, 250, 246, ' + (0.9 * (1 - p)) + ')');
      }
      ctx.restore();
    }
  }

  function drawBobber(ctx, x, y, u, t, biting) {
    ctx.save();
    const ringP = (t * 0.55) % 1;
    ctx.strokeStyle = 'rgba(255, 248, 235, ' + (0.34 * (1 - ringP)) + ')';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y + 3 * u, (8 + ringP * (biting ? 30 : 20)) * u, (2.6 + ringP * (biting ? 10 : 7)) * u, 0, 0, TAU);
    ctx.stroke();
    if (biting) {
      ctx.strokeStyle = 'rgba(255, 248, 235, .28)';
      ctx.beginPath();
      ctx.ellipse(x, y + 3 * u, 16 * u, 5.4 * u, 0, 0, TAU);
      ctx.stroke();
    }
    /* 浮标 */
    ctx.strokeStyle = '#F7EEDD';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(x, y - 17 * u);
    ctx.lineTo(x, y - 4 * u);
    ctx.stroke();
    fillEll(ctx, x, y - 2 * u, 4.6 * u, 6.4 * u, '#F8EFE0');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y + 1.4 * u, 4.6 * u, 4 * u, 0, 0, Math.PI);
    ctx.fillStyle = '#E8664F';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawFishShape(ctx, x, y, s, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.fillStyle = color || '#F0A05E';
    ell(ctx, 0, 0, 10, 5.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-18, -6.4);
    ctx.lineTo(-18, 6.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5B4030';
    ctx.beginPath();
    ctx.arc(5, -1.4, 1.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCatOnBoat(ctx, x, y, s, t, biting) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 1.6) * 1.1);
    ctx.scale(s, s);

    /* 尾巴 */
    ctx.save();
    ctx.strokeStyle = '#D8BD9C';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-24, -6);
    ctx.quadraticCurveTo(-52, -8, -50, -30 + Math.sin(t * 1.4) * 3);
    ctx.stroke();
    ctx.strokeStyle = '#E9D3B5';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-24, -6);
    ctx.quadraticCurveTo(-52, -8, -50, -30 + Math.sin(t * 1.4) * 3);
    ctx.stroke();
    ctx.restore();

    /* 斗篷 */
    const cloak = '#33545C', cloakDark = '#26424A', cloakLite = '#4E767D';
    ctx.beginPath();
    ctx.moveTo(-38, 6);
    ctx.quadraticCurveTo(-46, -30, -27, -52);
    ctx.quadraticCurveTo(-32, -74, -16, -82);
    ctx.quadraticCurveTo(0, -92, 16, -82);
    ctx.quadraticCurveTo(32, -74, 27, -52);
    ctx.quadraticCurveTo(46, -30, 38, 6);
    ctx.quadraticCurveTo(0, 16, -38, 6);
    ctx.closePath();
    ctx.fillStyle = cloak;
    ctx.fill();
    ctx.strokeStyle = cloakDark;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, .12)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-25, -46);
    ctx.quadraticCurveTo(-31, -20, -25, 0);
    ctx.moveTo(25, -46);
    ctx.quadraticCurveTo(31, -20, 25, 0);
    ctx.stroke();

    /* 耳朵 */
    [-1, 1].forEach(dir => {
      ctx.beginPath();
      ctx.moveTo(dir * 24, -78);
      ctx.lineTo(dir * 16, -101);
      ctx.lineTo(dir * 4, -82);
      ctx.closePath();
      ctx.fillStyle = '#F5E1C6';
      ctx.fill();
      ctx.strokeStyle = '#D9BF9E';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(dir * 21, -82);
      ctx.lineTo(dir * 16.5, -95);
      ctx.lineTo(dir * 9, -83);
      ctx.closePath();
      ctx.fillStyle = '#EFA893';
      ctx.fill();
    });

    /* 脸 */
    fillEll(ctx, 0, -62, 24, 23, '#F8E8D3');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -48, 19, 9, 0, 0, Math.PI);
    ctx.fillStyle = 'rgba(222, 196, 166, .32)';
    ctx.fill();
    ctx.restore();

    /* 兜帽边 */
    ctx.strokeStyle = cloakLite;
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -62, 27.5, Math.PI * 0.86, Math.PI * 2.14);
    ctx.stroke();

    /* 眼睛 */
    const blink = (t % 5.1) < 0.12;
    if (blink) {
      ctx.strokeStyle = '#4C382E';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-13, -62);
      ctx.quadraticCurveTo(-9, -58, -5, -62);
      ctx.moveTo(5, -62);
      ctx.quadraticCurveTo(9, -58, 13, -62);
      ctx.stroke();
    } else {
      const er = biting ? 3.5 : 2.9;
      fillEll(ctx, -9, -62, er, er * 1.15, '#4C382E');
      fillEll(ctx, 9, -62, er, er * 1.15, '#4C382E');
      fillEll(ctx, -8, -63.4, 0.9, 0.9, 'rgba(255,255,255,.9)');
      fillEll(ctx, 10, -63.4, 0.9, 0.9, 'rgba(255,255,255,.9)');
    }

    /* 鼻子和嘴 */
    ctx.fillStyle = '#E79A86';
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(-2.6, -52.2);
    ctx.lineTo(2.6, -52.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9C7B62';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3.2, -50.4);
    ctx.quadraticCurveTo(0, -48.2, 3.2, -50.4);
    ctx.stroke();

    /* 腮红 */
    fillEll(ctx, -15, -55, 4.2, 2.6, 'rgba(240, 150, 130, .38)');
    fillEll(ctx, 15, -55, 4.2, 2.6, 'rgba(240, 150, 130, .38)');

    /* 胡须 */
    ctx.strokeStyle = 'rgba(140, 112, 90, .55)';
    ctx.lineWidth = 1;
    [-1, 1].forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d * 17, -56);
      ctx.lineTo(d * 30, -59);
      ctx.moveTo(d * 17, -53);
      ctx.lineTo(d * 30, -52);
      ctx.stroke();
    });

    /* 斗篷扣 */
    fillEll(ctx, 0, -43, 4, 4, '#E8B45F');
    ctx.strokeStyle = 'rgba(150, 100, 40, .4)';
    ctx.lineWidth = 1;
    ell(ctx, 0, -43, 4, 4);
    ctx.stroke();

    /* 爪子 */
    fillEll(ctx, -13, -18, 8, 6.4, '#F8E8D3');
    fillEll(ctx, 12, -18, 8, 6.4, '#F8E8D3');
    ctx.strokeStyle = 'rgba(214, 177, 146, .6)';
    ctx.lineWidth = 1;
    [-13, 12].forEach(px => {
      ctx.beginPath();
      ctx.moveTo(px - 2.4, -21);
      ctx.lineTo(px - 2.4, -16);
      ctx.moveTo(px + 2.4, -21);
      ctx.lineTo(px + 2.4, -16);
      ctx.stroke();
    });

    ctx.restore();
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    const closeBtn = $('fishClose');
    if (!closeBtn) return;
    closeBtn.addEventListener('click', close);
    $('btnFishing').addEventListener('click', open);
    $('btnCast').addEventListener('click', () => {
      if (G.phase === 'idle') startCast();
      else if (G.phase === 'bite') reelIn();
    });
    $('btnFishDone').addEventListener('click', () => {
      if (G.phase === 'result') return;
      toResult();
    });
    $('fishGear').addEventListener('click', e => {
      const b = e.target.closest('[data-gear]');
      if (!b) return;
      const id = b.dataset.gear;
      const r = core.buyGear(id);
      if (!r.ok) {
        PDM.ui.toast(r.reason === 'fish' ? '小鱼干不够，再专注一会儿吧' : '这件钓具已经在船上了', 2200);
        return;
      }
      PDM.ui.refreshHeader();
      syncHud();
      PDM.ui.toast('买下「' + r.gear.name + '」，钓鱼更顺手了', 2200);
    });
    $('fishResultCard').addEventListener('click', e => {
      const sell = e.target.closest('[data-sell]');
      if (sell) { doSell(sell.dataset.sell); return; }
      const craft = e.target.closest('[data-craft]');
      if (craft) { doCraft(craft.dataset.craft); return; }
      const b = e.target.closest('[data-fr]');
      if (!b) return;
      const act = b.dataset.fr;
      if (act === 'back') backToFish();
      else if (act === 'leave') leave();
    });
    syncEntry();
  }

  PDM.fishing = {
    init: init,
    open: open,
    close: close,
    syncEntry: syncEntry,
    state: G
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.PDM);
