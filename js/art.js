/* ============ 陪读小喵 · art: helpers + cat ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';

  const C = {
    fur: '#EAD4B9',
    furLight: '#FBF0E0',
    furShade: '#D6BB99',
    furDeep: '#C4A47E',
    patch: '#D9A06B',
    patchDeep: '#C28650',
    line: '#6E5748',
    earIn: '#F2AC9A',
    eye: '#4C382E',
    blush: '#F5A894',
    collar: '#EF8A74',
    bell: '#F2B45C',
    cream: '#FFF9F0'
  };

  function rr(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function ell(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  }

  function star(ctx, x, y, r, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 4;
      const rad = i % 2 === 0 ? r : r * 0.32;
      ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ---------------- sitting cat ---------------- */
  function drawTail(ctx, t, state) {
    const sway = Math.sin(t * 1.4) * 5;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.furShade;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(19, -18);
    ctx.bezierCurveTo(42, -14, 54 + sway * 0.4, -30, 50 + sway, -48);
    ctx.stroke();
    ctx.strokeStyle = C.fur;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(19, -18);
    ctx.bezierCurveTo(42, -14, 54 + sway * 0.4, -30, 50 + sway, -48);
    ctx.stroke();
    ctx.strokeStyle = C.patch;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(52 + sway * 0.9, -42);
    ctx.lineTo(50 + sway, -48);
    ctx.stroke();
    ctx.restore();
  }

  function drawEar(ctx, side, twitch) {
    const dir = side === 'l' ? -1 : 1;
    ctx.save();
    ctx.translate(dir * 26, -101);
    ctx.rotate(dir * (0.05 + twitch));
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.quadraticCurveTo(-10, -28, 10, -20);
    ctx.quadraticCurveTo(14, 2, 12, 9);
    ctx.closePath();
    ctx.fillStyle = side === 'r' ? C.patch : C.fur;
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 87, 72, .34)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.quadraticCurveTo(-3, -16, 7, -11);
    ctx.quadraticCurveTo(9, 1, 6, 4);
    ctx.closePath();
    ctx.fillStyle = C.earIn;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }

  function drawFace(ctx, state, blink, t) {
    const closed = state === 'doze' || state === 'sleep' || state === 'stretch' || state === 'eat';
    const happy = state === 'cheer' || state === 'celebrate' || state === 'wash' || state === 'pet';
    const down = state === 'read';

    // blush
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = C.blush;
    ell(ctx, -27, -63, 7.4, 4.2); ctx.fill();
    ell(ctx, 27, -63, 7.4, 4.2); ctx.fill();
    ctx.restore();

    // eyes
    ctx.strokeStyle = C.eye;
    ctx.fillStyle = C.eye;
    ctx.lineCap = 'round';
    if (closed || blink) {
      ctx.lineWidth = 2.6;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s * 15 - 6, -77);
        ctx.quadraticCurveTo(s * 15, -73, s * 15 + 6, -77);
        ctx.stroke();
      });
    } else if (happy) {
      ctx.lineWidth = 2.8;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s * 15 - 6.5, -75);
        ctx.quadraticCurveTo(s * 15, -82, s * 15 + 6.5, -75);
        ctx.stroke();
      });
    } else {
      [-1, 1].forEach(s => {
        ctx.save();
        if (down) ctx.translate(0, 1.6);
        const ey = -78;
        ctx.beginPath();
        ctx.ellipse(s * 15, ey, 5.4, down ? 5.6 : 7.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFDF7';
        ctx.beginPath();
        ctx.ellipse(s * 15 - 1.8, ey - 2.6, 1.7, 2.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.ellipse(s * 15 + 2, ey + 2.4, 1.1, 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // nose
    ctx.fillStyle = '#E08E84';
    ctx.beginPath();
    ctx.moveTo(-3.1, -64);
    ctx.quadraticCurveTo(0, -61, 3.1, -64);
    ctx.quadraticCurveTo(0, -67, -3.1, -64);
    ctx.fill();

    // mouth
    ctx.strokeStyle = 'rgba(110, 87, 72, .8)';
    ctx.lineWidth = 1.6;
    if (happy) {
      ctx.beginPath();
      ctx.moveTo(-4.5, -59.5);
      ctx.quadraticCurveTo(0, -54.5, 4.5, -59.5);
      ctx.stroke();
      ctx.fillStyle = '#E08E84';
      ctx.beginPath();
      ctx.ellipse(0, -57.6, 3.4, 2.4, 0, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -62.4);
      ctx.lineTo(0, -60);
      ctx.moveTo(0, -60);
      ctx.quadraticCurveTo(-2.6, -57.4, -4.4, -59);
      ctx.moveTo(0, -60);
      ctx.quadraticCurveTo(2.6, -57.4, 4.4, -59);
      ctx.stroke();
    }

    // whiskers
    ctx.strokeStyle = 'rgba(140, 112, 92, .42)';
    ctx.lineWidth = 1.2;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s * 30, -67);
      ctx.lineTo(s * 45, -70);
      ctx.moveTo(s * 30, -63);
      ctx.lineTo(s * 46, -62);
      ctx.stroke();
    });

    // forehead marks
    ctx.strokeStyle = 'rgba(214, 180, 146, .7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -102); ctx.lineTo(-5, -97);
    ctx.moveTo(0, -104); ctx.lineTo(0, -98);
    ctx.moveTo(7, -102); ctx.lineTo(5, -97);
    ctx.stroke();
  }

  // 配饰画在头部坐标系里：头饰跟着头部一起倾斜，颈饰贴着脖子
  function drawAccessories(ctx, access) {
    const head = access.head, neck = access.neck;
    if (head === 'a_beret') {
      ctx.save();
      ctx.translate(-3, -112);
      ctx.rotate(-0.14);
      ctx.fillStyle = '#D9705F';
      ell(ctx, 0, 2, 33, 12); ctx.fill();
      ell(ctx, -2, -6, 23, 15); ctx.fill();
      ctx.fillStyle = '#C05A4C';
      ell(ctx, -1, -20, 3.4, 4.2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -4, 16, Math.PI * 1.12, Math.PI * 1.55);
      ctx.stroke();
      ctx.restore();
    } else if (head === 'a_bearband') {
      ctx.strokeStyle = '#D9A47F';
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-33, -97);
      ctx.quadraticCurveTo(0, -122, 33, -97);
      ctx.stroke();
      ctx.fillStyle = '#EFC2A0';
      ell(ctx, -25, -115, 10, 10); ctx.fill();
      ell(ctx, 25, -115, 10, 10); ctx.fill();
      ctx.fillStyle = '#F7DCC6';
      ell(ctx, -25, -115, 4.6, 4.6); ctx.fill();
      ell(ctx, 25, -115, 4.6, 4.6); ctx.fill();
    } else if (head === 'a_gradcap') {
      ctx.fillStyle = '#3B4A63';
      ell(ctx, 0, -106, 31, 9); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -131);
      ctx.lineTo(37, -114);
      ctx.lineTo(0, -101);
      ctx.lineTo(-37, -114);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.18)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = '#E8C36A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(31, -114);
      ctx.lineTo(34, -99);
      ctx.stroke();
      ctx.fillStyle = '#E8C36A';
      ell(ctx, 34.5, -97, 3, 3); ctx.fill();
    } else if (head === 'a_shades') {
      ctx.fillStyle = 'rgba(52, 50, 56, .94)';
      ell(ctx, -15, -78, 10, 6.6); ctx.fill();
      ell(ctx, 15, -78, 10, 6.6); ctx.fill();
      ctx.fillRect(-3, -80, 6, 2.6);
      ctx.fillStyle = 'rgba(255,255,255,.34)';
      ell(ctx, -18, -81, 3, 1.6); ctx.fill();
      ell(ctx, 12, -81, 3, 1.6); ctx.fill();
    }

    if (neck === 'a_scarf') {
      ctx.fillStyle = '#C4584F';
      ell(ctx, 0, -49, 30, 9.5); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -46);
      ctx.quadraticCurveTo(20, -40, 17, -24);
      ctx.lineTo(27, -26);
      ctx.quadraticCurveTo(28, -40, 22, -47);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,246,236,.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-22, -51); ctx.lineTo(-6, -44);
      ctx.moveTo(-10, -53); ctx.lineTo(6, -45);
      ctx.moveTo(2, -52); ctx.lineTo(18, -45);
      ctx.stroke();
    } else if (neck === 'a_bell') {
      ctx.strokeStyle = '#D2604F';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -53, 19, 0.28, Math.PI - 0.28);
      ctx.stroke();
      ctx.fillStyle = '#F2C24F';
      ell(ctx, 0, -34.5, 5, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ell(ctx, -1.6, -36, 1.3, 1.3); ctx.fill();
      ctx.strokeStyle = 'rgba(150,105,35,.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-1.8, -31); ctx.lineTo(-1.8, -29);
      ctx.moveTo(1.8, -31); ctx.lineTo(1.8, -29);
      ctx.stroke();
    }
  }

  function drawHead(ctx, state, outfit, t, blink, access) {
    const tilt = state === 'read' ? 0.1 : state === 'doze' ? 0.16 : state === 'wash' ? 0.05 : state === 'eat' ? 0.28 : state === 'pet' ? -0.06 : 0;
    const nod = state === 'doze' ? Math.sin(t * 0.9) * 2 : 0;
    ctx.save();
    ctx.translate(0, -57);
    ctx.rotate(tilt);
    ctx.translate(0, 57 + nod);

    // ears
    drawEar(ctx, 'l', Math.sin(t * 0.9) * 0.04);
    drawEar(ctx, 'r', Math.sin(t * 0.9 + 1.7) * 0.04);

    // head
    const g = ctx.createLinearGradient(0, -112, 0, -46);
    g.addColorStop(0, C.furLight);
    g.addColorStop(0.55, C.fur);
    g.addColorStop(1, '#F1DDC3');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -112);
    ctx.bezierCurveTo(24, -112, 39, -98, 38, -79);
    ctx.bezierCurveTo(38, -58, 24, -47, 0, -47);
    ctx.bezierCurveTo(-24, -47, -38, -58, -38, -79);
    ctx.bezierCurveTo(-39, -98, -24, -112, 0, -112);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 87, 72, .34)';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // caramel head patch, clipped to the head
    ctx.save();
    ctx.clip();
    ctx.fillStyle = C.patch;
    ctx.beginPath();
    ctx.ellipse(25, -99, 28, 24, -.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(35, -74, 15, 19, -.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = C.patchDeep;
    ctx.beginPath();
    ctx.ellipse(34, -98, 9, 7, -.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // soft cheek shading
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#EDD6BA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-34, -64);
    ctx.quadraticCurveTo(-30, -51, -14, -48);
    ctx.moveTo(34, -64);
    ctx.quadraticCurveTo(30, -51, 14, -48);
    ctx.stroke();
    ctx.restore();

    drawFace(ctx, state, blink, t);

    // headwear
    if (outfit === 'pj') {
      ctx.fillStyle = '#BFDCEC';
      ctx.beginPath();
      ctx.moveTo(-33, -96);
      ctx.quadraticCurveTo(-20, -122, 8, -121);
      ctx.quadraticCurveTo(26, -120, 28, -107);
      ctx.quadraticCurveTo(36, -102, 31, -95);
      ctx.quadraticCurveTo(20, -103, -2, -103);
      ctx.quadraticCurveTo(-18, -103, -33, -96);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-24, -101);
      ctx.quadraticCurveTo(-10, -109, 12, -108);
      ctx.stroke();
      ctx.fillStyle = '#FFF3E2';
      ell(ctx, 33, -96, 6, 6); ctx.fill();
      ctx.fillStyle = '#9CC4D8';
      ell(ctx, 8, -121, 2, 2); ctx.fill();
    } else if (outfit === 'academy') {
      ctx.fillStyle = '#44546E';
      ctx.beginPath();
      ctx.ellipse(-2, -107, 31, 10.5, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-4, -112, 15, 7, -0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3A485F';
      ell(ctx, -1, -114, 2.6, 3.6); ctx.fill();
      ctx.strokeStyle = '#5C6F8E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-26, -106);
      ctx.quadraticCurveTo(-6, -113, 20, -106);
      ctx.stroke();
    } else if (outfit === 'festival') {
      ctx.fillStyle = '#C9584F';
      ctx.beginPath();
      ctx.moveTo(-30, -95);
      ctx.quadraticCurveTo(-22, -106, 0, -107);
      ctx.quadraticCurveTo(22, -106, 30, -95);
      ctx.lineTo(26, -91);
      ctx.quadraticCurveTo(0, -98, -26, -91);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFF4E4';
      ell(ctx, 0, -103, 27, 5.2); ctx.fill();
      ctx.fillStyle = '#D96A5F';
      ctx.beginPath();
      ctx.moveTo(-18, -103);
      ctx.quadraticCurveTo(-12, -127, 2, -128);
      ctx.quadraticCurveTo(12, -122, 10, -108);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFF4E4';
      ell(ctx, 5, -127, 6, 6); ctx.fill();
    } else if (outfit === 'raincoat') {
      ctx.fillStyle = '#F2C85B';
      ctx.beginPath();
      ctx.moveTo(-31, -96); ctx.quadraticCurveTo(-26, -116, 0, -119);
      ctx.quadraticCurveTo(26, -116, 31, -96); ctx.lineTo(24, -91);
      ctx.quadraticCurveTo(0, -101, -24, -91); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-18, -103); ctx.lineTo(18, -103); ctx.stroke();
    } else if (outfit === 'chef') {
      ctx.fillStyle = '#FFF8EE';
      ctx.beginPath();
      ctx.moveTo(-29, -96); ctx.quadraticCurveTo(-26, -118, -12, -114);
      ctx.quadraticCurveTo(0, -129, 12, -114); ctx.quadraticCurveTo(27, -119, 30, -96);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#E7B69C'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#E8947B'; ell(ctx, 0, -112, 3, 3); ctx.fill();
    } else if (outfit === 'wizard') {
      ctx.fillStyle = '#6879B8';
      ctx.beginPath(); ctx.moveTo(-25, -102); ctx.lineTo(3, -139); ctx.lineTo(28, -101);
      ctx.quadraticCurveTo(0, -108, -25, -102); ctx.closePath(); ctx.fill();
      star(ctx, 3, -122, 5, '#FFE7A8', .95);
      ctx.fillStyle = '#F5D37A'; ell(ctx, 25, -101, 5, 3); ctx.fill();
    }
    if (access && (access.head || access.neck)) drawAccessories(ctx, access);
    ctx.restore();
  }

  function drawBody(ctx, outfit, state) {
    const g = ctx.createLinearGradient(0, -52, 0, -6);
    g.addColorStop(0, C.fur);
    g.addColorStop(1, '#EDD8BE');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-26, -52);
    ctx.bezierCurveTo(-41, -38, -40, -13, -23, -6);
    ctx.quadraticCurveTo(0, -2, 23, -6);
    ctx.bezierCurveTo(40, -13, 41, -38, 26, -52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110, 87, 72, .32)';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // caramel flank patch
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-26, -52);
    ctx.bezierCurveTo(-41, -38, -40, -13, -23, -6);
    ctx.quadraticCurveTo(0, -2, 23, -6);
    ctx.bezierCurveTo(40, -13, 41, -38, 26, -52);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = C.patch;
    ctx.beginPath();
    ctx.ellipse(27, -32, 15, 19, -.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // belly
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = C.cream;
    ell(ctx, -1, -25, 17, 19);
    ctx.fill();
    ctx.restore();

    if (outfit === 'pj') {
      ctx.fillStyle = '#CFE5F0';
      ctx.beginPath();
      ctx.moveTo(-25, -50);
      ctx.bezierCurveTo(-38, -37, -38, -16, -22, -9);
      ctx.quadraticCurveTo(0, -5, 22, -9);
      ctx.bezierCurveTo(38, -16, 38, -37, 25, -50);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#AFD0E2';
      ctx.lineWidth = 2.4;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 9, -46);
        ctx.lineTo(i * 11, -11);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#FFF9EF';
      [0, -1, 1].forEach((v, i) => {
        ell(ctx, 0, -39 + i * 9, 1.7, 1.7);
        ctx.fill();
      });
    } else if (outfit === 'academy') {
      ctx.fillStyle = '#44546E';
      ctx.beginPath();
      ctx.moveTo(-25, -50);
      ctx.bezierCurveTo(-38, -37, -38, -16, -22, -9);
      ctx.quadraticCurveTo(0, -5, 22, -9);
      ctx.bezierCurveTo(38, -16, 38, -37, 25, -50);
      ctx.closePath();
      ctx.fill();
      // shirt v
      ctx.fillStyle = '#FBF5EA';
      ctx.beginPath();
      ctx.moveTo(-12, -48);
      ctx.lineTo(0, -30);
      ctx.lineTo(12, -48);
      ctx.closePath();
      ctx.fill();
      // bow tie
      ctx.fillStyle = '#D9615B';
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(-8, -50);
      ctx.lineTo(-8, -40);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(8, -50);
      ctx.lineTo(8, -40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#B94E49';
      ell(ctx, 0, -45, 2.6, 2.6); ctx.fill();
      // buttons
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ell(ctx, 0, -28, 1.6, 1.6); ctx.fill();
      ell(ctx, 0, -20, 1.6, 1.6); ctx.fill();
    } else if (outfit === 'festival') {
      // scarf
      ctx.fillStyle = '#C9584F';
      rr(ctx, -26, -53, 52, 9, 4.5);
      ctx.fill();
      ctx.fillStyle = '#D96A5F';
      rr(ctx, -5, -48, 10, 25, 4);
      ctx.fill();
      ctx.fillStyle = '#FFF4E4';
      ctx.beginPath();
      ctx.moveTo(-7, -24); ctx.lineTo(-3, -24); ctx.lineTo(-4, -18); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(3, -23); ctx.lineTo(7, -23); ctx.lineTo(6, -17); ctx.closePath();
      ctx.fill();
    } else if (outfit === 'raincoat') {
      ctx.fillStyle = '#E7B83F';
      ctx.beginPath();
      ctx.moveTo(-25, -50); ctx.bezierCurveTo(-38, -35, -37, -14, -21, -8);
      ctx.quadraticCurveTo(0, -3, 21, -8); ctx.bezierCurveTo(37, -14, 38, -35, 25, -50);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -10); ctx.stroke();
      ctx.fillStyle = '#FFF4D0'; ell(ctx, 0, -30, 3, 3); ctx.fill();
    } else if (outfit === 'chef') {
      ctx.fillStyle = '#FFF8EE';
      ctx.beginPath(); ctx.moveTo(-25, -50); ctx.bezierCurveTo(-38, -35, -37, -14, -21, -8);
      ctx.quadraticCurveTo(0, -3, 21, -8); ctx.bezierCurveTo(37, -14, 38, -35, 25, -50);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#E7B69C'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#E8947B'; ell(ctx, 0, -31, 4, 4); ctx.fill();
    } else if (outfit === 'wizard') {
      ctx.fillStyle = '#6879B8';
      ctx.beginPath(); ctx.moveTo(-25, -50); ctx.bezierCurveTo(-38, -35, -37, -14, -21, -8);
      ctx.quadraticCurveTo(0, -3, 21, -8); ctx.bezierCurveTo(37, -14, 38, -35, 25, -50);
      ctx.closePath(); ctx.fill();
      star(ctx, -12, -30, 4, '#FFE7A8', .9); star(ctx, 13, -18, 3, '#FFE7A8', .85);
    }
  }

  function drawArms(ctx, state, t) {
    let hands;
    if (state === 'pet') {
      hands = [[-27, -54], [20, -30]];
    } else if (state === 'stretch' || state === 'cheer' || state === 'celebrate') {
      const wob = state === 'cheer' ? Math.sin(t * 6) * 1.8 : 0;
      hands = [[-40, -94 + wob], [40, -90 - wob]];
    } else if (state === 'read' || state === 'eat') {
      hands = [[-17, -34], [17, -34]];
    } else if (state === 'wash') {
      hands = [[-19, -30], [16, -55]];
    } else {
      hands = [[-20, -27], [20, -27]];
    }
    const shoulders = [[-24, -44], [24, -44]];
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? 'rgba(196, 164, 126, .6)' : C.fur;
      ctx.lineWidth = pass === 0 ? 12.6 : 9.8;
      for (let i = 0; i < 2; i++) {
        const lifted = hands[i][1] < -50;
        ctx.beginPath();
        ctx.moveTo(shoulders[i][0], shoulders[i][1]);
        ctx.quadraticCurveTo(
          lifted ? hands[i][0] * 1.12 : hands[i][0] * 1.04,
          lifted ? -66 : hands[i][1] - 8,
          hands[i][0], hands[i][1]
        );
        ctx.stroke();
      }
    }
    hands.forEach(h => {
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.ellipse(h[0], h[1], 5.2, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(196, 164, 126, .55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    // toe beans
    ctx.fillStyle = 'rgba(226, 178, 158, .8)';
    hands.forEach(h => {
      ell(ctx, h[0] - 1.4, h[1] - 0.8, 1.2, 1.2);
      ctx.fill();
      ell(ctx, h[0] + 2, h[1] - 0.2, 1.1, 1.1);
      ctx.fill();
    });
  }

  function drawBook(ctx, t) {
    ctx.save();
    ctx.translate(0, -37);
    ctx.rotate(-0.06);
    // cover
    ctx.fillStyle = '#D98F7C';
    rr(ctx, -28, -13, 56, 28, 2.5);
    ctx.fill();
    ctx.fillStyle = '#FBF2E2';
    rr(ctx, -26, -12, 25, 25, 2);
    ctx.fill();
    rr(ctx, 1, -12, 25, 25, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(174, 137, 108, .45)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-21, -5 + i * 5.4);
      ctx.lineTo(-7, -5 + i * 5.4);
      ctx.moveTo(6, -5 + i * 5.4);
      ctx.lineTo(20, -5 + i * 5.4);
      ctx.stroke();
    }
    // moving bookmark
    ctx.fillStyle = '#E8B45C';
    ctx.beginPath();
    ctx.moveTo(22, -12);
    ctx.lineTo(26, -12);
    ctx.lineTo(26, -1);
    ctx.lineTo(24, -3.4);
    ctx.lineTo(22, -1);
    ctx.closePath();
    ctx.fill();
    // hands over book
    ctx.fillStyle = C.cream;
    ell(ctx, -25, 9, 5.4, 4.6); ctx.fill();
    ell(ctx, 25, 9, 5.4, 4.6); ctx.fill();
    ctx.restore();
  }

  function drawSleepingCat(ctx, t) {
    const breath = Math.sin(t * 1.2);
    ctx.save();
    // tail
    ctx.strokeStyle = C.furShade;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, -14);
    ctx.bezierCurveTo(52, -12, 48, -32, 28, -30);
    ctx.stroke();
    ctx.strokeStyle = C.fur;
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(30, -14);
    ctx.bezierCurveTo(52, -12, 48, -32, 28, -30);
    ctx.stroke();
    // body
    const g = ctx.createLinearGradient(0, -50, 0, -8);
    g.addColorStop(0, C.furLight);
    g.addColorStop(1, '#EFD9BE');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -22, 44, 24 + breath * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // paws
    ctx.fillStyle = C.cream;
    ell(ctx, -30, -9, 9, 5); ctx.fill();
    ell(ctx, -12, -7, 9, 5); ctx.fill();
    // head
    ctx.save();
    ctx.translate(-30, -34);
    ctx.rotate(-0.18);
    // ears
    ctx.fillStyle = C.fur;
    ctx.beginPath();
    ctx.moveTo(-23, -12);
    ctx.quadraticCurveTo(-32, -34, -10, -24);
    ctx.quadraticCurveTo(-14, -16, -23, -12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -22);
    ctx.quadraticCurveTo(12, -40, 25, -18);
    ctx.quadraticCurveTo(16, -14, 8, -22);
    ctx.fill();
    ctx.fillStyle = C.earIn;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.quadraticCurveTo(-25, -27, -14, -21);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, -22);
    ctx.quadraticCurveTo(14, -32, 20, -20);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // head
    const hg = ctx.createLinearGradient(0, -30, 0, 18);
    hg.addColorStop(0, C.furLight);
    hg.addColorStop(1, C.fur);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(0, -2, 25, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    // closed eyes
    ctx.strokeStyle = C.eye;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s * 11 - 4.5, 1);
      ctx.quadraticCurveTo(s * 11, 4, s * 11 + 4.5, 1);
      ctx.stroke();
    });
    // nose + blush + mouth
    ctx.fillStyle = '#E08E84';
    ell(ctx, 0, 8, 2.6, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(110, 87, 72, .7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(-2, 12.4, -4, 11);
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(2, 12.4, 4, 11);
    ctx.stroke();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = C.blush;
    ell(ctx, -16, 7, 4.8, 2.8); ctx.fill();
    ell(ctx, 16, 7, 4.8, 2.8); ctx.fill();
    ctx.globalAlpha = 1;
    // whiskers
    ctx.strokeStyle = 'rgba(140, 112, 92, .35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-20, 5); ctx.lineTo(-31, 3);
    ctx.moveTo(-20, 9); ctx.lineTo(-31, 10);
    ctx.moveTo(20, 5); ctx.lineTo(31, 3);
    ctx.moveTo(20, 9); ctx.lineTo(31, 10);
    ctx.stroke();
    // collar hint + bell
    ctx.strokeStyle = C.collar;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-17, 18);
    ctx.quadraticCurveTo(0, 24, 15, 16);
    ctx.stroke();
    ctx.fillStyle = C.bell;
    ell(ctx, 3, 22, 3.4, 3.4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ell(ctx, 2, 21, 1, 1); ctx.fill();
    ctx.restore();
    // zzz
    drawZzz(ctx, 14, -58, t, 1);
    ctx.restore();
  }

  function drawZzz(ctx, x, y, t, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 250, 240, .8)';
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.45 + i * 0.33) % 1;
      const alpha = 0.62 * (1 - ph) * Math.min(1, ph * 4);
      const size = 11 + i * 3.4;
      ctx.font = '700 ' + size + 'px "PingFang SC", "HarmonyOS Sans SC", sans-serif';
      const px = i * 8 + Math.sin(ph * 3) * 3;
      const py = -ph * 34 - i * 5;
      ctx.globalAlpha = alpha;
      ctx.strokeText('z', px, py);
      ctx.fillStyle = 'rgba(96, 74, 58, .85)';
      ctx.fillText('z', px, py);
    }
    ctx.restore();
  }

  function drawHearts(ctx, t) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * .55 + i * .33) % 1;
      const x = (i - 1) * 32 + Math.sin(t * 2 + i) * 4;
      const y = -86 - ph * 22;
      const a = Math.sin(ph * Math.PI);
      ctx.save();
      ctx.globalAlpha = a * .9;
      ctx.translate(x, y);
      ctx.scale(.9 + a * .35, .9 + a * .35);
      ctx.fillStyle = i % 2 ? '#F58E80' : '#F3A9A0';
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-9, -3, -4, -10, 0, -5);
      ctx.bezierCurveTo(4, -10, 9, -3, 0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawSnack(ctx, t) {
    const bob = Math.sin(t * 5) * 1.2;
    ctx.save();
    ctx.translate(7, -41 + bob);
    ctx.fillStyle = '#EFA35E';
    ell(ctx, 0, 0, 9, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-16, -4);
    ctx.lineTo(-16, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4C382E';
    ell(ctx, 4, -1, 1, 1);
    ctx.fill();
    ctx.fillStyle = 'rgba(239, 163, 94, .8)';
    ell(ctx, -2, 11, 1.4, 1.4); ctx.fill();
    ell(ctx, 5, 13, 1.1, 1.1); ctx.fill();
    ctx.restore();
  }

  function drawSparkles(ctx, t) {
    const pts = [[-52, -104, 7], [48, -112, 6], [42, -78, 4.4], [-48, -76, 4], [8, -128, 5]];
    pts.forEach((p, i) => {
      const tw = 0.55 + Math.sin(t * 3 + i * 1.7) * 0.45;
      star(ctx, p[0], p[1] + Math.sin(t * 2 + i) * 2, p[2] * (0.75 + tw * 0.35), i % 2 ? '#F6C877' : '#F8A78E', tw);
    });
  }

  function drawConfetti(ctx, t) {
    const colors = ['#F5A38A', '#F3C36B', '#8FC3AE', '#9DB9D8', '#F5D9B8'];
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4;
      const ph = (t * 0.8 + i * 0.17) % 1;
      const x = Math.cos(a) * (34 + i * 3.2) + Math.sin(t + i) * 4;
      const y = -54 - ph * 78 + Math.sin(a) * 14;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 2 + i);
      ctx.globalAlpha = 0.9 * (1 - ph * 0.8);
      ctx.fillStyle = colors[i % colors.length];
      rr(ctx, -2.4, -1.6, 4.8, 3.2, 1);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCat(ctx, x, y, scale, opts) {
    opts = opts || {};
    const state = opts.state || 'idle';
    const outfit = opts.outfit || 'default';
    const t = opts.t == null ? performance.now() / 1000 : opts.t;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // ground shadow
    ctx.fillStyle = 'rgba(120, 88, 62, .13)';
    ell(ctx, 0, 2, state === 'sleep' ? 50 : 39, 8);
    ctx.fill();

    if (state === 'sleep') {
      drawSleepingCat(ctx, t);
      ctx.restore();
      return;
    }

    const bouncing = state === 'celebrate' ? Math.abs(Math.sin(t * 4.6)) * 9 : 0;
    const breath = Math.sin(t * 1.5) * 0.9;
    ctx.translate(0, -bouncing + breath * 0.2);

    drawTail(ctx, t, state);
    drawBody(ctx, outfit, state);

    // feet
    ctx.fillStyle = C.cream;
    ell(ctx, -13, -7, 10, 7); ctx.fill();
    ell(ctx, 13, -7, 10, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(214, 177, 146, .55)';
    ctx.lineWidth = 1.3;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s * 13 - 3.2, -10.4);
      ctx.lineTo(s * 13 - 3.2, -5);
      ctx.moveTo(s * 13 + 3.2, -10.4);
      ctx.lineTo(s * 13 + 3.2, -5);
      ctx.stroke();
    });

    // collar
    ctx.strokeStyle = C.collar;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -53, 19, 0.28, Math.PI - 0.28);
    ctx.stroke();
    ctx.fillStyle = C.bell;
    ell(ctx, 0, -34.5, 4.4, 4.4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ell(ctx, -1.4, -36, 1.2, 1.2); ctx.fill();
    ctx.strokeStyle = 'rgba(160, 112, 40, .5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1.8, -32.4);
    ctx.lineTo(-1.8, -30.6);
    ctx.moveTo(1.8, -32.4);
    ctx.lineTo(1.8, -30.6);
    ctx.stroke();

    const blinkPhase = (t % 4.6);
    const blink = blinkPhase < 0.11;
    drawHead(ctx, state, outfit, t, blink && !['doze', 'sleep', 'stretch', 'wash'].includes(state), opts.access);
    drawArms(ctx, state, t);

    if (state === 'read') drawBook(ctx, t);
    if (state === 'eat') drawSnack(ctx, t);
    if (state === 'pet') drawHearts(ctx, t);
    if (state === 'cheer' || state === 'celebrate') drawSparkles(ctx, t);
    if (state === 'celebrate') drawConfetti(ctx, t);
    if (state === 'doze') drawZzz(ctx, 32, -112, t, 0.9);
    if (state === 'wash') {
      ctx.strokeStyle = 'rgba(150, 200, 220, .8)';
      ctx.lineWidth = 1.4;
      const ph = (t * 0.7) % 1;
      ctx.globalAlpha = 1 - ph;
      ctx.beginPath();
      ctx.arc(-2, -58, 6 + ph * 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  PDM.art = {
    colors: C,
    rr: rr,
    ell: ell,
    star: star,
    drawCat: drawCat,
    drawZzz: drawZzz,
    drawSparkles: drawSparkles
  };
})(window.PDM);
