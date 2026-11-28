/* ============ 陪读小喵 · furniture art (wall / window / desk) ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const A = PDM.art;
  const rr = A.rr, ell = A.ell, star = A.star;

  const ITEMS = {};

  function tape(ctx, x, y, w, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.fillStyle = 'rgba(245, 214, 166, .75)';
    ctx.fillRect(-w / 2, -3.5, w, 7);
    ctx.restore();
  }

  /* ---------------- wall ---------------- */
  ITEMS.w_photo = function (ctx, t) {
    ctx.strokeStyle = 'rgba(164, 134, 106, .5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-66, -104);
    ctx.quadraticCurveTo(0, -88, 66, -104);
    ctx.stroke();

    const frames = [
      { x: -33, y: -74, r: -0.09, w: 39, h: 45 },
      { x: 4, y: -86, r: 0.04, w: 39, h: 45 },
      { x: 40, y: -68, r: 0.11, w: 37, h: 43 }
    ];
    frames.forEach((f, i) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.r);
      ctx.fillStyle = 'rgba(120, 90, 65, .12)';
      rr(ctx, -f.w / 2 + 2, -f.h / 2 + 3, f.w, f.h, 2);
      ctx.fill();
      ctx.fillStyle = '#FFFCF6';
      rr(ctx, -f.w / 2, -f.h / 2, f.w, f.h, 2.5);
      ctx.fill();
      // photo
      const g = ctx.createLinearGradient(0, -f.h / 2, 0, f.h / 2);
      const cols = [['#FBE3C9', '#F6C9A6'], ['#DCEBF2', '#BBD8E6'], ['#F3E3D0', '#E9CBB4']][i];
      g.addColorStop(0, cols[0]);
      g.addColorStop(1, cols[1]);
      ctx.fillStyle = g;
      ctx.fillRect(-f.w / 2 + 3.5, -f.h / 2 + 3.5, f.w - 7, f.h - 12);
      // mini cat
      ctx.fillStyle = '#FBF2E4';
      ell(ctx, 0, -3, 9, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, -8); ctx.lineTo(-9, -15); ctx.lineTo(-3, -10);
      ctx.moveTo(8, -8); ctx.lineTo(9, -15); ctx.lineTo(3, -10);
      ctx.fill();
      ctx.fillStyle = '#6E5748';
      ell(ctx, -3.2, -4, 1.2, 1.5); ctx.fill();
      ell(ctx, 3.2, -4, 1.2, 1.5); ctx.fill();
      ctx.fillStyle = '#E89A8C';
      ell(ctx, 0, -1.4, 1.1, 0.9); ctx.fill();
      tape(ctx, 0, -f.h / 2 + 2, 15, f.r);
      ctx.restore();
    });
  };

  ITEMS.w_star = function (ctx, t, env) {
    const night = env && env.night;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const x = -120 + i * 20;
      const y = -40 + Math.pow(i / 12 - 0.5, 2) * 44 - 0; // sag
      pts.push([x, -52 + (1 - Math.pow(i / 6 - 1, 2)) * 26]);
    }
    ctx.strokeStyle = 'rgba(170, 143, 117, .6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], prev = pts[i - 1];
      ctx.quadraticCurveTo((p[0] + prev[0]) / 2, Math.max(p[1], prev[1]) + 3, p[0], p[1]);
    }
    ctx.stroke();

    pts.forEach((p, i) => {
      if (i % 2) return;
      const sway = Math.sin(t * 0.8 + i) * 1;
      const bx = p[0] + sway;
      const by = p[1] + 7;
      ctx.strokeStyle = 'rgba(170, 143, 117, .5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(bx, by - 3);
      ctx.stroke();
      if (night) {
        const g = ctx.createRadialGradient(bx, by, 1, bx, by, 16);
        g.addColorStop(0, 'rgba(255, 214, 141, .55)');
        g.addColorStop(1, 'rgba(255, 214, 141, 0)');
        ctx.fillStyle = g;
        ell(ctx, bx, by, 16, 16); ctx.fill();
      }
      if (i % 4 === 0) {
        star(ctx, bx, by, 6.5, '#F7C979', 1);
      } else {
        ctx.fillStyle = i % 8 === 2 ? '#F7B7A0' : '#FBE7C4';
        ell(ctx, bx, by, 4.2, 5);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#FFFDF5';
        ell(ctx, bx - 1.2, by - 1.4, 1.4, 1.8);
        ctx.fill();
        ctx.restore();
      }
    });
  };

  ITEMS.w_clock = function (ctx, t) {
    // hanger
    ctx.strokeStyle = 'rgba(160, 130, 102, .55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -96);
    ctx.lineTo(0, -88);
    ctx.stroke();
    // body
    ctx.fillStyle = '#FFF5E4';
    rr(ctx, -26, -78, 52, 78, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(213, 181, 148, .7)';
    ctx.lineWidth = 1.5;
    rr(ctx, -26, -78, 52, 78, 18);
    ctx.stroke();
    // clock face
    ctx.fillStyle = '#FBEAD4';
    ell(ctx, 0, -40, 19, 19); ctx.fill();
    ctx.strokeStyle = '#E3C5A4';
    ctx.lineWidth = 2;
    ell(ctx, 0, -40, 19, 19); ctx.stroke();
    ctx.fillStyle = '#A98A6E';
    for (let i = 0; i < 12; i += 3) {
      const a = i * Math.PI / 6;
      ctx.beginPath();
      ctx.arc(Math.sin(a) * 14, -40 - Math.cos(a) * 14, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const now = new Date();
    const hA = (now.getHours() % 12 + now.getMinutes() / 60) * Math.PI / 6;
    const mA = now.getMinutes() * Math.PI / 30;
    ctx.strokeStyle = '#7E6553';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(Math.sin(hA) * 8, -40 - Math.cos(hA) * 8);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(Math.sin(mA) * 12, -40 - Math.cos(mA) * 12);
    ctx.stroke();
    // mushroom cap
    ctx.fillStyle = '#E58C74';
    ctx.beginPath();
    ctx.moveTo(-38, -74);
    ctx.quadraticCurveTo(-34, -106, 0, -106);
    ctx.quadraticCurveTo(34, -106, 38, -74);
    ctx.quadraticCurveTo(0, -66, -38, -74);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 244, 228, .85)';
    [
      [-18, -88, 5.5, 4],
      [6, -96, 4, 3.2],
      [22, -84, 4.6, 3.4],
      [-2, -80, 3, 2.4]
    ].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
    // bird
    ctx.save();
    ctx.translate(27, -92);
    ctx.fillStyle = '#8FBFAC';
    ell(ctx, 0, 0, 7, 6); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -2); ctx.lineTo(11, 0); ctx.lineTo(5, 2.4); ctx.closePath();
    ctx.fillStyle = '#E5A55B';
    ctx.fill();
    ctx.fillStyle = '#4B3A31';
    ell(ctx, 1.4, -1.8, 1, 1); ctx.fill();
    ctx.restore();
  };

  ITEMS.w_poster = function (ctx, t) {
    ctx.save();
    ctx.rotate(-0.02);
    ctx.fillStyle = 'rgba(120, 90, 65, .12)';
    rr(ctx, -28, -86, 60, 90, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFDF7';
    rr(ctx, -30, -90, 60, 90, 4);
    ctx.fill();
    ctx.strokeStyle = '#E9D6BE';
    ctx.lineWidth = 1.4;
    rr(ctx, -30, -90, 60, 90, 4);
    ctx.stroke();
    // poster art
    const g = ctx.createLinearGradient(0, -84, 0, -46);
    g.addColorStop(0, '#FCE4CD');
    g.addColorStop(1, '#F6C7AE');
    ctx.fillStyle = g;
    ctx.fillRect(-25, -85, 50, 42);
    // cat doodle
    ctx.fillStyle = '#FFF8EC';
    ell(ctx, 0, -64, 15, 13); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -70); ctx.lineTo(-16, -82); ctx.lineTo(-5, -74);
    ctx.moveTo(14, -70); ctx.lineTo(16, -82); ctx.lineTo(5, -74);
    ctx.fill();
    ctx.fillStyle = '#6E5748';
    ell(ctx, -5.5, -65, 1.8, 2.2); ctx.fill();
    ell(ctx, 5.5, -65, 1.8, 2.2); ctx.fill();
    ctx.fillStyle = '#E08E84';
    ell(ctx, 0, -60.5, 1.6, 1.2); ctx.fill();
    // words
    ctx.fillStyle = '#B77B5E';
    ctx.font = '700 11px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('加 油', 0, -36);
    ctx.fillStyle = '#C9A386';
    ctx.font = '500 6.5px "PingFang SC", sans-serif';
    ctx.fillText('STUDY WITH ME', 0, -27);
    ctx.textAlign = 'left';
    tape(ctx, 0, -89, 18, 0.03);
    ctx.restore();
  };

  /* ---------------- window (local window box 120 x 125) ---------------- */
  ITEMS.wd_curtain = function (ctx, t) {
    const sway = Math.sin(t * 0.7) * 2;
    // rod
    ctx.strokeStyle = '#C9A582';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-63, -124);
    ctx.lineTo(63, -124);
    ctx.stroke();
    ctx.fillStyle = '#B8926F';
    ell(ctx, -63, -124, 4.5, 4.5); ctx.fill();
    ell(ctx, 63, -124, 4.5, 4.5); ctx.fill();

    [-1, 1].forEach(s => {
      const xOut = s * 60;
      const xIn = s * 20;
      const bottomSway = s * 2 + sway;
      ctx.save();
      // fabric panel
      const g = ctx.createLinearGradient(xOut, -120, xIn, -110);
      g.addColorStop(0, '#F4E3CE');
      g.addColorStop(0.55, '#FBF0E1');
      g.addColorStop(1, '#F6E7D4');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(xOut, -121);
      ctx.quadraticCurveTo(xOut - s * 4, -68, xOut + s * 3 + bottomSway, -7);
      ctx.quadraticCurveTo(xOut - s * 6 + bottomSway, 1, xIn + s * 7 + bottomSway, -4);
      ctx.quadraticCurveTo(xIn + s * 4, -66, xOut, -121);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(205, 173, 140, .5)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // folds
      ctx.strokeStyle = 'rgba(219, 190, 160, .55)';
      ctx.lineWidth = 1.4;
      for (let k = 1; k <= 3; k++) {
        const fx = xOut - s * k * 10;
        ctx.beginPath();
        ctx.moveTo(fx, -112);
        ctx.quadraticCurveTo(fx - s * 2, -60, fx + s * 1.5 + bottomSway * 0.8, -12);
        ctx.stroke();
      }
      // highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, .65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xOut - s * 3, -112);
      ctx.quadraticCurveTo(xOut - s * 7, -62, xOut - s * 1 + bottomSway, -18);
      ctx.stroke();
      // tieback bow
      const bx = xOut - s * 13, by = -47;
      ctx.fillStyle = '#EF9C86';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - s * 10, by - 6);
      ctx.lineTo(bx - s * 10, by + 6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + s * 5, by - 5);
      ctx.lineTo(bx + s * 5, by + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#E1876F';
      ell(ctx, bx, by, 2.8, 2.8); ctx.fill();
      ctx.strokeStyle = '#EF9C86';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 2);
      ctx.quadraticCurveTo(bx - s * 3, by + 10, bx - s * 1, by + 14);
      ctx.stroke();
      ctx.restore();
    });
  };

  ITEMS.wd_sill = function (ctx, t) {
    // sill board
    ctx.fillStyle = '#F3DCC1';
    rr(ctx, -62, -12, 124, 9, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(150, 116, 84, .18)';
    ctx.fillRect(-60, -4, 120, 2);
    // two pots
    [-30, 30].forEach((x, i) => {
      ctx.save();
      ctx.translate(x, -10);
      ctx.fillStyle = i ? '#D9A47E' : '#C99C82';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(12, 0);
      ctx.lineTo(9, -16);
      ctx.lineTo(-9, -16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F2D6B8';
      ell(ctx, 0, -16, 10, 3.4); ctx.fill();
      // leaves
      const leaf = (ang, len, col) => {
        ctx.save();
        ctx.translate(0, -16);
        ctx.rotate(ang);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(0, -len / 2, len * 0.22, len / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      leaf(-0.5, 20, '#9BC4A6');
      leaf(0.15, 24, '#87B896');
      leaf(0.7, 16, '#ABCFB4');
      ctx.restore();
    });
  };

  ITEMS.wd_chime = function (ctx, t) {
    const swing = Math.sin(t * 0.9) * 0.09;
    ctx.save();
    ctx.translate(0, -125);
    ctx.rotate(swing);
    ctx.strokeStyle = 'rgba(160, 132, 105, .6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 34);
    ctx.stroke();
    // top branch
    ctx.fillStyle = '#C9A582';
    rr(ctx, -22, 33, 44, 5, 2.5);
    ctx.fill();
    // hanging tubes
    const cols = ['#F3E2C8', '#E8B7A4', '#B9D3C4', '#F3E2C8', '#D8C1A8'];
    [-18, -9, 0, 9, 18].forEach((x, i) => {
      const len = 14 + (i % 3) * 8;
      ctx.strokeStyle = 'rgba(160, 132, 105, .5)';
      ctx.beginPath();
      ctx.moveTo(x, 38);
      ctx.lineTo(x, 44);
      ctx.stroke();
      ctx.fillStyle = cols[i];
      rr(ctx, x - 2.6, 43, 5.2, len, 2.6);
      ctx.fill();
    });
    // moon charm
    ctx.fillStyle = '#F5D48E';
    ctx.beginPath();
    ctx.arc(0, 72, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#40342C';
    ctx.beginPath();
    ctx.arc(3, 70, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  ITEMS.wd_sticker = function (ctx, t) {
    const items = [
      { x: -38, y: -78, s: 7, c: '#F8D9A0', a: 0.9 },
      { x: 28, y: -96, s: 5, c: '#F4E7C6', a: 0.95 },
      { x: 40, y: -44, s: 6.5, c: '#F7C7B2', a: 0.85 },
      { x: -12, y: -36, s: 4, c: '#F8E6B8', a: 0.9 },
      { x: 8, y: -108, s: 3.2, c: '#FFF4DA', a: 0.9 }
    ];
    items.forEach((it, i) => {
      const tw = 0.7 + Math.sin(t * 1.8 + i * 2) * 0.3;
      ctx.save();
      ctx.globalAlpha = it.a * tw;
      star(ctx, it.x, it.y, it.s, it.c, 1);
      ctx.restore();
    });
    // crescent
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#F6D99E';
    ctx.beginPath();
    ctx.arc(-30, -104, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CDE6F2';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(-26, -106, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // planet
    ctx.save();
    ctx.translate(24, -64);
    ctx.rotate(-0.3);
    ctx.fillStyle = 'rgba(247, 200, 170, .9)';
    ell(ctx, 0, 0, 7, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(250, 227, 189, .85)';
    ctx.lineWidth = 1.8;
    ell(ctx, 0, 0, 13, 4); ctx.stroke();
    ctx.restore();
  };

  /* ---------------- desk ---------------- */
  ITEMS.d_lamp = function (ctx, t, env) {
    const glow = env && env.night !== false;
    if (glow) {
      const g = ctx.createRadialGradient(0, -36, 2, 0, -36, 72);
      g.addColorStop(0, 'rgba(255, 216, 156, .5)');
      g.addColorStop(0.6, 'rgba(255, 210, 150, .14)');
      g.addColorStop(1, 'rgba(255, 210, 150, 0)');
      ctx.fillStyle = g;
      ell(ctx, 0, -36, 72, 72);
      ctx.fill();
    }
    // base
    ctx.fillStyle = '#D9B894';
    ell(ctx, 0, -2, 17, 5.5); ctx.fill();
    ctx.fillStyle = '#F0D9BC';
    ell(ctx, 0, -4, 15, 4.5); ctx.fill();
    // stem
    ctx.fillStyle = '#F6E3C8';
    rr(ctx, -4, -30, 8, 26, 4);
    ctx.fill();
    // cap
    ctx.fillStyle = '#F1A98E';
    ctx.beginPath();
    ctx.moveTo(-24, -30);
    ctx.quadraticCurveTo(-22, -58, 0, -58);
    ctx.quadraticCurveTo(22, -58, 24, -30);
    ctx.quadraticCurveTo(0, -24, -24, -30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 249, 236, .92)';
    [
      [-11, -40, 4.2, 3.2],
      [7, -46, 3.4, 2.6],
      [13, -34, 2.8, 2.2]
    ].forEach(([x, y, rx, ry]) => { ell(ctx, x, y, rx, ry); ctx.fill(); });
    // light rim
    ctx.strokeStyle = 'rgba(255, 240, 204, .9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, -30);
    ctx.quadraticCurveTo(0, -24, 24, -30);
    ctx.stroke();
  };

  ITEMS.d_pen = function (ctx, t) {
    // pencils
    const pencils = [
      { x: -8, a: -0.1, c: '#E8947B' },
      { x: 0, a: 0.04, c: '#8FBFAC' },
      { x: 8, a: 0.16, c: '#F0BE72' }
    ];
    pencils.forEach(p => {
      ctx.save();
      ctx.translate(p.x, -12);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      rr(ctx, -2.4, -34, 4.8, 32, 2);
      ctx.fill();
      ctx.fillStyle = '#F6E2C4';
      rr(ctx, -2.4, -34, 4.8, 5, 2);
      ctx.fill();
      ctx.fillStyle = '#6E5748';
      ctx.beginPath();
      ctx.moveTo(-1.6, -34);
      ctx.lineTo(1.6, -34);
      ctx.lineTo(0, -39);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // cup
    ctx.fillStyle = '#DCEAF0';
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.quadraticCurveTo(12, -22, 9, -24);
    ctx.lineTo(-9, -24);
    ctx.quadraticCurveTo(-12, -22, -13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, .8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.quadraticCurveTo(-7, -16, -5, -20);
    ctx.stroke();
    ctx.fillStyle = '#F2B9A6';
    ctx.beginPath();
    ctx.arc(0, -11, 3.4, 0, Math.PI * 2);
    ctx.fill();
  };

  ITEMS.d_jar = function (ctx, t) {
    // jar
    ctx.fillStyle = 'rgba(238, 246, 243, .75)';
    rr(ctx, -19, -48, 38, 48, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196, 216, 208, .9)';
    ctx.lineWidth = 1.6;
    rr(ctx, -19, -48, 38, 48, 9);
    ctx.stroke();
    // lid
    ctx.fillStyle = '#C9A57E';
    rr(ctx, -21, -56, 42, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#B58F68';
    rr(ctx, -18, -58, 36, 4, 2);
    ctx.fill();
    // fish crackers
    const fish = [[-8, -12, 0.3], [6, -16, -0.2], [-2, -26, 0.1], [9, -34, 0.5], [-9, -38, -0.4]];
    fish.forEach(([x, y, r]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.fillStyle = '#F0B96C';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(5.4, 0);
      ctx.lineTo(9, -3);
      ctx.lineTo(9, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8E6B48';
      ell(ctx, -2.4, -0.8, 0.7, 0.7); ctx.fill();
      ctx.restore();
    });
    // shine
    ctx.strokeStyle = 'rgba(255, 255, 255, .85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -40);
    ctx.lineTo(-13, -14);
    ctx.stroke();
  };

  ITEMS.d_cocoa = function (ctx, t) {
    // steam
    ctx.strokeStyle = 'rgba(255, 255, 255, .75)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const x = -4 + i * 8;
      const ph = t * 0.8 + i;
      ctx.beginPath();
      ctx.moveTo(x, -40);
      ctx.bezierCurveTo(x - 4, -47 + Math.sin(ph) * 2, x + 4, -52 + Math.sin(ph) * 2, x, -59);
      ctx.stroke();
    }
    // mug
    ctx.fillStyle = '#F0A98E';
    rr(ctx, -15, -36, 30, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#F8C0A8';
    ell(ctx, 0, -36, 15, 5); ctx.fill();
    ctx.fillStyle = '#8D5E45';
    ell(ctx, 0, -36, 12, 3.6); ctx.fill();
    // marshmallows
    ctx.fillStyle = '#FFF8EC';
    [[-4, -37], [4, -36], [0, -39]].forEach(([x, y]) => {
      rr(ctx, x - 2.2, y - 1.6, 4.4, 3.2, 1.2);
      ctx.fill();
    });
    // handle
    ctx.strokeStyle = '#F0A98E';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(17, -21, 8, -1.2, 1.2);
    ctx.stroke();
    // heart
    ctx.fillStyle = 'rgba(255, 251, 242, .9)';
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.bezierCurveTo(-8, -21, -12, -16, -6, -10);
    ctx.lineTo(-4, -8);
    ctx.lineTo(-2, -10);
    ctx.bezierCurveTo(4, -16, 0, -21, -4, -16);
    ctx.fill();
  };

  PDM.furniture = { ITEMS: ITEMS, tape: tape };
})(window.PDM);

