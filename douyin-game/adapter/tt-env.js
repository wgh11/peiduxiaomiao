/* 抖音小游戏运行环境适配层
   把 H5 版本依赖的浏览器 API 映射到 tt 小游戏能力：
   - window / document / localStorage / Image / location
   - three.js 的图片加载（TextureLoader）改走 tt.createImage
   只实现引擎真实调用到的最小接口，DOM 元素都是空壳，不做布局。 */
(function () {
  'use strict';

  const g = GameGlobal;
  const sys = tt.getSystemInfoSync();

  g.window = g;
  g.self = g;
  g.location = g.location || { search: '', href: '' };
  g.devicePixelRatio = sys.pixelRatio || 1;
  g.innerWidth = sys.windowWidth;
  g.innerHeight = sys.windowHeight;
  if (!g.performance) g.performance = { now: function () { return Date.now(); } };
  if (!g.requestAnimationFrame) {
    g.requestAnimationFrame = function (cb) {
      return setTimeout(function () { cb(Date.now()); }, 16);
    };
  }

  function noop() {}

  function rect() {
    return { left: 0, top: 0, width: g.innerWidth, height: g.innerHeight, right: g.innerWidth, bottom: g.innerHeight };
  }

  function makeElement(tag) {
    const el = {
      tagName: String(tag || 'div').toUpperCase(),
      id: '',
      style: {},
      dataset: {},
      innerHTML: '',
      textContent: '',
      value: '',
      children: [],
      parentNode: null,
      classList: {
        add: noop,
        remove: noop,
        toggle: noop,
        contains: function () { return false; }
      },
      appendChild: function (c) { el.children.push(c); return c; },
      removeChild: noop,
      insertBefore: noop,
      addEventListener: noop,
      removeEventListener: noop,
      setAttribute: noop,
      getAttribute: function () { return null; },
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      focus: noop,
      blur: noop,
      getContext: function () { return null; },
      getBoundingClientRect: rect
    };
    return el;
  }

  const cache = {};
  g.document = {
    readyState: 'complete',
    body: makeElement('body'),
    documentElement: makeElement('html'),
    createElement: function (tag) {
      const t = String(tag).toLowerCase();
      if (t === 'canvas') return tt.createCanvas();
      if (t === 'img') return tt.createImage();
      return makeElement(t);
    },
    createElementNS: function (ns, tag) {
      return g.document.createElement(tag);
    },
    getElementById: function (id) {
      if (!cache[id]) {
        cache[id] = makeElement('div');
        cache[id].id = id;
      }
      return cache[id];
    },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: noop,
    removeEventListener: noop
  };

  g.localStorage = {
    getItem: function (k) {
      try {
        const v = tt.getStorageSync(k);
        return (v === '' || v === undefined || v === null) ? null : v;
      } catch (e) { return null; }
    },
    setItem: function (k, v) {
      try { tt.setStorageSync(k, String(v)); } catch (e) {}
    },
    removeItem: function (k) {
      try { tt.removeStorageSync(k); } catch (e) {}
    },
    clear: function () {
      try { tt.clearStorageSync(); } catch (e) {}
    }
  };

  g.Image = function Image() { return tt.createImage(); };

  /* three.js 的 ImageLoader 依赖 DOM Image，这里整体替换为 tt 图片对象 */
  function patchThree(THREE) {
    if (!THREE || !THREE.ImageLoader || !THREE.ImageLoader.prototype) return;
    THREE.ImageLoader.prototype.load = function (url, onLoad, onProgress, onError) {
      const img = tt.createImage();
      img.onload = function () { if (onLoad) onLoad(img); };
      img.onerror = function (e) { if (onError) onError(e); };
      img.src = url;
      return img;
    };
  }

  module.exports = { patchThree: patchThree };
})();
