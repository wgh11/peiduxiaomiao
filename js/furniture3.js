/* ============ 陪读小喵 · furniture pack 3 ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const A = PDM.art;
  const rr = A.rr, ell = A.ell, star = A.star;
  const ITEMS = PDM.furniture.ITEMS;

  /* ---------------- wall ---------------- */
  ITEMS.w_neon = function (ctx, t) {
    const pulse = 0.7 + Math.sin(t * 2.2) * 0.15;
    // hanging cords
    ctx.strokeStyle = 'rgba(120, 96, 76, .5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-26, -80); ctx.lineTo(-26, 0);
    ctx.moveTo(26, -80); ctx.lineTo(26, 0);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -56);
    // outer glow
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 64);
    g.addColorStop(0, 'rgba(255, 170, 200, ' + (0.3 * pulse) + ')');
    g.addColorStop(1, 'rgba(255, 170, 200, 0)');
    ctx.fillStyle = g;
    ell(ctx, 0, 0, 64, 42); ctx.fill();
    // panel
    ctx.fillStyle = '#4A3F55';
    rr(ctx, -38, -26, 76, 52, 13); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, .16)';
    ctx.lineWidth = 1.2;
    rr(ctx, -34, -22, 68, 44, 10); ctx.stroke();
    // neon text
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 150, 190, ' + (0.9 * pulse) + ')';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFD9E7';
    ctx.font = '700 21px "PingFang SC", sans-serif';
    ctx.fillText('加油', 0, 0);
    ctx.strokeStyle = 'rgba(255, 170, 200, ' + (0.6 + pulse * 0.4) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 17); ctx.lineTo(15, 17);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  ITEMS.w_calendar = function (ctx, t) {
    // shadow
    ctx.fillStyle = 'rgba(120, 90, 65, .12)';
    rr(ctx, -22, -76, 52, 78, 6); ctx.fill();
    // page
    ctx.fillStyle = '#FFFDF7';
    rr(ctx, -24, -80, 50, 78, 6); ctx.fill();
    ctx.strokeStyle = '#E9D6BE';
    ctx.lineWidth = 1.4;
    rr(ctx, -24, -80, 50, 78, 6); ctx.stroke();
    // red header
    ctx.save();
    rr(ctx, -24, -80, 50, 78, 6); ctx.clip();
    ctx.fillStyle = '#F08A72';
    ctx.fillRect(-24, -80, 50, 20);
    ctx.restore();
    // binding rings
    ctx.strokeStyle = '#CBAE8F';
    ctx.lineWidth = 2;
    [-13, 13].forEach(x => {
      ctx.beginPath();
      ctx.arc(x, -80, 3.2, 0, Math.PI * 2);
      ctx.stroke();
    });
    // date
    ctx.fillStyle = '#B77B5E';
    ctx.textAlign = 'center';
    ctx.font = '700 24px "PingFang SC", sans-serif';
    ctx.fillText('26', 1, -34);
    ctx.fillStyle = '#C9A386';
    ctx.font = '500 8px "PingFang SC", sans-serif';
    ctx.fillText('NOV', 1, -20);
    // little marks
    ctx.fillStyle = 'rgba(240, 138, 114, .35)';
    for (let i = 0; i < 5; i++) ctx.fillRect(-16 + i * 7, -12, 4, 4);
    ctx.textAlign = 'left';
  };

  /* ---------------- desk ---------------- */
  ITEMS.d_mug = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 1, 18, 4); ctx.fill();
    // handle
    ctx.strokeStyle = '#F0DCC4';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(14, -18, 8, -1.1, 1.1);
    ctx.stroke();
    // body
    ctx.fillStyle = '#FFF8EE';
    rr(ctx, -14, -36, 28, 36, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(214, 186, 156, .6)';
    ctx.lineWidth = 1.2;
    rr(ctx, -14, -36, 28, 36, 7); ctx.stroke();
    // rim
    ctx.fillStyle = '#F3E3CF';
    ell(ctx, 0, -36, 14, 4.2); ctx.fill();
    ctx.fillStyle = '#EAD3B9';
    ell(ctx, 0, -35.5, 11, 3); ctx.fill();
    // cat face
    ctx.fillStyle = '#F3B69C';
    ell(ctx, 0, -18, 8, 6.5); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-7, -22); ctx.lineTo(-9, -28); ctx.lineTo(-3, -24);
    ctx.moveTo(7, -22); ctx.lineTo(9, -28); ctx.lineTo(3, -24);
    ctx.fill();
    ctx.fillStyle = '#6E5748';
    ell(ctx, -3, -18, 1.1, 1.5); ctx.fill();
    ell(ctx, 3, -18, 1.1, 1.5); ctx.fill();
    // steam
    ctx.strokeStyle = 'rgba(255, 255, 255, .8)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      const ph = t * 1.6 + i * 1.7;
      ctx.globalAlpha = 0.28 + Math.sin(ph) * 0.15;
      ctx.beginPath();
      ctx.moveTo(-5 + i * 9, -40);
      ctx.quadraticCurveTo(-8 + i * 9 + Math.sin(ph) * 3, -47, -5 + i * 9, -54);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  ITEMS.d_books = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 1, 24, 4); ctx.fill();
    const books = [
      { y: 0, w: 44, h: 10, c: '#8FBFAC', c2: '#E7F3EC' },
      { y: -10, w: 40, h: 9, c: '#E7B69C', c2: '#FBE8DD' },
      { y: -19, w: 36, h: 9, c: '#9EBFCE', c2: '#E3F0F6' }
    ];
    books.forEach((b, i) => {
      ctx.save();
      ctx.translate(0, b.y);
      ctx.rotate((i - 1) * 0.02);
      ctx.fillStyle = b.c;
      rr(ctx, -b.w / 2, -b.h, b.w, b.h, 2); ctx.fill();
      ctx.fillStyle = b.c2;
      ctx.fillRect(-b.w / 2 + 2, -b.h + 2, b.w - 4, 2);
      ctx.fillStyle = 'rgba(255, 253, 247, .9)';
      ctx.fillRect(b.w / 2 - 3, -b.h + 1.5, 3, b.h - 3);
      ctx.restore();
    });
    // bookmark
    ctx.fillStyle = '#F08A72';
    ctx.fillRect(8, -28, 3, 9);
    ctx.beginPath();
    ctx.moveTo(8, -19); ctx.lineTo(9.5, -22); ctx.lineTo(11, -19);
    ctx.fill();
  };

  /* ---------------- floor ---------------- */
  ITEMS.fl_pouf = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 2, 44, 8); ctx.fill();
    // base
    ctx.fillStyle = '#E9C3A3';
    ell(ctx, 0, -16, 40, 22); ctx.fill();
    ctx.fillStyle = '#F3D7BD';
    ell(ctx, 0, -22, 38, 20); ctx.fill();
    // top
    ctx.fillStyle = '#FBEADB';
    ell(ctx, 0, -30, 26, 10); ctx.fill();
    // knit lines
    ctx.strokeStyle = 'rgba(201, 157, 120, .35)';
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 13, -40 + Math.abs(i) * 3);
      ctx.quadraticCurveTo(i * 15, -20, i * 12, -2);
      ctx.stroke();
    }
    // stitches
    ctx.fillStyle = 'rgba(255, 255, 255, .5)';
    for (let i = -2; i <= 2; i++) {
      ell(ctx, i * 12, -20, 1.6, 1.6); ctx.fill();
    }
  };

  /* ---------------- ornament ---------------- */
  ITEMS.o_vase = function (ctx, t) {
    const sway = Math.sin(t * 1.2) * 1.5;
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 1, 16, 4); ctx.fill();
    // stems
    ctx.strokeStyle = '#7FB39C';
    ctx.lineWidth = 2;
    [[-12, -34], [6, -40], [12, -30]].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.quadraticCurveTo(ex * 0.4, (ey - 20) / 2, ex + sway * 0.3, ey);
      ctx.stroke();
    });
    // leaves
    ctx.fillStyle = '#8FBFAC';
    ell(ctx, -8, -28, 5, 3); ctx.fill();
    ell(ctx, 8, -24, 5, 3); ctx.fill();
    // flowers
    [[-12, -34, '#F3B69C'], [6, -40, '#F5CE86'], [12, -30, '#E8947B']].forEach(([x, y, c]) => {
      ctx.fillStyle = c;
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        ell(ctx, x + sway * 0.3 + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 3, 3);
        ctx.fill();
      }
      ctx.fillStyle = '#FFF3D6';
      ell(ctx, x + sway * 0.3, y, 2, 2); ctx.fill();
    });
    // vase
    ctx.fillStyle = '#CFE7DA';
    ctx.beginPath();
    ctx.moveTo(-9, -20);
    ctx.quadraticCurveTo(-13, -10, -7, 0);
    ctx.lineTo(7, 0);
    ctx.quadraticCurveTo(13, -10, 9, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#E7F3EC';
    ell(ctx, 0, -20, 10, 3); ctx.fill();
    ctx.fillStyle = 'rgba(143, 191, 172, .5)';
    rr(ctx, -3, -15, 6, 9, 3); ctx.fill();
  };

  ITEMS.d_foodbox = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)'; ell(ctx, 0, 2, 28, 6); ctx.fill();
    ctx.fillStyle = '#F3C58D'; rr(ctx, -25, -22, 50, 20, 5); ctx.fill();
    ctx.fillStyle = '#E8947B'; rr(ctx, -27, -26, 54, 6, 3); ctx.fill();
    ctx.fillStyle = '#FFF4E6'; ell(ctx, 0, -19, 12, 4.4); ctx.fill();
    ctx.fillStyle = '#EFB27A'; ell(ctx, -5, -20, 3.5, 2.2); ctx.fill();
    ctx.fillStyle = '#D97B5A'; ell(ctx, 4, -19, 3.2, 2.1); ctx.fill();
    ctx.fillStyle = '#FFF8EE'; rr(ctx, -7, -11, 14, 5, 2); ctx.fill();
  };

  ITEMS.o_fishbowl = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)'; ell(ctx, 0, 2, 22, 5); ctx.fill();
    ctx.fillStyle = 'rgba(191, 224, 232, .75)'; ell(ctx, 0, -22, 22, 25); ctx.fill();
    ctx.strokeStyle = '#D9B894'; ctx.lineWidth = 2; ell(ctx, 0, -22, 22, 25); ctx.stroke();
    const x = Math.sin(t * 1.8) * 6 - 4;
    ctx.fillStyle = '#F09A63'; ell(ctx, x, -20, 8, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 7, -20); ctx.lineTo(x + 13, -25); ctx.lineTo(x + 13, -15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#C99B72'; rr(ctx, -15, 0, 30, 5, 2); ctx.fill();
  };

  ITEMS.o_starprojector = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)'; ell(ctx, 0, 2, 22, 5); ctx.fill();
    ctx.fillStyle = '#6879B8'; rr(ctx, -18, -12, 36, 13, 6); ctx.fill();
    ctx.fillStyle = '#9CB7FF'; ell(ctx, 0, -16, 15, 12); ctx.fill();
    [[-7, -18, 3], [4, -22, 2.3], [8, -13, 2]].forEach(([x, y, r], i) => star(ctx, x + Math.sin(t * 1.5 + i), y, r, '#FFE7A8', .95));
  };

  /* ---------------- icon config ---------------- */
  const ICON = PDM.furniture.ICON;
  ICON.w_neon = { s: 0.62, dy: -6 };
  ICON.w_calendar = { s: 0.72, dy: -2 };
  ICON.d_mug = { s: 1.1, dy: 0 };
  ICON.d_books = { s: 0.95, dy: 0 };
  ICON.fl_pouf = { s: 0.85, dy: -4 };
  ICON.o_vase = { s: 1.0, dy: 0 };
  ICON.d_foodbox = { s: 0.95, dy: -2 };
  ICON.o_fishbowl = { s: 1.0, dy: 0 };
  ICON.o_starprojector = { s: 1.0, dy: 0 };
})(window.PDM);
