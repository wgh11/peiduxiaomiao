/* ============ 陪读小喵 · comics / share card / welcome art ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const A = PDM.art;
  const rr = A.rr, ell = A.ell, star = A.star;

  function setup(canvas, W, H) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function rain(ctx, W, H, t, alpha) {
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 205, 220, ' + (alpha || 0.5) + ')';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137 + t * 60) % (W + 60)) - 30;
      const y = ((i * 89 + t * 220) % (H + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y + 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  function backdrop(ctx, W, H, comic, night) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, night ? '#48516B' : '#FDF3E2');
    g.addColorStop(0.7, night ? '#5E6684' : comic.color);
    g.addColorStop(1, night ? '#6C7189' : '#F3D9BE');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // soft halo
    const hg = ctx.createRadialGradient(W * 0.46, H * 0.45, 20, W * 0.46, H * 0.45, W * 0.5);
    hg.addColorStop(0, night ? 'rgba(255, 232, 180, .14)' : 'rgba(255, 255, 255, .38)');
    hg.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);
    // floor
    ctx.fillStyle = night ? 'rgba(43, 47, 63, .55)' : 'rgba(233, 203, 171, .8)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.78);
    ctx.quadraticCurveTo(W * 0.5, H * 0.74, W, H * 0.78);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function windowBox(ctx, x, y, w, h, night, withRain, t) {
    ctx.fillStyle = '#FFF9EF';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214, 184, 152, .7)';
    ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 10);
    ctx.stroke();
    const ix = x + 8, iy = y + 8, iw = w - 16, ih = h - 16;
    ctx.save();
    rr(ctx, ix, iy, iw, ih, 6);
    ctx.clip();
    const g = ctx.createLinearGradient(0, iy, 0, iy + ih);
    if (night) {
      g.addColorStop(0, '#3D4A6C');
      g.addColorStop(1, '#7C88A8');
    } else {
      g.addColorStop(0, '#BFE2F1');
      g.addColorStop(1, '#EAF5F7');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ix, iy, iw, ih);
    if (night) {
      ctx.fillStyle = '#FBEFC9';
      ctx.beginPath();
      ctx.arc(ix + iw * 0.68, iy + ih * 0.3, Math.min(iw, ih) * 0.12, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(255, 246, 214, .8)';
        ell(ctx, ix + (i * 29) % iw, iy + (i * 43) % ih, 1.2, 1.2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, .8)';
      ell(ctx, ix + iw * 0.3, iy + ih * 0.35, iw * 0.16, ih * 0.08);
      ctx.fill();
    }
    if (withRain) rain(ctx, iw, ih, t, 0.55);
    ctx.restore();
    ctx.strokeStyle = '#FFF9EF';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, iy);
    ctx.lineTo(x + w / 2, iy + ih);
    ctx.stroke();
  }

  const PROPS = {
    box: function (ctx, W, H, t) {
      // cat sits inside a cardboard box
      ctx.fillStyle = '#D9AF80';
      rr(ctx, W * 0.27, H * 0.62, W * 0.36, H * 0.2, 6);
      ctx.fill();
      ctx.fillStyle = '#C99B6C';
      rr(ctx, W * 0.27, H * 0.62, W * 0.36, H * 0.06, 6);
      ctx.fill();
      // flaps
      ctx.fillStyle = '#E2BE94';
      ctx.beginPath();
      ctx.moveTo(W * 0.27, H * 0.62);
      ctx.lineTo(W * 0.18, H * 0.53);
      ctx.lineTo(W * 0.3, H * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W * 0.63, H * 0.62);
      ctx.lineTo(W * 0.72, H * 0.54);
      ctx.lineTo(W * 0.6, H * 0.55);
      ctx.closePath();
      ctx.fill();
      // front
      ctx.fillStyle = '#D9AF80';
      rr(ctx, W * 0.3, H * 0.72, W * 0.3, H * 0.1, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(160, 116, 76, .5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(W * 0.3, H * 0.75);
      ctx.lineTo(W * 0.6, H * 0.75);
      ctx.stroke();
    },
    jar: function (ctx, W, H, t) {
      // kitchen counter + giant fish jar
      ctx.fillStyle = 'rgba(214, 178, 138, .85)';
      rr(ctx, 0, H * 0.78, W, H * 0.22, 0);
      ctx.fill();
      ctx.save();
      ctx.translate(W * 0.75, H * 0.76);
      ctx.scale(1.9, 1.9);
      ctx.fillStyle = 'rgba(236, 246, 243, .9)';
      rr(ctx, -20, -56, 40, 56, 9);
      ctx.fill();
      ctx.strokeStyle = '#BED8CE';
      ctx.lineWidth = 1.8;
      rr(ctx, -20, -56, 40, 56, 9);
      ctx.stroke();
      ctx.fillStyle = '#C9A57E';
      rr(ctx, -22, -64, 44, 10, 3);
      ctx.fill();
      const fish = [[-8, -14, 0.3], [6, -18, -0.2], [-2, -28, 0.1], [9, -36, 0.5], [-8, -42, -0.4]];
      fish.forEach(([x, y, r]) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r);
        ctx.fillStyle = '#F0B96C';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 3.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5.4, 0); ctx.lineTo(9, -3); ctx.lineTo(9, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
      // sleepy pale zzz
      ctx.fillStyle = 'rgba(255, 250, 240, .85)';
      ctx.font = '700 18px "PingFang SC", sans-serif';
      ctx.fillText('z', W * 0.83, H * 0.47);
    },
    umbrella: function (ctx, W, H, t) {
      rain(ctx, W, H, t, 0.35);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.63);
      // pole
      ctx.strokeStyle = '#9A7A5E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -H * 0.25);
      ctx.stroke();
      // canopy
      ctx.fillStyle = '#EF9C86';
      ctx.beginPath();
      ctx.moveTo(-W * 0.17, -H * 0.25);
      ctx.quadraticCurveTo(0, -H * 0.42, W * 0.17, -H * 0.25);
      ctx.quadraticCurveTo(W * 0.09, -H * 0.2, 0, -H * 0.25);
      ctx.quadraticCurveTo(-W * 0.09, -H * 0.2, -W * 0.17, -H * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 245, 235, .7)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-W * 0.085, -H * 0.235);
      ctx.quadraticCurveTo(-W * 0.04, -H * 0.34, 0, -H * 0.345);
      ctx.moveTo(W * 0.085, -H * 0.235);
      ctx.quadraticCurveTo(W * 0.04, -H * 0.34, 0, -H * 0.345);
      ctx.stroke();
      ctx.restore();
    },
    flag: function (ctx, W, H, t) {
      ctx.strokeStyle = '#C9A57E';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W * 0.69, H * 0.82);
      ctx.lineTo(W * 0.69, H * 0.3);
      ctx.stroke();
      ctx.fillStyle = '#F6E3C6';
      ctx.beginPath();
      ctx.moveTo(W * 0.69, H * 0.3);
      ctx.lineTo(W * 0.9, H * 0.35);
      ctx.lineTo(W * 0.69, H * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C0614F';
      ctx.font = '700 22px "PingFang SC", sans-serif';
      ctx.fillText('加油', W * 0.73, H * 0.37);
      // small paper stars
      star(ctx, W * 0.2, H * 0.25, 7, '#F5CE86', 0.8);
      star(ctx, W * 0.87, H * 0.18, 5, '#F5CE86', 0.7);
    },
    stars: function (ctx, W, H, t) {
      for (let i = 0; i < 22; i++) {
        const tw = 0.4 + Math.sin(t * 1.6 + i) * 0.4;
        ctx.globalAlpha = Math.max(0.15, tw);
        star(ctx, (i * 71) % W, H * 0.1 + (i * 53) % (H * 0.4), 2 + (i % 3), '#FFF3C9', 1);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255, 243, 205, .9)';
      ctx.beginPath();
      ctx.arc(W * 0.72, H * 0.2, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(72, 82, 110, .9)';
      ctx.beginPath();
      ctx.arc(W * 0.755, H * 0.185, 23, 0, Math.PI * 2);
      ctx.fill();
    },
    shop: function (ctx, W, H, t) {
      // counter
      ctx.fillStyle = '#D9AF80';
      rr(ctx, W * 0.14, H * 0.72, W * 0.72, H * 0.2, 10);
      ctx.fill();
      ctx.fillStyle = '#F1D6B4';
      rr(ctx, W * 0.17, H * 0.7, W * 0.66, H * 0.06, 6);
      ctx.fill();
      // sign
      ctx.save();
      ctx.translate(W * 0.5, H * 0.16);
      ctx.fillStyle = '#FBF1DE';
      rr(ctx, -100, -30, 200, 58, 10);
      ctx.fill();
      ctx.strokeStyle = '#D3A87E';
      ctx.lineWidth = 3;
      rr(ctx, -100, -30, 200, 58, 10);
      ctx.stroke();
      ctx.fillStyle = '#B77B5E';
      ctx.font = '700 24px "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('小喵杂货铺', 0, 9);
      ctx.textAlign = 'left';
      ctx.restore();
      // tiny cup on counter
      ctx.fillStyle = '#F0A98E';
      rr(ctx, W * 0.24, H * 0.66, 20, 22, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, .6)';
      rr(ctx, W * 0.24, H * 0.66, 20, 5, 3);
      ctx.fill();
    }
  };

  function drawComicPanel(canvas, comic, index) {
    const W = 640, H = 512;
    const ctx = setup(canvas, W, H);
    const night = comic.id === 'c2' || comic.id === 'c5';
    const rainy = comic.id === 'c1' || comic.id === 'c3';
    const t = index * 0.4;
    backdrop(ctx, W, H, comic, night);
    windowBox(ctx, W * 0.64, H * 0.12, W * 0.27, H * 0.3, night, rainy, t);
    if (PROPS[comic.prop]) PROPS[comic.prop](ctx, W, H, t);

    const catState = comic.prop === 'flag' ? 'cheer'
      : comic.prop === 'umbrella' ? 'sleep'
        : comic.prop === 'jar' ? 'doze'
          : comic.prop === 'shop' ? 'celebrate'
            : 'idle';
    A.drawCat(ctx, W * 0.43, H * 0.86, 1.55, {
      state: catState,
      outfit: index === 1 ? 'pj' : PDM.core.state().outfit,
      t: t
    });

    if (night) {
      ctx.fillStyle = 'rgba(40, 48, 74, .12)';
      ctx.fillRect(0, 0, W, H);
    }
    // frame corners
    ctx.strokeStyle = 'rgba(255, 253, 247, .55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    // page mark
    ctx.fillStyle = 'rgba(255, 248, 236, .8)';
    ctx.font = '600 12px "PingFang SC", sans-serif';
    ctx.fillText('第 ' + (index + 1) + ' 页', W - 66, H - 20);
    PDM.art._lastComic = comic.id;
  }

  function drawComicCover(canvas, comic) {
    const S = 240;
    const ctx = setup(canvas, S, S);
    const night = comic.id === 'c2' || comic.id === 'c5';
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, comic.color);
    g.addColorStop(1, night ? '#4B5573' : '#F7E7D2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    // halo
    ctx.fillStyle = 'rgba(255, 255, 255, .35)';
    ell(ctx, S / 2, S * 0.62, 78, 70);
    ctx.fill();
    A.drawCat(ctx, S / 2, S * 0.86, 0.9, {
      state: comic.prop === 'flag' ? 'cheer' : comic.prop === 'umbrella' ? 'sleep' : 'read',
      outfit: comic.id === 'c6' ? 'academy' : 'default',
      t: 0.6
    });
    if (night) {
      star(ctx, S * 0.2, S * 0.2, 5, '#FFF0C4', 0.9);
      star(ctx, S * 0.82, S * 0.28, 3.4, '#FFF0C4', 0.8);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(7, 7, S - 14, S - 14);
  }

  function drawWelcome(canvas) {
    const W = 640, H = 340;
    const ctx = setup(canvas, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FDF4E7');
    g.addColorStop(1, '#F5DFC7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // window
    windowBox(ctx, W * 0.66, H * 0.12, W * 0.24, H * 0.4, false, false, 0);
    // rug
    ctx.fillStyle = '#F2BEA6';
    ell(ctx, W * 0.38, H * 0.86, 130, 30);
    ctx.fill();
    ctx.fillStyle = '#F8D6C3';
    ell(ctx, W * 0.38, H * 0.84, 108, 22);
    ctx.fill();
    // plant
    ctx.fillStyle = '#D9A47E';
    rr(ctx, W * 0.78, H * 0.74, 30, 34, 5);
    ctx.fill();
    ctx.fillStyle = '#8FBFAC';
    ell(ctx, W * 0.795, H * 0.68, 24, 26); ctx.fill();
    ell(ctx, W * 0.76, H * 0.63, 14, 18); ctx.fill();
    ell(ctx, W * 0.83, H * 0.64, 13, 16); ctx.fill();
    A.drawCat(ctx, W * 0.4, H * 0.88, 1.35, { state: 'cheer', outfit: 'default', t: 1.2 });
    star(ctx, W * 0.22, H * 0.24, 8, '#F5CE86', 0.9);
    star(ctx, W * 0.52, H * 0.16, 5, '#F0A98F', 0.8);
    star(ctx, W * 0.87, H * 0.36, 4, '#F5CE86', 0.7);
    ctx.fillStyle = 'rgba(255, 252, 246, .9)';
    rr(ctx, W * 0.56, H * 0.22, 66, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#B0896F';
    ctx.font = '600 15px "PingFang SC", sans-serif';
    ctx.fillText('喵～', W * 0.585, H * 0.295);
  }

  function drawShareCard(canvas) {
    const core = PDM.core;
    const S = core.state();
    const W = 1080, H = 1440;
    const ctx = setup(canvas, W, H);
    // card background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#FDF6EA');
    bg.addColorStop(1, '#F6E5D1');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // room scene (top 1080)
    PDM.room.drawRoom(ctx, W, 1080, {
      catState: 'celebrate',
      level: core.levelInfo().level,
      t: 2.2,
      outfit: S.outfit
    });

    // confetti-ish sparkles in scene
    for (let i = 0; i < 10; i++) {
      star(ctx, 90 + (i * 137) % 900, 130 + (i * 89) % 520, 5 + (i % 3) * 3, i % 2 ? '#FFF1C9' : '#F8B79E', 0.85);
    }

    // bottom panel
    const py = 1080;
    ctx.fillStyle = '#FFFDF8';
    ctx.fillRect(0, py, W, H - py);
    ctx.fillStyle = '#F5E4D1';
    ctx.fillRect(0, py, W, 3);

    const summary = core.logSummary();
    const today = summary.today;
    let title;
    if (today <= 0) {
      title = '今天和小喵待了一会儿';
    } else if (today < 60) {
      title = '今天陪读 ' + today + ' 分钟';
    } else if (today % 60 === 0) {
      title = '今天陪读 ' + (today / 60) + ' 小时';
    } else {
      title = '今天陪读 ' + Math.floor(today / 60) + ' 小时 ' + (today % 60) + ' 分';
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5B4A42';
    ctx.font = '700 58px "PingFang SC", "HarmonyOS Sans SC", sans-serif';
    ctx.fillText(title, W / 2, py + 118);
    ctx.fillStyle = '#A18A78';
    ctx.font = '400 30px "PingFang SC", sans-serif';
    ctx.fillText('连续打卡 ' + summary.streak + ' 天 · 累计专注 ' + summary.total + ' 分钟', W / 2, py + 178);

    // fish + level chips
    const chipY = py + 218;
    ctx.fillStyle = '#FDF0DC';
    rr(ctx, W / 2 - 246, chipY, 230, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#C9853B';
    ctx.font = '700 26px "PingFang SC", sans-serif';
    ctx.fillText('小鱼干 ' + S.fish, W / 2 - 131, chipY + 38);
    ctx.fillStyle = '#E7F2EC';
    rr(ctx, W / 2 + 16, chipY, 230, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#5F9A84';
    ctx.fillText('Lv.' + core.levelInfo().level + ' ' + core.levelInfo().name, W / 2 + 131, chipY + 38);

    ctx.fillStyle = '#D5C4B2';
    ctx.font = '500 19px "PingFang SC", sans-serif';
    ctx.fillText('你今天认真学习的样子，它都记得。', W / 2, py + 310);
    ctx.fillStyle = '#C0AC99';
    ctx.font = '400 24px "PingFang SC", sans-serif';
    ctx.fillText('陪读小喵 · 原创学习桌宠 · ' + core.dateKey(), W / 2, py + 348);
    ctx.textAlign = 'left';
  }

  PDM.extras = {
    drawComicPanel: drawComicPanel,
    drawComicCover: drawComicCover,
    drawWelcome: drawWelcome,
    drawShareCard: drawShareCard
  };
})(window.PDM);

