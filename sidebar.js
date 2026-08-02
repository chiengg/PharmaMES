/**
 * PharmaMES 统一侧边栏导航 + 浏览标签
 * 单一数据源渲染导航；手风琴（仅展开一个一级菜单）；浏览标签页（可关闭）；基于 data-url 可靠路由。
 * 同时暴露 window.MES_ROUTES 供门户(index)使用。
 */
(function () {
  'use strict';

  /* ===== 单一导航数据源 ===== */
  var NAV = [
    { id: 'ws', name: '工作台', items: [
      { icon: '🧭', label: '生产驾驶舱', url: '生产监控大屏.html' },
      { icon: '📊', label: '决策分析', url: '决策分析.html' },
      { icon: '⏰', label: '我的待办', url: '我的待办.html' }
    ]},
    { id: 'prod', name: '生产管理', items: [
      { icon: '🗓', label: '生产计划', url: '生产计划.html' },
      { icon: '📋', label: '生产工单', url: '生产工单.html' },
      { icon: '🧪', label: '生产准备', url: '生产准备.html' },
      { icon: '⚗', label: '釜次管理', url: '釜次BOM管理.html' },
      { icon: '▶', label: '生产执行', url: '生产执行管理.html' },
      { icon: '📱', label: 'PDA 现场采集', url: 'PDA现场采集.html' },
      { icon: '≡', label: '工序动作管理', url: '工序动作管理.html' }
    ]},
    { id: 'qhse', name: '安质环管控', items: [
      { icon: '⚡', label: '动作监控预警', url: '实时预警.html' },
      { icon: '🔬', label: '质量控制', url: '质量控制.html' },
      { icon: '✅', label: '清场放行', url: '清场放行.html' },
      { icon: '⚠', label: '偏差/CAPA', url: '偏差CAPA.html' },
      { icon: '🔗', label: '批次追溯', url: '批次追溯.html' },
      { icon: '🗂', label: '电子批记录归档', url: '电子批记录归档.html' },
      { icon: '↻', label: '变更管理', url: '变更管理.html' }
    ]},
    { id: 'mat', name: '物料&设备', items: [
      { icon: '📦', label: '物料主数据', url: '物料主数据.html' },
      { icon: '⚖️', label: '称量配料', url: '称量配料.html' },
      { icon: '🤖', label: 'AI 投料推荐', url: 'AI投料推荐.html' },
      { icon: '🔧', label: '维护&校准', url: '维护校准.html' }
    ]},
    { id: 'md', name: '主数据&合规', items: [
      { icon: '📄', label: '工艺配方', url: '工艺配方.html' },
      { icon: '🧩', label: '动作库/BOM', url: '动作库BOM.html' },
      { icon: '🕵', label: '审计追踪', url: '审计追踪.html' }
    ]},
    { id: 'da', name: '数据报表', items: [
      { icon: '🏭', label: '产能釜次统计', url: '产能釜次统计报表.html' },
      { icon: '🛠', label: '设备管理报表', url: '设备管理报表.html' },
      { icon: '💡', label: '物耗能耗成本', url: '物耗能耗成本报表.html' },
      { icon: '🧪', label: '质量偏差追溯', url: '质量偏差追溯报表.html' },
      { icon: '📑', label: '生产计划执行', url: '生产计划执行报表.html' },
      { icon: '📦', label: '库存分析', url: '库存分析报表.html' }
    ]},
    { id: 'cfg', name: '基础配置', items: [
      { icon: '▦', label: '标准动作库', url: '标准动作库.html' },
      { icon: '💱', label: '数据接口', url: '数据接口.html' },
      { icon: '👤', label: '用户与权限设置', url: '用户与权限设置.html' },
      { icon: '🏢', label: '组织工厂管理', url: '组织工厂管理.html' },
      { icon: '🔌', label: '系统集成联调', url: '系统集成联调.html' }
    ]}
  ];

  /* 暴露给门户(index) */
  window.MES_ROUTES = [];
  NAV.forEach(function (g) {
    g.items.forEach(function (it) { window.MES_ROUTES.push({ key: it.label, url: it.url }); });
  });

  var rawCur = (location.pathname || '').split('/').pop() || '';
  var CURRENT = '';
  try { CURRENT = decodeURIComponent(rawCur); } catch (e) { CURRENT = rawCur; }
  var OPEN_KEY = 'mes_nav_open';
  var ALL_KEY = 'mes_sb_all';
  var TAB_KEY = 'mes_open_tabs';

  var LOGO = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect x="1" y="1" width="18" height="18" rx="3" fill="#FFFFFF" opacity="0.85"/><rect x="8" y="8" width="18" height="18" rx="3" fill="#FFFFFF" opacity="0.55"/><rect x="14" y="14" width="14" height="14" rx="3" fill="#FFFFFF" opacity="0.95"/></svg>';

  /* ===== CSS（仅当页面未自带侧边栏样式时注入基础样式；标签栏样式始终注入） ===== */
  var BASE = '' +
    '.app { display: flex; height: 100vh; }' +
    '.sidebar { width: 200px; min-width: 200px; background: var(--primary-800); color: #85B7EB; display: flex; flex-direction: column; overflow-y: auto; }' +
    '.sidebar-logo { padding: 14px 16px; border-bottom: 1px solid var(--primary-600); display: flex; align-items: center; gap: 10px; }' +
    '.logo-icon { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; flex: none; }' +
    '.sidebar-nav { padding: 8px 0; flex: 1; }' +
    '.nav-item { padding: 8px 16px 8px 36px; font-size: 12.5px; color: #85B7EB; cursor: pointer; position: relative; transition: all 0.15s; display: flex; align-items: center; gap: 7px; }' +
    '.nav-item:hover { background: var(--primary-900); color: #B5D4F4; }' +
    '.nav-item.active { background: var(--primary-600); color: #FFF; font-weight: 500; }' +
    '.nav-item.active::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--primary-400); }' +
    '.sidebar-footer { padding: 12px 20px; border-top: 1px solid var(--primary-600); font-size: 12px; color: #5DCAA5; display: flex; align-items: center; gap: 6px; }' +
    '.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--normal); }' +
    '.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }' +
    '.content { flex: 1; overflow-y: auto; padding: 14px 28px; }' +
    '.nav-group-head { padding: 14px 16px 5px; font-size: 11px; color: #6FA9DA; letter-spacing: 0.6px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; transition: color 0.15s; }' +
    '.nav-group-head:hover { color: #B5D4F4; }' +
    '.nav-group-head > span:first-child { font-weight: 500; }' +
    '.nav-caret { font-size: 10px; opacity: 0.75; transition: transform 0.18s; display: inline-block; }' +
    '.nav-group-items { overflow: hidden; }' +
    '.nav-group.collapsed .nav-caret { transform: rotate(-90deg); }' +
    '.nav-group.collapsed .nav-group-items { display: none; }' +
    '.sidebar-collapse { padding: 10px 16px; font-size: 12px; color: #85B7EB; cursor: pointer; display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--primary-600); transition: all 0.15s; }' +
    '.sidebar-collapse:hover { background: var(--primary-900); color: #B5D4F4; }' +
    '.collapse-caret { display: inline-block; transition: transform 0.2s; font-size: 14px; line-height: 1; }' +
    '.sidebar.collapsed { width: 56px; min-width: 56px; }' +
    '.sidebar.collapsed .collapse-caret { transform: rotate(180deg); }' +
    '.sidebar.collapsed .logo-text, .sidebar.collapsed .nav-group-head > span:first-child, .sidebar.collapsed .nav-item > span:last-child, .sidebar.collapsed .sidebar-footer > span:last-child { display: none; }' +
    '.sidebar.collapsed .nav-item { padding-left: 0; justify-content: center; }' +
    '.sidebar.collapsed .nav-group-head { justify-content: center; }' +
    /* 报告页等无自身顶栏时使用的顶栏样式（不影响已有 .topbar） */
    '.topbar.mes-topbar { height: 52px; min-height: 52px; background: var(--white); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }' +
    '.topbar.mes-topbar .topbar-right { display: flex; align-items: center; gap: 20px; }' +
    '.topbar.mes-topbar .breadcrumb { font-size: 13px; color: var(--text-sec); }' +
    '.topbar.mes-topbar .current { color: var(--text); font-weight: 500; }';

  var TAB = '' +
    '.tabbar { display: flex; align-items: center; gap: 4px; height: 38px; min-height: 38px; background: var(--white); border-bottom: 1px solid var(--border); padding: 0 12px; }' +
    '.tabbar-scroll { flex: 1; display: flex; align-items: center; gap: 4px; overflow-x: auto; height: 100%; }' +
    '.tabbar-scroll::-webkit-scrollbar { height: 6px; }' +
    '.tabbar-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }' +
    '.tab { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; font-size: 12.5px; color: var(--text-sec); background: var(--page); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; white-space: nowrap; transition: all 0.12s; }' +
    '.tab:hover { color: var(--primary-600); border-color: var(--primary-200); }' +
    '.tab.active { color: var(--primary-600); background: var(--primary-50); border-color: var(--primary-200); font-weight: 500; }' +
    '.tab-close { font-size: 13px; line-height: 1; opacity: 0.55; margin-left: 1px; }' +
    '.tab-close:hover { opacity: 1; color: #E5484D; }' +
    '.tabbar-actions { position: relative; display: inline-flex; align-items: center; margin-left: 8px; padding-left: 10px; border-left: 1px solid var(--border); z-index: 50; }' +
    '.tab-action-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border: 1px solid var(--border); border-radius: 6px; background: var(--white); color: var(--text-sec); cursor: pointer; font-size: 13px; line-height: 1; transition: all 0.12s; }' +
    '.tab-action-btn:hover { color: var(--primary-600); border-color: var(--primary-200); background: var(--primary-50); }' +
    '.tab-action-menu { display: none; position: absolute; top: calc(100% + 8px); right: 0; min-width: 124px; background: var(--white); border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); padding: 4px; z-index: 100; }' +
    '.tab-action-menu::before { content: ""; position: absolute; left: 0; right: 0; top: -12px; height: 12px; }' +
    '.tabbar-actions:hover .tab-action-menu, .tab-action-menu:hover { display: block; }' +
    '.tab-action-item { padding: 8px 12px; font-size: 13px; color: var(--text); border-radius: 6px; cursor: pointer; white-space: nowrap; }' +
    '.tab-action-item:hover { background: var(--page); color: var(--primary-600); }';

  function injectCSS() {
    if (document.getElementById('mesNavStyle')) return;
    var sb = document.getElementById('appSidebar');
    var needBase = true;
    try { if (sb && getComputedStyle(sb).flexDirection === 'column') needBase = false; } catch (e) {}
    var css = (needBase ? BASE : '') + TAB;
    var st = document.createElement('style');
    st.id = 'mesNavStyle';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function renderSidebar() {
    var sb = document.getElementById('appSidebar');
    if (!sb) return;
    var html = '<div class="sidebar-logo"><div class="logo-icon">' + LOGO + '</div><div class="logo-text"><div class="logo-name">PharmaMES</div><div class="logo-slogan">制药制造执行系统</div></div></div>';
    html += '<nav class="sidebar-nav">';
    NAV.forEach(function (g) {
      html += '<div class="nav-group" data-g="' + g.id + '">';
      html += '<div class="nav-group-head" data-g="' + g.id + '"><span>' + g.name + '</span><span class="nav-caret">▾</span></div>';
      html += '<div class="nav-group-items">';
      g.items.forEach(function (it) {
        var active = (it.url === CURRENT) ? ' active' : '';
        html += '<div class="nav-item' + active + '" data-url="' + it.url + '"><span>' + it.icon + '</span><span>' + it.label + '</span></div>';
      });
      html += '</div></div>';
    });
    html += '</nav>';
    html += '<div class="sidebar-collapse" id="sbCollapse"><span class="collapse-caret">‹</span><span id="lblAll">收起菜单</span></div>';
    html += '<div class="sidebar-footer"><span class="status-dot"></span><span>系统运行正常</span></div>';
    sb.innerHTML = html;
  }

  function getOpen() { try { return localStorage.getItem(OPEN_KEY) || ''; } catch (e) { return ''; } }
  function setOpen(id) { try { localStorage.setItem(OPEN_KEY, id || ''); } catch (e) {} }

  function applyAccordion() {
    var groups = document.querySelectorAll('.nav-group');
    if (!groups.length) return;
    var activeG = '';
    var act = document.querySelector('.nav-item.active');
    if (act) { var gp = act.closest('.nav-group'); if (gp) activeG = gp.getAttribute('data-g'); }
    var open = activeG || getOpen() || groups[0].getAttribute('data-g');
    groups.forEach(function (g) { g.classList.toggle('collapsed', g.getAttribute('data-g') !== open); });
    setOpen(open);
  }

  function bindSidebar() {
    document.querySelectorAll('.nav-group-head').forEach(function (h) {
      h.addEventListener('click', function () {
        var id = h.getAttribute('data-g');
        var g = document.querySelector('.nav-group[data-g="' + id + '"]');
        if (!g) return;
        var willOpen = g.classList.contains('collapsed');
        document.querySelectorAll('.nav-group').forEach(function (x) { x.classList.add('collapsed'); });
        if (willOpen) { g.classList.remove('collapsed'); setOpen(id); }
        else { setOpen(''); }
      });
    });
    document.querySelectorAll('.nav-item').forEach(function (it) {
      it.addEventListener('click', function () {
        var url = it.getAttribute('data-url');
        if (url) openTab(url);
      });
    });
    var sc = document.getElementById('sbCollapse');
    if (sc) {
      sc.addEventListener('click', function () {
        var sb = document.getElementById('appSidebar');
        sb.classList.toggle('collapsed');
        var all = sb.classList.contains('collapsed');
        try { localStorage.setItem(ALL_KEY, all ? '1' : '0'); } catch (e) {}
        var la = document.getElementById('lblAll');
        if (la) la.textContent = all ? '展开菜单' : '收起菜单';
      });
    }
  }

  /* ===== 浏览标签页 ===== */
  function loadTabs() { try { return JSON.parse(sessionStorage.getItem(TAB_KEY) || '[]'); } catch (e) { return []; } }
  function saveTabs(t) { try { sessionStorage.setItem(TAB_KEY, JSON.stringify(t)); } catch (e) {} }

  function tabLabel(url) {
    for (var i = 0; i < NAV.length; i++) {
      for (var j = 0; j < NAV[i].items.length; j++) {
        if (NAV[i].items[j].url === url) return NAV[i].items[j].label;
      }
    }
    var t = (document.title || '').replace(/^MES\s*精细化工\s*-?\s*/, '').replace(/^.*-\s*/, '');
    return t || url;
  }

  function renderTabs() {
    var bar = document.getElementById('tabBar');
    if (!bar) return;
    var tabs = loadTabs();
    var tabsHtml = '';
    tabs.forEach(function (t, i) {
      var act = (t.url === CURRENT) ? ' active' : '';
      tabsHtml += '<div class="tab' + act + '" data-url="' + t.url + '"><span class="tab-label">' + t.label + '</span><span class="tab-close" data-i="' + i + '">×</span></div>';
    });
    var actions =
      '<div class="tabbar-actions">' +
        '<button type="button" class="tab-action-btn" title="标签操作">✕</button>' +
        '<div class="tab-action-menu">' +
          '<div class="tab-action-item" data-act="others">关闭其他</div>' +
          '<div class="tab-action-item" data-act="all">关闭全部</div>' +
        '</div>' +
      '</div>';
    bar.innerHTML = '<div class="tabbar-scroll">' + tabsHtml + '</div>' + actions;
    bar.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        if (e.target.classList.contains('tab-close')) return;
        window.location.href = tab.getAttribute('data-url');
      });
    });
    bar.querySelectorAll('.tab-close').forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.stopPropagation();
        closeTab(parseInt(c.getAttribute('data-i'), 10));
      });
    });
    bar.querySelectorAll('.tab-action-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var act = item.getAttribute('data-act');
        if (act === 'others') closeOthers();
        else if (act === 'all') closeAll();
      });
    });
  }

  function closeOthers() {
    var tabs = loadTabs();
    var kept = tabs.filter(function (t) { return t.url === CURRENT; });
    if (kept.length === 0 && CURRENT) kept = [{ label: tabLabel(CURRENT), url: CURRENT }];
    saveTabs(kept);
    renderTabs();
  }

  function closeAll() {
    saveTabs([]);
    window.location.href = 'index.html';
  }

  function openTab(url) {
    var tabs = loadTabs();
    var has = tabs.some(function (t) { return t.url === url; });
    if (!has) tabs.push({ label: tabLabel(url), url: url });
    saveTabs(tabs);
    window.location.href = url;
  }

  function closeTab(i) {
    var tabs = loadTabs();
    var removed = tabs[i];
    tabs.splice(i, 1);
    saveTabs(tabs);
    if (removed && removed.url === CURRENT) {
      var next = tabs[i] || tabs[i - 1];
      window.location.href = next ? next.url : 'index.html';
    } else {
      renderTabs();
    }
  }

  function init() {
    injectCSS();
    renderSidebar();
    applyAccordion();
    bindSidebar();
    var tabs = loadTabs();
    var has = tabs.some(function (t) { return t.url === CURRENT; });
    if (!has && CURRENT) { tabs.push({ label: tabLabel(CURRENT), url: CURRENT }); saveTabs(tabs); }
    renderTabs();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
