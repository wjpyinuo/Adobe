/**
 * GridMaster Panel — 设置
 * 依赖：core.js, ui-components.js
 */

(function (GM) {
  'use strict';

  GM.renderSettingsPanel = function (container) {
    // 版本信息
    var aboutSection = GM.createSection('关于');
    var aboutCard = document.createElement('div');
    aboutCard.style.cssText = 'padding:12px;border-radius:4px;background:var(--gm-bg-secondary);border:1px solid var(--gm-border-default);margin-bottom:12px;';
    aboutCard.innerHTML =
      '<div style="font-size:14px;font-weight:700;margin-bottom:4px;">⊞ GridMaster</div>' +
      '<div style="font-size:10px;color:var(--gm-text-secondary);line-height:1.6;">' +
      '版本: 1.0.0 (CEP)<br>引擎: GridMaster Core<br>兼容: Illustrator 2023+<br>架构: CEP + ExtendScript</div>';
    aboutSection.appendChild(aboutCard);
    container.appendChild(aboutSection);

    // 批量操作
    var batchSection = GM.createSection('批量操作');
    var batchAllBtn = document.createElement('button');
    batchAllBtn.textContent = '📋 对所有画板应用当前网格';
    batchAllBtn.style.cssText = 'width:100%;padding:8px;border-radius:4px;font-size:11px;background:var(--gm-bg-tertiary);color:var(--gm-text-primary);border:1px solid var(--gm-border-default);cursor:pointer;margin-bottom:6px;';
    batchAllBtn.addEventListener('click', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      GM.HostAdapter.getAllArtboards().then(function (boards) {
        if (!boards || boards.length === 0) { GM.showToast('未找到画板', 'warning'); return; }
        var applyToBoard = function (index) {
          if (index >= boards.length) { GM.showToast('已对 ' + boards.length + ' 个画板应用网格', 'success'); return; }
          var board = boards[index];
          return GM.HostAdapter.setActiveArtboard(board.index).then(function () {
            var result = GM.Calculator.calculateGrid({
              docWidth: board.width, docHeight: board.height,
              columns: 12, rows: 1, gutterH: 20, gutterV: 0,
              marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
            });
            return GM.HostAdapter.addGuides(result.guides);
          }).then(function () { return applyToBoard(index + 1); });
        };
        return applyToBoard(0);
      }).catch(function (err) { GM.showToast('批量操作失败: ' + err.message, 'error'); });
    });
    batchSection.appendChild(batchAllBtn);
    container.appendChild(batchSection);

    // 数据管理
    var dataSection = GM.createSection('数据管理');

    var exportBtn = document.createElement('button');
    exportBtn.textContent = '📤 导出所有预设';
    exportBtn.style.cssText = 'width:100%;padding:6px;border-radius:4px;font-size:11px;background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);border:1px solid var(--gm-border-default);cursor:pointer;margin-bottom:6px;';
    exportBtn.addEventListener('click', function () {
      var data = GM.Storage.get('custom_presets');
      if (!data || Object.keys(data).length === 0) { GM.showToast('没有自定义预设可导出', 'warning'); return; }
      var json = JSON.stringify(data, null, 2);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(json).then(function () { GM.showToast('预设 JSON 已复制到剪贴板', 'success'); });
      } else { prompt('复制以下内容：', json); }
    });
    dataSection.appendChild(exportBtn);

    var importBtn = document.createElement('button');
    importBtn.textContent = '📥 导入预设';
    importBtn.style.cssText = exportBtn.style.cssText;
    importBtn.addEventListener('click', function () {
      var json = prompt('粘贴预设 JSON：');
      if (!json) return;
      try {
        var data = JSON.parse(json);
        GM.Storage.set('custom_presets', data);
        GM.PresetManager._customPresets = data;
        GM.showToast('预设已导入', 'success');
      } catch (e) { GM.showToast('JSON 格式错误', 'error'); }
    });
    dataSection.appendChild(importBtn);

    var clearDataBtn = document.createElement('button');
    clearDataBtn.textContent = '🗑 清除所有自定义预设';
    clearDataBtn.style.cssText = 'width:100%;padding:6px;border-radius:4px;font-size:11px;background:var(--gm-bg-tertiary);color:var(--gm-accent-danger);border:1px solid var(--gm-accent-danger);cursor:pointer;margin-bottom:6px;';
    clearDataBtn.addEventListener('click', function () {
      if (!confirm('确定清除所有自定义预设？此操作不可恢复。')) return;
      GM.Storage.remove('custom_presets');
      GM.PresetManager._customPresets = {};
      GM.showToast('已清除', 'success');
    });
    dataSection.appendChild(clearDataBtn);
    container.appendChild(dataSection);

    // 调试
    var debugSection = GM.createSection('调试');
    var refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 刷新文档信息';
    refreshBtn.style.cssText = 'width:100%;padding:6px;border-radius:4px;font-size:11px;background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);border:1px solid var(--gm-border-default);cursor:pointer;margin-bottom:6px;';
    refreshBtn.addEventListener('click', function () { GM.refreshDocInfo(); GM.showToast('已刷新', 'info'); });
    debugSection.appendChild(refreshBtn);

    var testBtn = document.createElement('button');
    testBtn.textContent = '🧪 测试宿主连接';
    testBtn.style.cssText = refreshBtn.style.cssText;
    testBtn.addEventListener('click', function () {
      GM.HostAdapter.getDocumentInfo().then(function (info) {
        GM.showToast('连接正常: ' + info.name + ' (' + info.width + '×' + info.height + ')', 'success');
      }).catch(function (err) { GM.showToast('连接失败: ' + err.message, 'error'); });
    });
    debugSection.appendChild(testBtn);
    container.appendChild(debugSection);
  };

})(GridMaster);
