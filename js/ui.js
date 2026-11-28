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
      if ($('shopBody')) $('shopBody').scrollTop = 0;
    });
    $('bookTabs').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      uiState.bookTab = b.dataset.tab;
      renderBook();
      if ($('bookBody')) $('bookBody').scrollTop = 0;
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
    if (name === 'shop') { renderShop(); if ($('shopBody')) $('shopBody').scrollTop = 0; }
    if (name === 'book') { renderBook(); if ($('bookBody')) $('bookBody').scrollTop = 0; }
    if (name === 'log') { PDM.ui.renderLog(); if ($('logBody')) $('logBody').scrollTop = 0; }
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
    } else if (o.how && o.how !== 'shop') {
      btn = '<button class="buy-btn owned" data-action="buyOutfit" data-id="' + o.id + '">' + (o.cond || '未解锁') + '</button>';
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
          : (o.how && o.how !== 'shop') ? '<span class="tiny">' + (o.cond || '完成条件解锁') + '</span>'
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

  function accessoryArt(a) {
    const id = a.id;
    const head = id === 'a_beret' || id === 'a_bucket' || id === 'a_gradcap';
    let shape = '';
    if (id === 'a_beret') shape = '<path d="M7 17c2-8 18-11 26-3 2 2 1 5-2 6H8c-2 0-2-1-1-3z" fill="#D78A73"/><path d="M7 18h26" stroke="#A65B50" stroke-width="2" stroke-linecap="round"/>';
    else if (id === 'a_bucket') shape = '<path d="M8 13h24l-3 12H11z" fill="#E9C98C"/><path d="M6 13h28" stroke="#C18E55" stroke-width="3" stroke-linecap="round"/><path d="M14 10c2-4 10-4 12 0" fill="none" stroke="#F6E5BC" stroke-width="3" stroke-linecap="round"/>';
    else if (id === 'a_gradcap') shape = '<path d="M8 13l12-6 12 6-12 6z" fill="#566D91"/><path d="M12 15v7h16v-7" fill="#6F87AA"/><path d="M31 12v10" stroke="#D7A74E" stroke-width="2"/><circle cx="31" cy="23" r="2" fill="#D7A74E"/>';
    else if (id === 'a_bearband') shape = '<path d="M10 13c0-8 20-8 20 0" fill="none" stroke="#A96C4C" stroke-width="3"/><circle cx="12" cy="10" r="5" fill="#B97C5A"/><circle cx="28" cy="10" r="5" fill="#B97C5A"/><circle cx="12" cy="10" r="2" fill="#F2C39D"/><circle cx="28" cy="10" r="2" fill="#F2C39D"/>';
    else if (id === 'a_bunny') shape = '<path d="M13 14c-4-8-1-12 3-10 2 1 2 6 2 9M27 14c0-3 0-8 2-9 4-2 7 2 3 10" fill="#F2B6BC" stroke="#B46B78" stroke-width="2" stroke-linejoin="round"/><path d="M10 15c2-6 18-6 20 0" fill="none" stroke="#D78A98" stroke-width="3"/>';
    else if (id === 'a_shades') shape = '<circle cx="13" cy="16" r="6" fill="#56606F"/><circle cx="27" cy="16" r="6" fill="#56606F"/><path d="M19 16h2M7 15l-4-2M33 15l4-2" stroke="#39414E" stroke-width="2" stroke-linecap="round"/>';
    else if (id === 'a_daisy') shape = '<path d="M8 17c2-7 22-7 24 0" fill="none" stroke="#74A77B" stroke-width="3"/><g fill="#FFF5D8" stroke="#E0B35F" stroke-width="1"><circle cx="12" cy="13" r="4"/><circle cx="20" cy="10" r="4"/><circle cx="28" cy="13" r="4"/></g><circle cx="12" cy="13" r="1.5" fill="#E4A94F"/><circle cx="20" cy="10" r="1.5" fill="#E4A94F"/><circle cx="28" cy="13" r="1.5" fill="#E4A94F"/>';
    else if (id === 'a_bow') shape = '<path d="M20 16c-7-8-13-6-12 0 1 5 7 4 12 1 5 3 11 4 12-1 1-6-5-8-12 0z" fill="#E98FA6"/><circle cx="20" cy="16" r="3" fill="#C76681"/>';
    else if (id === 'a_scarf') shape = '<path d="M9 11c3 5 19 5 22 0" fill="none" stroke="#C96B62" stroke-width="5" stroke-linecap="round"/><path d="M25 15l5 13-6 2-3-13" fill="#D8796E"/><path d="M11 12l20 0" stroke="#F2B5A1" stroke-width="1.5"/>';
    else if (id === 'a_bell') shape = '<path d="M8 13c3 5 21 5 24 0" fill="none" stroke="#D9A54C" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="22" r="6" fill="#F0C76A" stroke="#B7802E" stroke-width="2"/><path d="M18 23h4" stroke="#9B6B27" stroke-width="2" stroke-linecap="round"/>';
    else if (id === 'a_tie') shape = '<path d="M16 11l4 4 4-4 2 7-6 10-6-10z" fill="#5D789F"/><path d="M17 11h6l-1-4h-4z" fill="#D7A74E"/>';
    else if (id === 'a_pearl') shape = '<path d="M8 14c3 5 21 5 24 0" fill="none" stroke="#B6A3A0" stroke-width="2"/><circle cx="12" cy="16" r="3" fill="#FFF5ED" stroke="#D8C1BC"/><circle cx="20" cy="18" r="3" fill="#FFF5ED" stroke="#D8C1BC"/><circle cx="28" cy="16" r="3" fill="#FFF5ED" stroke="#D8C1BC"/>';
    else if (id === 'a_sunflower') shape = '<g fill="#F1BE4F"><circle cx="20" cy="17" r="9"/><circle cx="20" cy="7" r="4"/><circle cx="20" cy="27" r="4"/><circle cx="10" cy="17" r="4"/><circle cx="30" cy="17" r="4"/></g><circle cx="20" cy="17" r="4" fill="#8C6641"/>';
    else if (id === 'a_glasses') shape = '<circle cx="13" cy="16" r="6" fill="none" stroke="#9B764E" stroke-width="2"/><circle cx="27" cy="16" r="6" fill="none" stroke="#9B764E" stroke-width="2"/><path d="M19 16h2M7 15l-4-2M33 15l4-2" stroke="#9B764E" stroke-width="2" stroke-linecap="round"/>';
    else if (id === 'a_wings') shape = '<path d="M18 15c-9-8-14-1-8 6 3 3 6 4 10 1M22 15c9-8 14-1 8 6-3 3-6 4-10 1" fill="#C9DDEF" stroke="#799CBF" stroke-width="2" stroke-linejoin="round"/>';
    else if (id === 'a_bag') shape = '<rect x="11" y="12" width="18" height="15" rx="3" fill="#D99B69"/><path d="M15 12c0-6 10-6 10 0" fill="none" stroke="#A86B4B" stroke-width="2"/><circle cx="20" cy="19" r="2" fill="#F5D39A"/>';
    else shape = '<circle cx="20" cy="16" r="10" fill="#D8BFA9"/><circle cx="17" cy="14" r="2" fill="#FFF7ED"/>';
    return '<span class="acc-visual ' + (head ? 'head' : a.slot) + '" aria-hidden="true"><svg viewBox="0 0 40 32">' + shape + '</svg></span>';
  }

  function accessorySection() {
    const acc = core.state().accessories || { owned: [], head: null, neck: null, charm: null };
    const chip = a => {
      const owned = acc.owned.indexOf(a.id) >= 0;
      const on = acc[a.slot] === a.id;
      if (owned) {
        return '<button class="acc-chip ' + (on ? 'on' : '') + '" data-action="accItem" data-id="' + a.id + '">' +
          accessoryArt(a) + '<span class="acc-copy"><b>' + a.name + '</b>' + (on ? '<em>已佩戴</em>' : '<em>佩戴</em>') + '</span></button>';
      }
      if (a.how === 'shop') {
        return '<button class="acc-chip locked" data-action="accItem" data-id="' + a.id + '">' +
          accessoryArt(a) + '<span class="acc-copy"><b>' + a.name + '</b><em>' + icon('fish') + a.price + '</em></span></button>';
      }
      return '<button class="acc-chip locked" data-action="accItem" data-id="' + a.id + '">' +
        accessoryArt(a) + '<span class="acc-copy"><b>' + a.name + '</b><em>' + (a.cond || '未解锁') + '</em></span></button>';
    };
    const slotRow = (slot, name) => {
      const list = core.ACCESSORIES.filter(a => a.slot === slot);
      return '<div class="acc-slot"><span class="acc-slot-name">' + name + '</span>' +
        '<div class="acc-list">' + list.map(chip).join('') + '</div></div>';
    };
    return '<div class="panel accessory-panel"><div class="panel-head"><h3>猫咪配饰</h3><span class="hint">头饰 / 颈饰 / 挂饰 各 1 件</span></div>' +
      slotRow('head', '头饰') + slotRow('neck', '颈饰') + slotRow('charm', '挂饰') +
      '<div class="tiny" style="margin-top:8px;line-height:1.7">配饰会戴在小喵身上；点已拥有的再点一次即可摘下。连续打卡、刷题、图鉴和互动手册里还藏着免费配饰。</div></div>';
  }

  function themeShelf() {
    const st = core.state();
    const cards = core.ROOM_THEMES.map(t => {
      const owned = st.themes.indexOf(t.id) >= 0;
      const on = st.roomTheme === t.id;
      let btn;
      if (owned) {
        btn = '<button class="buy-btn ' + (on ? 'equipped' : 'owned') + '" data-action="themeItem" data-id="' + t.id + '">' + (on ? '使用中' : '换上') + '</button>';
      } else if (t.price > 0) {
        btn = '<button class="buy-btn' + (st.fish < t.price ? ' owned' : '') + '" data-action="themeItem" data-id="' + t.id + '">' + icon('fish') + t.price + '</button>';
      } else {
        btn = '<button class="buy-btn owned" data-action="themeItem" data-id="' + t.id + '">连续 ' + t.streak + ' 天</button>';
      }
      return '<div class="theme-card">' +
        '<div class="theme-swatch ' + t.id + (on ? ' on' : '') + '"></div>' +
        '<div class="theme-info"><h4>' + t.name + '</h4><p>' + t.desc + '</p></div>' +
        btn + '</div>';
    }).join('');
    return '<div class="panel-head" style="margin-top:2px"><h3>房间主题</h3><span class="hint">换墙面 / 窗外 / 光色</span></div>' +
      '<div class="theme-shelf">' + cards + '</div>';
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
      html = accessorySection() + '<div class="shop-grid">' + core.OUTFITS.filter(o => !o.ad).map(o => outfitCard(o)).join('') + '</div>';
    } else if (uiState.shopTab === 'food') {
      html = '<div class="tiny shop-note">完成专注会得到免费猫鱼条；不同口味会带来短时加成，喂食时可以选择。</div>' +
        '<div class="shop-grid">' + core.FOODS.map(f => foodCard(f)).join('') + '</div>';
    } else {
      const fishFurn = core.FURNITURE.filter(f => f.fishCost);
      const adFurn = core.FURNITURE.filter(f => f.ad && !f.fishCost);
      const adOutfits = core.OUTFITS.filter(o => o.ad);
      const next = core.nextLockedComic();
      html = themeShelf() + '<div class="shop-grid">' +
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
          '<div class="book-meta">' + (owned ? '已收集' : (o.ad ? '限定服装' : (o.how && o.how !== 'shop' ? (o.cond || '条件解锁') : '商店'))) + '</div>' +
          (owned ? '' : '<div class="lock-veil">' + icon('lock') + '<span>' + (o.ad ? '看广告解锁' : (o.how && o.how !== 'shop' ? (o.cond || '条件解锁') : '商店购买')) + '</span></div>') +
          '</div>';
      }).join('') + '</div>';
    } else if (uiState.bookTab === 'fish') {
      const dex = core.fishDex();
      const caughtSpecies = dex.filter(f => f.caught > 0).length;
      const totalCaught = dex.reduce((a, f) => a + f.caught, 0);
      html = '<div class="panel"><div class="panel-head"><h3>鱼塘图鉴</h3><span class="tiny">已收集 ' + caughtSpecies + '/' + dex.length + ' 种 · 累计钓到 ' + totalCaught + ' 条 · 鱼缸 ' + (st.tank ? st.tank.length : 0) + '/5</span></div>' +
        '<div class="book-grid">' + dex.map(f => {
          const got = f.caught > 0;
          const rarity = core.RARITY[f.rarity];
          const inTank = (st.tank || []).indexOf(f.id) >= 0;
          return '<div class="book-card ' + (got ? '' : 'locked') + '">' +
            '<div class="book-thumb fish-thumb" style="background:linear-gradient(160deg,#FFFDF8,' + f.color + '2E)">' +
            '<svg class="fish-dex-icon" style="color:' + f.color + '"><use href="#i-fish"/></svg></div>' +
            '<div class="book-name">' + f.name + '</div>' +
            '<div class="book-meta">' + (rarity ? rarity.name : '') + ' · ' + (got ? '已钓到 ' + f.caught + ' 条' : '还没钓到') + '</div>' +
            (got ? '<button class="dex-tank-btn ' + (inTank ? 'on' : '') + '" data-action="tankFish" data-id="' + f.id + '">' + (inTank ? '已放进鱼缸' : '放进鱼缸') + '</button>' : '') +
            (got ? '' : '<div class="lock-veil">' + icon('lock') + '<span>去鱼塘</span></div>') +
            '</div>';
        }).join('') + '</div></div>' +
        '<div class="panel" style="margin-top:12px"><div class="panel-head"><h3>鱼塘笔记</h3></div><div class="tiny" style="line-height:1.8">连续 8 次非稀有会触发保底，40 杆不见传说会大幅提高传说概率；每轮第一次空杆不耗次数。点「放进鱼缸」最多展示 5 条，角落的小鱼缸会一直养着它们。</div></div>';
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

