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

  // 默认值
  var _gridDefaults = {
    columns: 12, rows: 1,
    gutterH: 0, gutterV: 0,
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    marginLock: true,
    showGuides: true,
    showCellOverlay: true,
    showGutterGuides: true,
    overlayColor: '#0D99FF',
    overlayOpacity: 15
  };

  // BUG-11 修复: 从 localStorage 恢复时逐字段 fallback，防止旧版数据缺少新字段
  var _savedGridState = GM.Storage.get('grid_state');
  var gridState = {};
  for (var _key in _gridDefaults) {
    if (_gridDefaults.hasOwnProperty(_key)) {
      gridState[_key] = (_savedGridState && _savedGridState[_key] !== undefined)
        ? _savedGridState[_key]
        : _gridDefaults[_key];
    }
  }

  // 修复: localStorage 中旧版 opacity 过高(35)，强制修正为合理范围
  if (gridState.overlayOpacity > 20) {
    gridState.overlayOpacity = 15;
    GM.Storage.set('grid_state', gridState);
  }

  // BUG-1 修复: 实时预览版本号，防止快速切换参数导致的竞态条件
  var _previewVersion = 0;

  // 单位转换：将输入值（默认px）转换为文档单位，与 Calculator.calculateGrid 保持一致
  function _convertMargin(val, docUnit) {
    if (docUnit === 'pt') return val * 2.83465;
    if (docUnit === 'in') return val / 25.4;
    if (docUnit === 'cm') return val * 0.1;
    return val; // px 和 mm 无需转换
  }

  function _saveState() {
    GM.Storage.set('grid_state', gridState);
  }

  // 暴露当前网格状态，供其他模块（如 settings 批量操作）读取
  GM.getGridState = function () {
    return {
      columns: gridState.columns, rows: gridState.rows,
      gutterH: gridState.gutterH, gutterV: gridState.gutterV,
      marginTop: gridState.marginTop, marginRight: gridState.marginRight,
      marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
    };
  };

  /**
   * 实时预览：根据当前显示选项状态，立即更新画布
   * 无需点击"应用网格"即可看到效果
   */
  function _applyLivePreview() {
    if (!GM.currentDocInfo) {
      GM.showToast('请先打开文档', 'warning');
      return;
    }

    // BUG-1 修复: 递增版本号，只有最新一次预览才会写入画布
    var myVersion = ++_previewVersion;

    var result = GM.Calculator.calculateGrid({
      docWidth: GM.currentDocInfo.width, docHeight: GM.currentDocInfo.height,
      docUnit: GM.currentDocInfo.unit || 'px',
      columns: gridState.columns, rows: gridState.rows,
      gutterH: gridState.gutterH, gutterV: gridState.gutterV,
      marginTop: gridState.marginTop, marginRight: gridState.marginRight,
      marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
    });

    var gutterGuides = [];
    if (gridState.showGutterGuides && (gridState.gutterH > 0 || gridState.gutterV > 0)) {
      gutterGuides = _calcGutterGuides({
        docWidth: GM.currentDocInfo.width, docHeight: GM.currentDocInfo.height,
        docUnit: GM.currentDocInfo.unit || 'px',
        columns: gridState.columns, rows: gridState.rows,
        gutterH: gridState.gutterH, gutterV: gridState.gutterV,
        marginTop: gridState.marginTop, marginRight: gridState.marginRight,
        marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft
      });
    }

    // 每个 clear 独立 catch，避免一个失败阻塞全部
    var clear1 = GM.HostAdapter.clearGuides().catch(function() {});
    var clear2 = GM.HostAdapter.clearGridOverlay().catch(function() {});
    var clear3 = GM.HostAdapter.clearGutterGuides().catch(function() {});

    Promise.all([clear1, clear2, clear3]).then(function () {
      // BUG-1 修复: 清除完成后检查版本号，若已过期则跳过添加
      if (myVersion !== _previewVersion) return;

      var promises = [];

      if (gridState.showGuides && result.guides.length > 0) {
        promises.push(GM.HostAdapter.addGuides(result.guides).catch(function(e) {
          console.error('[DotGuide] addGuides 失败:', e);
        }));
      }
      if (gridState.showGutterGuides && gutterGuides.length > 0) {
        promises.push(GM.HostAdapter.addGutterGuides(gutterGuides).catch(function(e) {
          console.error('[DotGuide] addGutterGuides 失败:', e);
        }));
      }
      if (gridState.showCellOverlay) {
        var docUnit = GM.currentDocInfo.unit || 'px';
        promises.push(GM.HostAdapter.addGridOverlay({
          columns: gridState.columns, rows: gridState.rows,
          gutterH: _convertMargin(gridState.gutterH, docUnit),
          gutterV: _convertMargin(gridState.gutterV, docUnit),
          marginTop: _convertMargin(gridState.marginTop, docUnit),
          marginRight: _convertMargin(gridState.marginRight, docUnit),
          marginBottom: _convertMargin(gridState.marginBottom, docUnit),
          marginLeft: _convertMargin(gridState.marginLeft, docUnit),
          color: gridState.overlayColor, opacity: gridState.overlayOpacity
        }).catch(function(e) {
          console.error('[DotGuide] addGridOverlay 失败:', e);
        }));
      }

      if (promises.length > 0) {
        return Promise.all(promises);
      }
    }).then(function () {
      if (myVersion === _previewVersion) _saveState();
    }).catch(function (err) {
      console.error('[DotGuide] 实时预览失败:', err);
    });
  }


  /**
   * 计算间距边界辅助线
   * 在每个间距的左右（或上下）边缘各加一条参考线
   */
  function _calcGutterGuides(opts) {
    var w = opts.docWidth, h = opts.docHeight;
    var cols = opts.columns || 1, rows = opts.rows || 1;
    var docUnit = opts.docUnit || 'px';
    var gH = _convertMargin(opts.gutterH || 0, docUnit);
    var gV = _convertMargin(opts.gutterV || 0, docUnit);
    var mT = _convertMargin(opts.marginTop || 0, docUnit);
    var mR = _convertMargin(opts.marginRight || 0, docUnit);
    var mB = _convertMargin(opts.marginBottom || 0, docUnit);
    var mL = _convertMargin(opts.marginLeft || 0, docUnit);

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
      'padding:3px 8px;border-radius:var(--gm-radius-sm);font-size:var(--gm-font-size-sm);cursor:pointer;' +
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
    guideLabel.style.cssText = 'font-size:var(--gm-font-size-md);color:var(--gm-text-primary);line-height:1;';
    guideLabel.textContent = '显示参考线';
    guideRow.appendChild(guideLabel);
    guideRow.appendChild(GM.createToggleSwitch(gridState.showGuides, function (v) {
      gridState.showGuides = v; _saveState(); _applyLivePreview();
    }));
    optSection.appendChild(guideRow);

    // 间距辅助线开关
    var gutterGuideRow = document.createElement('div');
    gutterGuideRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var gutterGuideLabel = document.createElement('span');
    gutterGuideLabel.style.cssText = 'font-size:var(--gm-font-size-md);color:var(--gm-text-primary);line-height:1;';
    gutterGuideLabel.textContent = '显示间距边界线';
    gutterGuideRow.appendChild(gutterGuideLabel);
    gutterGuideRow.appendChild(GM.createToggleSwitch(gridState.showGutterGuides, function (v) {
      gridState.showGutterGuides = v; _saveState(); _applyLivePreview();
    }));
    optSection.appendChild(gutterGuideRow);

    // 色块开关（快速切换）
    var overlayRow = document.createElement('div');
    overlayRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var overlayLabel = document.createElement('span');
    overlayLabel.style.cssText = 'font-size:var(--gm-font-size-md);color:var(--gm-text-primary);line-height:1;';
    overlayLabel.textContent = '显示色块';
    overlayRow.appendChild(overlayLabel);
    overlayRow.appendChild(GM.createToggleSwitch(gridState.showCellOverlay, function (v) {
      gridState.showCellOverlay = v; _saveState(); _applyLivePreview();
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
        'padding:8px 10px;border-radius:var(--gm-radius-sm);background:var(--gm-bg-secondary);' +
        'font-size:var(--gm-font-size-sm);color:var(--gm-text-primary);line-height:1.8;';
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
          docUnit: GM.currentDocInfo.unit || 'px',
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
          var docUnit = GM.currentDocInfo.unit || 'px';
          promises.push(GM.HostAdapter.addGridOverlay({
            columns: gridState.columns,
            rows: gridState.rows,
            gutterH: _convertMargin(gridState.gutterH, docUnit),
            gutterV: _convertMargin(gridState.gutterV, docUnit),
            marginTop: _convertMargin(gridState.marginTop, docUnit),
            marginRight: _convertMargin(gridState.marginRight, docUnit),
            marginBottom: _convertMargin(gridState.marginBottom, docUnit),
            marginLeft: _convertMargin(gridState.marginLeft, docUnit),
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
              marginBottom: gridState.marginBottom, marginLeft: gridState.marginLeft,
              color: gridState.overlayColor, opacity: gridState.overlayOpacity
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
      'width:100%;padding:7px;border-radius:var(--gm-radius-sm);font-size:var(--gm-font-size-md);margin-top:4px;' +
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
      'width:100%;padding:6px;border-radius:var(--gm-radius-sm);font-size:var(--gm-font-size-md);' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
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
