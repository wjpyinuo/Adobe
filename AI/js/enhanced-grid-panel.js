// ============================
// P1 增强版网格面板（补丁代码，插入到 renderGridPanel 尾部）
// ============================

/**
* 在 renderGridPanel 函数末尾、应用按钮之前，插入以下内容
*/

function _renderGridAdvancedOptions(container) {
// 实时预览开关
container.appendChild(createPreviewToggle());

// 可视化覆盖层
var overlaySection = createSection('可视化覆盖层');

// 开关行
var toggleRow = document.createElement('div');
toggleRow.style.cssText =
'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';

var toggleLabel = document.createElement('span');
toggleLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
toggleLabel.textContent = '显示网格色块';

var toggle = _createToggleSwitch(gridState.showOverlay, function (enabled) {
gridState.showOverlay = enabled;
if (!enabled) {
HostAdapter.clearGridOverlay();
}
container.innerHTML = '';
renderGridPanel(container);
});

toggleRow.appendChild(toggleLabel);
toggleRow.appendChild(toggle);
overlaySection.appendChild(toggleRow);

if (gridState.showOverlay) {
// 颜色选择器
var colorPicker = createColorPicker(
'覆盖层颜色',
gridState.overlayColor,
        gridState.overlayColor,
        ['#0D99FF', '#FF6B00', '#BF5AF2', '#34C759', '#FF375F', '#FF9500',
         '#5856D6', '#00C7BE', '#30B0C7', '#AF52DE', '#007AFF', '#64D2FF'],
        function (color) {
          gridState.overlayColor = color;
        }
      );
      overlaySection.appendChild(colorPicker.el);

      // 透明度滑块
      var opacityCtrl = createOpacitySlider(
        '覆盖层透明度',
        gridState.overlayOpacity,
        1, 50,
        function (v) {
          gridState.overlayOpacity = v;
        }
      );
      overlaySection.appendChild(opacityCtrl.el);

      // 应用覆盖层按钮
      var applyOverlayBtn = document.createElement('button');
      applyOverlayBtn.textContent = '🎨 应用覆盖层';
      applyOverlayBtn.style.cssText =
        'width:100%;padding:7px;border-radius:4px;font-size:11px;' +
        'background:var(--gm-bg-tertiary);color:var(--gm-accent-primary);' +
        'border:1px solid var(--gm-accent-primary);cursor:pointer;transition:all 0.15s;' +
        'margin-bottom:4px;';

      applyOverlayBtn.addEventListener('mouseenter', function () {
        applyOverlayBtn.style.background = 'rgba(13,153,255,0.1)';
      });
      applyOverlayBtn.addEventListener('mouseleave', function () {
        applyOverlayBtn.style.background = 'var(--gm-bg-tertiary)';
      });

      applyOverlayBtn.addEventListener('click', function () {
        if (!currentDocInfo) {
          showToast('请先打开文档', 'warning');
          return;
        }
        HostAdapter.addGridOverlay({
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
        }).then(function (result) {
          showToast('网格覆盖层已应用', 'success');
        }).catch(function (err) {
          showToast('覆盖层失败: ' + err.message, 'error');
        });
      });
      overlaySection.appendChild(applyOverlayBtn);

      // 清除覆盖层按钮
      var clearOverlayBtn = document.createElement('button');
      clearOverlayBtn.textContent = '✕ 清除覆盖层';
      clearOverlayBtn.style.cssText =
        'width:100%;padding:6px;border-radius:4px;font-size:10px;' +
        'background:transparent;color:var(--gm-text-tertiary);' +
        'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';

      clearOverlayBtn.addEventListener('mouseenter', function () {
        clearOverlayBtn.style.color = 'var(--gm-accent-danger)';
        clearOverlayBtn.style.borderColor = 'var(--gm-accent-danger)';
      });
      clearOverlayBtn.addEventListener('mouseleave', function () {
        clearOverlayBtn.style.color = 'var(--gm-text-tertiary)';
        clearOverlayBtn.style.borderColor = 'var(--gm-border-default)';
      });

      clearOverlayBtn.addEventListener('click', function () {
        HostAdapter.clearGridOverlay().then(function () {
          showToast('覆盖层已清除', 'info');
        });
      });
      overlaySection.appendChild(clearOverlayBtn);
    }

    container.appendChild(overlaySection);

    // 网格线颜色设置（影响参考线路径的颜色，非原生参考线）
    var lineStyleSection = createSection('参考线样式');

    var lineColorPicker = createColorPicker(
      '参考线颜色',
      gridState.guideColor || '#00FFFF',
      ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF6B00', '#0D99FF',
       '#BF5AF2', '#FF375F', '#FFFFFF', '#999999', '#666666', '#333333'],
      function (color) {
        gridState.guideColor = color;
      }
    );
    lineStyleSection.appendChild(lineColorPicker.el);

    container.appendChild(lineStyleSection);

    // Canvas 预览
    var previewSection = createSection('网格预览');
    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText =
      'width:100%;display:flex;justify-content:center;margin-bottom:10px;';

    var canvas = document.createElement('canvas');
    var canvasH = 120;
    var canvasW;
    if (currentDocInfo) {
      canvasW = Math.round(canvasH * (currentDocInfo.width / currentDocInfo.height));
      if (canvasW > 220) {
        canvasW = 220;
        canvasH = Math.round(canvasW * (currentDocInfo.height / currentDocInfo.width));
      }
    } else {
      canvasW = 160;
    }
    canvas.width = canvasW;
    canvas.height = canvasH;
    canvas.style.cssText =
      'background:#1a1a1a;border-radius:4px;border:1px solid var(--gm-border-default);';

    _drawGridPreview(canvas);
    canvasWrap.appendChild(canvas);
    previewSection.appendChild(canvasWrap);
    container.appendChild(previewSection);
  }

  /**
   * 在 Canvas 上绘制网格预览
   */
  function _drawGridPreview(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 背景
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // 画板边框
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    if (!currentDocInfo) return;

    var scaleX = w / currentDocInfo.width;
    var scaleY = h / currentDocInfo.height;

    var mT = gridState.marginTop * scaleY;
    var mR = gridState.marginRight * scaleX;
    var mB = gridState.marginBottom * scaleY;
    var mL = gridState.marginLeft * scaleX;

    var cols = gridState.columns;
    var rows = gridState.rows;
    var gH = gridState.gutterH * scaleX;
    var gV = gridState.gutterV * scaleY;

    var availW = w - mL - mR;
    var availH = h - mT - mB;
    var totalGutterH = (cols - 1) * gH;
    var totalGutterV = (rows - 1) * gV;
    var colW = (availW - totalGutterH) / cols;
    var rowH = (availH - totalGutterV) / rows;

    // 边距区域（灰色半透明）
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    // 上边距
    if (mT > 0) ctx.fillRect(0, 0, w, mT);
    // 下边距
    if (mB > 0) ctx.fillRect(0, h - mB, w, mB);
    // 左边距
    if (mL > 0) ctx.fillRect(0, mT, mL, h - mT - mB);
    // 右边距
    if (mR > 0) ctx.fillRect(w - mR, mT, mR, h - mT - mB);

    // 网格色块
    var overlayColor = gridState.overlayColor || '#0D99FF';
    var rgb = _hexToRGBValues(overlayColor);
    var alpha = gridState.showOverlay ? (gridState.overlayOpacity / 100) : 0.06;

    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) {
        var x = mL + c * (colW + gH);
        var y = mT + r * (rowH + gV);

        ctx.fillStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
        ctx.fillRect(x, y, colW, rowH);
      }
    }

    // 网格线
    ctx.strokeStyle = gridState.guideColor || '#00FFFF';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.6;

    // 列线
    for (var ci = 0; ci <= cols; ci++) {
      var lx;
      if (ci === 0) {
        lx = mL;
      } else if (ci === cols) {
        lx = w - mR;
      } else {
        lx = mL + ci * colW + (ci - 1) * gH + gH;
      }
      ctx.beginPath();
      ctx.moveTo(lx, mT);
      ctx.lineTo(lx, h - mB);
      ctx.stroke();

      // 列右边线（gutter 左边界）
      if (ci < cols) {
        var rx = mL + (ci + 1) * colW + ci * gH;
        ctx.beginPath();
        ctx.moveTo(rx, mT);
        ctx.lineTo(rx, h - mB);
        ctx.stroke();
      }
    }

    // 行线
    for (var ri = 0; ri <= rows; ri++) {
      var ly;
      if (ri === 0) {
        ly = mT;
      } else if (ri === rows) {
        ly = h - mB;
      } else {
        ly = mT + ri * rowH + (ri - 1) * gV + gV;
      }
      ctx.beginPath();
      ctx.moveTo(mL, ly);
      ctx.lineTo(w - mR, ly);
      ctx.stroke();

      if (ri < rows) {
        var ry = mT + (ri + 1) * rowH + ri * gV;
        ctx.beginPath();
        ctx.moveTo(mL, ry);
        ctx.lineTo(w - mR, ry);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    // 尺寸标注
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';

    if (colW > 20) {
      var realColW = (currentDocInfo.width - gridState.marginLeft - gridState.marginRight -
        (cols - 1) * gridState.gutterH) / cols;
      ctx.fillText(Math.round(realColW) + '', mL + colW / 2, mT + 10);
    }
  }

  /**
   * 辅助函数：十六进制转 RGB 值
   */
  function _hexToRGBValues(hex) {
    var clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16)
    };
  }

  // ============================
  // 通用开关组件
  // ============================

  /**
   * 创建开关组件
   * @param {boolean} initialValue - 初始状态
   * @param {function} onChange - 变化回调
   * @returns {HTMLElement}
   */
  function _createToggleSwitch(initialValue, onChange) {
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'width:36px;height:20px;border-radius:10px;cursor:pointer;transition:all 0.2s;' +
      'background:' + (initialValue ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)') + ';' +
      'border:1px solid ' + (initialValue ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';' +
      'position:relative;flex-shrink:0;';

    var knob = document.createElement('div');
    knob.style.cssText =
      'width:16px;height:16px;border-radius:50%;background:#fff;' +
      'position:absolute;top:1px;transition:left 0.2s;' +
      'left:' + (initialValue ? '17px' : '1px') + ';' +
      'box-shadow:0 1px 3px rgba(0,0,0,0.3);';
    wrap.appendChild(knob);

    var state = initialValue;

    wrap.addEventListener('click', function () {
      state = !state;
      wrap.style.background = state ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)';
      wrap.style.borderColor = state ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)';
      knob.style.left = state ? '17px' : '1px';
      if (onChange) onChange(state);
    });

    return wrap;
  }

  // ============================
  // gridState 扩展属性（在 gridState 定义处追加）
  // ============================

  // 在 index.js 中找到 var gridState = { ... } 的定义，追加以下属性：
  // gridState.showOverlay = false;
  // gridState.overlayColor = '#0D99FF';
  // gridState.overlayOpacity = 8;
  // gridState.guideColor = '#00FFFF';

  // ============================
  // renderGridPanel 集成指引
  // ============================

  /**
   * 在 renderGridPanel 函数中，找到 "应用网格" 按钮创建代码的 **前面**，
   * 插入以下一行调用：
   *
   *   _renderGridAdvancedOptions(container);
   *
   * 完整上下文示例：
   *
   *   // ... 预设选择、参数输入等 ...
   *
   *   _renderGridAdvancedOptions(container);  // <-- 插入此行
   *
   *   container.appendChild(createApplyButton('✦ 应用网格', function () {
   *     // ... 原有应用逻辑 ...
   *   }));
   */
