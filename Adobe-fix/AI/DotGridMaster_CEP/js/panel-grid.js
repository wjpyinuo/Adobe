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

  // 网格面板状态（持久化到 localStorage）
  var gridState = GM.Storage.get('grid_state') || {
    columns: 6,
    rows: 6,
    gutterH: 0,
    gutterV: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    showGuides: true,       // 显示参考线（列/行分隔线）
    showCellOverlay: true,  // 显示单元格覆盖层（可视化间距）
    overlayColor: '#0D99FF',
    overlayOpacity: 8
  };

  function _saveState() {
    GM.Storage.set('grid_state', gridState);
  }

  // ============================
  // 渲染网格面板
  // ============================

  GM.renderGridPanel = function (container) {
    container.innerHTML = '';

    // ---- 预设 ----
    var presetSection = GM.createSection('网格预设');
    presetSection.appendChild(GM.createPresetList('grid', function (preset) {
      gridState.columns = preset.columns || 1;
      gridState.rows = preset.rows || 1;
      gridState.gutterH = preset.gutterH || 0;
      gridState.gutterV = preset.gutterV || 0;
      gridState.marginTop = preset.marginTop || 0;
      gridState.marginRight = preset.marginRight || 0;
      gridState.marginBottom = preset.marginBottom || 0;
      gridState.marginLeft = preset.marginLeft || 0;
      _saveState();
      GM.renderGridPanel(container);
    }));
    container.appendChild(presetSection);

    // ---- 列设置 ----
    var colSection = GM.createSection('列设置');
    colSection.appendChild(GM.createInput('列数', gridState.columns, 1, 24, 1, function (v) {
      gridState.columns = parseInt(v) || 1;
      _saveState();
    }));
    colSection.appendChild(GM.createInput('列间距 (px)', gridState.gutterH, 0, 500, 1, function (v) {
      gridState.gutterH = parseFloat(v) || 0;
      _saveState();
    }));
    container.appendChild(colSection);

    // ---- 行设置 ----
    var rowSection = GM.createSection('行设置');
    rowSection.appendChild(GM.createInput('行数', gridState.rows, 1, 24, 1, function (v) {
      gridState.rows = parseInt(v) || 1;
      _saveState();
    }));
    rowSection.appendChild(GM.createInput('行间距 (px)', gridState.gutterV, 0, 500, 1, function (v) {
      gridState.gutterV = parseFloat(v) || 0;
      _saveState();
    }));
    container.appendChild(rowSection);

    // ---- 边距设置 ----
    var marginSection = GM.createSection('边距 (px)');
    marginSection.appendChild(GM.createInput('上', gridState.marginTop, 0, 2000, 1, function (v) {
      gridState.marginTop = parseFloat(v) || 0; _saveState();
    }));
    marginSection.appendChild(GM.createInput('右', gridState.marginRight, 0, 2000, 1, function (v) {
      gridState.marginRight = parseFloat(v) || 0; _saveState();
    }));
    marginSection.appendChild(GM.createInput('下', gridState.marginBottom, 0, 2000, 1, function (v) {
      gridState.marginBottom = parseFloat(v) || 0; _saveState();
    }));
    marginSection.appendChild(GM.createInput('左', gridState.marginLeft, 0, 2000, 1, function (v) {
      gridState.marginLeft = parseFloat(v) || 0; _saveState();
    }));
    container.appendChild(marginSection);

    // ---- 显示选项 ----
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

    // ---- 预览信息 ----
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

    // ---- 应用按钮 ----
    container.appendChild(GM.createApplyButton('⊞ 应用网格', function () {
      if (!GM.currentDocInfo) {
        GM.showToast('请先打开文档', 'warning');
        return;
      }
      return _applyGrid(container);
    }));

    // ---- 清除按钮 ----
    var clearBtn = document.createElement('button');
    clearBtn.textContent = '✕ 清除网格';
    clearBtn.style.cssText =
      'width:100%;padding:7px;border-radius:4px;font-size:11px;margin-top:4px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-accent-danger);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';
    clearBtn.addEventListener('mouseenter', function () { clearBtn.style.borderColor = 'var(--gm-accent-danger)'; });
    clearBtn.addEventListener('mouseleave', function () { clearBtn.style.borderColor = 'var(--gm-border-default)'; });
    clearBtn.addEventListener('click', function () {
      var promises = [
        GM.HostAdapter.clearGuides(),
        GM.HostAdapter.clearGridOverlay()
      ];
      Promise.all(promises).then(function () {
        GM.showToast('网格已清除', 'success');
      }).catch(function (e) {
        GM.showToast('清除失败: ' + e.message, 'error');
      });
    });
    container.appendChild(clearBtn);
  };

  // ============================
  // 应用网格（核心逻辑）
  // ============================

  function _applyGrid(container) {
    var state = gridState;
    var info = GM.currentDocInfo;
    var promises = [];

    // ① 先清除旧的网格内容（防止重复叠加）
    promises.push(GM.HostAdapter.clearGuides());
    promises.push(GM.HostAdapter.clearGridOverlay());

    // ② 计算网格
    var result = GM.Calculator.calculateGrid({
      docWidth: info.width,
      docHeight: info.height,
      docUnit: info.unit || 'px',
      columns: state.columns,
      rows: state.rows,
      gutterH: state.gutterH,
      gutterV: state.gutterV,
      marginTop: state.marginTop,
      marginRight: state.marginRight,
      marginBottom: state.marginBottom,
      marginLeft: state.marginLeft
    });

    // ③ 添加参考线（列/行分隔线）
    if (state.showGuides && result.guides.length > 0) {
      promises.push(GM.HostAdapter.addGuides(result.guides));
    }

    // ④ 添加单元格覆盖层（可视化间距）
    if (state.showCellOverlay) {
      promises.push(GM.HostAdapter.addGridOverlay({
        columns: state.columns,
        rows: state.rows,
        gutterH: state.gutterH,
        gutterV: state.gutterV,
        marginTop: state.marginTop,
        marginRight: state.marginRight,
        marginBottom: state.marginBottom,
        marginLeft: state.marginLeft,
        color: state.overlayColor,
        opacity: state.overlayOpacity
      }));
    }

    // ⑤ 记录撤销
    if (typeof UndoManager !== 'undefined') {
      UndoManager.record(
        UndoManager.ActionTypes.ADD_GRID,
        {
          guides: result.guides,
          gridParams: {
            columns: state.columns,
            rows: state.rows,
            gutterH: state.gutterH,
            gutterV: state.gutterV,
            marginTop: state.marginTop,
            marginRight: state.marginRight,
            marginBottom: state.marginBottom,
            marginLeft: state.marginLeft
          }
        },
        '网格 ' + state.columns + '×' + state.rows
      );
    }

    return Promise.all(promises).then(function () {
      var msg = '网格已应用: ' + state.columns + '×' + state.rows;
      if (state.gutterH > 0 || state.gutterV > 0) {
        msg += ' (间距 ' + state.gutterH + '/' + state.gutterV + ')';
      }
      GM.showToast(msg, 'success');
    }).catch(function (err) {
      GM.showToast('应用失败: ' + err.message, 'error');
    });
  }

  // ============================
  // 工具函数
  // ============================

  function _fmt(val) {
    if (val === Math.floor(val)) return String(val);
    return val.toFixed(1);
  }

})(DotGridMaster);
