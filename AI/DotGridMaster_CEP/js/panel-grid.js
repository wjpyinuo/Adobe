/**
 * DotGridMaster Panel — 网格
 * 依赖：core.js, ui-components.js
 */

(function (GM) {
  'use strict';

  var gridState = {
    columns: 12, rows: 1,
    gutterH: 20, gutterV: 0,
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    marginLock: true
  };

  GM.renderGridPanel = function (container) {
    // 预设
    var presetSection = GM.createSection('快速预设');
    presetSection.appendChild(GM.createPresetList('grid', function (preset) {
      gridState.columns = preset.columns;
      gridState.rows = preset.rows;
      gridState.gutterH = preset.gutterH;
      gridState.gutterV = preset.gutterV;
      gridState.marginTop = preset.marginTop;
      gridState.marginRight = preset.marginRight;
      gridState.marginBottom = preset.marginBottom;
      gridState.marginLeft = preset.marginLeft;
      GM.renderGridPanel(container);
      GM.showToast('已加载预设: ' + preset.name, 'info');
    }));
    container.appendChild(presetSection);

    // 列/行设置
    var gridSection = GM.createSection('网格设置');
    gridSection.appendChild(GM.createNumberInput('列数', gridState.columns, 1, 100, 1, function (v) { gridState.columns = v; }).el);
    gridSection.appendChild(GM.createNumberInput('行数', gridState.rows, 1, 100, 1, function (v) { gridState.rows = v; }).el);
    gridSection.appendChild(GM.createNumberInput('列间距', gridState.gutterH, 0, 500, 1, function (v) { gridState.gutterH = v; }).el);
    gridSection.appendChild(GM.createNumberInput('行间距', gridState.gutterV, 0, 500, 1, function (v) { gridState.gutterV = v; }).el);
    container.appendChild(gridSection);

    // 边距设置
    var marginSection = GM.createSection('边距');

    var lockRow = document.createElement('div');
    lockRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px;';
    var lockBtn = document.createElement('button');
    lockBtn.textContent = gridState.marginLock ? '🔗 统一边距' : '🔓 独立边距';
    lockBtn.style.cssText =
      'padding:3px 8px;border-radius:3px;font-size:10px;cursor:pointer;' +
      'background:' + (gridState.marginLock ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)') + ';' +
      'color:#fff;border:none;';
    lockBtn.addEventListener('click', function () {
      gridState.marginLock = !gridState.marginLock;
      GM.renderGridPanel(container);
    });
    lockRow.appendChild(lockBtn);
    marginSection.appendChild(lockRow);

    if (gridState.marginLock) {
      marginSection.appendChild(GM.createNumberInput('全部边距', gridState.marginTop, 0, 500, 1, function (v) {
        gridState.marginTop = v; gridState.marginRight = v; gridState.marginBottom = v; gridState.marginLeft = v;
      }).el);
    } else {
      marginSection.appendChild(GM.createNumberInput('上', gridState.marginTop, 0, 500, 1, function (v) { gridState.marginTop = v; }).el);
      marginSection.appendChild(GM.createNumberInput('右', gridState.marginRight, 0, 500, 1, function (v) { gridState.marginRight = v; }).el);
      marginSection.appendChild(GM.createNumberInput('下', gridState.marginBottom, 0, 500, 1, function (v) { gridState.marginBottom = v; }).el);
      marginSection.appendChild(GM.createNumberInput('左', gridState.marginLeft, 0, 500, 1, function (v) { gridState.marginLeft = v; }).el);
    }
    container.appendChild(marginSection);

    // 应用按钮
    container.appendChild(GM.createApplyButton('✦ 应用网格', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      var result = GM.Calculator.calculateGrid({
        docWidth: GM.currentDocInfo.width, docHeight: GM.currentDocInfo.height,
        columns: gridState.columns, rows: gridState.rows,
        gutterH: gridState.gutterH, gutterV: gridState.gutterV,
        marginTop: gridState.marginTop, marginRight: gridState.marginRight,
        marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
      });
      return GM.HostAdapter.clearGuides().then(function () {
        return GM.HostAdapter.addGuides(result.guides);
      }).then(function () {
        GM.showToast('网格已应用 (' + result.guides.length + ' 条参考线)', 'success');
      });
    }));

    // 保存为预设
    var saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 保存为预设';
    saveBtn.style.cssText =
      'width:100%;padding:6px;border-radius:4px;font-size:11px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;margin-top:6px;';
    saveBtn.addEventListener('click', function () {
      var name = prompt('预设名称：');
      if (!name) return;
      GM.PresetManager.save('grid', {
        name: name, columns: gridState.columns, rows: gridState.rows,
        gutterH: gridState.gutterH, gutterV: gridState.gutterV,
        marginTop: gridState.marginTop, marginRight: gridState.marginRight,
        marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
      });
      GM.showToast('预设已保存', 'success');
      GM.renderGridPanel(container);
    });
    container.appendChild(saveBtn);
  };

})(DotGridMaster);
