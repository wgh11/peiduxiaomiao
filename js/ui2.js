/* ============ 陪读小喵 · ui: log / decor / settings / comic reader ============ */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const core = PDM.core, X = PDM.extras;
  const $ = id => document.getElementById(id);
  const icon = PDM.ui.icon;
  const uiState = PDM.ui.uiState;

  /* ---------------- 记录 ---------------- */
  function weekday(k) {
    return ['日', '一', '二', '三', '四', '五', '六'][core.parseKey(k).getDay()];
  }

  function renderLog() {
    const st = core.state();
    const sum = core.logSummary();
    const cal = core.calendarData();
    const max = Math.max(60, ...sum.days.map(d => d.minutes));

    const bars = sum.days.map(d => {
      const pct = Math.max(5, Math.round(d.minutes / max * 100));
      return '<div class="bar-col">' +
        (d.minutes > 0 ? '<span class="bar-val">' + d.minutes + '</span>' : '<span class="bar-val" style="opacity:0">0</span>') +
        '<div class="bar ' + (d.isToday ? 'today' : d.minutes > 0 ? 'has' : '') + '" style="height:' + pct + '%"></div>' +
        '<span class="bar-lab ' + (d.isToday ? 'today' : '') + '">' + (d.isToday ? '今天' : weekday(d.key)) + '</span>' +
        '</div>';
    }).join('');

    const calCells = cal.cells.map(c => {
      if (c.blank) return '<div class="cal-cell blank"></div>';
      return '<div class="cal-cell ' + (c.today ? 'today ' : '') + (c.checked ? 'on' : '') + (c.future ? ' future' : '') + '">' + c.day + '</div>';
    }).join('');

    const achs = core.achievementInfo().map(a => {
      const pct = Math.round(a.cur / a.def.goal * 100);
      return '<div class="ach-row">' +
        '<div class="ach-medal ' + (a.done ? 'on' : '') + '">' + icon('star') + '</div>' +
        '<div class="ach-info"><div class="t"><span>' + a.def.name + '</span><em>' + (a.awarded ? '已领取' : a.cur + '/' + a.def.goal) + '</em></div>' +
        '<div class="d">' + a.def.desc + ((a.def.reward || 0) > 0 ? ' · 奖励 +' + a.def.reward + ' 鱼干' : ' · 徽章') + '</div>' +
        '<div class="ach-bar"><i style="width:' + pct + '%"></i></div></div></div>';
    }).join('');

    const makeup = core.canMakeup();
    const makeupCard = makeup
      ? '<div class="makeup-card"><div class="mc-ico">' + icon('flame') + '</div><div style="flex:1"><h4>昨天忘记打卡了</h4><p>看一小段广告，帮小喵补上昨天，连续天数不断。</p></div><button class="btn primary" data-action="makeup">补签</button></div>'
      : '';

    const recent = (st.sessions || []).slice(-6).reverse();
    const recentHtml = recent.length ? recent.map(s => {
      const d = new Date(s.at || Date.now());
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const md = (d.getMonth() + 1) + '/' + d.getDate();
      return '<div class="kv-row"><span>' + md + ' ' + hh + ':' + mm + (s.tag ? ' · ' + s.tag : '') + '</span><b>' + s.minutes + ' 分钟</b></div>';
    }).join('') : '<div class="tiny" style="padding:8px 0">还没有记录，先去专注一会儿吧</div>';

    $('logBody').innerHTML =
      '<div class="log-cards">' +
      '<div class="log-stat"><div class="k">今日专注</div><div class="v">' + sum.today + '<small>分钟</small></div></div>' +
      '<div class="log-stat"><div class="k">本周专注</div><div class="v">' + sum.week + '<small>分钟</small></div></div>' +
      '<div class="log-stat"><div class="k">累计专注</div><div class="v">' + sum.total + '<small>分钟</small></div></div>' +
      '<div class="log-stat"><div class="k">连续打卡</div><div class="v">' + sum.streak + '<small>天</small></div></div>' +
      '</div>' +
      '<div class="panel"><div class="panel-head"><h3>最近 7 天</h3><span class="hint">单位：分钟</span></div><div class="bars">' + bars + '</div></div>' +
      makeupCard +
      '<div class="panel"><div class="panel-head"><h3>最近专注</h3><span class="hint">含任务标签</span></div>' + recentHtml + '</div>' +
      '<div class="panel"><div class="panel-head"><h3>' + cal.year + ' 年 ' + cal.month + ' 月打卡</h3><span class="hint">已打卡 ' + st.checkins.length + ' 天</span></div>' +
      '<div class="cal"><div class="cal-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>' +
      '<div class="cal-grid">' + calCells + '</div></div></div>' +
      '<div class="panel"><div class="panel-head"><h3>成就</h3><span class="hint">' + st.achievements.length + ' / ' + core.ACHIEVEMENTS.length + '</span></div>' + achs + '</div>' +
      '<div class="tiny" style="text-align:center;padding:14px 0 4px;line-height:1.7">数据只存在本机（localStorage），换设备不会同步。</div>';
  }

  /* ---------------- 布置小屋 ---------------- */
  function openDecor(slot) {
    if (slot) uiState.decorSlot = slot;
    if (!uiState.decorSlot) uiState.decorSlot = 'all';
    const st = core.state();
    const tabs = [{ id: 'all', name: '全部' }].concat(core.SLOTS).map(s =>
      '<button class="' + (uiState.decorSlot === s.id ? 'on' : '') + '" data-action="decorTab" data-slot="' + s.id + '">' + s.name + '</button>'
    ).join('');
    const list = core.FURNITURE.filter(f => uiState.decorSlot === 'all' || f.slot === uiState.decorSlot);
    const grid = list.map(f => {
      const owned = core.isOwned(f.id);
      const placed = core.isPlaced(f.id);
      return '<button class="decor-item ' + (placed ? 'on' : '') + ' ' + (owned ? '' : 'locked') + '" data-action="decorItem" data-id="' + f.id + '">' +
        '<canvas data-item="' + f.id + '"></canvas><span>' + f.name + '</span>' +
        (placed ? '<span class="mini-tag">已摆放</span>' : (owned ? '' : '<span class="mini-tag">未拥有</span>')) +
        '</button>';
    }).join('');
    const ownedCount = list.filter(f => core.isOwned(f.id)).length;
    const placedCount = Object.keys(st.layout || {}).length;
    PDM.ui.openSheet('布置小屋', '' +
      '<div class="slot-tabs">' + tabs + '</div>' +
      '<div class="decor-hint">点一下已拥有的物品就能摆上 / 收进柜子，位置不再固定。在屋里直接拖动家具也能调整位置。当前已拥有 ' + ownedCount + ' 件，屋里摆了 ' + placedCount + ' 件。</div>' +
      '<div class="decor-grid">' + grid + '</div>' +
      '<div class="decor-actions">' +
      '<button class="btn primary wide" data-action="decorDrag">自由摆放（拖动）</button>' +
      '<button class="btn ghost wide" data-action="goShop">去商店挑新家具</button>' +
      '</div>');
  }

  /* ---------------- 设置 / 埋点 ---------------- */
  function openSettings() {
    const st = core.state();
    const debug = !!(PDM.app && PDM.app.state && PDM.app.state.debug);
    const speedOn = !!(PDM.app && PDM.app.state && PDM.app.state.speed > 1);
    PDM.ui.openSheet('设置', '' +
      (debug ? '<div class="set-row"><div><div class="lab">演示加速 ×60</div><div class="desc">仅调试可用。开启后 25 分钟约 25 秒走完，不会写入正式存档</div></div>' +
      '<div class="switch ' + (speedOn ? 'on' : '') + '" data-action="toggleSpeed"></div></div>' : '') +
      '<div class="set-row"><div><div class="lab">休息提醒</div><div class="desc">每连续专注 25 分钟，提醒你起来活动一下</div></div>' +
      '<div class="switch ' + (st.settings.breakRemind !== false ? 'on' : '') + '" data-action="toggleBreak"></div></div>' +
      '<div class="set-row"><div><div class="lab">导出存档</div><div class="desc">把小鱼干、家具、记录导出成 JSON 备份</div></div>' +
      '<button class="btn ghost small" data-action="exportSave">导出</button></div>' +
      '<div class="set-row"><div><div class="lab">生成分享卡片</div><div class="desc">「今天陪读 2 小时」竖屏图，带小喵和小屋</div></div>' +
      '<button class="btn ghost small" data-action="share">生成</button></div>' +
      '<div class="set-row"><div><div class="lab">数据埋点</div><div class="desc">开始率、完成率、次日回访、广告点击</div></div>' +
      '<button class="btn ghost small" data-action="analytics">查看</button></div>' +
      '<div class="set-row"><div><div class="lab">重置存档</div><div class="desc">清空小鱼干、家具、打卡和记录</div></div>' +
      '<button class="btn ghost small" data-action="resetData">重置</button></div>' +
      '<div class="plain-list" style="margin-top:14px;line-height:1.8">' +
      '<b>关于 · 陪读小喵 v0.1 原型</b><br>原创动漫小猫 · 单机 · 无需登录<br>网页版使用 localStorage；正式小游戏版会迁移到 wx.setStorage，并接入激励视频广告 SDK。' +
      '</div>');
  }

  function openAnalytics() {
    const s = core.eventStats();
    const labels = {
      open: '打开应用', focus_start: '开始专注', focus_complete: '完成专注', focus_partial: '提前结束',
      ad_click: '打开广告', ad_complete: '看完广告', buy: '购买物品', equip: '布置家具', outfit: '换装',
      share: '生成分享卡', comic_read: '阅读番外', makeup: '补签', comic_unlock: '解锁番外',
      achievement: '达成成就', unlock_item: '解锁家具', unlock_outfit: '解锁服装', bonus_fish: '额外奖励',
      buy_outfit: '购买服装', goal_daily: '每日目标', goal_weekly: '每周目标', activity: '互动手册',
      share_reward: '分享奖励', cat_house_upgrade: '猫屋升级'
    };
    const recent = s.recent.map(e => {
      const time = new Date(e.t);
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      return '<div class="kv-row"><span>' + hh + ':' + mm + ' · ' + (labels[e.type] || e.type) + '</span><b>' + (e.data && (e.data.minutes != null ? e.data.minutes + ' 分钟' : e.data.id || e.data.amount || '')) + '</b></div>';
    }).join('');
    PDM.ui.openModal('' +
      '<h2 style="font-size:17px;margin-bottom:4px">本地埋点面板</h2>' +
      '<p class="tiny" style="margin-bottom:12px">仅原型演示，数据保存在本机。正式版接入统计后台。</p>' +
      '<div class="kv-row"><span>打开次数 / 天数</span><b>' + s.opens + ' 次 / ' + s.openDays + ' 天</b></div>' +
      '<div class="kv-row"><span>专注开始 / 完成</span><b>' + s.starts + ' / ' + s.completes + '</b></div>' +
      '<div class="kv-row"><span>专注完成率</span><b>' + s.completionRate + '%</b></div>' +
      '<div class="kv-row"><span>次日回访（本地估算）</span><b>' + s.nextDayReturn + '%</b></div>' +
      '<div class="kv-row"><span>广告点击 / 看完</span><b>' + s.adClicks + ' / ' + s.adCompletes + '</b></div>' +
      '<div class="kv-row"><span>购买 / 分享</span><b>' + s.buys + ' / ' + s.shares + '</b></div>' +
      '<h3 style="font-size:12.5px;margin:14px 0 4px">最近事件</h3>' +
      (recent || '<div class="tiny">还没有事件，去专注一次吧。</div>') +
      '<button class="btn primary wide" style="margin-top:14px" data-action="closeModal">知道了</button>',
      { locked: false });
  }

  /* ---------------- 漫画 ---------------- */
  function openComic(id) {
    const st = core.state();
    const comic = core.comicById(id);
    if (!comic) return;
    if (st.comics.indexOf(id) < 0) {
      PDM.ui.openModal('' +
        '<div class="reward-modal" style="text-align:center">' +
        '<h2 style="font-size:17px;margin-bottom:6px">《' + comic.title + '》还没解锁</h2>' +
        '<p class="tiny" style="line-height:1.7;margin-bottom:14px">累计专注到 ' + comic.req + ' 分钟会自动解锁；也可以看一段广告提前读。</p>' +
        '<div class="reward-actions"><button class="btn primary" data-action="adComic" data-id="' + id + '">看广告提前解锁</button>' +
        '<button class="btn ghost" data-action="closeModal">先去专注</button></div></div>');
      return;
    }
    uiState.comicId = id;
    uiState.comicPage = 0;
    core.markComicRead(id);
    $('comicWrap').classList.add('show');
    renderComicPage();
  }

  function renderComicPage() {
    const comic = core.comicById(uiState.comicId);
    if (!comic) return;
    const idx = uiState.comicPage;
    const pages = comic.panels.length;
    $('comicTitle').textContent = comic.title;
    $('comicPage').textContent = (idx + 1) + ' / ' + pages;
    $('comicBody').innerHTML = '<div class="comic-frame"><canvas id="comicCanvas"></canvas>' +
      '<div class="comic-cap">' + comic.panels[idx] + '</div></div>';
    const canvas = $('comicCanvas');
    X.drawComicPanel(canvas, comic, idx);
    $('comicPrev').disabled = idx <= 0;
    $('comicNext').textContent = idx >= pages - 1 ? '读完啦' : '下一页';
  }

  function comicNext() {
    const comic = core.comicById(uiState.comicId);
    if (!comic) return;
    if (uiState.comicPage >= comic.panels.length - 1) {
      closeComic();
      PDM.ui.toast('读完啦，小猫把故事收进了抽屉');
      PDM.ui.refreshHeader();
      return;
    }
    uiState.comicPage++;
    renderComicPage();
  }

  function comicPrev() {
    if (uiState.comicPage <= 0) return;
    uiState.comicPage--;
    renderComicPage();
  }

  function closeComic() {
    $('comicWrap').classList.remove('show');
    $('comicBody').innerHTML = '';
    uiState.comicId = null;
  }

  PDM.ui = Object.assign(PDM.ui, {
    renderLog: renderLog,
    openDecor: openDecor,
    openSettings: openSettings,
    openAnalytics: openAnalytics,
    openComic: openComic,
    renderComicPage: renderComicPage,
    comicNext: comicNext,
    comicPrev: comicPrev,
    closeComic: closeComic,
    weekday: weekday
  });
})(window.PDM);
