/* ============ 陪读小喵 · furniture art (floor / ornament) + icons ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const A = PDM.art;
  const rr = A.rr, ell = A.ell, star = A.star;
  const ITEMS = PDM.furniture.ITEMS;
  const tape = PDM.furniture.tape;

  /* ---------------- floor ---------------- */
  ITEMS.fl_rug = function (ctx, t) {
    // base
    ctx.fillStyle = '#F3DDC4';
    ell(ctx, 0, 2, 92, 31); ctx.fill();
    ctx.fillStyle = '#F9A98C';
    ell(ctx, 0, 0, 88, 29); ctx.fill();
    ctx.fillStyle = '#F7BFA8';
    ell(ctx, 0, -2, 74, 23); ctx.fill();
    // hole
    ctx.fillStyle = '#F1DCC4';
    ell(ctx, 0, -2, 34, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(214, 154, 128, .55)';
    ctx.lineWidth = 1.4;
    ell(ctx, 0, 0, 88, 29); ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, .4)';
    ell(ctx, 0, -2, 74, 23); ctx.stroke();
    // sprinkles
    const cols = ['#FBE8B8', '#BDE0CE', '#F8D6C8', '#FFF6E4', '#D9C4E4'];
    for (let i = 0; i < 20; i++) {
      const a = i * 0.86;
      const rx = 46 + (i % 4) * 9;
      const ry = 13 + (i % 3) * 3.4;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry - 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a * 1.4);
      ctx.fillStyle = cols[i % cols.length];
      rr(ctx, -2.6, -1.3, 5.2, 2.6, 1.3);
      ctx.fill();
      ctx.restore();
    }
  };

  ITEMS.fl_bed = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 2, 50, 8); ctx.fill();
    // cloud
    ctx.fillStyle = '#FFFAF1';
    ell(ctx, -32, -18, 19, 16); ctx.fill();
    ell(ctx, -12, -28, 22, 20); ctx.fill();
    ell(ctx, 12, -29, 21, 19); ctx.fill();
    ell(ctx, 32, -20, 18, 15); ctx.fill();
    ell(ctx, 0, -8, 44, 16); ctx.fill();
    // inner cushion
    ctx.fillStyle = '#CFE7DA';
    ell(ctx, 0, -12, 32, 10); ctx.fill();
    ctx.fillStyle = '#E7F3EC';
    ell(ctx, 4, -17, 17, 7); ctx.fill();
    // pillow
    ctx.fillStyle = '#FFF4E2';
    ell(ctx, -30, -26, 13, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(219, 190, 156, .6)';
    ctx.lineWidth = 1.1;
    ell(ctx, -30, -26, 13, 8); ctx.stroke();
    // tiny stars
    star(ctx, 30, -34, 4, '#F5CE86', 0.8);
    star(ctx, 14, -44, 2.6, '#F5CE86', 0.6);
    ctx.strokeStyle = 'rgba(196, 164, 132, .5)';
    ctx.lineWidth = 1.3;
    ell(ctx, 0, -2, 44, 12);
    ctx.stroke();
  };

  ITEMS.fl_shelf = function (ctx, t) {
    const w = 92, h = 150;
    // frame
    ctx.fillStyle = '#C99B72';
    rr(ctx, -w / 2, -h, w, h, 7);
    ctx.fill();
    ctx.fillStyle = '#F3DFC6';
    rr(ctx, -w / 2 + 5, -h + 5, w - 10, h - 8, 4);
    ctx.fill();
    // back shadow
    ctx.fillStyle = 'rgba(201, 166, 130, .16)';
    ctx.fillRect(-w / 2 + 5, -h + 5, w - 10, h - 8);
    // shelves
    const rows = [-96, -52, -8];
    rows.forEach((y, ri) => {
      ctx.fillStyle = '#D7AE86';
      ctx.fillRect(-w / 2 + 3, y, w - 6, 5);
      // books
      let x = -w / 2 + 9;
      const cols = ri === 0 ? ['#F0A58C', '#8FBFAE', '#F2C576', '#C6B7D8'] : ri === 1 ? ['#E8B9A4', '#A8C9D8', '#F3D29B'] : ['#CBB6DC', '#F1C1A9', '#9DC6B4', '#EFD79E', '#B9CBE3'];
      cols.forEach((c, i) => {
        const bh = 16 + (i % 3) * 5;
        ctx.fillStyle = c;
        rr(ctx, x, y - bh, 6.5, bh, 1.5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.fillRect(x + 1.4, y - bh + 2.5, 1.2, bh - 4);
        x += 8.5;
      });
      if (ri === 2) {
        // plant on shelf
        ctx.fillStyle = '#D9A47E';
        rr(ctx, x + 4, y - 12, 13, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#8FBFAC';
        ell(ctx, x + 10, y - 16, 6, 7); ctx.fill();
        ell(ctx, x + 6, y - 20, 4, 5); ctx.fill();
        ell(ctx, x + 14, y - 20, 4, 5); ctx.fill();
      }
      if (ri === 1) {
        // small framed photo on shelf
        ctx.fillStyle = '#FFF8EA';
        rr(ctx, w / 2 - 26, y - 26, 17, 21, 2);
        ctx.fill();
        ctx.fillStyle = '#F3C9AE';
        ctx.fillRect(w / 2 - 23, y - 23, 11, 12);
        ctx.fillStyle = '#6E5748';
        ell(ctx, w / 2 - 18, y - 17, 1.2, 1.4); ctx.fill();
      }
    });
    // top fish bowl
    ctx.fillStyle = '#DDEFF2';
    ctx.beginPath();
    ctx.arc(18, -h + 17, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#BFE0E8';
    ell(ctx, 18, -h + 20, 9, 6); ctx.fill();
    ctx.fillStyle = '#F2B45C';
    ell(ctx, 16, -h + 19, 4, 2.2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(19.6, -h + 19);
    ctx.lineTo(23, -h + 16.6);
    ctx.lineTo(23, -h + 21.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 195, 205, .8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(18, -h + 17, 12, 0, Math.PI * 2);
    ctx.stroke();
    // rim
    ctx.fillStyle = '#C99B72';
    ctx.fillRect(-w / 2 - 2, -h - 2, w + 4, 5);
    ctx.fillStyle = 'rgba(255, 255, 255, .3)';
    ctx.fillRect(-w / 2 - 2, -h - 2, w + 4, 1.5);
  };

  ITEMS.fl_cushion = function (ctx, t) {
    ctx.save();
    ctx.rotate(-0.03);
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 3, 38, 8); ctx.fill();
    // tail
    ctx.fillStyle = '#EFA88F';
    ctx.beginPath();
    ctx.moveTo(30, -14);
    ctx.lineTo(46, -26);
    ctx.lineTo(44, -8);
    ctx.closePath();
    ctx.fill();
    // body
    ctx.fillStyle = '#F3B49C';
    ctx.beginPath();
    ctx.ellipse(-2, -16, 34, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F8CBB8';
    ell(ctx, -4, -20, 26, 10); ctx.fill();
    // fins
    ctx.fillStyle = '#EFA88F';
    ctx.beginPath();
    ctx.moveTo(-8, -31);
    ctx.quadraticCurveTo(0, -40, 8, -30);
    ctx.quadraticCurveTo(0, -26, -8, -31);
    ctx.fill();
    // face
    ctx.fillStyle = '#6E5748';
    ell(ctx, -22, -19, 2.2, 2.6); ctx.fill();
    ctx.strokeStyle = 'rgba(180, 112, 92, .8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(-26, -14, 3.4, 0.2, Math.PI - 0.4);
    ctx.stroke();
    // stitches
    ctx.strokeStyle = 'rgba(255, 247, 235, .65)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ell(ctx, -2, -16, 29, 13);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  /* ---------------- ornament ---------------- */
  ITEMS.o_plant = function (ctx, t) {
    // leaves
    const sway = Math.sin(t * 0.8) * 0.03;
    ctx.save();
    ctx.translate(0, -16);
    ctx.rotate(sway);
    [[-0.55, 24, '#8FBFAC'], [0.08, 30, '#7FB39C'], [0.62, 21, '#A4CCB6'], [-0.05, 18, '#B7D8C5']].forEach(([a, len, c]) => {
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, -len / 2, len * 0.26, len / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, .35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -len + 4);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    // pot
    ctx.fillStyle = '#D9A47E';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.lineTo(12, -18);
    ctx.lineTo(-12, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#E8BE9C';
    ell(ctx, 0, -18, 13, 3.6); ctx.fill();
    ctx.fillStyle = '#B9815C';
    ctx.fillRect(-16, -3, 32, 3);
  };

  ITEMS.o_maneki = function (ctx, t) {
    const wave = Math.sin(t * 2.2) * 0.16;
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 2, 20, 5); ctx.fill();
    // body
    ctx.fillStyle = '#FFF8EC';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(-22, -30, -8, -40);
    ctx.lineTo(8, -40);
    ctx.quadraticCurveTo(22, -30, 16, 0);
    ctx.closePath();
    ctx.fill();
    // head
    ell(ctx, 0, -46, 16, 14); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -52); ctx.lineTo(-16, -62); ctx.lineTo(-4, -56);
    ctx.moveTo(14, -52); ctx.lineTo(16, -62); ctx.lineTo(4, -56);
    ctx.fill();
    // raised paw
    ctx.save();
    ctx.translate(13, -30);
    ctx.rotate(0.25 + wave);
    ctx.fillStyle = '#FFF8EC';
    rr(ctx, -4, -18, 8, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#F2C9B4';
    ell(ctx, 0, -18, 3.4, 3.6); ctx.fill();
    ctx.restore();
    // face
    ctx.fillStyle = '#6E5748';
    ell(ctx, -6, -48, 1.7, 2.1); ctx.fill();
    ell(ctx, 6, -48, 1.7, 2.1); ctx.fill();
    ctx.fillStyle = '#E08E84';
    ell(ctx, 0, -43, 1.7, 1.3); ctx.fill();
    ctx.strokeStyle = '#D9A98F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -44); ctx.lineTo(-16, -46);
    ctx.moveTo(10, -44); ctx.lineTo(16, -46);
    ctx.stroke();
    // collar + coin
    ctx.fillStyle = '#D9615B';
    rr(ctx, -10, -34, 20, 4.4, 2.2);
    ctx.fill();
    ctx.fillStyle = '#F2C56C';
    ell(ctx, 0, -24, 8, 7.4); ctx.fill();
    ctx.strokeStyle = '#C99233';
    ctx.lineWidth = 1.2;
    ell(ctx, 0, -24, 8, 7.4); ctx.stroke();
    ctx.fillStyle = '#B47F28';
    ctx.fillRect(-2.2, -26.2, 4.4, 4.4);
    // raised paw glow
    ctx.save();
    ctx.globalAlpha = 0.5;
    star(ctx, 17 + wave * 10, -50, 3, '#F5CE86', 1);
    ctx.restore();
  };

  ITEMS.o_globe = function (ctx, t, env) {
    // glow at night
    const g = ctx.createRadialGradient(0, -32, 2, 0, -32, 42);
    g.addColorStop(0, 'rgba(255, 222, 160, .3)');
    g.addColorStop(1, 'rgba(255, 222, 160, 0)');
    ctx.fillStyle = g;
    ell(ctx, 0, -32, 42, 42);
    ctx.fill();
    // base
    ctx.fillStyle = '#C9A66B';
    ell(ctx, 0, 0, 17, 5); ctx.fill();
    ctx.fillStyle = '#DDBB80';
    rr(ctx, -5, -10, 10, 9, 3);
    ctx.fill();
    // arc
    ctx.strokeStyle = '#D9B678';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -34, 21, Math.PI * 0.18, Math.PI * 0.82, true);
    ctx.stroke();
    // sphere
    const sg = ctx.createLinearGradient(-14, -50, 14, -18);
    sg.addColorStop(0, '#9CC7DC');
    sg.addColorStop(1, '#5E93B5');
    ctx.fillStyle = sg;
    ell(ctx, 0, -33, 20, 20); ctx.fill();
    // continents
    ctx.fillStyle = 'rgba(160, 203, 159, .95)';
    ell(ctx, -8, -38, 7, 5); ctx.fill();
    ell(ctx, 6, -28, 8, 6); ctx.fill();
    ell(ctx, 9, -43, 4, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, .55)';
    ell(ctx, -10, -40, 4, 2.2); ctx.fill();
    ell(ctx, 4, -31, 5, 2); ctx.fill();
    // stars
    const tw = 0.6 + Math.sin(t * 2) * 0.4;
    ctx.save();
    ctx.globalAlpha = tw;
    star(ctx, -15, -23, 2.4, '#FFE9B0', 1);
    star(ctx, 14, -49, 2, '#FFE9B0', 1);
    star(ctx, 2, -15, 1.8, '#FFE9B0', 1);
    ctx.restore();
    // shine
    ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-4, -36, 15, -2.4, -1.3);
    ctx.stroke();
  };

  ITEMS.o_yarn = function (ctx, t) {
    ctx.fillStyle = 'rgba(120, 88, 62, .10)';
    ell(ctx, 0, 2, 18, 4.4); ctx.fill();
    // thread
    ctx.strokeStyle = '#E49C8E';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.bezierCurveTo(34, -2, 38, -14, 30, -20);
    ctx.stroke();
    // ball
    ctx.fillStyle = '#F0A99B';
    ctx.beginPath();
    ctx.arc(0, -16, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(206, 128, 114, .8)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -16, 14, 6 + i * 3.4, -0.7 + i * 0.4, 0, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 244, 235, .6)';
    ell(ctx, -6, -23, 3, 2.2); ctx.fill();
    // knitting needles
    ctx.strokeStyle = '#C9A57E';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6, -30);
    ctx.lineTo(6, -44);
    ctx.moveTo(4, -28);
    ctx.lineTo(14, -40);
    ctx.stroke();
  };

  /* ---------------- icon rendering ---------------- */
  const ICON = {
    w_photo: { s: 0.66, dy: -2 },
    w_star: { s: 0.34, dy: -12 },
    w_clock: { s: 0.66, dy: 0 },
    w_poster: { s: 0.78, dy: -2 },
    wd_curtain: { s: 0.58, dy: 4 },
    wd_sill: { s: 0.66, dy: -2 },
    wd_chime: { s: 0.66, dy: 0 },
    wd_sticker: { s: 0.66, dy: 2 },
    d_lamp: { s: 1.08, dy: 0 },
    d_pen: { s: 1.2, dy: 0 },
    d_jar: { s: 1.04, dy: 0 },
    d_cocoa: { s: 1.04, dy: 0 },
    fl_rug: { s: 0.56, dy: -24 },
    fl_bed: { s: 0.8, dy: 0 },
    fl_shelf: { s: 0.46, dy: 2 },
    fl_cushion: { s: 0.86, dy: -6 },
    o_plant: { s: 1.14, dy: 0 },
    o_maneki: { s: 1.1, dy: 0 },
    o_globe: { s: 1.04, dy: 0 },
    o_yarn: { s: 1.14, dy: -2 }
  };

  function drawItem(ctx, id, x, y, scale, t, env) {
    const fn = ITEMS[id];
    if (!fn) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    fn(ctx, t || 0, env || {});
    ctx.restore();
  }

  function drawIcon(canvas, id, size) {
    if (!canvas || !ITEMS[id]) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = size || canvas.clientWidth || 80;
    canvas.width = Math.round(s * dpr);
    canvas.height = Math.round(s * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);
    const cfg = ICON[id] || { s: 0.7, dy: 0 };
    ctx.save();
    ctx.translate(s / 2, s * 0.9 + (cfg.dy || 0) * (s / 80));
    ctx.scale(cfg.s * (s / 80), cfg.s * (s / 80));
    ITEMS[id](ctx, 0, { icon: true });
    ctx.restore();
  }

  PDM.furniture.drawItem = drawItem;
  PDM.furniture.drawIcon = drawIcon;
  PDM.furniture.ICON = ICON;
})(window.PDM);

