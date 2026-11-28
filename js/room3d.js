/* ============ 陪读小喵 · 3D room (Three.js) ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const THREE = window.THREE;
  if (!THREE) return;
  const core = PDM.core;

  const ROOM = { w: 4.4, d: 3.0, h: 3.0, backZ: -1.5, leftX: -2.2, deskY: 0.84 };
  const CL = {
    wall: '#F0DCC6', wallTop: '#FFF8ED', floor: '#C79F78', floor2: '#AE815E',
    base: '#D1BFA5', desk: '#8E6F55', deskTop: '#D7C5A9', white: '#FFF9EF',
    ink: '#5B4A42', coral: '#C9826D', coralDeep: '#AA604F', sage: '#879F8E',
    honey: '#C39A5B', sky: '#D3D0C5', cream: '#F7F0E1'
  };
  // GLB 猫屋包中的模型比例和原点不统一，默认使用程序化木屋保证首屏构图稳定。
  // 后续替换为重新校准过的模型时可切回 true。
  const USE_GLB_HOUSE = false;
  const MAP = {
    wall: { x: [-2.02, 2.02], y: [2.72, 0.88], z: -1.42 },
    window: { x: [0.55, 1.75], y: [2.28, 1.02], z: -1.42 },
    desk: { x: [0.42, 1.9], z: [-1.2, -0.66], y: ROOM.deskY },
    floor: { x: [-1.98, 1.98], z: [-0.88, 1.25] },
    ornament: { x: [-1.98, 1.98], z: [-0.88, 1.25] }
  };

  const lerp = THREE.MathUtils.lerp;
  const inv = (a, b, v) => Math.max(0, Math.min(1, (v - a) / (b - a)));

  const FLOOR_Y0 = 0.72, FLOOR_Y1 = 0.99, FLOOR_Z0 = -0.95, FLOOR_Z1 = 1.2;
  const floorZ = yN => {
    const t = Math.max(0, Math.min(1, (yN - FLOOR_Y0) / (FLOOR_Y1 - FLOOR_Y0)));
    return lerp(FLOOR_Z0, FLOOR_Z1, t);
  };
  const floorY = z => FLOOR_Y0 + inv(FLOOR_Z0, FLOOR_Z1, z) * (FLOOR_Y1 - FLOOR_Y0);

  function normToWorld(slot, xN, yN) {
    if (slot === 'wall') return { x: lerp(MAP.wall.x[0], MAP.wall.x[1], xN), y: lerp(MAP.wall.y[0], MAP.wall.y[1], yN), z: MAP.wall.z };
    if (slot === 'window') return { x: lerp(MAP.window.x[0], MAP.window.x[1], xN), y: lerp(MAP.window.y[0], MAP.window.y[1], yN), z: MAP.window.z };
    if (slot === 'desk') return { x: lerp(MAP.desk.x[0], MAP.desk.x[1], xN), y: MAP.desk.y, z: lerp(MAP.desk.z[0], MAP.desk.z[1], yN) };
    return { x: lerp(MAP.floor.x[0], MAP.floor.x[1], xN), y: 0, z: floorZ(yN) };
  }
  function worldToNorm(slot, p) {
    if (slot === 'wall') return { x: inv(MAP.wall.x[0], MAP.wall.x[1], p.x), y: inv(MAP.wall.y[0], MAP.wall.y[1], p.y) };
    if (slot === 'window') return { x: inv(MAP.window.x[0], MAP.window.x[1], p.x), y: inv(MAP.window.y[0], MAP.window.y[1], p.y) };
    if (slot === 'desk') return { x: inv(MAP.desk.x[0], MAP.desk.x[1], p.x), y: inv(MAP.desk.z[0], MAP.desk.z[1], p.z) };
    return { x: inv(MAP.floor.x[0], MAP.floor.x[1], p.x), y: floorY(p.z) };
  }

  /* ---------- primitives ---------- */
  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: .9, metalness: 0 }, opts || {}));
  }
  function box(w, h, d, color, opts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function cyl(rt, rb, h, color, seg, opts) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 18), mat(color, opts));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function sph(r, color, sx, sy, sz, opts) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(color, opts));
    m.scale.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function put(m, x, y, z) { m.position.set(x || 0, y || 0, z || 0); return m; }
  // 给模型加一圈卡通描边（背面放大法）
  function outline(mesh, color, s) {
    const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: color || '#D8B39A', side: THREE.BackSide }));
    o.scale.setScalar(s || 1.055);
    mesh.add(o);
    return o;
  }
  function tex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  /* ---------- sky ---------- */
  function skyTexture(env) {
    return tex(256, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      if (env.night) {
        gr.addColorStop(0, '#2E3B5E'); gr.addColorStop(.6, '#4E6390'); gr.addColorStop(1, '#8C9DBE');
      } else if (env.dusk) {
        gr.addColorStop(0, '#F0A97E'); gr.addColorStop(.55, '#F7C9A4'); gr.addColorStop(1, '#FCE2C9');
      } else if (env.morning) {
        gr.addColorStop(0, '#CBE7F3'); gr.addColorStop(.7, '#E9F6FA'); gr.addColorStop(1, '#FDF0DC');
      } else {
        gr.addColorStop(0, '#AED9EE'); gr.addColorStop(.7, '#DEF0F8'); gr.addColorStop(1, '#F9EEDC');
      }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (env.night) {
        g.fillStyle = '#FBEFC9';
        g.beginPath(); g.arc(w * .68, h * .28, 20, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(46,58,84,.85)';
        const base = h;
        [[.02, .2, .2], [.26, .26, .28], [.56, .2, .22], [.78, .24, .3]].forEach(([x, ww, hh]) => {
          g.fillRect(x * w, base - hh * h, ww * w, hh * h);
          g.beginPath();
          g.moveTo(x * w - 4, base - hh * h);
          g.lineTo(x * w + ww * w / 2, base - hh * h - 12);
          g.lineTo(x * w + ww * w + 4, base - hh * h);
          g.closePath(); g.fill();
        });
        g.fillStyle = '#FFF4D2';
        for (let i = 0; i < 26; i++) {
          g.globalAlpha = .35 + Math.random() * .6;
          g.fillRect((i * 53) % w, (i * 37) % (h * .6), 2, 2);
        }
        g.globalAlpha = 1;
      } else {
        const sx = w * (env.dusk ? .3 : .7), sy = h * (env.dusk ? .6 : .3);
        const rg = g.createRadialGradient(sx, sy, 2, sx, sy, 46);
        rg.addColorStop(0, env.dusk ? 'rgba(255,186,120,.95)' : 'rgba(255,235,180,.95)');
        rg.addColorStop(1, 'rgba(255,220,150,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(sx, sy, 46, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,.85)';
        [[.28, .32, 14], [.62, .5, 10], [.44, .2, 8]].forEach(([x, y, r]) => {
          g.beginPath(); g.arc(x * w, y * h, r, 0, Math.PI * 2); g.fill();
        });
        g.fillStyle = 'rgba(150,190,158,.55)';
        g.beginPath(); g.ellipse(w * .2, h * .95, 30, 14, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(w * .55, h * .98, 40, 16, 0, 0, Math.PI * 2); g.fill();
      }
    });
  }

  /* ---------- furniture builders ---------- */
  function frameBoard(w, h, face, edge) {
    const g = new THREE.Group();
    g.add(box(w + .04, h + .04, .035, edge || '#E7D0B8'));
    const f = box(w, h, .02, face); f.position.z = .026; g.add(f);
    return g;
  }

  const B = {};

  B.w_poster = function () {
    const g = frameBoard(.56, .72, '#FFFDF7');
    const art = box(.44, .4, .01, '#F6C7AE'); put(art, 0, .1, .04); g.add(art);
    const cat = sph(.1, '#FFF8EC', 1, .88, .28); put(cat, 0, .11, .05); g.add(cat);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.045, .09, 3), mat('#FFF8EC'));
      put(ear, s * .065, .19, .055); g.add(ear);
    });
    const bar = box(.3, .035, .01, '#B77B5E'); put(bar, 0, -.17, .042); g.add(bar);
    return g;
  };

  B.w_photo = function () {
    const g = new THREE.Group();
    [[-.19, .03, .28, .34, -.08], [.01, .06, .28, .34, .03], [.2, .01, .26, .32, .1]].forEach(([x, y, w, h, r], i) => {
      const f = frameBoard(w, h, i === 1 ? '#F3E6D8' : '#FFFDF7');
      put(f, x, y, i * .012);
      f.rotation.z = r;
      g.add(f);
    });
    return g;
  };

  B.w_clock = function () {
    const g = new THREE.Group();
    const rim = cyl(.23, .23, .06, '#E7C39A', 28);
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    const face = cyl(.19, .19, .02, '#FFFDF7', 28);
    face.rotation.x = Math.PI / 2; face.position.z = .035; g.add(face);
    const h1 = box(.02, .11, .01, '#7A6152'); put(h1, 0, .045, .05); g.add(h1);
    const h2 = box(.08, .02, .01, '#7A6152'); put(h2, .03, 0, .05); g.add(h2);
    const dot = sph(.025, '#F08A72'); put(dot, 0, 0, .052); g.add(dot);
    return g;
  };

  B.w_star = function () {
    const g = new THREE.Group();
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const x = -.62 + i * .155;
      const y = Math.sin(i * 0.9) * .08;
      pts.push(new THREE.Vector3(x, y, 0));
      const b = sph(.032, '#FFE7A8', 1, 1, 1, { emissive: '#F3B45C', emissiveIntensity: .9 });
      put(b, x, y, .02); g.add(b);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .006, 5, false), mat('#C9A98A'));
    g.add(wire);
    return g;
  };

  B.w_neon = function () {
    const g = new THREE.Group();
    const panel = box(.92, .52, .06, '#4A3F55'); g.add(panel);
    const t = tex(256, 140, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = '#FF9FC4'; c.shadowBlur = 22;
      c.fillStyle = '#FFD9E7';
      c.font = '700 82px "PingFang SC", sans-serif';
      c.fillText('加油', w / 2, h / 2 + 4);
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(.82, .44), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    sign.position.z = .035; g.add(sign);
    const light = new THREE.PointLight('#FF9FC4', .55, 2.2); light.position.set(0, 0, .4); g.add(light);
    g.userData.neonLight = light;
    return g;
  };

  B.w_calendar = function () {
    const g = frameBoard(.44, .58, '#FFFDF7');
    const head = box(.44, .16, .012, '#F08A72'); put(head, 0, .2, .038); g.add(head);
    const now = new Date();
    const day = String(now.getDate());
    const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][now.getMonth()];
    const t = tex(200, 160, (c, w, h) => {
      c.textAlign = 'center'; c.fillStyle = '#B77B5E';
      c.font = '700 84px "PingFang SC", sans-serif';
      c.fillText(day, w / 2, 96);
      c.font = '500 26px "PingFang SC", sans-serif';
      c.fillStyle = '#C9A386';
      c.fillText(month, w / 2, 138);
    });
    const num = new THREE.Mesh(new THREE.PlaneGeometry(.36, .3), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    num.position.set(0, -.1, .04); g.add(num);
    return g;
  };

  B.wd_curtain = function () {
    const g = new THREE.Group();
    const rod = cyl(.015, .015, 1.5, '#C9A98A', 10);
    rod.rotation.z = Math.PI / 2; put(rod, 0, .6, .02); g.add(rod);
    [-1, 1].forEach(s => {
      const cloth = box(.28, 1.16, .03, '#FFF6EA', { transparent: true, opacity: .92 });
      put(cloth, s * .6, 0, .01); g.add(cloth);
      const tie = box(.3, .035, .04, '#F3D7BD'); put(tie, s * .6, -.12, .02); g.add(tie);
    });
    return g;
  };

  B.wd_sill = function () {
    const g = new THREE.Group();
    const board = box(.96, .05, .2, '#F6E3CB'); put(board, 0, -.62, .06); g.add(board);
    [-.28, .28].forEach(x => {
      const pot = cyl(.1, .12, .13, '#D9A47E'); put(pot, x, -.53, .08); g.add(pot);
      const leaf = sph(.1, '#8FBFAC', .7, 1.2, .7); put(leaf, x, -.4, .08); g.add(leaf);
      const leaf2 = sph(.07, '#A4CCB6', .7, 1.1, .7); put(leaf2, x + .07, -.42, .08); g.add(leaf2);
    });
    return g;
  };

  B.wd_chime = function () {
    const g = new THREE.Group();
    const rod = cyl(.018, .018, .5, '#C9A98A', 10); rod.rotation.z = Math.PI / 2; put(rod, 0, .45, .03); g.add(rod);
    [-.16, 0, .16].forEach((x, i) => {
      const str = cyl(.006, .006, .38, '#D8C0A8', 6); put(str, x, .24, .03); g.add(str);
      const tube = cyl(.035, .035, .16 + i * .04, '#BFDFEF', 12, { metalness: .3, roughness: .3 });
      put(tube, x, -.02 - i * .01, .03); g.add(tube);
      const ball = sph(.03, '#FFF4E6'); put(ball, x, -.11 - i * .02, .03); g.add(ball);
    });
    return g;
  };

  B.wd_sticker = function () {
    const g = new THREE.Group();
    [[-.5, .35], [-.2, .1], [.25, .42], [.5, -.05], [0, -.35], [.4, -.42]].forEach(([x, y], i) => {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(.055 + (i % 3) * .012), mat('#FFF0B8', { emissive: '#F3B45C', emissiveIntensity: .7 }));
      put(s, x, y, .03); g.add(s);
    });
    return g;
  };

  B.d_lamp = function () {
    const g = new THREE.Group();
    const base = cyl(.11, .13, .045, '#D9B894'); put(base, 0, .022, 0); g.add(base);
    const stem = cyl(.02, .024, .3, '#F0D9BC'); put(stem, 0, .2, 0); g.add(stem);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(.21, .19, 22, 1, true), mat('#F1A98E', { side: THREE.DoubleSide }));
    put(shade, 0, .4, 0); g.add(shade);
    const bulb = sph(.055, '#FFF1C8', 1, 1, 1, { emissive: '#FFCF91', emissiveIntensity: 1 });
    put(bulb, 0, .36, 0); g.add(bulb);
    const light = new THREE.PointLight('#FFCF91', .0, 3.2);
    put(light, 0, .38, .1); g.add(light);
    g.userData.lampLight = light;
    return g;
  };

  B.d_pen = function () {
    const g = new THREE.Group();
    const cup = cyl(.085, .095, .2, '#F0BE72'); put(cup, 0, .1, 0); g.add(cup);
    [[-.03, -.15], [0, .12], [.03, .04]].forEach(([x, r], i) => {
      const p = cyl(.012, .012, .26, ['#E8947B', '#8FBFAC', '#F0BE72'][i]);
      put(p, x, .2, 0); p.rotation.z = r; g.add(p);
    });
    return g;
  };

  B.d_jar = function () {
    const g = new THREE.Group();
    const jar = cyl(.1, .1, .2, '#CFE7F3', 20, { transparent: true, opacity: .55, roughness: .15 });
    put(jar, 0, .1, 0); g.add(jar);
    const lid = cyl(.105, .105, .04, '#F3B45C'); put(lid, 0, .22, 0); g.add(lid);
    [[-.03, .1], [.03, .13], [0, .07]].forEach(([x, y]) => {
      const f = sph(.025, '#EFB27A', 1.5, .8, .6); put(f, x, y, 0); g.add(f);
    });
    return g;
  };

  B.d_cocoa = function () {
    const g = new THREE.Group();
    const mug = cyl(.095, .085, .18, '#FFF8EE', 20); put(mug, 0, .09, 0); g.add(mug);
    const top = cyl(.08, .08, .01, '#8B5E4A', 20); put(top, 0, .18, 0); g.add(top);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.055, .016, 8, 16), mat('#FFF8EE'));
    put(handle, .1, .1, 0); g.add(handle);
    return g;
  };

  B.d_mug = function () {
    const g = B.d_cocoa();
    const face = sph(.05, '#F3B69C', 1.2, .9, .25); put(face, 0, .11, .05); g.add(face);
    [-1, 1].forEach(s => {
      const eye = sph(.009, '#6E5748'); put(eye, s * .018, .12, .1); g.add(eye);
    });
    return g;
  };

  B.d_books = function () {
    const g = new THREE.Group();
    [[.34, .06, .24, '#8FBFAC', 0], [.31, .055, .22, '#E7B69C', .06], [.28, .05, .2, '#9EBFCE', .115]].forEach(([w, h, d, c, y], i) => {
      const b = box(w, h, d, c); put(b, (i - 1) * .015, y + h / 2, 0); b.rotation.y = (i - 1) * .04; g.add(b);
      const pages = box(w - .03, h, d - .02, '#FFFDF7'); put(pages, (i - 1) * .015, y + h / 2, .002); g.add(pages);
    });
    return g;
  };

  B.d_foodbox = function () {
    const g = new THREE.Group();
    const boxBody = box(.38, .16, .27, '#F3C58D'); put(boxBody, 0, .08, 0); g.add(boxBody);
    const lid = box(.4, .035, .29, '#E8947B'); put(lid, 0, .175, 0); g.add(lid);
    const dish = cyl(.11, .12, .025, '#FFF4E6', 20); put(dish, 0, .2, .02); g.add(dish);
    [-.035, .035, 0].forEach((x, i) => {
      const bite = sph(.025, i === 1 ? '#D97B5A' : '#EFB27A', 1.3, .65, .7);
      put(bite, x, .225, .02); g.add(bite);
    });
    const tag = box(.12, .055, .012, '#FFF8EE'); put(tag, 0, .085, .145); g.add(tag);
    return g;
  };

  B.fl_rug = function () {
    const g = new THREE.Group();
    const base = cyl(.92, .92, .04, '#EFBEA7', 40); put(base, 0, .02, 0); g.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .055, 8, 36), mat('#FFF4E6'));
    ring.rotation.x = Math.PI / 2; ring.position.y = .045; g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(.82, .022, 6, 40), mat('#FFF4E6'));
    ring2.rotation.x = Math.PI / 2; ring2.position.y = .045; g.add(ring2);
    return g;
  };

  B.fl_bed = function () {
    const g = new THREE.Group();
    const pts = [[-.32, .18, 0, .22], [-.14, .26, .02, .26], [.08, .27, 0, .27], [.3, .18, .02, .22], [0, .14, .18, .3]];
    pts.forEach(([x, y, z, r]) => {
      const s = sph(r, '#FFFAF1', 1.25, 1, 1);
      put(s, x, y, z); g.add(s);
    });
    const cushion = sph(.24, '#CFE7DA', 1.4, .5, 1); put(cushion, 0, .2, .12); g.add(cushion);
    return g;
  };

  B.fl_shelf = function () {
    const g = new THREE.Group();
    // open-front frame: two sides + back + top/bottom
    [-1, 1].forEach(s => {
      const side = box(.05, 1.5, .28, CL.desk); put(side, s * .43, .75, 0); g.add(side);
    });
    const back = box(.8, 1.44, .03, '#E3C39E'); put(back, 0, .75, -.12); g.add(back);
    const top = box(.9, .05, .28, CL.desk); put(top, 0, 1.47, 0); g.add(top);
    const bottom = box(.9, .05, .28, CL.desk); put(bottom, 0, .025, 0); g.add(bottom);
    [.3, .72, 1.14].forEach(y => {
      const sh = box(.82, .035, .24, '#E3C39E'); put(sh, 0, y, 0); g.add(sh);
    });
    const cols = ['#8FBFAC', '#E8947B', '#F0BE72', '#9EBFCE', '#E7B69C'];
    for (let i = 0; i < 9; i++) {
      const b = box(.08, .2 + (i % 3) * .04, .16, cols[i % cols.length]);
      const row = i < 4 ? .41 : i < 7 ? .83 : 1.25;
      put(b, -.3 + (i % 4) * .16, row, 0);
      g.add(b);
    }
    const pot = cyl(.07, .08, .1, '#D9A47E'); put(pot, .28, 1.2, .02); g.add(pot);
    const plant = sph(.1, '#8FBFAC', .7, 1.1, .7); put(plant, .28, 1.32, .02); g.add(plant);
    return g;
  };

  B.fl_cushion = function () {
    const g = new THREE.Group();
    const body = sph(.3, '#9EBFCE', 1.5, .62, .9); put(body, 0, .18, 0); g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.16, .24, 4), mat('#8FB2C4'));
    put(tail, -.46, .18, 0); tail.rotation.z = Math.PI / 2; g.add(tail);
    const eye = sph(.028, '#5B4A42'); put(eye, .22, .24, .2); g.add(eye);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(.09, .16, 3), mat('#BFD9E6')); put(fin, 0, .34, 0); g.add(fin);
    return g;
  };

  B.fl_pouf = function () {
    const g = new THREE.Group();
    const base = cyl(.33, .36, .32, '#E9C3A3', 28); put(base, 0, .16, 0); g.add(base);
    const top = sph(.33, '#F3D7BD', 1, .5, 1); put(top, 0, .33, 0); g.add(top);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.33, .035, 8, 28), mat('#FBEADB'));
    band.rotation.x = Math.PI / 2; band.position.y = .24; g.add(band);
    return g;
  };

  B.o_plant = function () {
    const g = new THREE.Group();
    const pot = cyl(.14, .17, .2, '#D9A47E'); put(pot, 0, .1, 0); g.add(pot);
    const rim = cyl(.17, .17, .03, '#E8BE9C'); put(rim, 0, .2, 0); g.add(rim);
    [[-.09, .32, -.3], [.05, .38, .2], [.12, .3, -.1], [-.04, .28, .5]].forEach(([x, y, r]) => {
      const leaf = sph(.12, '#8FBFAC', .55, 1.25, .55);
      put(leaf, x, y, 0); leaf.rotation.z = r; g.add(leaf);
    });
    return g;
  };

  B.o_maneki = function () {
    const g = new THREE.Group();
    const body = sph(.17, '#FFF8EC', 1, 1.15, .9); put(body, 0, .22, 0); g.add(body);
    const head = sph(.15, '#FFF8EC', 1, .95, .9); put(head, 0, .45, 0); g.add(head);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.055, .09, 3), mat('#FFF8EC'));
      put(ear, s * .09, .56, 0); g.add(ear);
    });
    const paw = sph(.06, '#FFF8EC'); put(paw, .16, .38, .06); g.add(paw);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.14, .025, 6, 18), mat('#F08A72'));
    collar.rotation.x = Math.PI / 2; collar.position.y = .32; g.add(collar);
    const bell = sph(.035, '#F3B45C'); put(bell, 0, .3, .15); g.add(bell);
    return g;
  };

  B.o_globe = function () {
    const g = new THREE.Group();
    const base = cyl(.12, .15, .05, '#C99B72'); put(base, 0, .025, 0); g.add(base);
    const arm = new THREE.Mesh(new THREE.TorusGeometry(.19, .014, 6, 24), mat('#C9A98A'));
    put(arm, 0, .25, 0); g.add(arm);
    const ball = sph(.17, '#7E93C9', 1, 1, 1, { emissive: '#3E4E7A', emissiveIntensity: .35 });
    put(ball, 0, .25, 0); g.add(ball);
    for (let i = 0; i < 10; i++) {
      const d = sph(.012, '#FFF1B8', 1, 1, 1, { emissive: '#F3B45C', emissiveIntensity: .9 });
      const a = i * 1.4, b = Math.sin(i * 2.1);
      put(d, Math.cos(a) * .17 * Math.cos(b), .25 + Math.sin(b) * .17, Math.sin(a) * .17 * Math.cos(b));
      g.add(d);
    }
    return g;
  };

  B.o_yarn = function () {
    const g = new THREE.Group();
    const ball = sph(.15, '#F3B69C'); put(ball, 0, .15, 0); g.add(ball);
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(.15, .012, 5, 20), mat('#E8947B'));
      put(t, 0, .15, 0); t.rotation.set(i * .7, i * 1.1, i * .5); g.add(t);
    }
    return g;
  };

  B.o_vase = function () {
    const g = new THREE.Group();
    const vase = cyl(.08, .11, .24, '#CFE7DA'); put(vase, 0, .12, 0); g.add(vase);
    const neck = cyl(.05, .07, .06, '#CFE7DA'); put(neck, 0, .26, 0); g.add(neck);
    [[-.09, .42, '#F3B69C'], [.06, .48, '#F5CE86'], [.12, .38, '#E8947B']].forEach(([x, y, c]) => {
      const st = cyl(.008, .008, .22, '#7FB39C', 6); put(st, x * .5, y - .1, 0); st.rotation.z = -x; g.add(st);
      const fl = sph(.045, c); put(fl, x, y, 0); g.add(fl);
      const core = sph(.018, '#FFF3D6'); put(core, x, y, .035); g.add(core);
    });
    return g;
  };

  B.o_fishbowl = function () {
    const g = new THREE.Group();
    const water = sph(.22, '#BFE0E8', 1, .8, .8, { transparent: true, opacity: .62, roughness: .15 });
    put(water, 0, .28, 0); g.add(water);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.225, .018, 8, 24), mat('#D9B894'));
    rim.rotation.x = Math.PI / 2; rim.position.y = .28; g.add(rim);
    const fish = sph(.065, '#F09A63', 1.5, .7, .6); put(fish, -.06, .29, .11); g.add(fish);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.045, .08, 3), mat('#E8836B'));
    tail.position.set(.045, .29, .11); tail.rotation.z = -Math.PI / 2; g.add(tail);
    const base = cyl(.16, .19, .05, '#C99B72', 20); put(base, 0, .025, 0); g.add(base);
    g.userData.fishbowl = fish;
    return g;
  };

  B.o_starprojector = function () {
    const g = new THREE.Group();
    const base = cyl(.15, .18, .08, '#6879B8', 20); put(base, 0, .04, 0); g.add(base);
    const dome = sph(.16, '#8EA5D8', 1, .72, 1, { transparent: true, opacity: .8, emissive: '#4D6098', emissiveIntensity: .4 });
    put(dome, 0, .18, 0); g.add(dome);
    [[-.08, .2, .035], [.05, .25, .025], [.1, .14, .02]].forEach(([x, y, r]) => {
      const star = sph(r, '#FFE7A8', 1, 1, 1, { emissive: '#F3B45C', emissiveIntensity: 1.1 });
      put(star, x, y, .14); g.add(star);
    });
    const light = new THREE.PointLight('#9CB7FF', .22, 1.3); light.position.set(0, .22, .1); g.add(light);
    g.userData.projectorLight = light;
    return g;
  };

  function fallback(slot) {
    const g = new THREE.Group();
    const c = slot === 'wall' ? '#E7D0B8' : '#E7B69C';
    g.add(box(.3, .3, .3, c));
    g.children[0].position.y = .15;
    return g;
  }

  /* ---------- GLB loading (cached, fallback to procedural) ---------- */
  const FURNITURE_GLB = { d_lamp: 'd_lamp', fl_bed: 'fl_bed', fl_rug: 'fl_rug', fl_shelf: 'fl_shelf', o_plant: 'o_plant' };
  const PROP_LAYOUT = {
    mailbox: { pos: [-1.88, 0, 0.92], rot: 0.4, pick: 'mail' },
    countdown_stand: { pos: [0.52, 0.84, -0.70], rot: -0.08, pick: 'countdown' },
    tank_corner: { pos: [1.72, 0, 1.02], rot: -0.3, pick: 'tank' }
  };
  let glbManifest = null;
  let sceneProps = {};

  function glbEntry(id) {
    return (glbManifest && glbManifest.models && glbManifest.models[id]) || null;
  }

  function glbPath(id) {
    const e = glbEntry(id);
    return (e && e.path) || ('assets/models/' + id + '.glb');
  }

  function applyGlbXform(root, id) {
    const e = glbEntry(id);
    const wrap = new THREE.Group();
    wrap.name = 'glb:' + id;
    if (e) {
      const sc = e.scale || [1, 1, 1];
      const o = e.offset || [0, 0, 0];
      root.scale.set(sc[0], sc[1], sc[2]);
      root.position.set(o[0], o[1], o[2]);
    }
    wrap.add(root);
    return wrap;
  }

  function loadGlbScene(id) {
    if (!PDM.glb || typeof PDM.glb.load !== 'function') return Promise.resolve(null);
    return PDM.glb.load(glbPath(id)).then(function (gltf) {
      return gltf && gltf.scene ? gltf.scene.clone(true) : null;
    }).catch(function () { return null; });
  }

  function prepareGlbVisual(visual, id) {
    visual.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (id && id.indexOf('cathouse') === 0) o.userData.house = true;
    });
    markFadeIn(visual);
    return visual;
  }

  function markFadeIn(root) {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    root.userData.fadeStart = t0;
    root.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        if (!m) return;
        m.userData = m.userData || {};
        if (m.userData._fadeFrom == null) {
          m.userData._fadeFrom = m.opacity == null ? 1 : m.opacity;
          m.userData._fadeWasT = !!m.transparent;
        }
        m.transparent = true;
        m.opacity = 0;
      });
    });
  }

  function tickGlbFades(nowMs) {
    function tick(root) {
      if (!root || !root.userData || !root.userData.fadeStart) return;
      const k = Math.min(1, (nowMs - root.userData.fadeStart) / 220);
      root.traverse(function (o) {
        if (!o.isMesh || !o.material) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function (m) {
          if (!m || !m.userData || m.userData._fadeFrom == null) return;
          m.opacity = m.userData._fadeFrom * k;
          if (k >= 1) {
            m.transparent = m.userData._fadeWasT || (m.userData._fadeFrom < 0.999);
            m.opacity = m.userData._fadeFrom;
            delete m.userData._fadeFrom;
            delete m.userData._fadeWasT;
          }
        });
      });
      if (k >= 1) delete root.userData.fadeStart;
    }
    Object.keys(items).forEach(function (id) { tick(items[id]); });
    tick(house);
    Object.keys(sceneProps).forEach(function (id) { tick(sceneProps[id]); });
  }

  function clearVisuals(group, keepLight) {
    group.children.slice().forEach(function (ch) {
      if (keepLight && ch.isLight) return;
      group.remove(ch);
    });
  }

  function buildHouseDetails() {
    const g = new THREE.Group();
    const awning = box(.66, .055, .24, '#E6B27C');
    awning.position.set(0, .68, .42);
    awning.rotation.x = -.12;
    g.add(awning);
    [-.27, .27].forEach(x => {
      const support = box(.025, .16, .025, '#B57D50');
      support.position.set(x, .59, .42);
      g.add(support);
    });
    const step = box(.38, .06, .18, '#D6A77A');
    step.position.set(0, .055, .5);
    g.add(step);
    const post = cyl(.055, .07, .28, '#B57D50', 12);
    post.position.set(.58, .14, .22);
    g.add(post);
    const cap = sph(.11, '#E8B46D', 1, .75, 1);
    cap.position.set(.58, .31, .22);
    g.add(cap);
    const yarn = sph(.075, '#E8836B', 1, 1, 1);
    yarn.position.set(.45, .08, .32);
    g.add(yarn);
    const mat = new THREE.MeshStandardMaterial({ color: '#F3D8C3', roughness: .95 });
    const matGeo = new THREE.CylinderGeometry(.18, .2, .025, 20);
    const matMesh = new THREE.Mesh(matGeo, mat);
    matMesh.position.set(-.05, .015, .42);
    g.add(matMesh);
    const pot = cyl(.07, .09, .1, '#C98D63', 12);
    pot.position.set(-.62, .05, .2);
    g.add(pot);
    const leaf = sph(.09, '#7FA27A', .55, 1.4, .65);
    leaf.position.set(-.62, .17, .2);
    g.add(leaf);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }

  function attachGlbTo(group, visual, id, extra) {
    const holder = applyGlbXform(visual, id);
    prepareGlbVisual(holder, id);
    const keepLight = extra && extra.keepLight;
    clearVisuals(group, keepLight);
    group.add(holder);
    group.userData.glb = true;
    group.userData.glbId = id;
    if (id === 'd_lamp' && !group.userData.lampLight) {
      const light = new THREE.PointLight('#FFCF91', 0, 3.2);
      light.position.set(0, 0.38, 0.1);
      group.add(light);
      group.userData.lampLight = light;
    }
    if (extra && extra.house) {
      holder.traverse(function (o) { if (o.isMesh) o.userData.house = true; });
      group.add(buildHouseDetails());
    }
    if (extra && extra.pick) group.userData[extra.pick] = true;
  }

  function tryAttachGlb(group, id, extra) {
    if (!group || group.userData.glb || group.userData.glbPending) return;
    if (!PDM.glb) return;
    group.userData.glbPending = true;
    loadGlbScene(id).then(function (visual) {
      group.userData.glbPending = false;
      if (!visual) return;
      if (group.parent == null && !(extra && extra.allowDetached)) return;
      attachGlbTo(group, visual, id, extra);
    });
  }

  function ensureManifest() {
    if (!PDM.glb || typeof PDM.glb.loadManifest !== 'function') return Promise.resolve(null);
    return PDM.glb.loadManifest().then(function (man) {
      glbManifest = man;
      return man;
    }).catch(function () { return null; });
  }

  function mountSceneProp(id) {
    if (!scene || sceneProps[id]) return sceneProps[id];
    const layout = PROP_LAYOUT[id];
    if (!layout) return null;
    const g = new THREE.Group();
    g.name = id;
    g.userData.id = id;
    g.userData.prop = true;
    if (layout.pick === 'mail') g.userData.pickMail = true;
    if (layout.pick === 'countdown') g.userData.pickCountdown = true;
    if (layout.pick === 'tank') g.userData.pickTank = true;
    g.position.set(layout.pos[0], layout.pos[1], layout.pos[2]);
    g.rotation.y = layout.rot;
    if (id === 'mailbox') {
      const post = cyl(.035, .04, .55, '#8C6239', 12); put(post, 0, .275, 0); g.add(post);
      const body = box(.28, .2, .18, '#F4E6CF'); put(body, 0, .66, 0); g.add(body);
    } else if (id === 'countdown_stand') {
      const board = box(.2, .16, .02, '#F7F0E1'); put(board, 0, .1, 0); g.add(board);
    } else if (id === 'tank_corner') {
      const tank = box(.56, .4, .34, '#BFE0E8', { transparent: true, opacity: .4 }); put(tank, 0, .36, 0); g.add(tank);
    }
    scene.add(g);
    sceneProps[id] = g;
    tryAttachGlb(g, id, { pick: layout.pick === 'mail' ? 'pickMail' : (layout.pick === 'countdown' ? 'pickCountdown' : 'pickTank') });
    return g;
  }

  function initSceneProps() {
    Object.keys(PROP_LAYOUT).forEach(mountSceneProp);
  }

  /* ---------- 2D billboard cat (AI sprite sheets) ---------- */
  const CAT_ART_KEYS = ['idle', 'blink', 'read', 'sleep', 'stretch', 'cheer', 'eat', 'play', 'side', 'back',
    'pj', 'academy', 'festival', 'pj_read', 'academy_read', 'festival_read'];
  const PROCEDURAL_OUTFITS = new Set(['raincoat', 'chef', 'wizard', 'sailor', 'matcha', 'dino', 'hoodie', 'cloak']);
  const CAT_ART_BASE = 'assets/cat/cat_';
  let catArt = {};          // key -> SpriteMaterial
  let catArtBox = {};       // key -> {top, cx, bottom}
  let catArtLoading = false;
  let catArtUsed = false;
  let catCurKey = '';
  let catMoveDir = 'front';
  let catFx = null, catFxCanvas = null, catFxCtx = null, catFxTex = null;
  let catFxLast = 0, catSwitchT = -9, blinkUntil = 0, nextBlink = 3;
  let catBaseMat = null;

  function preloadCatArt() {
    if (catArtLoading) return;
    catArtLoading = true;
    const loader = new THREE.TextureLoader();
    CAT_ART_KEYS.forEach(k => {
      loader.load(CAT_ART_BASE + k + '.png', tx => {
        if (THREE.SRGBColorSpace) tx.colorSpace = THREE.SRGBColorSpace;
        tx.anisotropy = 4;
        catArt[k] = new THREE.SpriteMaterial({ map: tx, transparent: true, alphaTest: .01, depthWrite: true });
        measureCatArt(k, tx.image);
        if (k === 'side') {
          const tx2 = tx.clone();
          tx2.needsUpdate = true;
          tx2.wrapS = THREE.RepeatWrapping;
          tx2.repeat.x = -1;
          tx2.offset.x = 1;
          catArt.side_l = new THREE.SpriteMaterial({ map: tx2, transparent: true, alphaTest: .01, depthWrite: true });
        }
      }, undefined, () => {});
    });
  }

  function measureCatArt(k, img) {
    try {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, 512, 512);
      const d = x.getImageData(0, 0, 512, 512).data;
      let top = 512, bottom = 0, sum = 0, n = 0;
      for (let y = 0; y < 512; y++) {
        for (let px = 0; px < 512; px++) {
          if (d[(y * 512 + px) * 4 + 3] > 40) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            sum += px; n++;
          }
        }
      }
      catArtBox[k] = n ? { top: top, bottom: bottom, cx: sum / n } : { top: 60, bottom: 505, cx: 256 };
    } catch (e) {
      catArtBox[k] = { top: 60, bottom: 505, cx: 256 };
    }
  }

  function catKeyFor(state, outfit) {
    const dress = (outfit === 'pj' || outfit === 'academy' || outfit === 'festival') ? outfit : '';
    // 穿衣服时不再切到没画服装的姿态，避免中途“衣服消失”
    if (dress) return state === 'read' ? dress + '_read' : dress;
    switch (state) {
      case 'read': return 'read';
      case 'sleep':
      case 'nap': return 'sleep';
      case 'stretch': return 'stretch';
      case 'cheer':
      case 'celebrate': return 'cheer';
      case 'eat': return 'eat';
      case 'play': return 'play';
      case 'pet': return 'blink';
      case 'wash':
      case 'doze': return 'idle';
      default: return 'idle';
    }
  }

  function buildCatShadow() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(110,80,56,.30)');
    g.addColorStop(.5, 'rgba(110,80,56,.16)');
    g.addColorStop(1, 'rgba(110,80,56,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, .68),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = .012;
    mesh.renderOrder = 1;
    return mesh;
  }

  function buildCatSprite() {
    preloadCatArt();
    catCanvas = document.createElement('canvas');
    catCanvas.width = 512;
    catCanvas.height = 512;
    catCtx = catCanvas.getContext('2d');
    catTex = new THREE.CanvasTexture(catCanvas);
    if (THREE.SRGBColorSpace) catTex.colorSpace = THREE.SRGBColorSpace;
    catTex.anisotropy = 4;
    catBaseMat = new THREE.SpriteMaterial({
      map: catTex,
      color: '#FFF8EE',
      transparent: true,
      alphaTest: .01,
      depthWrite: true
    });
    const sp = new THREE.Sprite(catBaseMat);
    sp.scale.set(1.22, 1.22, 1);
    sp.renderOrder = 2;
    sp.userData.isCat = true;

    // effects overlay (hearts / zzz / sparkles) drawn above the sprite
    catFxCanvas = document.createElement('canvas');
    catFxCanvas.width = 512;
    catFxCanvas.height = 512;
    catFxCtx = catFxCanvas.getContext('2d');
    catFxTex = new THREE.CanvasTexture(catFxCanvas);
    if (THREE.SRGBColorSpace) catFxTex.colorSpace = THREE.SRGBColorSpace;
    const fm = new THREE.SpriteMaterial({ map: catFxTex, transparent: true, depthWrite: false, depthTest: false, alphaTest: .01 });
    catFx = new THREE.Sprite(fm);
    catFx.scale.set(1.22, 1.22, 1);
    catFx.renderOrder = 8;
    catFx.userData.isCat = true;
    return sp;
  }

  function heartPath(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * .58);
    ctx.bezierCurveTo(-s * .95, -s * .25, -s * .42, -s * 1.05, 0, -s * .48);
    ctx.bezierCurveTo(s * .42, -s * 1.05, s * .95, -s * .25, 0, s * .58);
    ctx.closePath();
  }

  function drawCatFx(state, t, access) {
    if (!catFxCtx) return;
    const box = catArtBox[catCurKey] || { top: 60, bottom: 505, cx: 256 };
    const ctx = catFxCtx;
    ctx.clearRect(0, 0, 512, 512);
    if (state === 'pet') {
      for (let i = 0; i < 3; i++) {
        const ph = (t * .5 + i * .34) % 1;
        const a = Math.sin(ph * Math.PI);
        if (a < .03) continue;
        const x = 256 + (i - 1) * 58 + Math.sin(t * 2 + i) * 6;
        const y = 50 - ph * 18;
        ctx.save();
        ctx.globalAlpha = a * .95;
        ctx.translate(x, y);
        const s = 30 + a * 9;
        heartPath(ctx, s);
        ctx.fillStyle = i % 2 ? '#F07E6D' : '#F5A79B';
        ctx.fill();
        ctx.restore();
      }
    } else if (state === 'sleep' || state === 'doze') {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      for (let i = 0; i < 3; i++) {
        const ph = (t * .42 + i * .33) % 1;
        const alpha = .62 * (1 - ph) * Math.min(1, ph * 4);
        const size = 34 + i * 10;
        ctx.globalAlpha = alpha;
        ctx.font = '700 ' + size + 'px "PingFang SC", "HarmonyOS Sans SC", sans-serif';
        ctx.strokeStyle = 'rgba(255,250,240,.9)';
        const px = 262 + i * 18 + Math.sin(ph * 3) * 5;
        const py = box.top + 26 - ph * 52 - i * 8;
        ctx.strokeText('z', px, py);
        ctx.fillStyle = 'rgba(96,74,58,.85)';
        ctx.fillText('z', px, py);
      }
      ctx.restore();
    } else if (state === 'cheer' || state === 'celebrate') {
      const cols = ['#F5A38A', '#F3C36B', '#8FC3AE', '#9DB9D8', '#F5D9B8'];
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4;
        const ph = (t * .8 + i * .17) % 1;
        const x = box.cx + Math.cos(a) * (46 + i * 4.4) + Math.sin(t + i) * 5;
        const y = box.top + 30 - ph * 74 + Math.sin(a) * 14;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 2 + i);
        ctx.globalAlpha = .9 * (1 - ph * .8);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(-3, -2, 6, 4);
        ctx.restore();
      }
    } else if (state === 'play') {
      for (let i = 0; i < 4; i++) {
        const tw = .55 + Math.sin(t * 3.2 + i * 1.7) * .45;
        const x = box.cx + [-66, 60, 52, -58][i];
        const y = box.top + [24, 12, 62, 54][i] + Math.sin(t * 2 + i) * 3;
        const r = [9, 8, 6, 5][i] * (.7 + tw * .5);
        ctx.save();
        ctx.globalAlpha = tw * .95;
        ctx.fillStyle = i % 2 ? '#F6C877' : '#F8A78E';
        ctx.beginPath();
        for (let p = 0; p < 4; p++) {
          const ang = p * Math.PI / 2;
          ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
          ctx.lineTo(x + Math.cos(ang + Math.PI / 4) * r * .32, y + Math.sin(ang + Math.PI / 4) * r * .32);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    // 配饰独立挂件层：精灵图姿态照常切换，只把配饰叠上去
    if (access && (access.head || access.neck)) {
      // 睡觉时整只猫趴低，配饰跟着往下挪，避免飘在半空
      const ay = state === 'sleep' ? 560 : 496;
      PDM.art.drawAccessoryLayer(ctx, 256, ay, 3.45, access);
    }
    catFxTex.needsUpdate = true;
  }

  function paintCat(state, outfit, t, access) {
    if (!catCtx || !cat) return;
    if (PROCEDURAL_OUTFITS.has(outfit)) {
      if (cat.material !== catBaseMat) cat.material = catBaseMat;
      if (t - lastCatDraw >= .055) {
        lastCatDraw = t;
        catCtx.clearRect(0, 0, 512, 512);
        PDM.art.drawCat(catCtx, 256, 496, 3.45, { state: state, outfit: outfit, t: t, access: access });
        catTex.needsUpdate = true;
      }
      drawCatFx(state, t, null);
      return;
    }
    let key = catKeyFor(state, outfit);
    const dress = outfit === 'pj' || outfit === 'academy' || outfit === 'festival';
    if (!dress && catMoveDir !== 'front' && (key === 'idle' || key === 'read')) {
      key = catMoveDir === 'back' ? 'back' : 'side';
      if (key === 'side' && catFacing < 0) key = 'side_l';
    }
    if (key !== catCurKey) {
      catCurKey = key;
      catSwitchT = t;
    }
    // occasional blink on the base sitting poses
    if (t > nextBlink) {
      blinkUntil = t + .13;
      nextBlink = t + 3 + Math.random() * 3.4;
    }
    const blinkNow = (key === 'idle' || key === 'read') && t < blinkUntil && !!catArt.blink;
    const useKey = blinkNow ? 'blink' : key;

    if (catArt[useKey]) {
      if (cat.material !== catArt[useKey]) cat.material = catArt[useKey];
      catArtUsed = true;
    }
    if (!catArtUsed) {
      // fallback: hand-drawn cat until sprite sheets finish loading
      if (t - lastCatDraw < .055) return;
      lastCatDraw = t;
      catCtx.clearRect(0, 0, 512, 512);
      PDM.art.drawCat(catCtx, 256, 496, 3.45, { state: state, outfit: outfit || 'default', t: t, access: access });
      catTex.needsUpdate = true;
      return;
    }
    if (t - catFxLast < .04) return;
    catFxLast = t;
    drawCatFx(state, t, access);
  }

  /* ---------- cat house & snap marker ---------- */
  function buildYarnToy() {
    const g = new THREE.Group();
    const ball = sph(.08, '#F0A69C'); ball.position.y = .08; g.add(ball);
    [[.35, .3], [-.3, -.4]].forEach(([rx, ry]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.082, .008, 6, 18), mat('#E07F6F'));
      ring.position.y = .08;
      ring.rotation.set(rx, ry, .2);
      g.add(ring);
    });
    const string = new THREE.Mesh(new THREE.TorusGeometry(.13, .006, 5, 20, Math.PI * 1.2), mat('#E07F6F'));
    string.position.set(.06, .02, 0);
    string.rotation.x = Math.PI / 2;
    g.add(string);
    g.position.set(.4, 0, .58);
    g.traverse(o => { if (o.isMesh) o.userData.pickToy = true; });
    return g;
  }

  function buildSnack() {
    const g = new THREE.Group();
    const body = sph(.07, '#EFA35E', 1.6, .7, .6); body.position.y = .07; g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 3), mat('#E9924D'));
    tail.position.set(-.11, .07, 0);
    tail.rotation.z = -Math.PI / 2;
    g.add(tail);
    const eye = sph(.012, '#4C382E'); eye.position.set(.05, .1, .03); g.add(eye);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.09, .12, 24),
      new THREE.MeshBasicMaterial({ color: '#F6C877', transparent: true, opacity: .5, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .005; g.add(ring);
    return g;
  }

  function buildCatHouse(tier) {
    tier = Math.max(0, Math.min(2, Number(tier) || 0));
    const g = new THREE.Group();
    const card = '#C58A5B', cardDark = '#8F5C3B', cardLight = '#E7B37A';
    const platform = box(1.04, .08, .98, '#A9704A'); platform.position.set(0, .04, .02); g.add(platform);
    const body = box(.84, .66, .76, card); body.position.y = .35; g.add(body);
    // 原木立柱和横梁，让猫屋有明确的建筑结构，不再像散落的低模零件。
    [-.39, .39].forEach(x => {
      const post = box(.055, .68, .08, cardDark); post.position.set(x, .35, .39); g.add(post);
    });
    const beam = box(.9, .065, .08, cardDark); beam.position.set(0, .67, .39); g.add(beam);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(.2, 28), new THREE.MeshBasicMaterial({ color: '#4A3322' }));
    inner.position.set(0, .33, .386); g.add(inner);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .026, 8, 26), mat(cardDark));
    ring.position.set(0, .33, .39); g.add(ring);
    const welcome = box(.3, .12, .025, '#F5D9B5'); welcome.position.set(0, .86, .37); g.add(welcome);
    const welcomeDot = sph(.025, '#D9795F'); welcomeDot.position.set(-.07, .86, .39); g.add(welcomeDot);
    const welcomeDot2 = sph(.025, '#D9A34F'); welcomeDot2.position.set(.07, .86, .39); g.add(welcomeDot2);
    // side windows so any orientation still reads as a cat house
    [[.426, Math.PI / 2], [-.426, -Math.PI / 2]].forEach(([x, ry]) => {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(.125, 24), new THREE.MeshBasicMaterial({ color: '#4A3322' }));
      hole.position.set(x, .38, 0); hole.rotation.y = ry; g.add(hole);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.125, .02, 8, 24), mat(cardDark));
      rim.position.set(x, .38, 0); rim.rotation.y = ry; g.add(rim);
      const paw = new THREE.Mesh(new THREE.CircleGeometry(.05, 16), new THREE.MeshBasicMaterial({ color: '#E8C49A' }));
      paw.position.set(x + (x > 0 ? .004 : -.004), .38, 0); paw.rotation.y = ry; g.add(paw);
    });
    // roof flaps
    const r1 = box(.5, .05, .82, cardLight); r1.position.set(-.24, .7, 0); r1.rotation.z = .34; g.add(r1);
    const r2 = box(.5, .05, .82, cardDark); r2.position.set(.24, .7, 0); r2.rotation.z = -.34; g.add(r2);
    const ridge = box(.06, .06, .86, '#7B4E35'); ridge.position.set(0, .88, 0); ridge.rotation.z = 0; g.add(ridge);
    // cushion
    const cushion = box(.44, .06, .34, '#F2C9B4'); cushion.position.set(0, .03, .1); g.add(cushion);
    // sleepy eyes inside
    [-.07, .07].forEach(x => {
      const e = box(.05, .012, .01, '#FFF3DC'); e.position.set(x, .33, .398); g.add(e);
    });
    // tiny fish sign (放在屋顶前檐，避开二档阁楼正面)
    const post = box(.02, .14, .02, '#8C6239'); post.position.set(.3, .78, .3); g.add(post);
    const fish = sph(.06, '#E8836B', 1.4, .6, .4); fish.position.set(.3, .86, .3); g.add(fish);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.045, .07, 3), mat('#E8836B'));
    tail.position.set(.37, .86, .3); tail.rotation.z = -Math.PI / 2; g.add(tail);
    // 门廊台阶与侧面抓柱，增加猫咪真正会生活的细节。
    const step2 = box(.52, .06, .18, '#D9A06B'); step2.position.set(0, .11, .54); g.add(step2);
    const scratch = cyl(.055, .07, .34, '#B47B51', 12); scratch.position.set(.56, .2, .2); g.add(scratch);
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(.061, .008, 6, 18), mat('#F0C18B'));
      stripe.rotation.x = Math.PI / 2; stripe.position.set(.56, .1 + i * .09, .2); g.add(stripe);
    }

    if (tier >= 1) {
      // 原木双层：加一层小阁楼（下沿压住主屋顶，避免悬空）
      const loft = box(.58, .34, .52, card); loft.position.set(0, .92, 0); g.add(loft);
      const loftHole = new THREE.Mesh(new THREE.CircleGeometry(.12, 22), new THREE.MeshBasicMaterial({ color: '#4A3322' }));
      loftHole.position.set(0, .92, .266); g.add(loftHole);
      const loftRim = new THREE.Mesh(new THREE.TorusGeometry(.12, .018, 8, 22), mat(cardDark));
      loftRim.position.set(0, .92, .268); g.add(loftRim);
      const r3 = box(.38, .05, .6, cardLight); r3.position.set(-.17, 1.12, 0); r3.rotation.z = .34; g.add(r3);
      const r4 = box(.38, .05, .6, cardDark); r4.position.set(.17, 1.12, 0); r4.rotation.z = -.34; g.add(r4);
    }
    if (tier >= 2) {
      // 阳光花房：侧面玻璃房 + 猫草（贴住主体，且不遮挡侧面猫洞）
      const glassMat = new THREE.MeshBasicMaterial({ color: '#CFE8E2', transparent: true, opacity: .34 });
      const glass = new THREE.Mesh(new THREE.BoxGeometry(.34, .24, .36), glassMat);
      glass.position.set(.6, .12, .06); g.add(glass);
      const frame = box(.36, .03, .38, '#B99066'); frame.position.set(.6, .24, .06); g.add(frame);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(.06, .05, .09, 12), mat('#C98D63'));
      pot.position.set(.6, .045, .06); g.add(pot);
      [[-.05, .02], [.04, -.03], [0, .06]].forEach(([dx, dz]) => {
        const leaf = sph(.045, '#7FA27A'); leaf.position.set(.6 + dx, .1, .06 + dz); g.add(leaf);
      });
    }

    g.position.set(-1.68, 0, -1.02);
    g.rotation.y = .34;
    g.traverse(o => { if (o.isMesh) { o.userData.house = true; o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }

  function buildSnapMarker() {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.15, .2, 32),
      new THREE.MeshBasicMaterial({ color: '#E8836B', transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })
    );
    g.add(ring);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(.14, 32),
      new THREE.MeshBasicMaterial({ color: '#FFE1CB', transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false })
    );
    disc.position.z = -.001; g.add(disc);
    g.visible = false;
    g.renderOrder = 6;
    scene.add(g);
    return g;
  }

  /* ---------- scene ---------- */
  let renderer = null, scene = null, camera = null, canvasEl = null, wrapEl = null;
  let W = 0, H = 0;
  let items = {};
  let cat = null;
  let lampLight = null;
  let lights = null;
  let skyMesh = null;
  let currentTod = '';
  let available = false, active = false;
  const VIEW_H = 5.35;
  const CAM_R = 9.0, CAM_H = 4.95;
  const AZ_DEFAULT = .6435;
  let baseTarget = new THREE.Vector3(-.06, .84, -.48);
  let camTarget = baseTarget.clone();
  let camGoal = baseTarget.clone();
  let camZoom = 1.06, camZoomGoal = 1.06;
  let camHGoal = CAM_H;
  let blueprint = false;
  let camAz = AZ_DEFAULT, camAzGoal = AZ_DEFAULT;
  let orbit = null;
  let houseRot = .34;
  let houseTier = 0;
  let house = null, houseFocus = false;
  let catCanvas = null, catCtx = null, catTex = null, lastCatDraw = 0;
  let catShadow = null;
  let catX = -.62, catZ = .7, catTarget = null, catCb = null, catFacing = 1;
  let catLastT = 0, catHop = 0, nextWander = 0, catLastState = '';
  let bowlObj = null, toyObj = null, snackObj = null, toySpinUntil = 0;
  let shadeMat = null, glowMat = null, snapRing = null, dustMotes = null;
  let decorGrid = null, decorating = false;
  let finger = null;
  let ptr = { x: 0, y: 0 }, ptrS = { x: 0, y: 0 };
  let raycaster = null;
  let drag = null;
  let lastId = null;

  function buildDustMotes() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(34 * 3);
    for (let i = 0; i < 34; i++) {
      pos[i * 3] = .35 + ((i * 37) % 120) / 100;
      pos[i * 3 + 1] = .35 + ((i * 53) % 210) / 100;
      pos[i * 3 + 2] = -.82 + ((i * 29) % 150) / 100;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: '#FFE7B8', size: .025, transparent: true, opacity: .42, depthWrite: false });
    dustMotes = new THREE.Points(geo, m);
    dustMotes.renderOrder = 5;
    return dustMotes;
  }

  function buildDecorGrid() {
    const g = new THREE.Group();
    const floorGrid = new THREE.GridHelper(3.9, 13, '#C89778', '#E8CDB9');
    floorGrid.position.set(0, .012, .16);
    floorGrid.material.transparent = true;
    floorGrid.material.opacity = .42;
    floorGrid.material.depthWrite = false;
    g.add(floorGrid);
    // 桌面单独给一层小网格，拖动桌面摆件时更容易对齐。
    const deskGrid = new THREE.GridHelper(1.42, 7, '#C89778', '#E8CDB9');
    deskGrid.position.set(1.16, ROOM.deskY + .006, - .94);
    deskGrid.scale.set(1, 1, .4);
    deskGrid.material = deskGrid.material.clone();
    deskGrid.material.transparent = true;
    deskGrid.material.opacity = .34;
    deskGrid.material.depthWrite = false;
    g.add(deskGrid);
    g.visible = false;
    return g;
  }

  function buildRoom() {
    const g = new THREE.Group();

    // floor
    const floorTex = tex(256, 256, (c, w, h) => {
      c.fillStyle = CL.floor; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(190,150,112,.3)'; c.lineWidth = 2;
      for (let y = 16; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = 'rgba(190,150,112,.18)';
      for (let i = 0; i < 20; i++) { const x = (i * 71) % w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(2, 2);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .95 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    g.add(floor);
    const slab = box(ROOM.w + .16, .16, ROOM.d + .16, '#777970');
    slab.position.set(0, -.1, .03);
    slab.receiveShadow = true;
    g.add(slab);

    // baked-looking contact AO along the walls
    const aoTex = tex(256, 256, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(92, 62, 40, .32)');
      gr.addColorStop(.28, 'rgba(92, 62, 40, .12)');
      gr.addColorStop(.62, 'rgba(92, 62, 40, 0)');
      gr.addColorStop(1, 'rgba(92, 62, 40, 0)');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
    });
    const ao = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.w, ROOM.d),
      new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.set(0, .004, 0);
    g.add(ao);

    // warm window light patch on the floor
    const glowTex = tex(256, 256, (c, w, h) => {
      const gr = c.createRadialGradient(w * .55, h * .2, 6, w * .55, h * .25, w * .7);
      gr.addColorStop(0, 'rgba(255, 226, 178, .85)');
      gr.addColorStop(.5, 'rgba(255, 216, 160, .35)');
      gr.addColorStop(1, 'rgba(255, 210, 150, 0)');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
    });
    glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.5), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(1.15, .006, -.35);
    g.add(glow);

    // back wall around window
    const wz = ROOM.backZ;
    const winX0 = 0.55, winX1 = 1.75, winY0 = 0.95, winY1 = 2.32;
    const wallTexV = tex(8, 160, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#FFF8ED');
      gr.addColorStop(.55, '#F3DFCA');
      gr.addColorStop(.86, '#E9CDB0');
      gr.addColorStop(1, '#D9B28D');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
    });
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexV, roughness: .95 });
    function wallSeg(x, y, w, h) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .1), wallMat);
      b.position.set(x, y, wz - .03);
      b.receiveShadow = true;
      b.castShadow = true;
      g.add(b);
    }
    // left of window
    wallSeg((-2.2 + winX0) / 2, ROOM.h / 2, winX0 + 2.2, ROOM.h);
    // right of window
    wallSeg((winX1 + 2.2) / 2, ROOM.h / 2, 2.2 - winX1, ROOM.h);
    // below window
    wallSeg((winX0 + winX1) / 2, winY0 / 2, winX1 - winX0, winY0);
    // above window
    wallSeg((winX0 + winX1) / 2, (winY1 + ROOM.h) / 2, winX1 - winX0, ROOM.h - winY1);

    // left wall
    const lw = new THREE.Mesh(new THREE.BoxGeometry(.1, ROOM.h, ROOM.d), wallMat);
    lw.position.set(ROOM.leftX - .03, ROOM.h / 2, 0);
    lw.receiveShadow = true;
    lw.castShadow = true;
    g.add(lw);

    // wallpaper stripes on the open part of the back wall
    const wallTex = tex(160, 160, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#FFF9F1');
      gr.addColorStop(.6, '#F5E5D5');
      gr.addColorStop(1, '#E4C8AB');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255, 251, 241, .7)';
      for (let x = 0; x < w; x += 40) c.fillRect(x, 0, 14, h);
      c.fillStyle = 'rgba(197, 137, 98, .18)';
      for (let x = 26; x < w; x += 40) c.fillRect(x, 0, 2, h);
    });
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(2, 1);
    const wp = new THREE.Mesh(new THREE.PlaneGeometry(2.62, ROOM.h - .1), new THREE.MeshStandardMaterial({ map: wallTex, roughness: .95 }));
    wp.position.set(-0.86, (ROOM.h - .1) / 2, wz + .045);
    wp.receiveShadow = true;
    g.add(wp);

    // baseboards
    const bb1 = box(ROOM.w, .12, .06, CL.base); bb1.position.set(0, .06, wz + .01); g.add(bb1);
    const bb2 = box(.06, .12, ROOM.d, CL.base); bb2.position.set(ROOM.leftX + .01, .06, 0); g.add(bb2);

    // window frame + sky
    const skyT = skyTexture({ night: false });
    skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(winX1 - winX0, winY1 - winY0), new THREE.MeshBasicMaterial({ map: skyT }));
    skyMesh.position.set((winX0 + winX1) / 2, (winY0 + winY1) / 2, wz - .12);
    g.add(skyMesh);

    const fw = .05;
    const frameParts = [
      [ (winX0 + winX1) / 2, winY0, winX1 - winX0 + fw, fw ],
      [ (winX0 + winX1) / 2, winY1, winX1 - winX0 + fw, fw ],
      [ winX0, (winY0 + winY1) / 2, fw, winY1 - winY0 + fw ],
      [ winX1, (winY0 + winY1) / 2, fw, winY1 - winY0 + fw ]
    ];
    frameParts.forEach(([x, y, w, h]) => {
      const f = box(w, h, .1, '#FFF9F0');
      f.position.set(x, y, wz + .02);
      g.add(f);
    });
    // mullions
    const mx = box(.04, winY1 - winY0, .06, '#FFF9F0'); mx.position.set((winX0 + winX1) / 2, (winY0 + winY1) / 2, wz + .03); g.add(mx);
    const my = box(winX1 - winX0, .04, .06, '#FFF9F0'); my.position.set((winX0 + winX1) / 2, (winY0 + winY1) / 2, wz + .03); g.add(my);
    // sill
    const sill = box(winX1 - winX0 + .2, .07, .18, '#F6E3CB'); sill.position.set((winX0 + winX1) / 2, winY0 - .04, wz + .08); g.add(sill);

    // 生活化墙面：一幅小喵海报、木质挂板和暖色串灯，把空间从空房间变成小屋。
    const artFrame = box(.62, .62, .045, '#B77B55'); artFrame.position.set(-1.25, 1.82, wz + .04); g.add(artFrame);
    const artPaper = box(.52, .52, .018, '#FFF4E4'); artPaper.position.set(-1.25, 1.82, wz + .075); g.add(artPaper);
    const artDot = sph(.13, '#E9A07F', 1.15, .8, .28); artDot.position.set(-1.25, 1.88, wz + .095); g.add(artDot);
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.045, .08, 3), mat('#D8836E'));
      ear.position.set(-1.25 + s * .09, 2.02, wz + .095); ear.rotation.z = s * -.2; g.add(ear);
    });
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.9, 2.42, wz + .08), new THREE.Vector3(-1.1, 2.27, wz + .08), new THREE.Vector3(-.35, 2.42, wz + .08)
    ]), 18, .012, 5, false), mat('#C99065'));
    g.add(cable);
    [-1.62, -1.05, -.48].forEach((x, i) => {
      const bulb = sph(.045, i === 1 ? '#FFD38B' : '#F4B79D', 1, 1, 1, { emissive: i === 1 ? '#FFB45E' : '#E98D78', emissiveIntensity: .8 });
      bulb.position.set(x, 2.31 + Math.abs(x + 1.05) * .07, wz + .095); g.add(bulb);
    });

    // 中央软地毯与小边几，给猫咪留出明确的活动中心。
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .025, 48), mat('#E7B39B'));
    rug.scale.set(1.45, 1, .78); rug.position.set(-.22, .018, .55); g.add(rug);
    const rugInner = new THREE.Mesh(new THREE.TorusGeometry(.45, .018, 8, 40), mat('#F4D4BF'));
    rugInner.scale.set(1.45, 1, .78); rugInner.rotation.x = Math.PI / 2; rugInner.position.set(-.22, .035, .55); g.add(rugInner);
    const sideTable = new THREE.Group();
    const sideTop = cyl(.27, .25, .06, '#D9A06B', 20); sideTop.position.y = .52; sideTable.add(sideTop);
    const sideLeg = cyl(.045, .055, .5, '#9D6A46', 12); sideLeg.position.y = .27; sideTable.add(sideLeg);
    const sideBase = cyl(.2, .2, .035, '#A9754E', 16); sideBase.position.y = .035; sideTable.add(sideBase);
    sideTable.position.set(-.9, 0, .28); g.add(sideTable);

    // desk
    const desk = new THREE.Group();
    const top = box(1.66, .08, .72, CL.deskTop); top.position.y = ROOM.deskY - .04; desk.add(top);
    [[-.72, -.27], [.72, -.27], [-.72, .27], [.72, .27]].forEach(([x, z]) => {
      const leg = box(.08, ROOM.deskY - .08, .08, '#D3A87E');
      leg.position.set(x, (ROOM.deskY - .08) / 2, z);
      desk.add(leg);
    });
    const shelf = box(1.5, .05, .5, '#E0BC95'); shelf.position.set(0, .3, -.06); desk.add(shelf);
    const deskBooks = box(.24, .3, .2, '#9EBFCE'); deskBooks.position.set(-.45, .48, -.1); desk.add(deskBooks);
    const deskBooks2 = box(.2, .22, .18, '#E7B69C'); deskBooks2.position.set(-.2, .44, -.1); desk.add(deskBooks2);
    desk.position.set(1.12, 0, -.95);
    g.add(desk);

    // simple study chair: gives the desk a clear purpose and anchors the room composition
    const chair = new THREE.Group();
    const seat = box(.62, .09, .55, '#9C8B76'); seat.position.set(0, .43, 0); chair.add(seat);
    const back = box(.58, .58, .07, '#7B7568'); back.position.set(0, .72, -.22); chair.add(back);
    [[-.23, -.19], [.23, -.19], [-.23, .19], [.23, .19]].forEach(([x, z]) => {
      const leg = box(.055, .43, .055, '#655D52'); leg.position.set(x, .21, z); chair.add(leg);
    });
    chair.position.set(1.12, 0, -.05);
    g.add(chair);

    // ambient food bowl
    const bowl = new THREE.Group();
    const b1 = cyl(.16, .13, .07, '#F2C9B4', 20); b1.position.y = .035; bowl.add(b1);
    const b2 = cyl(.12, .12, .015, '#FFF4E6', 20); b2.position.y = .07; bowl.add(b2);
    const food = sph(.05, '#EFB27A', 1, .55, 1); food.position.y = .08; bowl.add(food);
    bowl.position.set(-0.05, 0, .55);
    bowl.traverse(o => { if (o.isMesh) o.userData.pickBowl = true; });
    bowlObj = bowl;
    g.add(bowl);

    // yarn toy, clickable
    toyObj = buildYarnToy();
    g.add(toyObj);

    dustMotes = buildDustMotes();
    g.add(dustMotes);
    decorGrid = buildDecorGrid();
    g.add(decorGrid);

    // cat (AI sprite billboard, Paper-Mario style)
    cat = buildCatSprite();
    cat.position.set(-0.62, 0.605, 0.7);
    g.add(cat);
    if (catFx) { catFx.position.copy(cat.position); g.add(catFx); }
    catShadow = buildCatShadow();
    catShadow.position.set(-0.62, .012, 0.7);
    g.add(catShadow);

    return g;
  }

  function buildCat() {
    const g = new THREE.Group();
    const cream = '#FFF2D8';
    const white = '#FFFCF4';
    const dark = '#43362F';

    // body + haunches
    const body = sph(.3, cream, 1, .96, .9); put(body, 0, .34, 0); outline(body); g.add(body);
    [-1, 1].forEach(s => {
      const h = sph(.16, cream, .85, .95, .95); put(h, s * .2, .22, -.04); outline(h); g.add(h);
    });
    const belly = sph(.21, white, 1.05, .92, .5); put(belly, 0, .28, .21); g.add(belly);

    // head
    const head = new THREE.Group();
    const headBall = sph(.33, cream, 1.04, .98, .95); outline(headBall); head.add(headBall);
    [-1, 1].forEach(s => {
      const cheek = sph(.12, cream, 1.05, .85, .7); put(cheek, s * .24, -.08, .08); outline(cheek); head.add(cheek);
      // ears with pink inner
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.13, .19, 4), mat(cream));
      put(ear, s * .2, .26, -.01); ear.rotation.z = s * -.3; ear.rotation.y = s * .2; outline(ear); head.add(ear);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(.065, .11, 4), mat('#F4B3A4'));
      put(inner, s * .2, .255, .045); inner.rotation.z = s * -.3; inner.rotation.y = s * .2; head.add(inner);
    });

    // eyes with highlights
    const eyes = [];
    [-1, 1].forEach(s => {
      const eye = sph(.062, dark, 1, 1.1, .7); put(eye, s * .125, .035, .275); head.add(eye); eyes.push(eye);
      const hi = sph(.022, '#FFFFFF'); put(hi, s * .105, .07, .318); head.add(hi);
      const hi2 = sph(.011, '#FFFFFF'); put(hi2, s * .148, .015, .318); head.add(hi2);
    });

    // muzzle, nose, mouth, blush
    const muzzle = sph(.1, white, 1.7, .95, .45); put(muzzle, 0, -.085, .25); head.add(muzzle);
    const nose = sph(.03, '#E58C82', 1.25, .9, .6); put(nose, 0, -.028, .318); head.add(nose);
    const mouthMat = mat('#A8705F');
    [-1, 1].forEach(s => {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(s * .002, -.06, .32),
        new THREE.Vector3(s * .032, -.115, .325),
        new THREE.Vector3(s * .058, -.07, .31)
      );
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .0065, 4, false), mouthMat);
      head.add(m);
    });
    [-1, 1].forEach(s => {
      const bl = sph(.055, '#F7B5A6', 1, .55, .22, { transparent: true, opacity: .8 });
      put(bl, s * .215, -.055, .21); head.add(bl);
    });

    head.position.set(0, .8, .01);
    g.add(head);

    // arms + paws
    [-1, 1].forEach(s => {
      const arm = sph(.08, cream, .9, 1.15, .9); put(arm, s * .25, .3, .14); outline(arm); g.add(arm);
      const paw = sph(.075, white, 1.15, .85, 1.1); put(paw, s * .25, .2, .22); outline(paw); g.add(paw);
    });
    // feet with toe beans
    [-1, 1].forEach(s => {
      const foot = sph(.125, white, 1.2, .7, 1.35); put(foot, s * .17, .055, .2); outline(foot); g.add(foot);
      for (let k = -1; k <= 1; k++) {
        const bean = sph(.014, '#F2A697'); put(bean, s * .17 + k * .038, .085, .315); g.add(bean);
      }
    });

    // whiskers
    const whiskerMat = mat('#D9B79C', { transparent: true, opacity: .85 });
    [-1, 1].forEach(s => {
      [-.055, .005, .06].forEach((yy, i) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .2, 4), whiskerMat);
        put(w, s * .31, -.03 + yy, .3);
        w.rotation.z = s * Math.PI / 2;
        w.rotation.y = s * (.18 + i * .08);
        head.add(w);
      });
    });

    // tail
    const tailPivot = new THREE.Group();
    const tailPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(.22, .03, -.14), new THREE.Vector3(.36, .16, -.24), new THREE.Vector3(.43, .27, -.22)];
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tailPts), 22, .05, 6, false), mat(cream));
    outline(tube);
    tailPivot.add(tube);
    const tip = sph(.055, '#FFF8EC'); put(tip, .43, .27, -.22); outline(tip); tailPivot.add(tip);
    tailPivot.position.set(-.19, .16, -.22);
    g.add(tailPivot);

    // collar + bell
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.21, .03, 8, 24), mat(CL.coral));
    collar.rotation.x = Math.PI / 2; collar.position.y = .6; g.add(collar);
    const bell = sph(.05, '#F3B45C'); put(bell, 0, .56, .23); g.add(bell);
    const bellDot = sph(.012, '#A8705F'); put(bellDot, 0, .56, .278); g.add(bellDot);

    // accessories
    const bow = new THREE.Group();
    [-1, 1].forEach(s => {
      const wing = sph(.07, '#D9503F', 1.5, .85, .5); put(wing, s * .08, 0, 0); bow.add(wing);
    });
    const knot = sph(.042, '#B33D31'); bow.add(knot);
    bow.position.set(0, .59, .23); bow.visible = false; g.add(bow);
    const hat = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(.19, .3, 18), mat('#CFE3F2'));
    put(cone, 0, .25, 0); hat.add(cone);
    const pom = sph(.065, '#FFFDF6'); put(pom, 0, .43, 0); hat.add(pom);
    hat.position.set(0, 1.03, 0); hat.visible = false; g.add(hat);
    const scarf = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.23, .05, 8, 20), mat('#D9503F'));
    ring.rotation.x = Math.PI / 2; scarf.add(ring);
    const tailS = box(.1, .24, .04, '#D9503F'); put(tailS, .17, -.17, .14); tailS.rotation.z = -.25; scarf.add(tailS);
    scarf.position.set(0, .59, 0); scarf.visible = false; g.add(scarf);

    g.userData = { body: body, belly: belly, head: head, tail: tailPivot, collar: collar, bell: bell, bow: bow, hat: hat, scarf: scarf, eyes: eyes, baseY: 0 };
    return g;
  }

  function applyOutfit(id) {
    if (!cat) return;
    const u = cat.userData;
    u.bow.visible = false;
    u.hat.visible = false;
    u.scarf.visible = false;
    u.collar.visible = true;
    u.body.material.color.set('#FFF2D8');
    if (id === 'pj') {
      u.body.material.color.set('#DCEBF7');
      u.hat.visible = true;
      u.collar.visible = false;
    } else if (id === 'academy') {
      u.body.material.color.set('#F3E3CD');
      u.bow.visible = true;
      u.collar.visible = false;
    } else if (id === 'festival') {
      u.scarf.visible = true;
      u.collar.visible = false;
    }
  }

  function buildLights() {
    const hemi = new THREE.HemisphereLight('#FFF6E4', '#C9AE92', .58);
    scene.add(hemi);
    const amb = new THREE.AmbientLight('#FFF6E8', .2);
    scene.add(amb);
    const dir = new THREE.DirectionalLight('#FFF1D6', 1.0);
    dir.position.set(2.4, 5.2, 4.2);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -3.5;
    dir.shadow.camera.right = 3.5;
    dir.shadow.camera.top = 4;
    dir.shadow.camera.bottom = -1;
    dir.shadow.camera.near = .5;
    dir.shadow.camera.far = 14;
    dir.shadow.bias = -0.0008;
    dir.shadow.radius = 2.5;
    scene.add(dir);
    const fill = new THREE.DirectionalLight('#BFDFEF', .18);
    fill.position.set(-3, 2.5, 3);
    scene.add(fill);
    // soft warm light spilling in from the window
    const win = new THREE.DirectionalLight('#FFD9A6', .42);
    win.position.set(1.15, 2.5, -2.2);
    win.target.position.set(-.3, .1, 1.2);
    scene.add(win);
    scene.add(win.target);
    lights = { hemi: hemi, amb: amb, dir: dir, fill: fill, win: win };
  }

  function applyTod(env) {
    if (!lights) return;
    const key = env.night ? 'night' : env.dusk ? 'dusk' : env.morning ? 'morning' : 'day';
    if (key === currentTod) return;
    currentTod = key;
    lights.hemi.intensity = env.night ? .34 : env.dusk ? .52 : .58;
    lights.amb.intensity = env.night ? .16 : .2;
    lights.dir.intensity = env.night ? .2 : env.dusk ? .85 : env.morning ? .9 : 1.0;
    lights.dir.color.set(env.night ? '#A9BEEA' : env.dusk ? '#FFB98A' : env.morning ? '#FFE9C9' : '#FFF1D6');
    lights.fill.intensity = env.night ? .08 : .18;
    lights.win.intensity = env.night ? .06 : env.dusk ? .55 : env.morning ? .3 : .42;
    lights.win.color.set(env.night ? '#9FB6E8' : env.dusk ? '#FFB07A' : '#FFD9A6');
    if (glowMat) glowMat.opacity = env.night ? .08 : env.dusk ? .38 : .46;
    scene.background = new THREE.Color(env.night ? '#3E4549' : env.dusk ? '#EBD0B6' : '#F4E9DA');
    if (skyMesh) {
      skyMesh.material.map.dispose();
      skyMesh.material.map = skyTexture(env);
      skyMesh.material.needsUpdate = true;
    }
  }

  function init(canvas, wrap) {
    if (!THREE || renderer) return available;
    canvasEl = canvas; wrapEl = wrap;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    } catch (e) {
      available = false;
      return false;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#F4E9DA');
    camera = new THREE.OrthographicCamera(-VIEW_H / 2, VIEW_H / 2, VIEW_H / 2, -VIEW_H / 2, .1, 60);
    try {
      const a = parseFloat(localStorage.getItem('pdm.camAz'));
      if (!isNaN(a)) camAz = camAzGoal = a;
      // 猫屋朝向优先读主存档，旧版本再回退到独立 localStorage
      const st = PDM.core && PDM.core.state ? PDM.core.state() : null;
      const savedRot = st && st.catHouse ? Number(st.catHouse.rot) : NaN;
      if (Number.isFinite(savedRot)) {
        houseRot = savedRot;
      } else {
        const h = parseFloat(localStorage.getItem('pdm.catHouseRot'));
        if (!isNaN(h)) houseRot = h;
      }
    } catch (err) {}
    camera.position.set(
      baseTarget.x + Math.sin(camAz) * CAM_R,
      baseTarget.y + CAM_H,
      baseTarget.z + Math.cos(camAz) * CAM_R
    );
    camera.lookAt(baseTarget);
    raycaster = new THREE.Raycaster();

    scene.add(buildRoom());
    houseTier = (PDM.core && PDM.core.state && PDM.core.state().catHouse) ? PDM.core.state().catHouse.tier : 0;
    house = buildCatHouse(houseTier);
    house.rotation.y = houseRot;
    scene.add(house);
    ensureManifest().then(function () {
      if (USE_GLB_HOUSE) tryAttachGlb(house, 'cathouse_t' + houseTier, { house: true });
      initSceneProps();
    });
    snapRing = buildSnapMarker();
    buildLights();
    applyTod(PDM.room.tod());

    active = true;
    available = true;
    return true;
  }

  function resize(w, h) {
    if (!renderer || !w || !h) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = -VIEW_H * aspect / 2;
    camera.right = VIEW_H * aspect / 2;
    camera.top = VIEW_H / 2;
    camera.bottom = -VIEW_H / 2;
    camera.updateProjectionMatrix();
  }

  function setActive(on) {
    active = !!on;
    if (canvasEl) canvasEl.style.display = active ? 'block' : 'none';
  }

  function focusCatHouse() {
    if (!house) return;
    houseFocus = true;
    camGoal.set(house.position.x + .18, .52, house.position.z + .38);
    camZoomGoal = 1.85;
  }

  function resetCamera() {
    houseFocus = false;
    blueprint = false;
    camGoal.copy(baseTarget);
    camZoomGoal = 1.06;
    camHGoal = CAM_H;
    camAzGoal = AZ_DEFAULT;
    try { localStorage.setItem('pdm.camAz', String(AZ_DEFAULT)); } catch (e) {}
  }

  function isFocused() {
    return houseFocus;
  }

  function toggleBlueprint() {
    blueprint = !blueprint;
    houseFocus = false;
    camGoal.copy(baseTarget);
    camHGoal = blueprint ? 7.2 : CAM_H;
    camZoomGoal = blueprint ? 1.18 : 1.06;
    return blueprint;
  }

  function setCatHouseTier(tier) {
    houseTier = Math.max(0, Math.min(2, Number(tier) || 0));
    if (!scene) return houseTier;
    if (house) scene.remove(house);
    house = buildCatHouse(houseTier);
    house.rotation.y = houseRot;
    scene.add(house);
    if (USE_GLB_HOUSE) tryAttachGlb(house, 'cathouse_t' + houseTier, { house: true });
    return houseTier;
  }

  function beginOrbit(clientX, clientY) {
    orbit = { x: clientX, y: clientY, az: camAzGoal };
    return orbit;
  }

  function moveOrbit(clientX, clientY) {
    if (!orbit) return;
    camAzGoal = orbit.az - (clientX - orbit.x) * .0036;
  }

  function endOrbit() {
    if (!orbit) return;
    orbit = null;
    try { localStorage.setItem('pdm.camAz', String(camAzGoal)); } catch (e) {}
  }

  function isOrbiting() {
    return !!orbit;
  }

  function zoomBy(delta) {
    camZoomGoal = Math.max(.85, Math.min(1.75, camZoomGoal - delta * .0009));
  }

  function rotateHouse() {
    houseRot += Math.PI / 2;
    if (house) house.rotation.y = houseRot;
    // 朝向写入主存档，换机/导存档不丢
    try {
      if (PDM.core && PDM.core.state) {
        const st = PDM.core.state();
        if (st.catHouse) { st.catHouse.rot = houseRot; PDM.core.save(); }
      }
    } catch (e) {}
    try { localStorage.setItem('pdm.catHouseRot', String(houseRot)); } catch (e) {}
    return houseRot;
  }

  // 小猫屋门口的位置（随猫屋朝向变化）
  function catHouseSpot() {
    const r = 0.62;
    return { x: -1.68 + Math.sin(houseRot) * r, z: -1.02 + Math.cos(houseRot) * r };
  }

  function rotateRoom(step) {
    camAzGoal += Number(step) || Math.PI / 2;
    try { localStorage.setItem('pdm.camAz', String(camAzGoal)); } catch (e) {}
    return camAzGoal;
  }

  function pickCatHouse(clientX, clientY) {
    if (!renderer || !camera || !house) return null;
    const ray = pointerRay(clientX, clientY);
    const hits = ray.intersectObject(house, true);
    return hits.length ? hits[0] : null;
  }

  function pickCat(clientX, clientY) {
    if (!renderer || !camera || !cat) return null;
    const ray = pointerRay(clientX, clientY);
    const hits = ray.intersectObject(cat, false);
    return hits.length ? hits[0] : null;
  }

  function pickProp(clientX, clientY) {
    if (!renderer || !camera) return null;
    const objs = [];
    if (bowlObj) objs.push(bowlObj);
    if (toyObj) objs.push(toyObj);
    Object.keys(sceneProps).forEach(function (id) { if (sceneProps[id]) objs.push(sceneProps[id]); });
    if (!objs.length) return null;
    const ray = pointerRay(clientX, clientY);
    const hits = ray.intersectObjects(objs, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !(o.userData.pickBowl || o.userData.pickToy || o.userData.pickMail || o.userData.pickCountdown || o.userData.pickTank)) {
      o = o.parent;
    }
    if (!o) return null;
    if (o.userData.pickBowl) return 'bowl';
    if (o.userData.pickToy) return 'toy';
    if (o.userData.pickMail) return 'mail';
    if (o.userData.pickCountdown) return 'countdown';
    if (o.userData.pickTank) return 'tank';
    return null;
  }

  function moveCatTo(x, z, cb) {
    catTarget = { x: x, z: z };
    catCb = cb || null;
    nextWander = 1e9;
  }

  function stopCat() {
    catTarget = null;
    catCb = null;
  }

  function catSpot() {
    return { x: catX, z: catZ };
  }

  function itemPos(id) {
    const L = (core.state().layout || {})[id];
    const item = core.itemById(id);
    if (!L || !item || typeof L.x !== 'number' || typeof L.y !== 'number') return null;
    const p = normToWorld(item.slot, L.x, L.y);
    return { x: p.x, z: p.z };
  }

  function feedSnack(x, z) {
    clearSnack();
    snackObj = buildSnack();
    snackObj.position.set(x, 0, z);
    scene.add(snackObj);
  }

  function clearSnack() {
    if (!snackObj) return;
    scene.remove(snackObj);
    snackObj.traverse(o => {
      if (o.isMesh) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      }
    });
    snackObj = null;
  }

  function playToy() {
    toySpinUntil = performance.now() / 1000 + 2.6;
  }

  function syncItems() {
    const st = core.state();
    const layout = st.layout || {};
    const want = {};
    Object.keys(layout).forEach(id => { if (core.isOwned(id)) want[id] = 1; });
    Object.keys(st.equipped || {}).forEach(s => {
      const id = st.equipped[s];
      if (id && core.isOwned(id)) want[id] = 1;
    });
    Object.keys(want).forEach(id => {
      let L = st.layout[id];
      if (!L || typeof L.x !== 'number' || typeof L.y !== 'number') {
        const spot = PDM.room.defaultSpot(id);
        core.ensurePlacement(id, spot.x, spot.y, spot.k);
        L = st.layout[id];
      }
      const item = core.itemById(id);
      if (!item || !L) return;
      let g = items[id];
      if (!g) {
        g = (B[id] || fallback)(item.slot);
        g.userData.id = id;
        g.userData.slot = item.slot;
        scene.add(g);
        items[id] = g;
        if (FURNITURE_GLB[id]) tryAttachGlb(g, FURNITURE_GLB[id]);
      }
      const p = normToWorld(item.slot, L.x, L.y);
      g.position.set(p.x, p.y, p.z);
      const rot = (L.rot || 0) * Math.PI / 180;
      if (item.slot === 'floor' || item.slot === 'ornament') {
        g.rotation.y = -0.16 + rot;
        g.rotation.z = 0;
      } else if (item.slot === 'desk') {
        g.rotation.y = -0.08 + rot;
        g.rotation.z = 0;
      } else {
        g.rotation.y = 0;
        g.rotation.z = -rot;
      }
      g.visible = true;
    });
    Object.keys(items).forEach(id => {
      if (!want[id]) items[id].visible = false;
    });
    // lamp light
    lampLight = null;
    const lamp = items['d_lamp'];
    if (lamp && lamp.visible) lampLight = lamp.userData.lampLight || null;
  }

  const CAT_SPOTS = [[-.62, .7], [-.2, .88], [.32, .58], [-1.02, .32], [.12, .2], [-.4, .22]];

  function updateCat(t, opts) {
    if (!cat) return;
    const state = opts.catState || 'idle';
    const dt = catLastT ? Math.min(.12, Math.max(0, t - catLastT)) : 0;
    catLastT = t;
    if (!nextWander) nextWander = t + 7;

    // where should the cat be?
    if (state === 'read') {
      const hx = .25, hz = .02;
      if (!catTarget && Math.hypot(catX - hx, catZ - hz) > .06) catTarget = { x: hx, z: hz };
    } else if (state === 'idle' && !catTarget && t > nextWander) {
      const spot = CAT_SPOTS[Math.floor(Math.random() * CAT_SPOTS.length)];
      catTarget = { x: spot[0], z: spot[1] };
      nextWander = t + 10;
    }

    let moving = false;
    if (catTarget) {
      const dx = catTarget.x - catX;
      const dz = catTarget.z - catZ;
      const dist = Math.hypot(dx, dz);
      if (dist < .035) {
        catX = catTarget.x;
        catZ = catTarget.z;
        catTarget = null;
        catMoveDir = 'front';
        const cb = catCb;
        catCb = null;
        if (cb) cb();
        nextWander = t + 7;
      } else {
        const step = Math.min(dist, .78 * dt);
        catX += dx / dist * step;
        catZ += dz / dist * step;
        if (Math.abs(dx) > .01) catFacing = dx > 0 ? 1 : -1;
        const nz = dz / dist;
        catMoveDir = nz < -.55 ? 'back' : (Math.abs(dx) / dist > .45 ? 'side' : 'front');
        catHop += step * 24;
        moving = true;
        nextWander = t + 10;
      }
    }

    const hop = moving ? Math.abs(Math.sin(catHop)) * .035 : 0;
    const breathe = moving ? 0 : Math.sin(t * 1.6) * .006;
    // short squash-and-stretch to soften pose swaps
    const sw = Math.max(0, 1 - (t - catSwitchT) / .24);
    const pop = sw > 0 ? Math.sin(sw * Math.PI) : 0;
    let sx = 1 - pop * .07, sy = 1 + pop * .09;
    let lift = 0;
    if (state === 'stretch') {
      const k = (Math.sin(t * 1.4 - 1.57) + 1) / 2;
      sy *= 1 + k * .1;
      sx *= 1 - k * .05;
    } else if (state === 'cheer' || state === 'celebrate') {
      lift = Math.abs(Math.sin(t * 3.2)) * .05;
    }
    cat.position.set(catX, .605 + hop + breathe + lift, catZ);
    cat.scale.set(1.22 * sx, 1.22 * sy, 1);
    cat.material.rotation = moving ? Math.sin(t * 9) * .035 : 0;
    if (catFx) {
      catFx.position.set(catX, .605 + hop + breathe + lift, catZ + .01);
      catFx.scale.set(1.22 * sx, 1.22 * sy, 1);
    }
    if (catShadow) {
      catShadow.position.set(catX, .012, catZ);
      const shr = 1 - (hop + lift) * 4;
      catShadow.scale.set(shr, shr, 1);
      catShadow.material.opacity = .95 - (hop + lift) * 6;
    }

    if (state !== catLastState) {
      catLastState = state;
      lastCatDraw = 0;
    }
    paintCat(state, opts.outfit || 'default', t, opts.access);
  }

  function render(t, opts) {
    if (!renderer || !scene || !camera) return;
    if (typeof tickGlbFades === 'function') tickGlbFades((typeof performance !== 'undefined' && performance.now) ? performance.now() : t * 1000);
    if (!W || !H) {
      const r = wrapEl.getBoundingClientRect();
      if (r.width > 20 && r.height > 20) resize(r.width, r.height);
    }
    let env = PDM.room.tod();
    // 雨夜窗台主题固定成夜晚光线，避免白天大太阳叠着雨
    if (PDM.core && PDM.core.state().roomTheme === 'rainy') {
      env = { key: 'night', label: '雨夜', night: true, dusk: false };
    }
    applyTod(env);
    syncItems();
    Object.values(items).forEach(g => {
      if (!g.visible) return;
      if (g.userData && g.userData.fishbowl) {
        g.userData.fishbowl.position.x = Math.sin(t * 1.8) * .07 - .06;
        g.userData.fishbowl.rotation.y = Math.sin(t * 1.8) * .18;
      }
      if (g.userData && g.userData.projectorLight) {
        g.userData.projectorLight.intensity = .16 + Math.abs(Math.sin(t * 1.5)) * .18;
      }
    });
    updateCat(t, opts || {});
    if (snackObj) snackObj.position.y = .01 + Math.abs(Math.sin(t * 3)) * .03;
    if (toyObj) {
      if (t < toySpinUntil) toyObj.rotation.y += .32;
      else toyObj.rotation.y *= .9;
    }
    if (dustMotes) dustMotes.rotation.y = Math.sin(t * .18) * .035;
    if (!houseFocus && !blueprint) camZoomGoal = opts && opts.focus ? 1.12 : 1.06;
    if (lampLight) {
      lampLight.intensity = env.night ? 1.35 : (opts && opts.focus ? .85 : .35);
    }
    // isometric camera with gentle parallax + focus tween
    ptrS.x += (ptr.x - ptrS.x) * .05;
    ptrS.y += (ptr.y - ptrS.y) * .05;
    camTarget.lerp(camGoal, .12);
    camZoom += (camZoomGoal - camZoom) * .1;
    camAz += (camAzGoal - camAz) * .12;
    const ox = Math.sin(camAz) * CAM_R;
    const oz = Math.cos(camAz) * CAM_R;
    const panX = (camAz - AZ_DEFAULT) * .55;
    camera.position.set(
      camTarget.x + ox + panX + ptrS.x * .22,
      camTarget.y + camHGoal - ptrS.y * .14,
      camTarget.z + oz + ptrS.x * .1
    );
    camera.lookAt(camTarget.x + panX + ptrS.x * .14, camTarget.y - ptrS.y * .1, camTarget.z);
    if (Math.abs(camera.zoom - camZoom) > .0005) {
      camera.zoom = camZoom;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  }

  /* ---------- picking & drag ---------- */
  function pointerRay(clientX, clientY) {
    const rect = canvasEl.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
    return raycaster;
  }

  function findRoot(obj) {
    let o = obj;
    while (o) {
      if (o.userData && o.userData.id) return o;
      o = o.parent;
    }
    return null;
  }

  function pick(clientX, clientY) {
    if (!renderer || !camera) return null;
    const ray = pointerRay(clientX, clientY);
    const roots = Object.keys(items).map(k => items[k]).filter(g => g && g.visible);
    const hits = ray.intersectObjects(roots, true);
    for (let i = 0; i < hits.length; i++) {
      const root = findRoot(hits[i].object);
      if (root && root.visible) {
        return { id: root.userData.id, slot: root.userData.slot, point: hits[i].point };
      }
    }
    // 没直接点中模型时，按屏幕距离找最近的物品，手指粗也能拖到
    const rect = canvasEl.getBoundingClientRect();
    const px = clientX - rect.left, py = clientY - rect.top;
    let best = null, bestD = 58 * 58;
    const v = new THREE.Vector3();
    const box = new THREE.Box3();
    roots.forEach(root => {
      box.setFromObject(root);
      if (box.isEmpty()) return;
      box.getCenter(v);
      v.project(camera);
      if (v.z > 1) return;
      const sx = (v.x * .5 + .5) * rect.width;
      const sy = (-v.y * .5 + .5) * rect.height;
      const d = (sx - px) * (sx - px) + (sy - py) * (sy - py);
      if (d < bestD) { bestD = d; best = root; }
    });
    return best ? { id: best.userData.id, slot: best.userData.slot, point: null } : null;
  }

  function planeFor(slot) {
    if (slot === 'wall' || slot === 'window') return { plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -MAP.wall.z), normalAxis: 'z' };
    if (slot === 'desk') return { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -ROOM.deskY), normalAxis: 'y' };
    return { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), normalAxis: 'y' };
  }

  function snap(v, step) {
    return Math.round(v / step) * step;
  }

  function showMarker(slot, x, y, z) {
    if (!snapRing) return;
    snapRing.visible = true;
    if (slot === 'wall' || slot === 'window') {
      snapRing.position.set(x, y, MAP.wall.z + .07);
      snapRing.rotation.set(0, 0, 0);
    } else if (slot === 'desk') {
      snapRing.position.set(x, ROOM.deskY + .008, z);
      snapRing.rotation.set(-Math.PI / 2, 0, 0);
    } else {
      snapRing.position.set(x, .008, z);
      snapRing.rotation.set(-Math.PI / 2, 0, 0);
    }
  }

  function avoidOverlap(id, slot, n) {
    const layout = core.state().layout || {};
    const occupied = Object.keys(layout).filter(otherId => {
      if (otherId === id) return false;
      const other = core.itemById(otherId);
      return other && other.slot === slot && core.isOwned(otherId);
    }).map(otherId => layout[otherId]);
    if (!occupied.length) return n;
    const minDist = slot === 'desk' ? .13 : (slot === 'wall' || slot === 'window' ? .11 : .12);
    let x = n.x, y = n.y;
    for (let i = 0; i < 18; i++) {
      if (!occupied.some(p => Math.hypot((p.x || 0) - x, (p.y || 0) - y) < minDist)) {
        return { x: x, y: y };
      }
      const a = i * 2.39996;
      const r = minDist * (.7 + Math.floor(i / 3) * .55);
      x = Math.max(.05, Math.min(.95, n.x + Math.cos(a) * r));
      y = Math.max(.05, Math.min(.95, n.y + Math.sin(a) * r));
    }
    return { x: Math.max(.05, Math.min(.95, x)), y: Math.max(.05, Math.min(.95, y)) };
  }

  function fadeItem(g, on) {
    if (!drag) return;
    if (on) {
      drag.faded = [];
      g.traverse(o => {
        if (o.isMesh && o.material && !Array.isArray(o.material)) {
          const orig = o.material;
          const c = orig.clone();
          c.transparent = true;
          c.opacity = Math.min(orig.opacity == null ? 1 : orig.opacity, .5);
          c.depthWrite = false;
          o.userData._origMat = orig;
          o.material = c;
          drag.faded.push(o);
        }
      });
    } else if (drag.faded) {
      drag.faded.forEach(o => {
        const c = o.material;
        o.material = o.userData._origMat;
        if (c && c !== o.userData._origMat) c.dispose();
      });
      drag.faded = null;
    }
  }

  function beginDrag(clientX, clientY) {
    const hit = pick(clientX, clientY);
    if (!hit) return null;
    const ray = pointerRay(clientX, clientY);
    const pf = planeFor(hit.slot);
    const pt = new THREE.Vector3();
    if (!ray.ray.intersectPlane(pf.plane, pt)) return null;
    const g = items[hit.id];
    drag = {
      id: hit.id,
      slot: hit.slot,
      offset: new THREE.Vector3(g.position.x - pt.x, 0, g.position.z - pt.z)
    };
    if (hit.slot === 'wall' || hit.slot === 'window') {
      drag.offset = new THREE.Vector3(g.position.x - pt.x, g.position.y - pt.y, 0);
    }
    lastId = hit.id;
    fadeItem(g, true);
    return drag;
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return;
    const ray = pointerRay(clientX, clientY);
    const pf = planeFor(drag.slot);
    const pt = new THREE.Vector3();
    if (!ray.ray.intersectPlane(pf.plane, pt)) return;
    let n, wx, wy, wz;
    if (drag.slot === 'wall' || drag.slot === 'window') {
      wx = snap(pt.x + drag.offset.x, .2);
      wy = snap(pt.y + drag.offset.y, .2);
      n = worldToNorm(drag.slot, { x: wx, y: wy });
      showMarker(drag.slot, wx, wy, 0);
    } else {
      const step = drag.slot === 'desk' ? .15 : .2;
      wx = snap(pt.x + drag.offset.x, step);
      wz = snap(pt.z + drag.offset.z, step);
      wy = drag.slot === 'desk' ? ROOM.deskY : 0;
      n = worldToNorm(drag.slot, { x: wx, z: wz });
      showMarker(drag.slot, wx, wy, wz);
    }
    n.x = Math.max(.04, Math.min(.96, n.x));
    n.y = Math.max(.04, Math.min(.96, n.y));
    const safe = avoidOverlap(drag.id, drag.slot, n);
    n.x = safe.x;
    n.y = safe.y;
    core.setPlacement(drag.id, n.x, n.y, null, { save: false });
  }

  function endDrag() {
    if (!drag) return;
    if (snapRing) snapRing.visible = false;
    const g = items[drag.id];
    if (g) fadeItem(g, false);
    drag = null;
    core.save();
  }

  function setDecorating(on) {
    decorating = !!on;
    if (decorGrid) decorGrid.visible = decorating;
    if (!decorating && snapRing) snapRing.visible = false;
  }

  function setPointer(clientX, clientY) {
    ptr.x = (clientX / window.innerWidth) * 2 - 1;
    ptr.y = (clientY / window.innerHeight) * 2 - 1;
  }

  PDM.room3d = {
    init: init,
    resize: resize,
    render: render,
    setActive: setActive,
    isActive: () => active && available,
    isAvailable: () => available,
    pick: pick,
    beginDrag: beginDrag,
    moveDrag: moveDrag,
    endDrag: endDrag,
    setDecorating: setDecorating,
    dragging: () => !!drag,
    selected: () => lastId,
    pickCatHouse: pickCatHouse,
    pickCat: pickCat,
    pickProp: pickProp,
    moveCatTo: moveCatTo,
    itemPos: itemPos,
    stopCat: stopCat,
    catSpot: catSpot,
    feedSnack: feedSnack,
    clearSnack: clearSnack,
    playToy: playToy,
    focusCatHouse: focusCatHouse,
    resetCamera: resetCamera,
    isFocused: isFocused,
    toggleBlueprint: toggleBlueprint,
    isBlueprint: () => blueprint,
    beginOrbit: beginOrbit,
    moveOrbit: moveOrbit,
    endOrbit: endOrbit,
    isOrbiting: isOrbiting,
    zoomBy: zoomBy,
    rotateHouse: rotateHouse,
    rotateRoom: rotateRoom,
    cameraInfo: () => ({ az: camAzGoal, zoom: camZoomGoal, focused: houseFocus }),
    setCatHouseTier: setCatHouseTier,
    catHouseSpot: catHouseSpot,
    setPointer: setPointer,
    items: () => items
  };
})(window.PDM);

