/* ============ 陪读小喵 · audio: 环境音混音台 + 轻音效（WebAudio 实时合成） ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';

  const KEY = 'pdm.audio.v1';
  const DEFAULTS = {
    on: false,
    sfx: true,
    vol: { rain: 42, fire: 38, page: 28, cafe: 24, purr: 34 }
  };
  const LAYERS = [
    { id: 'rain', name: '细雨' },
    { id: 'fire', name: '壁炉' },
    { id: 'page', name: '翻书' },
    { id: 'cafe', name: '咖啡馆' },
    { id: 'purr', name: '呼噜' }
  ];
  // 每条声音的响度权重，让滑块在同一位置听感接近
  const TRIM = { rain: 0.5, fire: 0.5, page: 0.3, cafe: 0.48, purr: 0.42 };

  let cfg = load();
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let built = false;
  let nodes = {};
  let fireTimer = 0;

  function load() {
    const out = {
      on: DEFAULTS.on,
      sfx: DEFAULTS.sfx,
      vol: Object.assign({}, DEFAULTS.vol)
    };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          out.on = !!p.on;
          out.sfx = p.sfx !== false;
          out.vol = Object.assign({}, DEFAULTS.vol, (p.vol && typeof p.vol === 'object') ? p.vol : {});
        }
      }
    } catch (e) {}
    LAYERS.forEach(l => {
      const v = Number(out.vol[l.id]);
      out.vol[l.id] = isFinite(v) ? Math.max(0, Math.min(100, v)) : DEFAULTS.vol[l.id];
    });
    return out;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  function AudioCtor() {
    return window.AudioContext || window.webkitAudioContext;
  }

  /* ---------------- 节点搭建 ---------------- */
  function noiseBuffer(seconds, brown) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.4;
      } else {
        d[i] = w;
      }
    }
    return buf;
  }

  function loopNoise(brown, seconds) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(seconds || 3, brown);
    src.loop = true;
    return src;
  }

  // 缓慢起伏用的调制器：返回一个 gain，其增益在 base 附近呼吸
  function breathe(rate, depth, base) {
    const mod = ctx.createGain();
    mod.gain.value = base;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    const amount = ctx.createGain();
    amount.gain.value = depth;
    lfo.connect(amount);
    amount.connect(mod.gain);
    lfo.start();
    return mod;
  }

  function ensureLayers() {
    if (built || !ctx) return;
    built = true;
    const t = ctx.currentTime;

    // 细雨：高频噪声 + 柔和低通
    {
      const src = loopNoise(false, 4);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6400;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master);
      src.start(t);
      nodes.rain = { gain: g };
    }

    // 壁炉：棕噪声做底，再加随机噼啪
    {
      const src = loopNoise(true, 4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 760;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(t);
      nodes.fire = { gain: g };
      scheduleCrackle();
    }

    // 翻书：带通噪声 + 很慢的呼吸，像纸页翻动
    {
      const src = loopNoise(false, 4);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1700;
      bp.Q.value = 0.7;
      const mod = breathe(0.12, 0.42, 0.5);
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(bp); bp.connect(mod); mod.connect(g); g.connect(master);
      src.start(t);
      nodes.page = { gain: g };
    }

    // 咖啡馆：低频人声底噪 + 轻微起伏
    {
      const src = loopNoise(true, 4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 680;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 420;
      bp.Q.value = 0.5;
      const mod = breathe(0.27, 0.28, 0.6);
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(lp); lp.connect(bp); bp.connect(mod); mod.connect(g); g.connect(master);
      src.start(t);
      nodes.cafe = { gain: g };
    }

    // 小猫呼噜：噪声透过低通，再用 24Hz 做幅度调制
    {
      const src = loopNoise(false, 4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 300;
      const mod = breathe(24, 0.45, 0.5);
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(lp); lp.connect(mod); mod.connect(g); g.connect(master);
      src.start(t);
      nodes.purr = { gain: g };
    }
  }

  function scheduleCrackle() {
    clearTimeout(fireTimer);
    fireTimer = setTimeout(() => {
      if (!ctx) return;
      if (cfg.on && (cfg.vol.fire || 0) > 0 && nodes.fire) crackle();
      scheduleCrackle();
    }, 180 + Math.random() * 900);
  }

  function crackle() {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.1, false);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400 + Math.random() * 1800;
    const g = ctx.createGain();
    const peak = 0.12 + Math.random() * 0.24;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06 + Math.random() * 0.08);
    src.connect(hp); hp.connect(g); g.connect(nodes.fire.gain);
    src.start(t);
    src.stop(t + 0.2);
  }

  function layerTarget(id) {
    return cfg.on ? (cfg.vol[id] || 0) / 100 * (TRIM[id] || 0.4) : 0;
  }

  function applyLayer(id) {
    if (!ctx || !nodes[id]) return;
    nodes[id].gain.gain.setTargetAtTime(layerTarget(id), ctx.currentTime, 0.08);
  }

  function applyAll() {
    if (!ctx) return;
    master.gain.setTargetAtTime(cfg.on ? 1 : 0, ctx.currentTime, 0.12);
    sfxBus.gain.setTargetAtTime(cfg.sfx ? 0.9 : 0, ctx.currentTime, 0.05);
    LAYERS.forEach(l => applyLayer(l.id));
  }

  /* ---------------- 对外：环境音 ---------------- */
  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended' && ctx.resume) {
        try { ctx.resume(); } catch (e) {}
      }
      return ctx;
    }
    const Ctor = AudioCtor();
    if (!Ctor) return null;
    try { ctx = new Ctor(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = cfg.sfx ? 0.9 : 0;
    sfxBus.connect(ctx.destination);
    if (cfg.on) ensureLayers();
    applyAll();
    if (ctx.state === 'suspended' && ctx.resume) {
      try { ctx.resume(); } catch (e) {}
    }
    return ctx;
  }

  function setOn(on) {
    cfg.on = !!on;
    save();
    if (cfg.on) {
      ensure();
      ensureLayers();
    }
    applyAll();
    return cfg.on;
  }

  function setSfx(on) {
    cfg.sfx = !!on;
    save();
    if (cfg.sfx) ensure();
    if (ctx && sfxBus) sfxBus.gain.setTargetAtTime(cfg.sfx ? 0.9 : 0, ctx.currentTime, 0.05);
    return cfg.sfx;
  }

  function setVolume(id, val) {
    if (!(id in DEFAULTS.vol)) return;
    const v = Math.max(0, Math.min(100, Number(val) || 0));
    cfg.vol[id] = v;
    save();
    applyLayer(id);
    return v;
  }

  function mixerInfo() {
    return {
      on: cfg.on,
      sfx: cfg.sfx,
      layers: LAYERS.map(l => ({ id: l.id, name: l.name, vol: cfg.vol[l.id] }))
    };
  }

  /* ---------------- 轻音效 ---------------- */
  function envGain(peak, dur, at) {
    const g = ctx.createGain();
    const t = at == null ? ctx.currentTime : at;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }

  function tone(freq, type, dur, peak, when, sweepTo) {
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t + dur);
    const g = envGain(peak || 0.1, dur, t);
    o.connect(g); g.connect(sfxBus);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function burst(dur, peak, type, freq, when) {
    const t = ctx.currentTime + (when || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(Math.max(0.06, dur), false);
    const f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.setValueAtTime(freq || 1200, t);
    f.Q.value = 0.8;
    const g = envGain(peak || 0.16, dur, t);
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function playSfx(name) {
    if (!cfg.sfx) return;
    if (!ensure()) return;
    if (ctx.state === 'suspended' && ctx.resume) {
      try { ctx.resume(); } catch (e) {}
    }
    switch (name) {
      case 'purr':
        tone(46, 'triangle', 0.55, 0.09, 0, 38);
        tone(92, 'sine', 0.5, 0.04, 0, 76);
        burst(0.5, 0.05, 'lowpass', 260, 0);
        break;
      case 'click':
        tone(760, 'triangle', 0.06, 0.05, 0, 560);
        break;
      case 'ding':
        tone(880, 'sine', 0.5, 0.1);
        tone(1318.5, 'sine', 0.62, 0.07, 0.09);
        break;
      case 'splash':
        burst(0.26, 0.16, 'bandpass', 1800);
        tone(320, 'sine', 0.2, 0.045, 0, 120);
        break;
      case 'coin':
        tone(1046.5, 'triangle', 0.09, 0.05);
        tone(1568, 'triangle', 0.09, 0.045, 0.06);
        tone(2093, 'sine', 0.18, 0.06, 0.12);
        break;
    }
  }

  PDM.audio = {
    ensure: ensure,
    isOn: () => cfg.on,
    isSfxOn: () => cfg.sfx,
    setOn: setOn,
    setSfx: setSfx,
    setVolume: setVolume,
    mixerInfo: mixerInfo,
    playSfx: playSfx
  };
})(window.PDM);
