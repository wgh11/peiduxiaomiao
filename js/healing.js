/* ==========================================================================
   陪读小喵 · 治愈与陪伴增强模块 (js/healing.js)
   架构：挂载于 window.PDM.healing，零侵入兼容原 PDM.core 与 PDM.app
   能力：
     1. 零外链 Web Audio 治愈声景（细雨/壁炉/翻书/微风 + 呼噜/嚼食/风铃微音效）
     2. 昼夜 4 时段沉浸光影与天气粒子（清晨/午后/黄昏/深夜 + 台灯联动）
     3. 陪伴记忆、任务标签碎碎念、家具生活联动、猫粮口味独立反馈、中断去惩罚安抚
     4. 第一人称「晚安小纸条 / 今日陪伴手账」卡片与 PNG 存图
   ========================================================================== */
(function () {
  'use strict';

  var PDM = (window.PDM = window.PDM || {});
  var SAVE_KEY = 'peiduxiaomiao.save.v1';
  var HEAL_KEY = 'peiduxiaomiao.healing.v1';

  /* ----------------------------- 工具函数 ----------------------------- */
  function todayKey(d) {
    var now = d || new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function readCoreSave() {
    try {
      if (PDM.core && typeof PDM.core.load === 'function') {
        return PDM.core.load();
      }
      var raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function defaultHealState() {
    var today = todayKey();
    return {
      v: 1,
      lastVisitAt: 0,
      lastVisitDay: '',
      companionDays: 0,
      ambient: 'off',       // off | rain | fire | pages | breeze
      volume: 0.35,
      sfxEnabled: true,
      periodMode: 'auto',   // auto | morning | afternoon | dusk | night | off
      weather: 'auto',      // auto | dust | rain | snow | firefly | off
      daily: {
        day: today,
        pets: 0,
        feeds: 0,
        feedKinds: { fish: 0, milk: 0, cookie: 0 },
        focusSessions: 0,
        focusMins: 0,
        gentleReturns: 0,
        noteSeed: Math.floor(Math.random() * 1000)
      }
    };
  }

  function loadHealState() {
    var base = defaultHealState();
    try {
      var raw = localStorage.getItem(HEAL_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        Object.assign(base, parsed);
        if (parsed.daily && parsed.daily.day === todayKey()) {
          base.daily = Object.assign(base.daily, parsed.daily);
          base.daily.feedKinds = Object.assign(
            { fish: 0, milk: 0, cookie: 0 },
            parsed.daily.feedKinds || {}
          );
        }
      }
    } catch (_) {}
    return base;
  }

  var state = loadHealState();

  function saveHealState() {
    try {
      localStorage.setItem(HEAL_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function getRealPeriod() {
    var h = new Date().getHours();
    if (h >= 6 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'afternoon';
    if (h >= 17 && h < 20) return 'dusk';
    return 'night';
  }

  function getActivePeriod() {
    return state.periodMode === 'auto' ? getRealPeriod() : state.periodMode;
  }

  function getActiveWeather() {
    if (state.weather !== 'auto') return state.weather;
    if (state.ambient === 'rain') return 'rain';
    var p = getActivePeriod();
    if (p === 'night') return 'firefly';
    if (p === 'morning' || p === 'afternoon') return 'dust';
    if (p === 'dusk') return 'dust';
    return 'off';
  }

  /* ===================== 1. Web Audio 治愈声景引擎 ===================== */
  var audio = (function () {
    var ctx = null;
    var masterGain = null;
    var ambientNode = null;
    var pageTimer = null;

    function ensureCtx() {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!ctx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = state.volume;
        masterGain.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      return ctx;
    }

    function createNoiseBuffer(c, seconds, color) {
      var len = Math.floor(c.sampleRate * seconds);
      var buf = c.createBuffer(1, len, c.sampleRate);
      var data = buf.getChannelData(0);
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      var lastOut = 0;
      for (var i = 0; i < len; i++) {
        var white = Math.random() * 2 - 1;
        if (color === 'pink') {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
          b6 = white * 0.115926;
        } else if (color === 'brown') {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 2.6;
        } else {
          data[i] = white * 0.28;
        }
      }
      return buf;
    }

    function stopAmbient() {
      if (pageTimer) {
        clearInterval(pageTimer);
        pageTimer = null;
      }
      if (ambientNode) {
        try {
          if (ambientNode.gain && ctx) {
            ambientNode.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
          }
          var old = ambientNode;
          setTimeout(function () {
            try { old.source && old.source.stop(); } catch (_) {}
            try { old.lfo && old.lfo.stop(); } catch (_) {}
          }, 700);
        } catch (_) {}
        ambientNode = null;
      }
    }

    function triggerPageRustle(c, dest) {
      var dur = 0.28 + Math.random() * 0.18;
      var src = c.createBufferSource();
      src.buffer = createNoiseBuffer(c, dur, 'white');
      var bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800 + Math.random() * 900;
      bp.Q.value = 1.6;
      var g = c.createGain();
      var now = c.currentTime;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.16, now + dur * 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(dest);
      src.start(now);
    }

    function startAmbient(type) {
      stopAmbient();
      state.ambient = type;
      saveHealState();
      if (type === 'off') return;
      var c = ensureCtx();
      if (!c) return;

      var gain = c.createGain();
      gain.gain.setValueAtTime(0.001, c.currentTime);
      gain.gain.setTargetAtTime(1.0, c.currentTime, 0.45);
      gain.connect(masterGain);

      if (type === 'rain') {
        var src = c.createBufferSource();
        src.buffer = createNoiseBuffer(c, 4, 'pink');
        src.loop = true;
        var lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1350;
        var hp = c.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 220;
        src.connect(lp);
        lp.connect(hp);
        hp.connect(gain);
        src.start();
        ambientNode = { source: src, gain: gain };
      } else if (type === 'fire') {
        var fsrc = c.createBufferSource();
        fsrc.buffer = createNoiseBuffer(c, 4, 'brown');
        fsrc.loop = true;
        var flp = c.createBiquadFilter();
        flp.type = 'lowpass';
        flp.frequency.value = 340;
        fsrc.connect(flp);
        flp.connect(gain);
        fsrc.start();
        pageTimer = setInterval(function () {
          if (Math.random() < 0.45 && ctx) {
            var crack = ctx.createBufferSource();
            crack.buffer = createNoiseBuffer(ctx, 0.04, 'white');
            var cbp = ctx.createBiquadFilter();
            cbp.type = 'highpass';
            cbp.frequency.value = 2600;
            var cg = ctx.createGain();
            var t = ctx.currentTime;
            cg.gain.setValueAtTime(0.14 * Math.random(), t);
            cg.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
            crack.connect(cbp);
            cbp.connect(cg);
            cg.connect(gain);
            crack.start(t);
          }
        }, 650);
        ambientNode = { source: fsrc, gain: gain };
      } else if (type === 'breeze') {
        var bsrc = c.createBufferSource();
        bsrc.buffer = createNoiseBuffer(c, 5, 'pink');
        bsrc.loop = true;
        var blp = c.createBiquadFilter();
        blp.type = 'bandpass';
        blp.frequency.value = 520;
        blp.Q.value = 0.8;
        var lfo = c.createOscillator();
        lfo.frequency.value = 0.14;
        var lfoGain = c.createGain();
        lfoGain.gain.value = 240;
        lfo.connect(lfoGain);
        lfoGain.connect(blp.frequency);
        bsrc.connect(blp);
        blp.connect(gain);
        bsrc.start();
        lfo.start();
        ambientNode = { source: bsrc, lfo: lfo, gain: gain };
      } else if (type === 'pages') {
        var psrc = c.createBufferSource();
        psrc.buffer = createNoiseBuffer(c, 4, 'brown');
        psrc.loop = true;
        var plp = c.createBiquadFilter();
        plp.type = 'lowpass';
        plp.frequency.value = 200;
        var pSub = c.createGain();
        pSub.gain.value = 0.25;
        psrc.connect(plp);
        plp.connect(pSub);
        pSub.connect(gain);
        psrc.start();
        triggerPageRustle(c, gain);
        pageTimer = setInterval(function () {
          if (ctx && Math.random() < 0.72) triggerPageRustle(ctx, gain);
        }, 3600);
        ambientNode = { source: psrc, gain: gain };
      }
    }

    function setVolume(v) {
      state.volume = Math.max(0, Math.min(1, Number(v) || 0));
      saveHealState();
      if (masterGain && ctx) {
        masterGain.gain.setTargetAtTime(state.volume, ctx.currentTime, 0.08);
      }
    }

    /* 互动微音效：猫咪呼噜声 */
    function playPurr() {
      if (!state.sfxEnabled) return;
      var c = ensureCtx();
      if (!c) return;
      var now = c.currentTime;
      var dur = 1.65;
      var osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(28, now);
      var osc2 = c.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(56, now);

      var lfo = c.createOscillator();
      lfo.frequency.setValueAtTime(1.4, now);
      var lfoG = c.createGain();
      lfoG.gain.value = 0.055;

      var lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 140;

      var g = c.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.14, now + 0.25);
      g.gain.setValueAtTime(0.12, now + dur - 0.35);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);

      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      osc.connect(lp);
      osc2.connect(lp);
      lp.connect(g);
      g.connect(masterGain);

      osc.start(now);
      osc2.start(now);
      lfo.start(now);
      osc.stop(now + dur + 0.05);
      osc2.stop(now + dur + 0.05);
      lfo.stop(now + dur + 0.05);
    }

    /* 互动微音效：投喂（区分脆食与牛奶） */
    function playFeed(kind) {
      if (!state.sfxEnabled) return;
      var c = ensureCtx();
      if (!c) return;
      var now = c.currentTime;
      var steps = kind === 'milk' ? [0, 0.22, 0.44] : [0, 0.16, 0.34, 0.52];
      steps.forEach(function (offset, idx) {
        var t = now + offset;
        if (kind === 'milk') {
          var o = c.createOscillator();
          o.type = 'sine';
          o.frequency.setValueAtTime(360 + idx * 45, t);
          o.frequency.exponentialRampToValueAtTime(520 + idx * 35, t + 0.09);
          var g = c.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.08, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          o.connect(g);
          g.connect(masterGain);
          o.start(t);
          o.stop(t + 0.12);
        } else {
          var s = c.createBufferSource();
          s.buffer = createNoiseBuffer(c, 0.06, 'white');
          var bp = c.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = kind === 'cookie' ? 1700 : 2300;
          var cg = c.createGain();
          cg.gain.setValueAtTime(0.09, t);
          cg.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
          s.connect(bp);
          bp.connect(cg);
          cg.connect(masterGain);
          s.start(t);
        }
      });
    }

    /* 互动微音效：专注完成风铃和弦 */
    function playChime() {
      if (!state.sfxEnabled) return;
      var c = ensureCtx();
      if (!c) return;
      var notes = [523.25, 659.25, 783.99, 1046.5];
      var now = c.currentTime;
      notes.forEach(function (freq, i) {
        var t = now + i * 0.12;
        var o = c.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t);
        var g = c.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 1.15);
        o.connect(g);
        g.connect(masterGain);
        o.start(t);
        o.stop(t + 1.2);
      });
    }

    return {
      startAmbient: startAmbient,
      stopAmbient: stopAmbient,
      setVolume: setVolume,
      playPurr: playPurr,
      playFeed: playFeed,
      playChime: playChime
    };
  })();

  /* ================= 2. 昼夜光影与窗外微粒子氛围层 ================= */
  var atmosphere = (function () {
    var overlayEl = null;
    var canvas = null;
    var ctx = null;
    var particles = [];
    var rafId = 0;

    function init() {
      overlayEl = document.createElement('div');
      overlayEl.id = 'pdm-heal-atmosphere';
      document.body.appendChild(overlayEl);

      canvas = document.createElement('canvas');
      canvas.id = 'pdm-heal-particles';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');

      resize();
      window.addEventListener('resize', resize);
      applyPeriod();
      seedParticles();
      loop();
    }

    function resize() {
      if (!canvas) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function applyPeriod() {
      if (!overlayEl) return;
      var p = getActivePeriod();
      var save = readCoreSave();
      var hasLamp = Boolean(save && save.equipped && save.equipped.desk);
      overlayEl.setAttribute('data-period', p);
      overlayEl.setAttribute('data-lamp', hasLamp ? 'on' : 'off');
    }

    function seedParticles() {
      var mode = getActiveWeather();
      particles = [];
      if (mode === 'off') return;
      var count = mode === 'rain' ? 42 : mode === 'snow' ? 28 : 18;
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: mode === 'rain' ? 1 : (1.2 + Math.random() * 2.2),
          vx: mode === 'rain' ? -1.4 : (Math.random() - 0.5) * 0.35,
          vy: mode === 'rain' ? (6.5 + Math.random() * 3.5) : mode === 'snow' ? (0.45 + Math.random() * 0.75) : (-0.15 - Math.random() * 0.25),
          alpha: 0.18 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function loop() {
      rafId = requestAnimationFrame(loop);
      if (!ctx || !canvas) return;
      var w = window.innerWidth;
      var h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      var mode = getActiveWeather();
      if (mode === 'off' || particles.length === 0) return;

      var t = performance.now() * 0.001;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx + (mode === 'snow' ? Math.sin(t + p.phase) * 0.35 : 0);
        p.y += p.vy;
        if (p.y > h + 14) { p.y = -10; p.x = Math.random() * w; }
        if (p.y < -14) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -14) p.x = w + 10;
        if (p.x > w + 14) p.x = -10;

        if (mode === 'rain') {
          ctx.strokeStyle = 'rgba(205, 224, 245, ' + (p.alpha * 0.62) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + 13);
          ctx.stroke();
        } else if (mode === 'snow') {
          ctx.fillStyle = 'rgba(255, 252, 248, ' + (p.alpha * 0.85) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (mode === 'firefly') {
          var glow = 0.28 + 0.52 * (0.5 + 0.5 * Math.sin(t * 1.8 + p.phase));
          ctx.fillStyle = 'rgba(255, 226, 152, ' + glow + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 1.15, 0, Math.PI * 2);
          ctx.fill();
        } else {
          var shimmer = p.alpha * (0.65 + 0.35 * Math.sin(t + p.phase));
          ctx.fillStyle = 'rgba(255, 236, 194, ' + shimmer + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    return {
      init: init,
      refresh: function () {
        applyPeriod();
        seedParticles();
      },
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
      }
    };
  })();

  /* ================= 3. 温柔气泡、爱心特效与陪伴记忆 ================= */
  var bubbleEl = null;
  var bubbleTimer = null;

  function showBubble(text, tag, durationMs) {
    if (!bubbleEl) {
      bubbleEl = document.createElement('div');
      bubbleEl.id = 'pdm-heal-bubble';
      bubbleEl.addEventListener('click', function () {
        bubbleEl.classList.remove('is-visible');
      });
      document.body.appendChild(bubbleEl);
    }
    var html = '';
    if (tag) html += '<div class="pdm-heal-bubble-tag">' + tag + '</div><br>';
    html += text;
    bubbleEl.innerHTML = html;
    bubbleEl.classList.add('is-visible');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      bubbleEl.classList.remove('is-visible');
    }, durationMs || 5200);
  }

  function spawnHearts(count) {
    var n = count || 3;
    var cx = window.innerWidth * 0.5;
    var cy = window.innerHeight * 0.46;
    for (var i = 0; i < n; i++) {
      (function (idx) {
        setTimeout(function () {
          var el = document.createElement('div');
          el.className = 'pdm-heal-heart';
          el.textContent = idx % 2 === 0 ? '♥' : '✦';
          el.style.left = (cx + (Math.random() - 0.5) * 90) + 'px';
          el.style.top = (cy + (Math.random() - 0.5) * 40) + 'px';
          document.body.appendChild(el);
          setTimeout(function () { el.remove(); }, 1400);
        }, idx * 140);
      })(i);
    }
  }

  var TAG_LINES = {
    '阅读': [
      '翻页的声音很让人安心，我就在书角边陪你慢慢看。',
      '遇到难啃的段落也没关系，先读完这一页我们就歇口气。'
    ],
    '刷题': [
      '卡住的题先做个记号，不用跟自己较劲，小喵给你递小鱼干打气。',
      '每搞懂一道错题都在变强呢，我乖乖蹲在草稿纸旁边陪你。'
    ],
    '写作': [
      '先写下第一句就赢了一半，不用追求一次完美，我当你的第一位读者。',
      '灵感慢一点来也没关系，听会儿雨声，我们慢慢把想法理顺。'
    ],
    '复习': [
      '把旧知识再摸一遍很踏实呀，我陪你把零碎的重点一块块拼起来。',
      '复习的时候最容易累，记得喝口温水，我帮你看着时间。'
    ],
    '其他': [
      '不管今天要忙什么，只要你坐下来，我就一直在桌边陪着你。',
      '一点点推进就已经很棒了，我把尾巴卷好，安静陪你这一段。'
    ]
  };

  var FOOD_FEEDBACK = {
    fish: [
      '咔嚓咔嚓——小鱼干好香！尾巴摇成小螺旋桨啦，谢谢你。',
      '最喜欢脆脆的小鱼干了，吃饱就有力气陪你继续看书啦！'
    ],
    milk: [
      '咕噜咕噜喝完暖暖牛奶，鼻尖沾了一圈小白胡子，整只猫都暖呼呼的。',
      '温热的牛奶最适合自习间隙啦，你也记得喝口水哦。'
    ],
    cookie: [
      '奶油小饼干好酥呀，掉了两粒小渣渣被我悄悄舔干净了～',
      '甜甜的奶油香味！感觉今天接下来的学习也会顺顺利利的。'
    ]
  };

  var GENTLE_INTERRUPT_LINES = [
    '提前停下来也没关系，你刚刚已经很认真了，剩下的我们缓一缓再说。',
    '没关系的呀，节奏本来就该由你说了算，随时想回来我都在这里。',
    '先去处理眼前的事吧，我帮你把桌面看好了，不算失败哦。'
  ];

  var RETURN_FROM_AWAY_LINES = [
    '你回来啦！刚刚我打了个小盹，一直帮你守着桌角呢。',
    '欢迎回来～离开一会儿也没关系，我们接着刚刚的地方慢慢来。',
    '听到你回来的动静耳朵立刻竖起来了，要不要先伸个懒腰？'
  ];

  function buildGreeting() {
    var save = readCoreSave();
    var period = getActivePeriod();
    var now = Date.now();
    var today = todayKey();
    var hoursAway = state.lastVisitAt ? (now - state.lastVisitAt) / 3600000 : 0;
    var tag = (save && save.settings && save.settings.lastTag) || '阅读';
    var hasLamp = Boolean(save && save.equipped && save.equipped.desk);
    var hasRug = Boolean(save && save.equipped && save.equipped.floor);

    if (state.lastVisitDay !== today) {
      state.companionDays = (state.companionDays || 0) + 1;
      state.lastVisitDay = today;
    }
    state.lastVisitAt = now;
    saveHealState();

    if (hoursAway >= 48) {
      return {
        tag: '好久不见 · 第 ' + state.companionDays + ' 天相伴',
        text: '好久没一起坐着啦，今天哪怕只专注 15 分钟、或者只是来摸摸我，也都很开心。'
      };
    }

    if (period === 'night') {
      return {
        tag: hasLamp ? '深夜台灯下' : '夜深陪读',
        text: hasLamp
          ? '台灯亮着暖暖的光呢。这么晚还在忙呀，我陪你再看一小会儿，困了就早点休息。'
          : '夜深啦，别让自己太紧绷，我把呼噜声调轻一点，安安静静陪着你。'
      };
    }
    if (period === 'morning') {
      return {
        tag: '早安 · ' + tag,
        text: '早安呀！今天想先从「' + tag + '」开始吗？不用着急，先舒舒服服坐下就好。'
      };
    }
    if (period === 'dusk') {
      return {
        tag: '黄昏暖光',
        text: '窗外开始变成橘色了。忙碌了一天辛苦啦，接下来的一小段路我陪你慢慢收尾。'
      };
    }
    return {
      tag: hasRug ? '午后软垫旁' : '午后自习',
      text: hasRug
        ? '午后阳光落在软垫上暖洋洋的，我先占个角落趴好，陪你一起「' + tag + '」。'
        : pick(TAG_LINES[tag] || TAG_LINES['其他'])
    };
  }

  /* ================= 4. 状态监听：无侵入联动原 app.js ================= */
  var prevCatState = '';
  var prevSessionActive = false;
  var prevFoods = null;
  var lastIdleChatterAt = 0;

  function snapshotFoods(save) {
    if (!save || !save.foods) return { fish: 0, milk: 0, cookie: 0 };
    return {
      fish: Number(save.foods.fish) || 0,
      milk: Number(save.foods.milk) || 0,
      cookie: Number(save.foods.cookie) || 0
    };
  }

  function detectConsumedFood(before, after) {
    if (!before || !after) return null;
    if (after.fish < before.fish) return 'fish';
    if (after.milk < before.milk) return 'milk';
    if (after.cookie < before.cookie) return 'cookie';
    return null;
  }

  function pollAppState() {
    var appState = PDM.app && PDM.app.state;
    var save = readCoreSave();
    var curFoods = snapshotFoods(save);

    /* 检测猫粮口味消耗（即使状态机切换极快也能准确捕获） */
    var consumed = detectConsumedFood(prevFoods, curFoods);
    if (consumed) {
      state.daily.feeds += 1;
      state.daily.feedKinds[consumed] = (state.daily.feedKinds[consumed] || 0) + 1;
      saveHealState();
      audio.playFeed(consumed);
      spawnHearts(2);
      var labelMap = { fish: '小鱼干投喂', milk: '暖暖牛奶投喂', cookie: '奶油小饼干投喂' };
      showBubble(pick(FOOD_FEEDBACK[consumed]), labelMap[consumed], 4800);
    }
    prevFoods = curFoods;

    if (!appState) return;
    var catState = (appState.cat && appState.cat.state) || 'idle';
    var session = appState.session;
    var sessionActive = Boolean(session && !session.done);

    /* 监听猫咪状态变化 */
    if (catState !== prevCatState) {
      if (catState === 'pet') {
        state.daily.pets += 1;
        saveHealState();
        audio.playPurr();
        spawnHearts(4);
        showBubble('呼噜呼噜……被你摸头的时候，整间小屋都变柔软了。', '亲密互动', 3600);
      } else if (catState === 'celebrate') {
        state.daily.focusSessions += 1;
        state.daily.focusMins += Number(appState.selMin) || 25;
        saveHealState();
        audio.playChime();
        spawnHearts(5);
        showBubble('辛苦啦！这一段专注我们一起顺利走完咯，去伸个懒腰或者钓会儿鱼吧。', '专注完成', 5600);
      } else if (catState === 'read' && prevCatState === 'idle') {
        var tag = (save && save.settings && save.settings.lastTag) || '阅读';
        showBubble(pick(TAG_LINES[tag] || TAG_LINES['其他']), '陪你' + tag, 4600);
      } else if (catState === 'nap') {
        var hasRug = Boolean(save && save.equipped && save.equipped.floor);
        showBubble(
          hasRug ? '蜷在软绵绵的地毯上打个小盹，你忙你的，我就在旁边。' : '阳光暖暖的，我眯一小会儿，随时叫我都醒。',
          '小屋日常',
          4200
        );
      }
      prevCatState = catState;
    }

    /* 监听专注提前中断（非 celebrate 退出 session）→ 去惩罚温柔安抚 */
    if (prevSessionActive && !sessionActive && catState !== 'celebrate') {
      state.daily.gentleReturns += 1;
      saveHealState();
      showBubble(pick(GENTLE_INTERRUPT_LINES), '没关系的', 5400);
    }
    prevSessionActive = sessionActive;

    /* 专注期间偶发轻柔碎碎念（每 8 分钟最多一次，避免打扰） */
    if (sessionActive && Date.now() - lastIdleChatterAt > 8 * 60 * 1000) {
      lastIdleChatterAt = Date.now();
      var activeTag = (save && save.settings && save.settings.lastTag) || '阅读';
      showBubble(pick(TAG_LINES[activeTag] || TAG_LINES['其他']), '安静陪伴中', 4500);
    }
  }

  /* 切出页面再回来时的温柔迎接 */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      atmosphere.refresh();
      var appState = PDM.app && PDM.app.state;
      if (appState && appState.cat && appState.cat.state === 'sleep') {
        state.daily.gentleReturns += 1;
        saveHealState();
        showBubble(pick(RETURN_FROM_AWAY_LINES), '欢迎回来', 4800);
      }
    }
  });

  /* ================= 5. 晚安小纸条 / 今日陪伴手账 ================= */
  function composeDailyLetter() {
    var save = readCoreSave();
    var d = state.daily;
    var tag = (save && save.settings && save.settings.lastTag) || '学习';
    var lines = [];

    if (d.focusSessions > 0) {
      lines.push('今天我们一起完成了 ' + d.focusSessions + ' 次专注，大概安安静静坐了 ' + d.focusMins + ' 分钟。');
    } else {
      lines.push('今天虽然没有开启正式计时，但你能抽空来看看我、坐上一小会儿，我就已经很满足啦。');
    }

    if (d.pets > 0 && d.feeds > 0) {
      lines.push('被你摸了 ' + d.pets + ' 次头，还吃到了 ' + d.feeds + ' 次投喂，心里暖呼呼的。');
    } else if (d.pets > 0) {
      lines.push('今天被你摸了 ' + d.pets + ' 次头，每次呼噜起来都觉得时间慢了下来。');
    } else if (d.feeds > 0) {
      lines.push('谢谢你今天记得喂我（' + d.feeds + ' 次），小肚子圆滚滚的很有安全感。');
    } else {
      lines.push('下次忙完记得来揉揉我的耳朵，呼噜声随时为你留着。');
    }

    if (d.gentleReturns > 0) {
      lines.push('中途停下来或离开过也没关系，能一次次回到桌前，本身就是很温柔的坚持。');
    } else {
      lines.push('关于今天的「' + tag + '」，不必苛求做到满分，已经推进的每一小步都算数。');
    }

    lines.push('晚安呀，明天也在暖暖的小屋里等你。');
    return lines.join('\n\n');
  }

  function exportLetterPng(dateStr, bodyText) {
    var c = document.createElement('canvas');
    c.width = 720;
    c.height = 960;
    var g = c.getContext('2d');

    /* 纸张背景 */
    var grad = g.createLinearGradient(0, 0, 0, 960);
    grad.addColorStop(0, '#fffdf8');
    grad.addColorStop(1, '#fff3e0');
    g.fillStyle = grad;
    g.fillRect(0, 0, 720, 960);

    /* 外框 */
    g.strokeStyle = '#dfb891';
    g.lineWidth = 4;
    g.strokeRect(36, 36, 648, 888);

    /* 标题 */
    g.fillStyle = '#5a3f2c';
    g.font = 'bold 34px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText('陪读小喵 · 今日小纸条', 72, 112);

    g.fillStyle = '#9a7a61';
    g.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.fillText(dateStr + ' · 第 ' + Math.max(1, state.companionDays) + ' 天相伴', 72, 154);

    /* 虚线 */
    g.setLineDash([8, 8]);
    g.strokeStyle = '#d8b490';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(72, 186);
    g.lineTo(648, 186);
    g.stroke();
    g.setLineDash([]);

    /* 正文自动换行 */
    g.fillStyle = '#5a4232';
    g.font = '26px "PingFang SC", "Microsoft YaHei", sans-serif';
    var y = 248;
    var maxW = 576;
    bodyText.split('\n').forEach(function (para) {
      if (!para) { y += 22; return; }
      var line = '';
      for (var i = 0; i < para.length; i++) {
        var test = line + para[i];
        if (g.measureText(test).width > maxW) {
          g.fillText(line, 72, y);
          line = para[i];
          y += 44;
        } else {
          line = test;
        }
      }
      if (line) { g.fillText(line, 72, y); y += 44; }
    });

    /* 落款 */
    g.fillStyle = '#9a7a61';
    g.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.textAlign = 'right';
    g.fillText('—— 一直在桌边陪你的小喵 🐾', 648, 868);

    var a = document.createElement('a');
    a.download = 'peiduxiaomiao-note-' + todayKey() + '.png';
    a.href = c.toDataURL('image/png');
    a.click();
  }

  /* ================= 6. 构建悬浮胶囊与面板 UI ================= */
  var ui = (function () {
    var dock, panel, soundBtn, letterMask;

    function build() {
      dock = document.createElement('div');
      dock.id = 'pdm-heal-dock';
      dock.innerHTML = [
        '<div class="pdm-heal-pill-bar">',
        '  <button type="button" class="pdm-heal-icon-btn" id="pdm-heal-toggle-panel" title="治愈声景与光影">',
        '    <span>🎧</span><span>氛围</span>',
        '  </button>',
        '  <button type="button" class="pdm-heal-icon-btn" id="pdm-heal-open-letter" title="今日陪伴小纸条">',
        '    <span>💌</span><span>小纸条</span>',
        '  </button>',
        '</div>',
        '<div id="pdm-heal-panel" aria-label="治愈声景与光影设置">',
        '  <div class="pdm-heal-section">',
        '    <div class="pdm-heal-title"><span>白噪音陪伴声景</span><span id="pdm-heal-sound-state">已关闭</span></div>',
        '    <div class="pdm-heal-grid">',
        '      <button type="button" class="pdm-heal-chip" data-ambient="rain">🌧 窗外细雨</button>',
        '      <button type="button" class="pdm-heal-chip" data-ambient="fire">🔥 暖炉轻响</button>',
        '      <button type="button" class="pdm-heal-chip" data-ambient="pages">📖 翻书沙沙</button>',
        '      <button type="button" class="pdm-heal-chip" data-ambient="breeze">🍃 夏夜微风</button>',
        '    </div>',
        '    <div class="pdm-heal-slider-row">',
        '      <span>音量</span>',
        '      <input id="pdm-heal-vol" type="range" min="0" max="1" step="0.05">',
        '      <button type="button" class="pdm-heal-chip" data-ambient="off" style="padding:4px 8px;">静音</button>',
        '    </div>',
        '  </div>',
        '  <div class="pdm-heal-section">',
        '    <div class="pdm-heal-title"><span>小屋昼夜光影</span></div>',
        '    <div class="pdm-heal-grid-3">',
        '      <button type="button" class="pdm-heal-chip" data-period="auto">随时间</button>',
        '      <button type="button" class="pdm-heal-chip" data-period="morning">清晨</button>',
        '      <button type="button" class="pdm-heal-chip" data-period="afternoon">午后</button>',
        '      <button type="button" class="pdm-heal-chip" data-period="dusk">黄昏</button>',
        '      <button type="button" class="pdm-heal-chip" data-period="night">深夜</button>',
        '      <button type="button" class="pdm-heal-chip" data-period="off">原色</button>',
        '    </div>',
        '  </div>',
        '  <div class="pdm-heal-section">',
        '    <div class="pdm-heal-title"><span>窗外微粒子</span></div>',
        '    <div class="pdm-heal-grid-3">',
        '      <button type="button" class="pdm-heal-chip" data-weather="auto">自动</button>',
        '      <button type="button" class="pdm-heal-chip" data-weather="dust">暖尘</button>',
        '      <button type="button" class="pdm-heal-chip" data-weather="rain">雨丝</button>',
        '      <button type="button" class="pdm-heal-chip" data-weather="snow">微雪</button>',
        '      <button type="button" class="pdm-heal-chip" data-weather="firefly">萤火</button>',
        '      <button type="button" class="pdm-heal-chip" data-weather="off">关闭</button>',
        '    </div>',
        '  </div>',
        '  <div class="pdm-heal-section">',
        '    <label class="pdm-heal-toggle-row">',
        '      <span>摸头呼噜 & 投喂轻音效</span>',
        '      <input id="pdm-heal-sfx" type="checkbox">',
        '    </label>',
        '  </div>',
        '</div>'
      ].join('');
      document.body.appendChild(dock);

      letterMask = document.createElement('div');
      letterMask.id = 'pdm-heal-letter-mask';
      letterMask.innerHTML = [
        '<div class="pdm-heal-letter-card">',
        '  <div class="pdm-heal-letter-header">',
        '    <h3 class="pdm-heal-letter-title">💌 今日陪伴小纸条</h3>',
        '    <span class="pdm-heal-letter-date" id="pdm-heal-letter-date"></span>',
        '  </div>',
        '  <div class="pdm-heal-letter-stats">',
        '    <div><div class="pdm-heal-stat-val" id="pdm-stat-mins">0</div><div class="pdm-heal-stat-lbl">专注分钟</div></div>',
        '    <div><div class="pdm-heal-stat-val" id="pdm-stat-pets">0</div><div class="pdm-heal-stat-lbl">摸头次数</div></div>',
        '    <div><div class="pdm-heal-stat-val" id="pdm-stat-days">1</div><div class="pdm-heal-stat-lbl">相伴天数</div></div>',
        '  </div>',
        '  <p class="pdm-heal-letter-body" id="pdm-heal-letter-body"></p>',
        '  <div class="pdm-heal-letter-sign">—— 一直在桌边陪你的小喵 🐾</div>',
        '  <div class="pdm-heal-letter-actions">',
        '    <button type="button" class="pdm-heal-btn pdm-heal-btn-ghost" id="pdm-heal-letter-close">收好纸条</button>',
        '    <button type="button" class="pdm-heal-btn pdm-heal-btn-primary" id="pdm-heal-letter-save">保存纪念图</button>',
        '  </div>',
        '</div>'
      ].join('');
      document.body.appendChild(letterMask);

      panel = document.getElementById('pdm-heal-panel');
      soundBtn = document.getElementById('pdm-heal-toggle-panel');

      soundBtn.addEventListener('click', function () {
        panel.classList.toggle('is-open');
      });

      document.getElementById('pdm-heal-open-letter').addEventListener('click', openLetter);
      document.getElementById('pdm-heal-letter-close').addEventListener('click', function () {
        letterMask.classList.remove('is-open');
      });
      letterMask.addEventListener('click', function (e) {
        if (e.target === letterMask) letterMask.classList.remove('is-open');
      });
      document.getElementById('pdm-heal-letter-save').addEventListener('click', function () {
        exportLetterPng(todayKey(), composeDailyLetter());
      });

      panel.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (btn.dataset.ambient) {
          audio.startAmbient(btn.dataset.ambient);
          atmosphere.refresh();
          syncUI();
        } else if (btn.dataset.period) {
          state.periodMode = btn.dataset.period;
          saveHealState();
          atmosphere.refresh();
          syncUI();
        } else if (btn.dataset.weather) {
          state.weather = btn.dataset.weather;
          saveHealState();
          atmosphere.refresh();
          syncUI();
        }
      });

      var volEl = document.getElementById('pdm-heal-vol');
      volEl.value = String(state.volume);
      volEl.addEventListener('input', function () {
        audio.setVolume(volEl.value);
      });

      var sfxEl = document.getElementById('pdm-heal-sfx');
      sfxEl.checked = Boolean(state.sfxEnabled);
      sfxEl.addEventListener('change', function () {
        state.sfxEnabled = sfxEl.checked;
        saveHealState();
        if (state.sfxEnabled) audio.playPurr();
      });

      syncUI();
    }

    function openLetter() {
      document.getElementById('pdm-heal-letter-date').textContent = todayKey();
      document.getElementById('pdm-stat-mins').textContent = String(state.daily.focusMins);
      document.getElementById('pdm-stat-pets').textContent = String(state.daily.pets);
      document.getElementById('pdm-stat-days').textContent = String(Math.max(1, state.companionDays));
      document.getElementById('pdm-heal-letter-body').textContent = composeDailyLetter();
      letterMask.classList.add('is-open');
      panel.classList.remove('is-open');
    }

    function syncUI() {
      var names = { off: '已关闭', rain: '细雨中', fire: '暖炉中', pages: '翻书中', breeze: '微风中' };
      var stEl = document.getElementById('pdm-heal-sound-state');
      if (stEl) stEl.textContent = names[state.ambient] || '已关闭';
      if (soundBtn) soundBtn.classList.toggle('is-active', state.ambient !== 'off');

      panel.querySelectorAll('[data-ambient]').forEach(function (el) {
        el.classList.toggle('is-active', el.dataset.ambient === state.ambient);
      });
      panel.querySelectorAll('[data-period]').forEach(function (el) {
        el.classList.toggle('is-active', el.dataset.period === state.periodMode);
      });
      panel.querySelectorAll('[data-weather]').forEach(function (el) {
        el.classList.toggle('is-active', el.dataset.weather === state.weather);
      });
    }

    return { build: build, openLetter: openLetter, syncUI: syncUI };
  })();

  /* ================= 7. 启动入口 ================= */
  function bootHealing() {
    prevFoods = snapshotFoods(readCoreSave());
    atmosphere.init();
    ui.build();

    setTimeout(function () {
      var g = buildGreeting();
      showBubble(g.text, g.tag, 6000);
    }, 900);

    setInterval(pollAppState, 400);
    setInterval(function () {
      atmosphere.refresh();
    }, 60000);
  }

  PDM.healing = {
    boot: bootHealing,
    audio: audio,
    atmosphere: atmosphere,
    showBubble: showBubble,
    openLetter: ui.openLetter,
    state: state
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHealing);
  } else {
    bootHealing();
  }
})();

