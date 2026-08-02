/**
 * 精细化工MES系统 - 全局侧边栏导航路由
 * 已设计页面直接跳转；未设计页面统一进入「建设中」占位页。
 */
(function () {
  var ROUTES = [
    { key: '生产驾驶舱',   url: '生产监控大屏.html' },
    { key: '我的待办',     url: '我的待办.html' },
    { key: '生产计划执行', url: '生产计划执行报表.html' },
    { key: '生产计划',     url: '生产计划.html' },
    { key: '生产工单',     url: '生产工单.html' },
    { key: '生产准备',     url: '生产准备.html' },
    { key: '生产执行',     url: '生产执行管理.html' },
    { key: 'PDA 现场采集', url: 'PDA现场采集.html' },
    { key: '釜次管理',     url: '釜次BOM管理.html' },
    { key: '工序动作管理', url: '工序动作管理.html' },
    { key: '动作监控预警', url: '实时预警.html' },
    { key: '质量控制',     url: '质量控制.html' },
    { key: '清场放行',     url: '清场放行.html' },
    { key: '批次追溯',     url: '批次追溯.html' },
    { key: '电子批记录归档', url: '电子批记录归档.html' },
    { key: '变更管理',     url: '变更管理.html' },
    { key: '偏差/CAPA',    url: '偏差CAPA.html' },
    { key: '物料主数据',   url: '物料主数据.html' },
    { key: '称量配料',     url: '称量配料.html' },
    { key: 'AI 投料推荐', url: 'AI投料推荐.html' },
    { key: '维护&校准',    url: '维护校准.html' },
    { key: '工艺配方',     url: '工艺配方.html' },
    { key: '动作库/BOM',  url: '动作库BOM.html' },
    { key: '审计追踪',     url: '审计追踪.html' },
    { key: '标准动作库',   url: '标准动作库.html' },
    { key: '数据接口',     url: '数据接口.html' },
    { key: '用户与权限设置', url: '用户与权限设置.html' },
    { key: '组织工厂管理', url: '组织工厂管理.html' },
    { key: '系统集成联调', url: '系统集成联调.html' },
    { key: '决策分析',     url: '决策分析.html' },
    { key: '产能釜次统计', url: '产能釜次统计报表.html' },
    { key: '设备管理报表', url: '设备管理报表.html' },
    { key: '物耗能耗成本', url: '物耗能耗成本报表.html' },
    { key: '质量偏差追溯', url: '质量偏差追溯报表.html' },
    { key: '库存分析',     url: '库存分析报表.html' }
  ];
  window.MES_ROUTES = ROUTES;

  function bind() {
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var text = (this.textContent || '').replace(/\s/g, '');
        for (var i = 0; i < ROUTES.length; i++) {
          if (text.indexOf(ROUTES[i].key) > -1) {
            window.location.href = ROUTES[i].url;
            return;
          }
        }
        items.forEach(function (n) { n.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
