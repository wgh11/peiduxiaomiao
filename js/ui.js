/* ============ 陪读小喵 · ui: shell / shop / book ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const core = PDM.core, F = PDM.furniture, X = PDM.extras;
  const $ = id => document.getElementById(id);
  const uiState = { shopTab: 'furniture', bookTab: 'furniture', decorSlot: 'all', comicId: null, comicPage: 0 };

  let refs = {};
  let toastTimer = 0;

  function icon(n) { return '<svg><use href="#i-' + n + '"/></svg>'; }

  function init() {
    refs = {
      screens: document.querySelectorAll('.screen'),
      tabs: document.querySelectorAll('#tabbar .tab'),
      overlay: $('overlay'),
      sheet: $('sheet'),
      sheetBody: $('sheetBody'),
      sheetTitle: $('sheetTitle'),
      modalWrap: $('modalWrap'),
      modalBody: $('modalBody'),
      rewardWrap: $('rewardWrap'),
      rewardBody: $('rewardBody'),
      toast: $('toast')
    };
    refs.tabs.forEach(t => {
      t.addEventListener('click', () => PDM.ui.switchScreen(t.dataset.screen));
    });
    $('shopTabs').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      uiState.shopTab = b.dataset.tab;
      renderShop();
    });
    $('bookTabs').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      uiState.bookTab = b.dataset.tab;
      renderBook();
    });
    refs.overlay.addEventListener('click', closeSheet);
    $('sheetClose').addEventListener('click', closeSheet);
    refs.modalWrap.addEventListener('click', e => {
      if (e.target === refs.modalWrap && !refs.modalWrap.dataset.locked) closeModal();
    });
    refreshHeader();
  }

  function toast(msg, ms) {
    const el = refs.toast || $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2200);
  }

  function refreshHeader() {
    const st = core.state();
    const lv = core.levelInfo();
    const streak = core.computeStreak(st);
    const setText = (sel, txt) => {
      document.querySelectorAll(sel).forEach(el => { el.textContent = txt; });
    };
    document.querySelectorAll('#statFish b').forEach(el => el.textContent = st.fish);
    document.querySelectorAll('#statStreak b').forEach(el => el.textContent = streak);
    const lvEl = $('levelText');
    if (lvEl) lvEl.textContent = 'Lv.' + lv.level + ' ' + lv.name;
    const tod = PDM.room.tod();
    const todEl = $('todText');
    if (todEl) todEl.textContent = tod.label;
    const shopFish = $('shopFish');
    if (shopFish) shopFish.textContent = st.fish;
    const bp = $('bookProgress');
    if (bp) {
      const got = st.owned.length + st.ownedOutfits.length + st.comics.length;
      bp.textContent = Math.round(got / (core.FURNITURE.length + core.OUTFITS.length + core.COMICS.length) * 100) + '%';
    }
    setText('#statFish b', st.fish);
    setText('#statStreak b', streak);
  }

  function switchScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    document.querySelectorAll('#tabbar .tab').forEach(t => t.classList.toggle('on', t.dataset.screen === name));
    if (name === 'shop') renderShop();
    if (name === 'book') renderBook();
    if (name === 'log') PDM.ui.renderLog();
  }

  function openSheet(title, html) {
    refs = refs.sheet ? refs : refs;
    $('sheetTitle').textContent = title;
    $('sheetBody').innerHTML = html;
    $('overlay').classList.add('show');
    $('sheet').classList.add('show');
    hydrate($('sheetBody'));
  }
  function closeSheet() {
    $('overlay').classList.remove('show');
    $('sheet').classList.remove('show');
    $('sheetBody').innerHTML = '';
  }

  function openModal(html, opts) {
    $('modalBody').innerHTML = html;
    $('modalWrap').classList.toggle('show', true);
    $('modalWrap').dataset.locked = opts && opts.locked ? '1' : '';
  }
  function closeModal() {
    $('modalWrap').classList.remove('show');
    $('modalWrap').dataset.locked = '';
    $('modalBody').innerHTML = '';
  }

  /* ---------- hydrate thumbnails ---------- */
  const OUTFIT_IMG = {
    default: 'assets/cat/cat_idle.png',
    pj: 'assets/cat/cat_pj.png',
    academy: 'assets/cat/cat_academy.png',
    festival: 'assets/cat/cat_festival.png'
  };
  const outfitImgCache = {};

  function paintOutfit(canvas, id) {
    const size = 180;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    // soft ground
    ctx.fillStyle = 'rgba(214, 180, 148, .18)';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.9, 66, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const src = OUTFIT_IMG[id] || OUTFIT_IMG.default;
    let img = outfitImgCache[src];
    if (!img) {
      img = new Image();
      outfitImgCache[src] = img;
      img.onload = () => paintOutfit(canvas, id);
      img.src = src;
    }
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, size * 0.01, -size * 0.06, size * 0.98, size * 0.98);
      return;
    }
    PDM.art.drawCat(ctx, size / 2, size * 0.94, 1.02, { state: 'idle', outfit: id, t: 1.1 });
  }

  function hydrate(root) {
    if (!root) return;
    root.querySelectorAll('canvas[data-item]').forEach(c => F.drawIcon(c, c.dataset.item, 140));
    root.querySelectorAll('canvas[data-outfit]').forEach(c => paintOutfit(c, c.dataset.outfit));
    root.querySelectorAll('canvas[data-comic]').forEach(c => {
      const comic = core.comicById(c.dataset.comic);
      if (comic) X.drawComicCover(c, comic);
    });
  }

  /* ---------- shop ---------- */
  function furnitureCard(f, limited) {
    const st = core.state();
    const owned = core.isOwned(f.id);
    const eq = core.isPlaced(f.id);
    let btn;
    if (limited) {
      btn = owned
        ? '<button class="buy-btn ' + (eq ? 'equipped' : 'owned') + '" data-action="openDecor" data-slot="' + f.slot + '">' + (eq ? '已摆放' : '布置') + '</button>'
        : '<button class="buy-btn ad" data-action="adItem" data-id="' + f.id + '">看广告</button>';
    } else {
      btn = owned
        ? '<button class="buy-btn ' + (eq ? 'equipped' : 'owned') + '" data-action="openDecor" data-slot="' + f.slot + '">' + (eq ? '已摆放' : '布置') + '</button>'
        : '<button class="buy-btn' + (st.fish < f.price ? ' owned' : '') + '" data-action="buyItem" data-id="' + f.id + '">买下</button>';
    }
    return '<div class="item-card">' +
      (owned ? '<span class="tag-corner ' + (eq ? 'new' : '') + '">' + (eq ? '已摆放' : '已拥有') + '</span>' : (f.ad ? '<span class="tag-corner ad">限定</span>' : '')) +
      '<div class="item-thumb"><canvas data-item="' + f.id + '"></canvas></div>' +
      '<div class="item-name">' + f.name + '</div>' +
      '<div class="item-desc">' + f.desc + '</div>' +
      '<div class="item-foot">' +
      (owned ? '<span class="tiny">' + slotName(f.slot) + '</span>'
        : f.ad ? '<span class="tiny">激励视频解锁</span>'
          : '<span class="price">' + icon('fish') + f.price + '</span>') +
      btn + '</div></div>';
  }

  function outfitCard(o, limited) {
    const st = core.state();
    const owned = st.ownedOutfits.indexOf(o.id) >= 0;
    const wearing = st.outfit === o.id;
    let btn;
    if (owned) {
      btn = '<button class="buy-btn ' + (wearing ? 'equipped' : 'owned') + '" data-action="wearOutfit" data-id="' + o.id + '">' + (wearing ? '使用中' : '穿上') + '</button>';
    } else if (limited || o.ad) {
      btn = '<button class="buy-btn ad" data-action="adOutfit" data-id="' + o.id + '">看广告</button>';
    } else {
      btn = '<button class="buy-btn' + (st.fish < o.price ? ' owned' : '') + '" data-action="buyOutfit" data-id="' + o.id + '">买下</button>';
    }
    return '<div class="item-card">' +
      (owned ? '<span class="tag-corner ' + (wearing ? 'new' : '') + '">' + (wearing ? '使用中' : '已拥有') + '</span>' : (o.ad ? '<span class="tag-corner ad">限定</span>' : '')) +
      '<div class="item-thumb tall"><canvas data-outfit="' + o.id + '"></canvas></div>' +
      '<div class="item-name">' + o.name + '</div>' +
      '<div class="item-desc">' + o.desc + '</div>' +
      '<div class="item-foot">' +
      (owned ? '<span class="tiny">' + (o.id === 'default' ? '初始服装' : '衣橱') + '</span>'
        : o.ad ? '<span class="tiny">激励视频解锁</span>'
          : '<span class="price">' + icon('fish') + o.price + '</span>') +
      btn + '</div></div>';
  }

  function foodCard(f) {
    const st = core.state();
    const owned = (st.foods && st.foods[f.id]) || 0;
    return '<div class="item-card food-card">' +
      '<div class="food-art food-' + f.id + '">' + (f.id === 'fish' ? '🐟' : f.id === 'milk' ? '🥛' : '🍪') + '</div>' +
      '<div class="item-name">' + f.name + '</div>' +
      '<div class="item-desc">' + f.desc + '</div>' +
      '<div class="item-foot"><span class="tiny">已有 ' + owned + ' 份</span>' +
      '<button class="buy-btn" data-action="buyFood" data-id="' + f.id + '"><span class="price">' + icon('fish') + f.price + '</span>买一份</button></div></div>';
  }

  function slotName(slot) {
    const s = core.SLOTS.find(x => x.id === slot);
    return s ? s.name : '';
  }

  function renderShop() {
    const st = core.state();
    $('shopFish').textContent = st.fish;
    document.querySelectorAll('#shopTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === uiState.shopTab));
    const body = $('shopBody');
    let html = '';
    if (uiState.shopTab === 'furniture') {
      html = '<div class="shop-grid">' + core.FURNITURE.filter(f => !f.ad).map(f => furnitureCard(f)).join('') + '</div>';
    } else if (uiState.shopTab === 'outfit') {
      html = '<div class="shop-grid">' + core.OUTFITS.filter(o => !o.ad).map(o => outfitCard(o)).join('') + '</div>';
    } else if (uiState.shopTab === 'food') {
      html = '<div class="tiny shop-note">完成专注会得到基础零食，也可以用小鱼干给小喵换不同口味。</div>' +
        '<div class="shop-grid">' + core.FOODS.map(f => foodCard(f)).join('') + '</div>';
    } else {
      const adFurn = core.FURNITURE.filter(f => f.ad);
      const adOutfits = core.OUTFITS.filter(o => o.ad);
      const next = core.nextLockedComic();
      html = '<div class="shop-grid">' +
        adFurn.map(f => furnitureCard(f, true)).join('') +
        adOutfits.map(o => outfitCard(o, true)).join('') +
        (next
          ? '<div class="item-card wide"><div class="item-thumb" style="width:74px;height:74px;flex:none;border-radius:12px"><canvas data-comic="' + next.id + '" style="width:100%;height:100%;border-radius:12px"></canvas></div>' +
          '<div style="min-width:0;flex:1"><div class="item-name">番外 · ' + next.title + '</div><div class="item-desc">' + next.sub + '</div>' +
          '<button class="buy-btn ad" style="margin-top:6px" data-action="adComic" data-id="' + next.id + '">看广告提前解锁</button></div></div>'
          : '<div class="empty-note">番外已经全部解锁啦，等小喵写新的故事。</div>') +
        '</div>' +
        '<div class="tiny" style="margin:14px 4px 0;line-height:1.7">限定物品通过激励视频解锁，放在商店里但不会主动弹出；正式版接入广告 SDK 后即可上线。</div>';
    }
    body.innerHTML = html;
    hydrate(body);
  }

  /* ---------- book ---------- */
  function renderBook() {
    const st = core.state();
    const got = st.owned.length + st.ownedOutfits.length + st.comics.length;
    $('bookProgress').textContent = Math.round(got / (core.FURNITURE.length + core.OUTFITS.length + core.COMICS.length) * 100) + '%';
    document.querySelectorAll('#bookTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === uiState.bookTab));
    const body = $('bookBody');
    let html = '';
    if (uiState.bookTab === 'furniture') {
      html = '<div class="book-grid">' + core.FURNITURE.map(f => {
        const owned = core.isOwned(f.id);
        return '<div class="book-card ' + (owned ? '' : 'locked') + '">' +
          '<div class="book-thumb"><canvas data-item="' + f.id + '"></canvas></div>' +
          '<div class="book-name">' + f.name + '</div>' +
          '<div class="book-meta">' + slotName(f.slot) + ' · ' + (owned ? '已收集' : (f.ad ? '限定' : '商店')) + '</div>' +
          (owned ? '' : '<div class="lock-veil">' + icon('lock') + '<span>' + (f.ad ? '看广告解锁' : '商店购买') + '</span></div>') +
          '</div>';
      }).join('') + '</div>';
    } else if (uiState.bookTab === 'outfit') {
      html = '<div class="book-grid">' + core.OUTFITS.map(o => {
        const owned = st.ownedOutfits.indexOf(o.id) >= 0;
        return '<div class="book-card ' + (owned ? '' : 'locked') + '">' +
          '<div class="book-thumb"><canvas data-outfit="' + o.id + '"></canvas></div>' +
          '<div class="book-name">' + o.name + '</div>' +
          '<div class="book-meta">' + (owned ? '已收集' : (o.ad ? '限定服装' : '商店')) + '</div>' +
          (owned ? '' : '<div class="lock-veil">' + icon('lock') + '<span>' + (o.ad ? '看广告解锁' : '商店购买') + '</span></div>') +
          '</div>';
      }).join('') + '</div>';
    } else {
      html = '<div class="comic-list">' + core.COMICS.map(c => {
        const unlocked = st.comics.indexOf(c.id) >= 0;
        const read = st.comicsRead.indexOf(c.id) >= 0;
        return '<button class="comic-card ' + (unlocked ? '' : 'locked') + '" data-action="comic" data-id="' + c.id + '">' +
          '<div class="comic-cover"><canvas data-comic="' + c.id + '"></canvas></div>' +
          '<div class="comic-info"><h4>' + c.title + (read ? ' <span class="ad-badge">已读</span>' : '') + '</h4>' +
          '<p>' + c.sub + '</p>' +
          '<div class="comic-state ' + (unlocked ? '' : 'locked') + '">' + (unlocked ? '已解锁 · 点开阅读' : '成长值 ' + c.req + ' 自动解锁') + '</div></div>' +
          '</button>';
      }).join('') + '</div>' +
        '<div class="panel" style="margin-top:12px"><div class="panel-head"><h3>关于番外</h3></div><div class="tiny" style="line-height:1.8">累计专注会慢慢解锁小喵的故事；也可以在商店「限定」里看广告提前解锁下一话。原型共有 6 话，每话 3 页。</div></div>';
    }
    body.innerHTML = html;
    hydrate(body);
  }

  PDM.ui = Object.assign(PDM.ui || {}, {
    init: init,
    toast: toast,
    icon: icon,
    uiState: uiState,
    refreshHeader: refreshHeader,
    switchScreen: switchScreen,
    openSheet: openSheet,
    closeSheet: closeSheet,
    openModal: openModal,
    closeModal: closeModal,
    renderShop: renderShop,
    renderBook: renderBook,
    hydrate: hydrate,
    paintOutfit: paintOutfit,
    slotName: slotName
  });
})(window.PDM);
