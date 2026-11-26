/* 陪读小喵 · 抖音小游戏入口（骨架）
   当前目标：让 3D 小屋 + 小猫在抖音小游戏环境里跑起来。
   说明：H5 版的计时器、商店、图鉴、刷题等界面全部依赖 DOM + CSS，
   小游戏没有 DOM，这批界面需要后续改成 canvas UI 或独立页面，
   因此这里只挂载渲染层，不加载 ui.js / app.js / quiz.js / fishing.js。 */
const env = require('./adapter/tt-env.js');

const THREE = require('./engine/vendor/three.min.js');
GameGlobal.THREE = THREE;
env.patchThree(THREE);

require('./engine/core.js');
require('./engine/art.js');
require('./engine/furniture.js');
require('./engine/furniture2.js');
require('./engine/furniture3.js');
require('./engine/room.js');
require('./engine/room3d.js');

const PDM = GameGlobal.PDM;
const sys = tt.getSystemInfoSync();
const dpr = Math.min(2, sys.pixelRatio || 1);
const W = sys.windowWidth;
const H = sys.windowHeight;

const canvas = tt.createCanvas();
canvas.width = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
canvas.style = canvas.style || {};
canvas.getBoundingClientRect = function () {
  return { left: 0, top: 0, width: W, height: H, right: W, bottom: H };
};

const wrap = {
  style: {},
  classList: { add: function () {}, remove: function () {}, toggle: function () {} },
  addEventListener: function () {},
  getBoundingClientRect: canvas.getBoundingClientRect
};

let use3d = false;
try {
  use3d = !!(PDM.room3d && PDM.room3d.init(canvas, wrap));
} catch (e) {
  console.error('[pdm] 3D 初始化失败，回退 2D 小屋', e);
}

let ctx2d = null;
if (use3d) {
  PDM.room3d.resize(W, H);
} else {
  ctx2d = canvas.getContext('2d');
  if (ctx2d) ctx2d.scale(dpr, dpr);
}

/* 先跑一个自动循环，验证渲染链路；后续接入计时逻辑时替换 catState 来源 */
const CAT_STATES = ['idle', 'read', 'stretch', 'cheer'];
let last = 0;

function frame(ts) {
  requestAnimationFrame(frame);
  if (ts - last < 33) return;
  last = ts;
  const t = ts / 1000;
  const catState = CAT_STATES[Math.floor(t / 6) % CAT_STATES.length];
  const outfit = 'default';
  const level = 1;
  if (use3d) {
    PDM.room3d.render(t, { t: t, catState: catState, outfit: outfit, equipped: {}, level: level });
  } else if (ctx2d) {
    ctx2d.clearRect(0, 0, W, H);
    PDM.room.drawRoom(ctx2d, W, H, { t: t, catState: catState, outfit: outfit, equipped: {}, level: level });
  }
}

requestAnimationFrame(frame);
console.log('[pdm] 小游戏骨架启动完成，3D=' + use3d);
