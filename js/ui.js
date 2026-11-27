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
    // 相同提示不重复叠：直接续时，避免多条 toast 抢屏
    if (el.textContent === msg && el.classList.contains('show')) {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2200);
      return;
    }
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
    // 回到小屋时立即刷新首页状态（今日目标进度、鱼干、宠物栏等）
    if (name === 'home' && PDM.app && PDM.app.refreshAll) PDM.app.refreshAll();
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
  function fishCostText(f) {
    return Object.keys(f.fishCost || {}).map(k => {
      const sp = core.fishById(k);
      return (sp ? sp.name : k) + '×' + f.fishCost[k];
    }).join(' + ');
  }

  function furnitureCard(f, limited) {
    const st = core.state();
    const owned = core.isOwned(f.id);
    const eq = core.isPlaced(f.id);
    const craft = !owned && !!f.fishCost;
    let btn;
    if (owned) {
      btn = '<button class="buy-btn ' + (eq ? 'equipped' : 'owned') + '" data-action="openDecor" data-slot="' + f.slot + '">' + (eq ? '已摆放' : '布置') + '</button>';
    } else if (craft) {
      btn = '<button class="buy-btn ad" data-action="goFishing">去鱼塘打造</button>';
    } else if (limited) {
      btn = '<button class="buy-btn ad" data-action="adItem" data-id="' + f.id + '">看广告</button>';
    } else {
      btn = '<button class="buy-btn' + (st.fish < f.price ? ' owned' : '') + '" data-action="buyItem" data-id="' + f.id + '">买下</button>';
    }
    return '<div class="item-card">' +
      (owned ? '<span class="tag-corner ' + (eq ? 'new' : '') + '">' + (eq ? '已摆放' : '已拥有') + '</span>'
        : craft ? '<span class="tag-corner ad">鱼塘限定</span>'
          : (f.ad ? '<span class="tag-corner ad">限定</span>' : '')) +
      '<div class="item-thumb"><canvas data-item="' + f.id + '"></canvas></div>' +
      '<div class="item-name">' + f.name + '</div>' +
      '<div class="item-desc">' + f.desc + '</div>' +
      '<div class="item-foot">' +
      (owned ? '<span class="tiny">' + slotName(f.slot) + '</span>'
        : craft ? '<span class="tiny">' + fishCostText(f) + '</span>'
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
      html = '<div class="shop-grid">' + core.FURNITURE.filter(f => !f.ad && !f.fishCost).map(f => furnitureCard(f)).join('') + '</div>';
    } else if (uiState.shopTab === 'outfit') {
      html = '<div class="shop-grid">' + core.OUTFITS.filter(o => !o.ad).map(o => outfitCard(o)).join('') + '</div>';
    } else if (uiState.shopTab === 'food') {
      html = '<div class="tiny shop-note">完成专注会得到免费猫鱼条；不同口味会带来短时加成，喂食时可以选择。</div>' +
        '<div class="shop-grid">' + core.FOODS.map(f => foodCard(f)).join('') + '</div>';
    } else {
      const fishFurn = core.FURNITURE.filter(f => f.fishCost);
      const adFurn = core.FURNITURE.filter(f => f.ad && !f.fishCost);
      const adOutfits = core.OUTFITS.filter(o => o.ad);
      const next = core.nextLockedComic();
      html = '<div class="shop-grid">' +
        fishFurn.map(f => furnitureCard(f, true)).join('') +
        adFurn.map(f => furnitureCard(f, true)).join('') +
        adOutfits.map(o => outfitCard(o, true)).join('') +
        (next
          ? '<div class="item-card wide"><div class="item-thumb" style="width:74px;height:74px;flex:none;border-radius:12px"><canvas data-comic="' + next.id + '" style="width:100%;height:100%;border-radius:12px"></canvas></div>' +
          '<div style="min-width:0;flex:1"><div class="item-name">番外 · ' + next.title + '</div><div class="item-desc">' + next.sub + '</div>' +
          '<button class="buy-btn ad" style="margin-top:6px" data-action="adComic" data-id="' + next.id + '">看广告提前解锁</button></div></div>'
          : '<div class="empty-note">番外已经全部解锁啦，等小喵写新的故事。</div>') +
        '</div>' +
        '<div class="tiny" style="margin:14px 4px 0;line-height:1.7">鱼塘限定只能用钓到的鱼打造；激励视频只解锁服装等视觉变体。</div>';
    }
    body.innerHTML = html;
    hydrate(body);
  }

  /* ---------- book ---------- */
  function renderBook() {
    const st = core.state();
    const fishCaught = core.fishDex().filter(f => f.caught > 0).length;
    const got = st.owned.length + st.ownedOutfits.length + st.comics.length + fishCaught;
    $('bookProgress').textContent = Math.round(got / (core.FURNITURE.length + core.OUTFITS.length + core.COMICS.length + core.FISH.length) * 100) + '%';
    document.querySelectorAll('#bookTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === uiState.bookTab));
    const body = $('bookBody');
    let html = '';
    if (uiState.bookTab === 'furniture') {
      html = '<div class="book-grid">' + core.FURNITURE.map(f => {
        const owned = core.isOwned(f.id);
        return '<div class="book-card ' + (owned ? '' : 'locked') + '">' +
          '<div class="book-thumb"><canvas data-item="' + f.id + '"></canvas></div>' +
          '<div class="book-name">' + f.name + '</div>' +
          '<div class="book-meta">' + slotName(f.slot) + ' · ' + (owned ? '已收集' : (f.ad ? '限定' : (f.fishCost ? '鱼塘限定' : '商店'))) + '</div>' +
          (owned ? '' : '<div class="lock-veil">' + icon('lock') + '<span>' + (f.ad ? '看广告解锁' : f.fishCost ? '鱼塘打造' : '商店购买') + '</span></div>') +
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
    } else if (uiState.bookTab === 'fish') {
      const dex = core.fishDex();
      const caughtSpecies = dex.filter(f => f.caught > 0).length;
      const totalCaught = dex.reduce((a, f) => a + f.caught, 0);
      html = '<div class="panel"><div class="panel-head"><h3>鱼塘图鉴</h3><span class="tiny">已收集 ' + caughtSpecies + '/' + dex.length + ' 种 · 累计钓到 ' + totalCaught + ' 条</span></div>' +
        '<div class="book-grid">' + dex.map(f => {
          const got = f.caught > 0;
          const rarity = core.RARITY[f.rarity];
          return '<div class="book-card ' + (got ? '' : 'locked') + '">' +
            '<div class="book-thumb fish-thumb" style="background:linear-gradient(160deg,#FFFDF8,' + f.color + '2E)">' +
            '<svg class="fish-dex-icon" style="color:' + f.color + '"><use href="#i-fish"/></svg></div>' +
            '<div class="book-name">' + f.name + '</div>' +
            '<div class="book-meta">' + (rarity ? rarity.name : '') + ' · ' + (got ? '已钓到 ' + f.caught + ' 条' : '还没钓到') + '</div>' +
            (got ? '' : '<div class="lock-veil">' + icon('lock') + '<span>去鱼塘</span></div>') +
            '</div>';
        }).join('') + '</div></div>' +
        '<div class="panel" style="margin-top:12px"><div class="panel-head"><h3>鱼塘笔记</h3></div><div class="tiny" style="line-height:1.8">连续 8 次非稀有会触发保底，40 杆不见传说会大幅提高传说概率；每轮第一次空杆不耗次数。图鉴记录累计钓到的鱼，兑换后也不会消失。</div></div>';
    } else if (uiState.bookTab === 'activity') {
      const acts = core.activityInfo();
      const actDone = acts.filter(a => a.done).length;
      const actRows = acts.map(a =>
        '<div class="act-row ' + (a.done ? 'done' : '') + '">' +
          '<span class="act-check">' + (a.done ? '✓' : '○') + '</span>' +
          '<div class="act-info"><b>' + a.def.name + '</b><span>' + a.def.desc + '</span></div>' +
          '<em>' + (a.done ? '已完成' : '+' + a.def.reward + ' 🐟') + '</em>' +
        '</div>'
      ).join('');
      html = '<div class="panel"><div class="panel-head"><h3>互动手册</h3><span class="hint">' + actDone + ' / ' + acts.length + '</span></div>' +
        '<div class="act-list">' + actRows + '</div>' +
        '<div class="tiny" style="margin-top:10px;line-height:1.7">每项首次完成 +2 小鱼干；全部 8 项完成再 +10。互动手册只在第一次完成时计数。</div></div>' +
        '<div class="activity-grid" style="margin-top:12px">' + core.ACTIVITIES.map(a =>
        '<article class="activity-card"><div class="activity-icon">' + a.icon + '</div><div><h3>' + a.name + '</h3><p>' + a.desc + '</p><span>可在小屋中体验</span></div></article>'
      ).join('') + '</div>' +
        '<div class="panel" style="margin-top:12px"><div class="panel-head"><h3>陪伴记录</h3></div><div class="tiny" style="line-height:1.8">小喵的日常不靠抽卡解锁。摸摸、投喂、陪读和布置，都会让房间慢慢变成你们共同生活的地方。</div></div>';
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
