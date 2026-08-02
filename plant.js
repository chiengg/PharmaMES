/* =====================================================================
 * plant.js — 多工厂 / 多组织 数据隔离（Q-02 落地）
 * 全局工厂切换器 + 行级/容器级数据隔离
 * 纯 ES5，无外部依赖。动态注入样式，避免改动各页 CSS。
 * 用法：
 *   1) header 放 <div id="plantSwitch"></div>
 *   2) 本脚本 <script src="plant.js"></script> 引入（已在 body 末或 head 注入）
 *   3) 行级隔离：元素带 data-ws="一车间" 自动按车间→工厂映射过滤
 *      容器级隔离：容器带 data-plant-scope="P1" 整块按工厂隔离
 * ===================================================================== */
(function () {
  'use strict';

  // —— 工厂模型（集团-基地-工厂-车间 四级）——
  var PLANTS = [
    { code: 'P0', name: '全厂视角', base: '集团', short: '全厂' },
    { code: 'P1', name: '上海一厂', base: '华东原料药基地', short: '上海一厂' },
    { code: 'P2', name: '上海二厂', base: '华东制剂基地', short: '上海二厂' },
    { code: 'P3', name: '广州厂', base: '华南综合基地', short: '广州厂' }
  ];

  // 车间 -> 工厂 映射（车间为数据行级维度）
  var WORKSHOP_TO_PLANT = {
    '一车间': 'P3', '二车间': 'P3', '三车间': 'P3',
    '合成一车间': 'P1', '合成二车间': 'P1', '精制车间': 'P1', '中试车间': 'P1',
    '制剂一车间': 'P2', '制剂二车间': 'P2'
  };

  var STORE_KEY = 'mes_plant';
  var current = localStorage.getItem(STORE_KEY) || 'P1';

  // —— 动态注入样式 ——
  function injectStyle() {
    if (document.getElementById('plantStyle')) return;
    var s = document.createElement('style');
    s.id = 'plantStyle';
    s.innerHTML =
      '.plant-switch{display:inline-flex;align-items:center;gap:6px;position:relative;}' +
      '.plant-switch .ps-trigger{display:inline-flex;align-items:center;gap:6px;background:var(--page,#fff);border:1px solid var(--border,#e2e8f0);border-radius:8px;padding:5px 10px;font-size:12px;color:var(--text,#1f2937);cursor:pointer;line-height:1;white-space:nowrap;}' +
      '.plant-switch .ps-trigger:hover{border-color:var(--primary-400,#378add);}' +
      '.plant-switch .ps-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex:none;}' +
      '.plant-switch .ps-caret{font-size:9px;opacity:.7;}' +
      '.plant-switch .ps-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:230px;background:#fff;border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 12px 32px rgba(15,35,70,.16);padding:6px;z-index:90;display:none;}' +
      '.plant-switch.open .ps-menu{display:block;}' +
      '.plant-switch .ps-item{display:flex;flex-direction:column;gap:1px;padding:8px 10px;border-radius:7px;cursor:pointer;}' +
      '.plant-switch .ps-item:hover{background:var(--page,#f5f7fa);}' +
      '.plant-switch .ps-item .ps-name{font-size:13px;color:var(--text,#1f2937);font-weight:500;}' +
      '.plant-switch .ps-item .ps-base{font-size:11px;color:var(--text-sec,#64748b);}' +
      '.plant-switch .ps-item.active{background:rgba(55,138,221,.10);}' +
      '.plant-switch .ps-item.active .ps-name{color:var(--primary-500,#2563eb);}' +
      '.plant-switch .ps-sep{height:1px;background:var(--border,#e2e8f0);margin:4px 2px;}' +
      '.plant-isolated-bar{padding:40px 24px;text-align:center;color:var(--text-sec,#64748b);font-size:13px;background:repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#f1f5f9 10px,#f1f5f9 20px);border:1px dashed var(--border,#e2e8f0);border-radius:10px;margin:8px 0;}' +
      '.plant-isolated-bar .pi-title{font-size:14px;font-weight:600;color:var(--text,#1f2937);margin-bottom:6px;}' +
      '.plant-isolated-bar .pi-lock{font-size:22px;margin-bottom:8px;}';
    document.head.appendChild(s);
  }

  function plantByCode(code) {
    for (var i = 0; i < PLANTS.length; i++) if (PLANTS[i].code === code) return PLANTS[i];
    return PLANTS[1];
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast show';
    t.textContent = msg;
    if (!document.getElementById('plantStyle')) injectStyle();
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); }, 1800);
  }

  // —— 隔离核心 ——
  function refresh() {
    var scope = current; // 当前工厂
    // 行级：data-plant-row（值=工厂码 P1/P2/P3），显式标记才参与隔离（避免与 data-ws 车间字段冲突）
    var rows = document.querySelectorAll('[data-plant-row]');
    for (var i = 0; i < rows.length; i++) {
      var pf = rows[i].getAttribute('data-plant-row');
      if (scope === 'P0' || !pf) { rows[i].style.display = ''; }
      else { rows[i].style.display = (pf === scope) ? '' : 'none'; }
    }
    // 容器级：data-plant-scope
    var scopes = document.querySelectorAll('[data-plant-scope]');
    for (var j = 0; j < scopes.length; j++) {
      var el = scopes[j];
      var sc = el.getAttribute('data-plant-scope');
      var bar = el.parentNode ? el.parentNode.querySelector('.plant-isolated-bar[data-for="' + (el.id || ('s' + j)) + '"]') : null;
      if (scope !== 'P0' && sc !== scope) {
        el.style.display = 'none';
        if (!bar && el.parentNode) {
          bar = document.createElement('div');
          bar.className = 'plant-isolated-bar';
          bar.setAttribute('data-for', el.id || ('s' + j));
          bar.innerHTML = '<div class="pi-lock">🔒</div><div class="pi-title">数据已按组织隔离</div><div>当前工厂「' + plantByCode(scope).short + '」无权访问「' + plantByCode(sc).short + '」的业务数据。<br>请切换至对应工厂，或申请跨厂数据授权（需集团管理员审批）。</div>';
          el.parentNode.insertBefore(bar, el.nextSibling);
        } else if (bar) { bar.style.display = ''; }
      } else {
        el.style.display = '';
        if (bar) bar.style.display = 'none';
      }
    }
  }

  // —— 切换器 UI ——
  function renderSwitches() {
    var mounts = document.querySelectorAll('#plantSwitch');
    for (var m = 0; m < mounts.length; m++) buildSwitch(mounts[m]);
  }

  function buildSwitch(mount) {
    mount.className = 'plant-switch';
    var cur = plantByCode(current);
    var html = '';
    html += '<div class="ps-trigger" onclick="PLANT.toggleMenu(this)"><span class="ps-dot"></span><span>' + cur.short + '</span><span class="ps-caret">▾</span></div>';
    html += '<div class="ps-menu">';
    for (var i = 0; i < PLANTS.length; i++) {
      var p = PLANTS[i];
      var active = (p.code === current) ? ' active' : '';
      html += '<div class="ps-item' + active + '" data-code="' + p.code + '" onclick="PLANT.pick(\'' + p.code + '\')"><span class="ps-name">' + p.name + (p.code === 'P0' ? '（集团）' : '') + '</span><span class="ps-base">' + p.base + ' · ' + p.code + '</span></div>';
    }
    html += '<div class="ps-sep"></div><div style="padding:6px 10px;font-size:11px;color:var(--text-sec,#64748b);">切换后将按工厂隔离业务数据</div>';
    html += '</div>';
    mount.innerHTML = html;
    mount.setAttribute('data-built', '1');
  }

  var PLANT = {
    list: function () { return PLANTS; },
    current: function () { return current; },
    plantOf: function (ws) { return WORKSHOP_TO_PLANT[ws] || null; },
    toggleMenu: function (el) {
      var sw = el.parentNode;
      sw.classList.toggle('open');
      // 点击外部关闭
      var close = function (e) { if (!sw.contains(e.target)) { sw.classList.remove('open'); document.removeEventListener('click', close); } };
      setTimeout(function () { document.addEventListener('click', close); }, 0);
    },
    pick: function (code) {
      current = code;
      localStorage.setItem(STORE_KEY, code);
      var sws = document.querySelectorAll('.plant-switch');
      for (var i = 0; i < sws.length; i++) buildSwitch(sws[i]);
      refresh();
      var p = plantByCode(code);
      toast('已切换至「' + (code === 'P0' ? '全厂视角' : p.short) + '」' + (code === 'P0' ? '' : '，业务数据已隔离'));
    },
    refresh: refresh,
    init: function () {
      injectStyle();
      renderSwitches();
      refresh();
    }
  };

  window.PLANT = PLANT;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { PLANT.init(); });
  else PLANT.init();
})();
