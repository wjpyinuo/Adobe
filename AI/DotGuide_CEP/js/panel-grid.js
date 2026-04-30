/**
 * DotGuide Panel — 网格
 * 依赖：core.js, ui-components.js
 *
 * 修复:
 *   1. 列间距/行间距可视化 — 使用 GridOverlay 绘制带间距的单元格
 *   2. 应用网格不再重复创建图层 — 先清除旧内容再添加
 *
 * 增强:
 *   3. 间距边界辅助线 — 在间距两侧各加一条参考线
 *   4. 间距默认值为 0
 *   5. 色块快速切换按钮
 */

(function (GM) {
  'use strict';

  var gridState = GM.Storage.get('grid_state') || {
    columns: 12, rows: 1,
    gutterH: 0, gutterV: 0,
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    marginLock: true,
    showGuides: true,
    showCellOverlay: true,
    showGutterGuides: true,
    overlayColor: '#0D99FF',
    overlayOpacity: 35
  };

  function _saveState() {
    GM.Storage.set('grid_state', gridState);
  }

  /**
   * 计算间距边界辅助线
   * 在每个间距的左右（或上下）边缘各加一条参考线
   */
  function _calcGutterGuides(opts) {
    var w = opts.docWidth, h = opts.docHeight;
    var cols = opts.columns || 1, rows = opts.rows || 1;
    var gH = opts.gutterH || 0, gV = opts.gutterV || 0;
    var mT = opts.marginTop || 0, mR = opts.marginRight || 0;
    var mB = opts.marginBottom || 0, mL = opts.marginLeft || 0;

    var guides = [];
    if (gH <= 0 && gV <= 0) return guides;

    var availW = w - mL - mR;
    var availH = h - mT - mB;
    var totalGutterH = (cols - 1) * gH;
    var totalGutterV = (rows - 1) * gV;
    var colWidth = (availW - totalGutterH) / cols;
    var rowHeight = (availH - totalGutterV) / rows;

    // 列间距边界（垂直线）
    if (gH > 0 && cols > 1) {
      var x = mL + colWidth;
      for (var c = 0; c < cols - 1; c++) {
        guides.push({ orientation: 'vertical', position: x });
        guides.push({ orientation: 'vertical', position: x + gH });
        x += colWidth + gH;
      }
    }

    // 行间距边界（水平线）
    if (gV > 0 && rows > 1) {
      var y = mT + rowHeight;
      for (var r = 0; r < rows - 1; r++) {
        guides.push({ orientation: 'horizontal', position: y });
        guides.push({ orientation: 'horizontal', position: y + gV });
        y += rowHeight + gV;
      }
    }

    return guides;
  }

  GM.renderGridPanel = function (container) {
    // 清空容器，防止重复渲染
    container.innerHTML = '';

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
    }, function () { GM.renderGridPanel(container); }));
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
      marginSection.appendChild(GM.createNumberInput('下', gridState.marginBottom, 0, 500, 1, function (v) { gridState.marginBottom = v; }).el);
      marginSection.appendChild(GM.createNumberInput('左', gridState.marginLeft, 0, 500, 1, function (v) { gridState.marginLeft = v; }).el);
      marginSection.appendChild(GM.createNumberInput('右', gridState.marginRight, 0, 500, 1, function (v) { gridState.marginRight = v; }).el);
    }
    container.appendChild(marginSection);

    // 显示选项
    var optSection = GM.createSection('显示选项');

    // 参考线开关
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

    // 间距辅助线开关
    var gutterGuideRow = document.createElement('div');
    gutterGuideRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var gutterGuideLabel = document.createElement('span');
    gutterGuideLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    gutterGuideLabel.textContent = '显示间距边界线';
    gutterGuideRow.appendChild(gutterGuideLabel);
    gutterGuideRow.appendChild(GM.createToggleSwitch(gridState.showGutterGuides, function (v) {
      gridState.showGutterGuides = v; _saveState();
    }));
    optSection.appendChild(gutterGuideRow);

    // 色块开关（快速切换）
    var overlayRow = document.createElement('div');
    overlayRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var overlayLabel = document.createElement('span');
    overlayLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    overlayLabel.textContent = '显示色块';
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

      // 计算间距边界辅助线
      var gutterGuides = [];
      if (gridState.showGutterGuides && (gridState.gutterH > 0 || gridState.gutterV > 0)) {
        gutterGuides = _calcGutterGuides({
          docWidth: GM.currentDocInfo.width, docHeight: GM.currentDocInfo.height,
          columns: gridState.columns, rows: gridState.rows,
          gutterH: gridState.gutterH, gutterV: gridState.gutterV,
          marginTop: gridState.marginTop, marginRight: gridState.marginRight,
          marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
        });
      }

      // 先清除旧内容（串行，确保清除完成后再添加）
      return Promise.all([
        GM.HostAdapter.clearGuides(),
        GM.HostAdapter.clearGridOverlay(),
        GM.HostAdapter.clearGutterGuides()
      ]).then(function () {
        var promises = [];

        // 添加参考线（不含间距边界线）
        if (gridState.showGuides && result.guides.length > 0) {
          promises.push(GM.HostAdapter.addGuides(result.guides));
        }

        // 添加间距边界辅助线（独立图层，橙色醒目）
        if (gridState.showGutterGuides && gutterGuides.length > 0) {
          promises.push(GM.HostAdapter.addGutterGuides(gutterGuides));
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

        return Promise.all(promises);
      }).then(function () {
        // 记录撤销
        if (typeof UndoManager !== 'undefined') {
          UndoManager.record(
            UndoManager.ActionTypes.ADD_GRID,
            { guides: result.guides, gutterGuides: gutterGuides, gridParams: {
              columns: gridState.columns, rows: gridState.rows,
              gutterH: gridState.gutterH, gutterV: gridState.gutterV,
              marginTop: gridState.marginTop, marginRight: gridState.marginRight,
              marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
            }},
            '网格 ' + gridState.columns + '×' + gridState.rows
          );
        }

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
        GM.HostAdapter.clearGridOverlay(),
        GM.HostAdapter.clearGutterGuides()
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

})(DotGuide);
