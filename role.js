/* =====================================================================
 * role.js — 字段级 / 操作级权限（Q-07 落地）
 * 全局角色切换器 + 字段级可见性 + 操作级拦截
 * 纯 ES5，无外部依赖。与 plant.js（组织/工厂隔离）共同构成
 * 「组织 × 角色」双层权限。动态注入样式，避免改动各页 CSS。
 *
 * 用法：
 *   1) header 放 <div id="roleSwitch"></div>
 *   2) 本脚本 <script src="role.js"></script> 引入（body 末）
 *   3) 字段级可见性（对任意元素加属性）：
 *        data-role-min="2"      仅当 用户层级 >= 2 可见（操作员0/车间1/工厂2/集团3）
 *        data-role-max="1"      仅当 用户层级 <= 1 可见
 *        data-role-show="admin,plant_mgr"  仅列出的角色码可见
 *        data-role-hide="operator"         列出的角色码隐藏
 *   4) 操作级拦截（对按钮/可点元素加属性）：
 *        data-role-act-min="2"  层级不足时点击被拦截并提示
 *        data-role-act-show="admin,plant_mgr"
 *   5) 动态渲染后调用 ROLE.refresh() 重新应用（抽屉/表格重渲时）
 * ===================================================================== */
(function () {
  'use strict';

  // —— 角色模型（层级：operator 0 / ws_mgr 1 / plant_mgr 2 / admin 3）——
  var ROLES = [
    { code: 'admin',    name: '集团管理员', level: 3, scope: '全集团 · 跨厂可见 · 可配', color: '#8B5CF6' },
    { code: 'plant_mgr', name: '工厂管理者', level: 2, scope: '本工厂 · 可配本厂', color: '#378ADD' },
    { code: 'ws_mgr',   name: '车间管理者', level: 1, scope: '本车间 · 受限配置', color: '#1FA971' },
    { code: 'operator', name: '操作员',     level: 0, scope: '本岗 · 仅查看/执行', color: '#E8A33D' }
  ];

  var STORE_KEY = 'mes_role';
  var currentCode = localStorage.getItem(STORE_KEY) || 'plant_mgr';

  function roleByCode(code) {
    for (var i = 0; i < ROLES.length; i++) if (ROLES[i].code === code) return ROLES[i];
    return ROLES[1];
  }
  function cur() { return roleByCode(currentCode); }
  function curLevel() { return cur().level; }

  // —— 动态样式 ——
  function injectStyle() {
    if (document.getElementById('roleStyle')) return;
    var s = document.createElement('style');
    s.id = 'roleStyle';
    s.innerHTML =
      '.role-switch{display:inline-flex;align-items:center;gap:6px;position:relative;}' +
      '.role-switch .rs-trigger{display:inline-flex;align-items:center;gap:6px;background:var(--page,#fff);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:5px 10px;font-size:12px;color:var(--text,#1f2937);cursor:pointer;line-height:1;white-space:nowrap;}' +
      '.role-switch .rs-trigger:hover{border-color:var(--primary-400,#378add);}' +
      '.role-switch .rs-dot{width:7px;height:7px;border-radius:50%;flex:none;}' +
      '.role-switch .rs-caret{font-size:9px;opacity:.7;}' +
      '.role-switch .rs-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:240px;background:#fff;border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 12px 32px rgba(15,35,70,.16);padding:6px;z-index:91;display:none;}' +
      '.role-switch.open .rs-menu{display:block;}' +
      '.role-switch .rs-item{display:flex;flex-direction:column;gap:1px;padding:8px 10px;border-radius:7px;cursor:pointer;}' +
      '.role-switch .rs-item:hover{background:var(--page,#f5f7fa);}' +
      '.role-switch .rs-item .rs-name{font-size:13px;color:var(--text,#1f2937);font-weight:500;display:flex;align-items:center;gap:7px;}' +
      '.role-switch .rs-item .rs-scope{font-size:11px;color:var(--text-sec,#64748b);margin-left:14px;}' +
      '.role-switch .rs-item.active{background:rgba(55,138,221,.10);}' +
      '.role-switch .rs-item.active .rs-name{color:var(--primary-500,#2563eb);}' +
      '.role-switch .rs-dot-s{width:7px;height:7px;border-radius:50%;flex:none;}' +
      '.role-switch .rs-sep{height:1px;background:var(--border,#e2e8f0);margin:4px 2px;}' +
      '.role-readonly-tip{font-size:11.5px;color:var(--text-sec,#64748b);background:var(--bg,#f4f6f9);border:1px dashed var(--border,#e2e8f0);border-radius:8px;padding:8px 12px;margin:6px 0;}' +
      '.role-readonly-tip b{color:var(--text,#1f2937);}';
    document.head.appendChild(s);
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast show';
    t.textContent = msg;
    if (!document.getElementById('roleStyle')) injectStyle();
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); }, 1800);
  }

  // —— 可见性核心 ——
  function applyVisibility() {
    var lvl = curLevel();
    var code = currentCode;
    // 字段级
    var all = document.querySelectorAll('[data-role-min],[data-role-max],[data-role-show],[data-role-hide]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var show = true;
      var mn = el.getAttribute('data-role-min');
      var mx = el.getAttribute('data-role-max');
      var sh = el.getAttribute('data-role-show');
      var hd = el.getAttribute('data-role-hide');
      if (mn !== null && lvl < parseInt(mn, 10)) show = false;
      if (mx !== null && lvl > parseInt(mx, 10)) show = false;
      if (sh !== null) { var arr = sh.split(','); if (arr.indexOf(code) < 0) show = false; }
      if (hd !== null) { var arr2 = hd.split(','); if (arr2.indexOf(code) >= 0) show = false; }
      el.style.display = show ? '' : 'none';
    }
  }

  // —— 操作级拦截（捕获阶段）——
  function guard(e) {
    var el = e.target;
    while (el && el !== document.body) {
      if (el.getAttribute) {
        var mn = el.getAttribute('data-role-act-min');
        var sh = el.getAttribute('data-role-act-show');
        var blocked = false;
        if (mn !== null && curLevel() < parseInt(mn, 10)) blocked = true;
        if (sh !== null && sh.split(',').indexOf(currentCode) < 0) blocked = true;
        if (blocked) {
          e.preventDefault(); e.stopPropagation();
          toast('当前角色「' + cur().name + '」无权限执行该操作，需「' + needName(mn, sh) + '」角色');
          return;
        }
      }
      el = el.parentNode;
    }
  }
  function needName(mn, sh) {
    if (mn !== null) {
      for (var i = 0; i < ROLES.length; i++) if (ROLES[i].level === parseInt(mn, 10)) return ROLES[i].name;
    }
    if (sh !== null) {
      var arr = sh.split(','); var names = [];
      for (var j = 0; j < ROLES.length; j++) if (arr.indexOf(ROLES[j].code) >= 0) names.push(ROLES[j].name);
      return names.join('/');
    }
    return '更高';
  }

  function refresh() { applyVisibility(); }

  // —— 切换器 UI ——
  function renderSwitches() {
    var mounts = document.querySelectorAll('#roleSwitch');
    for (var m = 0; m < mounts.length; m++) buildSwitch(mounts[m]);
  }

  function buildSwitch(mount) {
    mount.className = 'role-switch';
    var c = cur();
    var html = '';
    html += '<div class="rs-trigger" onclick="ROLE.toggleMenu(this)"><span class="rs-dot" style="background:' + c.color + '"></span><span>' + c.name + '</span><span class="rs-caret">▾</span></div>';
    html += '<div class="rs-menu">';
    for (var i = 0; i < ROLES.length; i++) {
      var r = ROLES[i];
      var active = (r.code === currentCode) ? ' active' : '';
      html += '<div class="rs-item' + active + '" data-code="' + r.code + '" onclick="ROLE.pick(\'' + r.code + '\')"><span class="rs-name"><span class="rs-dot-s" style="background:' + r.color + '"></span>' + r.name + '</span><span class="rs-scope">' + r.scope + '</span></div>';
    }
    html += '<div class="rs-sep"></div><div style="padding:6px 10px;font-size:11px;color:var(--text-sec,#64748b);">切换后按角色重算字段/操作权限</div>';
    html += '</div>';
    mount.innerHTML = html;
    mount.setAttribute('data-built', '1');
  }

  var ROLE = {
    list: function () { return ROLES; },
    current: function () { return currentCode; },
    level: function () { return curLevel(); },
    name: function () { return cur().name; },
    toggleMenu: function (el) {
      var sw = el.parentNode;
      sw.classList.toggle('open');
      var close = function (e) { if (!sw.contains(e.target)) { sw.classList.remove('open'); document.removeEventListener('click', close); } };
      setTimeout(function () { document.addEventListener('click', close); }, 0);
    },
    pick: function (code) {
      currentCode = code;
      localStorage.setItem(STORE_KEY, code);
      var sws = document.querySelectorAll('.role-switch');
      for (var i = 0; i < sws.length; i++) buildSwitch(sws[i]);
      applyVisibility();
      toast('已切换角色为「' + cur().name + '」，字段/操作权限已重算');
    },
    refresh: refresh,
    init: function () {
      injectStyle();
      renderSwitches();
      applyVisibility();
      document.addEventListener('click', guard, true);
    }
  };

  window.ROLE = ROLE;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { ROLE.init(); });
  else ROLE.init();
})();
