/* ============ 陪读小喵 · room scene ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const A = PDM.art;
  const F = PDM.furniture;
  const rr = A.rr, ell = A.ell, star = A.star;

  function tod() {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return { key: 'morning', label: '清晨', night: false, dusk: false };
    if (h >= 10 && h < 17) return { key: 'day', label: '白天', night: false, dusk: false };
    if (h >= 17 && h < 20) return { key: 'dusk', label: '傍晚', night: false, dusk: true };
    return { key: 'night', label: '夜晚', night: true, dusk: false };
  }

  function cloud(ctx, x, y, s, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ell(ctx, x, y, 18 * s, 8 * s); ctx.fill();
    ell(ctx, x + 14 * s, y - 5 * s, 12 * s, 8 * s); ctx.fill();
    ell(ctx, x - 15 * s, y - 2 * s, 10 * s, 6 * s); ctx.fill();
    ctx.restore();
  }

  function drawWindow(ctx, x, y, w, h, env) {
    const night = env.night, dusk = env.dusk;
    ctx.fillStyle = 'rgba(130, 98, 70, .13)';
    rr(ctx, x + 3, y + 5, w, h, 12);
    ctx.fill();

    ctx.fillStyle = '#FFF9F0';
    rr(ctx, x, y, w, h, 11);
    ctx.fill();
    ctx.strokeStyle = '#E7D0B8';
    ctx.lineWidth = 1.6;
    rr(ctx, x, y, w, h, 11);
    ctx.stroke();

    const pad = Math.max(5, w * 0.055);
    const ix = x + pad, iy = y + pad, iw = w - pad * 2, ih = h - pad * 2;

    ctx.save();
    rr(ctx, ix, iy, iw, ih, 7);
    ctx.clip();

    // sky
    const g = ctx.createLinearGradient(0, iy, 0, iy + ih);
    if (night) {
      g.addColorStop(0, '#39476A');
      g.addColorStop(0.6, '#556690');
      g.addColorStop(1, '#8B9BBE');
    } else if (dusk) {
      g.addColorStop(0, '#F3B58F');
      g.addColorStop(0.55, '#F8D3AE');
      g.addColorStop(1, '#FBE7CF');
    } else if (env.morning) {
      g.addColorStop(0, '#CFE9F4');
      g.addColorStop(0.65, '#E9F6FA');
      g.addColorStop(1, '#FDF2DE');
    } else {
      g.addColorStop(0, '#B9E0F2');
      g.addColorStop(0.7, '#E1F2F9');
      g.addColorStop(1, '#F7F0E1');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ix, iy, iw, ih);

    const t = env.t || 0;
    if (night) {
      // moon
      const mx = ix + iw * 0.68, my = iy + ih * 0.28, mr = iw * 0.13;
      ctx.fillStyle = '#FBEFC9';
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0.55, Math.PI * 2 - 0.55, false);
      ctx.arc(mx + mr * 0.42, my - mr * 0.2, mr * 0.82, Math.PI * 2 - 0.85, 0.85, true);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 14; i++) {
        const sx = ix + ((i * 37) % 100) / 100 * iw;
        const sy = iy + ((i * 53) % 62) / 100 * ih;
        const tw = 0.45 + Math.sin(t * 2 + i * 1.3) * 0.4;
        ctx.globalAlpha = Math.max(0.1, tw);
        ctx.fillStyle = '#FFF4D2';
        ell(ctx, sx, sy, 1.2, 1.2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // rooftops
      ctx.fillStyle = 'rgba(46, 58, 84, .85)';
      const baseY = iy + ih;
      const roofs = [[ix + iw * 0.02, iw * 0.2, ih * 0.2], [ix + iw * 0.25, iw * 0.26, ih * 0.28], [ix + iw * 0.56, iw * 0.2, ih * 0.22], [ix + iw * 0.78, iw * 0.24, ih * 0.3]];
      roofs.forEach(([rx, rw, rh]) => {
        ctx.fillRect(rx, baseY - rh, rw, rh);
        ctx.beginPath();
        ctx.moveTo(rx - 2, baseY - rh);
        ctx.lineTo(rx + rw / 2, baseY - rh - 8);
        ctx.lineTo(rx + rw + 2, baseY - rh);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 220, 150, .75)';
        for (let k = 0; k < 3; k++) {
          if ((k + Math.floor(rx)) % 2 === 0) {
            ctx.fillRect(rx + 4 + k * 8, baseY - rh + 8, 3, 4);
          }
        }
        ctx.fillStyle = 'rgba(46, 58, 84, .85)';
      });
    } else {
      const sunX = ix + iw * (dusk ? 0.28 : 0.72);
      const sunY = iy + ih * (dusk ? 0.62 : 0.3);
      const sunR = iw * 0.11;
      const sg = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, sunR * 2.4);
      sg.addColorStop(0, dusk ? 'rgba(255, 186, 120, .85)' : 'rgba(255, 231, 174, .9)');
      sg.addColorStop(1, 'rgba(255, 220, 150, 0)');
      ctx.fillStyle = sg;
      ell(ctx, sunX, sunY, sunR * 2.4, sunR * 2.4);
      ctx.fill();
      ctx.fillStyle = dusk ? '#FFD3A0' : '#FFE9B0';
      ell(ctx, sunX, sunY, sunR, sunR);
      ctx.fill();
      cloud(ctx, ix + iw * 0.28, iy + ih * 0.3, iw / 110, 0.75);
      cloud(ctx, ix + iw * 0.66, iy + ih * 0.55, iw / 150, 0.55);
      // distant trees
      ctx.fillStyle = 'rgba(150, 190, 158, .55)';
      ell(ctx, ix + iw * 0.14, iy + ih * 0.93, iw * 0.1, ih * 0.08); ctx.fill();
      ell(ctx, ix + iw * 0.3, iy + ih * 0.96, iw * 0.13, ih * 0.09); ctx.fill();
    }
    ctx.restore();

    // mullions
    ctx.strokeStyle = '#FFF9F0';
    ctx.lineWidth = Math.max(3, w * 0.035);
    ctx.beginPath();
    ctx.moveTo(ix + iw / 2, iy);
    ctx.lineTo(ix + iw / 2, iy + ih);
    ctx.moveTo(ix, iy + ih * 0.52);
    ctx.lineTo(ix + iw, iy + ih * 0.52);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(202, 172, 142, .45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ix + iw / 2 + 1.6, iy);
    ctx.lineTo(ix + iw / 2 + 1.6, iy + ih);
    ctx.stroke();

    // sill
    ctx.fillStyle = '#F6E3CB';
    rr(ctx, x - 7, y + h - 3, w + 14, 9, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(205, 172, 138, .5)';
    ctx.lineWidth = 1;
    rr(ctx, x - 7, y + h - 3, w + 14, 9, 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, .5)';
    ctx.fillRect(x - 5, y + h - 2, w + 10, 2);
  }

  function drawDesk(ctx, W, H, floorY, u) {
    const x0 = W * 0.545, x1 = W * 0.988;
    const topY = floorY - 94 * u;
    // shadow
    ctx.fillStyle = 'rgba(120, 86, 58, .12)';
    ell(ctx, (x0 + x1) / 2, floorY + 4, (x1 - x0) * 0.54, 10 * u);
    ctx.fill();
    // legs
    ctx.fillStyle = '#D3A87E';
    rr(ctx, x0 + 10 * u, topY + 8 * u, 10 * u, 86 * u, 3 * u);
    ctx.fill();
    rr(ctx, x1 - 22 * u, topY + 8 * u, 10 * u, 86 * u, 3 * u);
    ctx.fill();
    // shelf under desk
    ctx.fillStyle = '#E0BC95';
    rr(ctx, x0 + 12 * u, topY + 48 * u, (x1 - x0) - 30 * u, 6 * u, 2 * u);
    ctx.fill();
    // books under desk
    ctx.fillStyle = '#9EBFCE';
    rr(ctx, x0 + 28 * u, topY + 62 * u, 16 * u, 24 * u, 2);
    ctx.fill();
    ctx.fillStyle = '#E7B69C';
    rr(ctx, x0 + 44 * u, topY + 68 * u, 13 * u, 18 * u, 2);
    ctx.fill();
    // top
    const g = ctx.createLinearGradient(0, topY, 0, topY + 12 * u);
    g.addColorStop(0, '#F5DCBD');
    g.addColorStop(1, '#E3BD95');
    ctx.fillStyle = g;
    rr(ctx, x0, topY, x1 - x0, 11 * u, 4 * u);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190, 148, 108, .45)';
    ctx.lineWidth = 1;
    rr(ctx, x0, topY, x1 - x0, 11 * u, 4 * u);
    ctx.stroke();
    // edge highlight
    ctx.fillStyle = 'rgba(255, 255, 255, .45)';
    rr(ctx, x0 + 2, topY + 1, (x1 - x0) - 4, 2.2 * u, 1);
    ctx.fill();
    return { x0: x0, x1: x1, topY: topY };
  }

  function drawFloor(ctx, W, H, floorY, u, env) {
    const g = ctx.createLinearGradient(0, floorY, 0, H);
    g.addColorStop(0, '#F2DCC2');
    g.addColorStop(1, '#E9CEAF');
    ctx.fillStyle = g;
    ctx.fillRect(0, floorY, W, H - floorY);
    // planks
    ctx.strokeStyle = 'rgba(190, 150, 112, .22)';
    ctx.lineWidth = 1;
    const step = 15 * u;
    for (let y = floorY + step; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(190, 150, 112, .16)';
    for (let i = 0; i < 8; i++) {
      const x = (i * 67 * u) % W;
      const y = floorY + ((i * 41) % 3) * step;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, Math.min(H, y + step));
      ctx.stroke();
    }
    // window light patch
    if (!env.night) {
      ctx.save();
      ctx.globalAlpha = env.dusk ? 0.1 : 0.13;
      ctx.fillStyle = '#FFF2D6';
      ctx.beginPath();
      ctx.moveTo(W * 0.58, floorY);
      ctx.lineTo(W * 0.94, floorY);
      ctx.lineTo(W, H);
      ctx.lineTo(W * 0.52, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // baseboard shadow
    const bg = ctx.createLinearGradient(0, floorY - 6 * u, 0, floorY + 8 * u);
    bg.addColorStop(0, 'rgba(120, 86, 58, 0)');
    bg.addColorStop(0.4, 'rgba(120, 86, 58, .16)');
    bg.addColorStop(1, 'rgba(120, 86, 58, 0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, floorY - 6 * u, W, 14 * u);
  }

  function drawParticles(ctx, W, H, t, level) {
    const n = 8 + Math.min(10, level * 2);
    for (let i = 0; i < n; i++) {
      const baseX = ((i * 61) % 97) / 97 * W;
      const baseY = ((i * 37) % 83) / 83 * H * 0.72 + H * 0.1;
      const drift = Math.sin(t * 0.35 + i * 1.7) * 8;
      const rise = ((t * 5 + i * 13) % 40) - 20;
      ctx.globalAlpha = 0.12 + (i % 4) * 0.035 + Math.sin(t * 0.8 + i) * 0.04;
      ctx.fillStyle = i % 3 === 0 ? '#FFF1D0' : '#FFFFFF';
      ell(ctx, baseX + drift, baseY + rise, 1.5 + (i % 3) * 0.5, 1.5 + (i % 3) * 0.5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- free layout ---------------- */
  let lastGeom = null;

  function itemSlot(id) {
    const it = PDM.core.itemById(id);
    return it ? it.slot : 'floor';
  }

  // 旧版每个格子的默认摆放位置（像素）
  function presetPlacement(id, g) {
    const W = g.W, H = g.H, u = g.u, floorY = g.floorY, deskTopY = g.deskTopY, win = g.win;
    const winScale = win.w / 120;
    switch (id) {
      case 'wd_curtain': case 'wd_sill': case 'wd_chime': case 'wd_sticker':
        return { x: win.x + win.w / 2, y: win.y + win.h + 2, scale: winScale };
      case 'w_star':
        return { x: W * 0.33, y: H * 0.145, scale: u * 0.86 };
      case 'w_clock':
        return { x: W * 0.335, y: H * 0.365, scale: u * 0.88 };
      case 'w_photo': case 'w_poster': case 'w_neon': case 'w_calendar':
        return { x: W * 0.335, y: H * 0.365, scale: u * (id === 'w_neon' ? 0.82 : 0.92) };
      case 'fl_rug':
        return { x: W * 0.365, y: floorY + 29 * u, scale: u * 0.86 };
      case 'fl_bed':
        return { x: W * 0.18, y: floorY + 52 * u, scale: u * 0.76 };
      case 'fl_shelf':
        return { x: W * 0.135, y: floorY + 6 * u, scale: u * 0.84 };
      case 'fl_cushion':
        return { x: W * 0.15, y: floorY + 38 * u, scale: u * 0.8 };
      case 'fl_pouf':
        return { x: W * 0.23, y: floorY + 44 * u, scale: u * 0.8 };
      case 'o_plant':
        return { x: W * 0.535, y: floorY + 20 * u, scale: u * 0.8 };
      case 'o_maneki':
        return { x: W * 0.545, y: floorY + 18 * u, scale: u * 0.72 };
      case 'o_globe':
        return { x: W * 0.535, y: floorY + 22 * u, scale: u * 0.78 };
      case 'o_yarn':
        return { x: W * 0.49, y: floorY + 36 * u, scale: u * 0.8 };
      case 'o_vase':
        return { x: W * 0.5, y: floorY + 26 * u, scale: u * 0.82 };
      case 'd_lamp':
        return { x: W * 0.745, y: deskTopY + 1.5 * u, scale: u * 0.92 };
      case 'd_pen':
        return { x: W * 0.64, y: deskTopY + 1.5 * u, scale: u * 0.9 };
      case 'd_jar':
        return { x: W * 0.935, y: deskTopY + 1.5 * u, scale: u * 0.8 };
      case 'd_cocoa':
        return { x: W * 0.83, y: deskTopY + 1.5 * u, scale: u * 0.86 };
      case 'd_mug':
        return { x: W * 0.7, y: deskTopY + 1.5 * u, scale: u * 0.82 };
      case 'd_books':
        return { x: W * 0.8, y: deskTopY + 1.5 * u, scale: u * 0.8 };
    }
    // 未知物品按格子兜底
    const slot = itemSlot(id);
    const fb = {
      wall: { x: W * 0.335, y: H * 0.365, scale: u * 0.9 },
      window: { x: win.x + win.w / 2, y: win.y + win.h + 2, scale: winScale },
      desk: { x: W * 0.74, y: deskTopY + 1.5 * u, scale: u * 0.86 },
      floor: { x: W * 0.3, y: floorY + 40 * u, scale: u * 0.8 },
      ornament: { x: W * 0.53, y: floorY + 20 * u, scale: u * 0.8 }
    };
    return fb[slot] || fb.floor;
  }

  function buildPlacements(equipped, g) {
    const S = PDM.core.state();
    const layout = S.layout || {};
    const out = [];
    const seen = {};
    function add(id) {
      if (!id || seen[id] || !PDM.core.isOwned(id)) return;
      const L = layout[id];
      let p;
      if (L && typeof L.x === 'number' && typeof L.y === 'number') {
        p = { id: id, slot: itemSlot(id), x: L.x * g.W, y: L.y * g.H, scale: (L.k || 1) * g.u };
      } else {
        const def = presetPlacement(id, g);
        if (!def) return;
        p = { id: id, slot: itemSlot(id), x: def.x, y: def.y, scale: def.scale };
        // 旧存档没有坐标，按预设补一条，之后就能自由拖动
        PDM.core.ensurePlacement(id, def.x / g.W, def.y / g.H, def.scale / g.u);
      }
      seen[id] = true;
      out.push(p);
    }
    Object.keys(layout).forEach(add);
    if (equipped) Object.keys(equipped).forEach(s => add(equipped[s]));
    return out;
  }

  // 供布置面板取默认落点（归一化）
  function defaultSpot(id) {
    if (lastGeom) {
      const p = presetPlacement(id, lastGeom);
      if (p) return { x: p.x / lastGeom.W, y: p.y / lastGeom.H, k: p.scale / lastGeom.u };
    }
    const fb = {
      wall: [0.335, 0.365, 0.9],
      window: [0.762, 0.41, 1.05],
      desk: [0.74, 0.55, 0.88],
      floor: [0.3, 0.88, 0.8],
      ornament: [0.53, 0.86, 0.8]
    };
    const d = fb[itemSlot(id)] || fb.floor;
    return { x: d[0], y: d[1], k: d[2] };
  }

  function drawRoom(ctx, W, H, opts) {
    opts = opts || {};
    const S = PDM.core.state();
    const env = tod();
    env.t = opts.t == null ? performance.now() / 1000 : opts.t;
    env.night = env.night || !!opts.forceNight;
    const u = W / 400;
    const floorY = H * 0.80;
    const level = opts.level || (PDM.core.levelInfo().level);
    const equipped = opts.equipped || S.equipped;
    const outfit = opts.outfit || S.outfit;
    const catState = opts.catState || 'idle';

    // wall
    const wg = ctx.createLinearGradient(0, 0, 0, floorY);
    wg.addColorStop(0, '#FDF4E6');
    wg.addColorStop(1, '#F7E5D0');
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W, floorY);

    // wallpaper stripes
    ctx.fillStyle = 'rgba(255, 255, 255, .38)';
    for (let x = 0; x < W; x += 26 * u) {
      ctx.fillRect(x, 0, 9 * u, floorY);
    }
    ctx.fillStyle = 'rgba(236, 209, 181, .18)';
    for (let x = 18 * u; x < W; x += 52 * u) {
      ctx.fillRect(x, 0, 2 * u, floorY);
    }
    // warm top glow
    const tg = ctx.createRadialGradient(W * 0.5, -H * 0.1, 10, W * 0.5, -H * 0.1, H * 0.85);
    tg.addColorStop(0, 'rgba(255, 240, 212, .75)');
    tg.addColorStop(1, 'rgba(255, 240, 212, 0)');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, W, H * 0.8);

    const win = { x: W * 0.60, y: H * 0.10, w: W * 0.325, h: H * 0.305 };
    drawWindow(ctx, win.x, win.y, win.w, win.h, env);

    // ---- free layout: 摆放坐标（layout 优先，旧存档按预设迁移）----
    const geom = { W: W, H: H, u: u, floorY: floorY, deskTopY: floorY - 94 * u, win: win };
    const placements = buildPlacements(equipped, geom);
    lastGeom = geom;
    PDM.room.placements = placements;

    const winEnv = { night: env.night, tod: env.key };
    const drawGroup = (list, e) => list.forEach(p => F.drawItem(ctx, p.id, p.x, p.y, p.scale, env.t, e || env));

    // window items (curtain / sill / chime / stickers)
    drawGroup(placements.filter(p => p.slot === 'window'), winEnv);

    // wall items
    drawGroup(placements.filter(p => p.slot === 'wall'), env);

    // floor
    drawFloor(ctx, W, H, floorY, u, env);
    // baseboard
    ctx.fillStyle = '#F3DFC6';
    ctx.fillRect(0, floorY - 5 * u, W, 5 * u);
    ctx.fillStyle = 'rgba(255, 255, 255, .4)';
    ctx.fillRect(0, floorY - 5 * u, W, 1.6 * u);
    ctx.fillStyle = 'rgba(186, 148, 112, .25)';
    ctx.fillRect(0, floorY - 0.8 * u, W, 0.8 * u);

    // rug first, then other floor items (lower on screen in front)
    const floorItems = placements.filter(p => p.slot === 'floor');
    drawGroup(floorItems.filter(p => p.id === 'fl_rug'), env);
    drawGroup(floorItems.filter(p => p.id !== 'fl_rug').sort((a, b) => a.y - b.y), env);

    // ornament
    drawGroup(placements.filter(p => p.slot === 'ornament').sort((a, b) => a.y - b.y), env);

    // desk
    const desk = drawDesk(ctx, W, H, floorY, u);
    drawGroup(placements.filter(p => p.slot === 'desk'), env);

    // food bowl (ambient)
    ctx.fillStyle = 'rgba(120, 88, 62, .1)';
    ell(ctx, W * 0.47, floorY + 41 * u, 17 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = '#F2C9B4';
    ell(ctx, W * 0.47, floorY + 37 * u, 16 * u, 5.5 * u);
    ctx.fill();
    ctx.fillStyle = '#FFF4E6';
    ell(ctx, W * 0.47, floorY + 36 * u, 12 * u, 3.6 * u);
    ctx.fill();
    ctx.fillStyle = '#EFB27A';
    ell(ctx, W * 0.47, floorY + 36 * u, 5 * u, 1.8 * u);
    ctx.fill();

    // cat
    const catX = W * 0.355;
    const catY = floorY + 22 * u;
    A.drawCat(ctx, catX, catY, u * 1.12, {
      state: catState,
      outfit: outfit,
      t: env.t
    });

    // lamp glow overlay follows the lamp wherever it is placed
    const lamp = placements.find(p => p.id === 'd_lamp');
    if (lamp) {
      const gx = lamp.x, gy = lamp.y - 34 * lamp.scale;
      const lg = ctx.createRadialGradient(gx, gy, 4, gx, gy, 115 * u);
      lg.addColorStop(0, env.night ? 'rgba(255, 207, 145, .30)' : 'rgba(255, 214, 155, .16)');
      lg.addColorStop(1, 'rgba(255, 207, 145, 0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    }

    drawParticles(ctx, W, H, env.t, level);

    // time tint + vignette
    if (env.night) {
      ctx.fillStyle = 'rgba(72, 92, 140, .10)';
      ctx.fillRect(0, 0, W, H);
    } else if (env.dusk) {
      ctx.fillStyle = 'rgba(255, 170, 110, .05)';
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.44, H * 0.25, W * 0.5, H * 0.5, H * 0.9);
    vg.addColorStop(0, 'rgba(120, 80, 50, 0)');
    vg.addColorStop(1, 'rgba(120, 80, 50, .13)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    return { catX: catX, catY: catY, u: u, floorY: floorY, desk: desk };
  }

  PDM.room = { drawRoom: drawRoom, tod: tod, defaultSpot: defaultSpot, placements: [] };
})(window.PDM);
