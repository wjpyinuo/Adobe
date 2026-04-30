/**
 * DotGridMaster Panel — 网格
 * 依赖：core.js, ui-components.js
 *
 * 修复:
 *   1. 列间距/行间距可视化 — 使用 GridOverlay 绘制带间距的单元格
 *   2. 应用网格不再重复创建图层 — 先清除旧内容再添加
 */

(function (GM) {
  'use strict';

  var gridState = GM.Storage.get('grid_state') || {
    columns: 12, rows: 1,
    gutterH: 20, gutterV: 0,
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    marginLock: true,
    showGuides: true,
    showCellOverlay: true,
    overlayColor: '#0D99FF',
    overlayOpacity: 8
  };

  function _saveState() {
    GM.Storage.set('grid_state', gridState);
  }

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
    gridSection.appendChild(GM.createNumberInput('列数', gridState.columns, 1, 100, 1, function (v) { gridState.columns = v; GM.triggerPreview('grid', gridState); }).el);
    gridSection.appendChild(GM.createNumberInput('行数', gridState.rows, 1, 100, 1, function (v) { gridState.rows = v; GM.triggerPreview('grid', gridState); }).el);
    gridSection.appendChild(GM.createNumberInput('列间距', gridState.gutterH, 0, 500, 1, function (v) { gridState.gutterH = v; GM.triggerPreview('grid', gridState); }).el);
    gridSection.appendChild(GM.createNumberInput('行间距', gridState.gutterV, 0, 500, 1, function (v) { gridState.gutterV = v; GM.triggerPreview('grid', gridState); }).el);
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

    // 显示选项
    var optSection = GM.createSection('显示选项');

    var guideRow = document.createElement('div');
    guideRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var guideLabel = document.createElement('span');
    guideLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    guideLabel.textContent = '显示参考线';
    guideRow.appendChild(guideLabel);
    guideRow.appendChild(GM.createToggleSwitch(gridState.showGuides, function (v) {
      gridState.showGuides = v; _saveState();
    }));
    optSection.appendChild(guideRow);

    var overlayRow = document.createElement('div');
    overlayRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var overlayLabel = document.createElement('span');
    overlayLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    overlayLabel.textContent = '显示单元格 (间距可视化)';
    overlayRow.appendChild(overlayLabel);
    overlayRow.appendChild(GM.createToggleSwitch(gridState.showCellOverlay, function (v) {
      gridState.showCellOverlay = v; _saveState();
    }));
    optSection.appendChild(overlayRow);
    container.appendChild(optSection);

    // 预览信息
    if (GM.currentDocInfo) {
      var previewSection = GM.createSection('网格预览');
      var info = GM.currentDocInfo;
      var availW = info.width - gridState.marginLeft - gridState.marginRight;
      var availH = info.height - gridState.marginTop - gridState.marginBottom;
      var totalGutterH = (gridState.columns - 1) * gridState.gutterH;
      var totalGutterV = (gridState.rows - 1) * gridState.gutterV;
      var colWidth = (availW - totalGutterH) / gridState.columns;
      var rowHeight = (availH - totalGutterV) / gridState.rows;

      var previewText = document.createElement('div');
      previewText.style.cssText =
        'padding:8px 10px;border-radius:4px;background:var(--gm-bg-secondary);' +
        'font-size:10px;color:var(--gm-text-secondary);line-height:1.8;';
      previewText.innerHTML =
        '可用区域: ' + _fmt(availW) + ' × ' + _fmt(availH) + '<br>' +
        '单元格: ' + _fmt(colWidth) + ' × ' + _fmt(rowHeight) + '<br>' +
        '列间距总计: ' + _fmt(totalGutterH) + ' | 行间距总计: ' + _fmt(totalGutterV) + '<br>' +
        '总列数: ' + gridState.columns + ' | 总行数: ' + gridState.rows + ' = ' + (gridState.columns * gridState.rows) + ' 个单元格';
      previewSection.appendChild(previewText);
      container.appendChild(previewSection);
    }

    // 应用按钮
    container.appendChild(GM.createApplyButton('⊞ 应用网格', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      var result = GM.Calculator.calculateGrid({
        docWidth: GM.currentDocInfo.width, docHeight: GM.currentDocInfo.height,
        docUnit: GM.currentDocInfo.unit || 'px',
        columns: gridState.columns, rows: gridState.rows,
        gutterH: gridState.gutterH, gutterV: gridState.gutterV,
        marginTop: gridState.marginTop, marginRight: gridState.marginRight,
        marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
      });

      var promises = [];
      // 先清除旧内容（防止重复叠加）
      promises.push(GM.HostAdapter.clearGuides());
      promises.push(GM.HostAdapter.clearGridOverlay());

      // 添加参考线
      if (gridState.showGuides && result.guides.length > 0) {
        promises.push(GM.HostAdapter.addGuides(result.guides));
      }

      // 添加单元格覆盖层（可视化间距）
      if (gridState.showCellOverlay) {
        promises.push(GM.HostAdapter.addGridOverlay({
          columns: gridState.columns,
          rows: gridState.rows,
          gutterH: gridState.gutterH,
          gutterV: gridState.gutterV,
          marginTop: gridState.marginTop,
          marginRight: gridState.marginRight,
          marginBottom: gridState.marginBottom,
          marginLeft: gridState.marginLeft,
          color: gridState.overlayColor,
          opacity: gridState.overlayOpacity
        }));
      }

      // 记录撤销
      if (typeof UndoManager !== 'undefined') {
        UndoManager.record(
          UndoManager.ActionTypes.ADD_GRID,
          { guides: result.guides, gridParams: {
            columns: gridState.columns, rows: gridState.rows,
            gutterH: gridState.gutterH, gutterV: gridState.gutterV,
            marginTop: gridState.marginTop, marginRight: gridState.marginRight,
            marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
          }},
          '网格 ' + gridState.columns + '×' + gridState.rows
        );
      }

      return Promise.all(promises).then(function () {
        var msg = '网格已应用: ' + gridState.columns + '×' + gridState.rows;
        if (gridState.gutterH > 0 || gridState.gutterV > 0) {
          msg += ' (间距 ' + gridState.gutterH + '/' + gridState.gutterV + ')';
        }
        GM.showToast(msg, 'success');
      }).catch(function (err) {
        GM.showToast('应用失败: ' + err.message, 'error');
      });
    }));

    // 清除按钮
    var clearBtn = document.createElement('button');
    clearBtn.textContent = '✕ 清除网格';
    clearBtn.style.cssText =
      'width:100%;padding:7px;border-radius:4px;font-size:11px;margin-top:4px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-accent-danger);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';
    clearBtn.addEventListener('mouseenter', function () { clearBtn.style.borderColor = 'var(--gm-accent-danger)'; });
    clearBtn.addEventListener('mouseleave', function () { clearBtn.style.borderColor = 'var(--gm-border-default)'; });
    clearBtn.addEventListener('click', function () {
      Promise.all([
        GM.HostAdapter.clearGuides(),
        GM.HostAdapter.clearGridOverlay()
      ]).then(function () {
        GM.showToast('网格已清除', 'success');
      }).catch(function (e) {
        GM.showToast('清除失败: ' + e.message, 'error');
      });
    });
    container.appendChild(clearBtn);

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

  // ============================
  // 工具函数
  // ============================

  function _fmt(val) {
    if (val === Math.floor(val)) return String(val);
    return val.toFixed(1);
  }

})(DotGridMaster);
