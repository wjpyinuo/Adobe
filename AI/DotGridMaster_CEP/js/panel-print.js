/**
 * DotGridMaster Panel — 印刷出血
 * 依赖：core.js, ui-components.js
 */

(function (GM) {
  'use strict';

  var printState = {
    bleedTop: 3, bleedRight: 3, bleedBottom: 3, bleedLeft: 3,
    bleedLinked: true, trimMarks: true, registrationMarks: true,
    colorBar: false, foldLines: [], spineWidth: 0,
    showBleedOverlay: true, bleedColor: '#FF375F', bleedOpacity: 10
  };

  GM.renderPrintPanel = function (container) {
    // 出血设置
    var bleedSection = GM.createSection('出血 (Bleed)');

    var linkRow = document.createElement('div');
    linkRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var linkLabel = document.createElement('span');
    linkLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    linkLabel.textContent = '四边等距';
    linkRow.appendChild(linkLabel);
    linkRow.appendChild(GM.createToggleSwitch(printState.bleedLinked, function (v) {
      printState.bleedLinked = v;
      if (v) { printState.bleedRight = printState.bleedTop; printState.bleedBottom = printState.bleedTop; printState.bleedLeft = printState.bleedTop; }
      container.innerHTML = '';
      GM.renderPrintPanel(container);
    }));
    bleedSection.appendChild(linkRow);

    if (printState.bleedLinked) {
      bleedSection.appendChild(GM.createNumberInput('出血值 (mm)', printState.bleedTop, 0, 20, 0.5, function (v) {
        printState.bleedTop = v; printState.bleedRight = v; printState.bleedBottom = v; printState.bleedLeft = v;
      }).el);
    } else {
      bleedSection.appendChild(GM.createNumberInput('上 (mm)', printState.bleedTop, 0, 20, 0.5, function (v) { printState.bleedTop = v; }).el);
      bleedSection.appendChild(GM.createNumberInput('右 (mm)', printState.bleedRight, 0, 20, 0.5, function (v) { printState.bleedRight = v; }).el);
      bleedSection.appendChild(GM.createNumberInput('下 (mm)', printState.bleedBottom, 0, 20, 0.5, function (v) { printState.bleedBottom = v; }).el);
      bleedSection.appendChild(GM.createNumberInput('左 (mm)', printState.bleedLeft, 0, 20, 0.5, function (v) { printState.bleedLeft = v; }).el);
    }

    // 常用出血预设
    var bleedPresets = document.createElement('div');
    bleedPresets.style.cssText = 'display:flex;gap:4px;margin-top:6px;';
    var presetValues = [{ label: '2mm', value: 2 }, { label: '3mm', value: 3 }, { label: '5mm', value: 5 }, { label: '1/8"', value: 3.175 }, { label: '1/4"', value: 6.35 }];
    for (var pi = 0; pi < presetValues.length; pi++) {
      (function (preset) {
        var btn = document.createElement('button');
        var isActive = printState.bleedTop === preset.value && printState.bleedLinked;
        btn.textContent = preset.label;
        btn.style.cssText =
          'flex:1;padding:4px 2px;border-radius:3px;font-size:9px;cursor:pointer;' +
          'border:1px solid ' + (isActive ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';' +
          'background:' + (isActive ? 'var(--gm-accent-primary)' : 'var(--gm-bg-secondary)') + ';' +
          'color:' + (isActive ? '#fff' : 'var(--gm-text-secondary)') + ';';
        btn.addEventListener('click', function () {
          printState.bleedTop = preset.value; printState.bleedRight = preset.value;
          printState.bleedBottom = preset.value; printState.bleedLeft = preset.value;
          printState.bleedLinked = true;
          container.innerHTML = '';
          GM.renderPrintPanel(container);
        });
        bleedPresets.appendChild(btn);
      })(presetValues[pi]);
    }
    bleedSection.appendChild(bleedPresets);
    container.appendChild(bleedSection);

    // 印刷标记选项
    var marksSection = GM.createSection('印刷标记');
    var markOptions = [
      { key: 'trimMarks', label: '裁切标记', icon: '✂' },
      { key: 'registrationMarks', label: '套准标记', icon: '⊕' },
      { key: 'colorBar', label: '色彩条', icon: '🎨' },
      { key: 'showBleedOverlay', label: '出血区域可视化', icon: '🔲' }
    ];
    for (var mi = 0; mi < markOptions.length; mi++) {
      (function (opt) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';
        var label = document.createElement('span');
        label.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
        label.textContent = opt.icon + ' ' + opt.label;
        row.appendChild(label);
        row.appendChild(GM.createToggleSwitch(printState[opt.key], function (v) { printState[opt.key] = v; }));
        marksSection.appendChild(row);
      })(markOptions[mi]);
    }
    container.appendChild(marksSection);

    // 书脊设置
    var spineSection = GM.createSection('书脊 / 折线（可选）');
    spineSection.appendChild(GM.createNumberInput('书脊宽度 (mm)', printState.spineWidth, 0, 50, 0.5, function (v) { printState.spineWidth = v; }).el);

    var foldHint = document.createElement('div');
    foldHint.style.cssText = 'font-size:9px;color:var(--gm-text-tertiary);margin-bottom:6px;';
    foldHint.textContent = '折线位置（从左边距，逗号分隔，单位mm）';
    spineSection.appendChild(foldHint);

    var foldInput = document.createElement('input');
    foldInput.type = 'text';
    foldInput.placeholder = '例: 100, 200, 300';
    foldInput.value = printState.foldLines.join(', ');
    foldInput.style.cssText = 'width:100%;padding:5px 8px;border-radius:3px;font-size:11px;background:var(--gm-bg-tertiary);color:var(--gm-text-primary);border:1px solid var(--gm-border-default);box-sizing:border-box;';
    foldInput.addEventListener('change', function () {
      var val = foldInput.value.trim();
      printState.foldLines = val === '' ? [] : val.split(',').map(function (s) { return parseFloat(s.trim()); }).filter(function (n) { return !isNaN(n) && n > 0; });
    });
    spineSection.appendChild(foldInput);
    container.appendChild(spineSection);

    // Canvas 预览
    var previewSection = GM.createSection('预览');
    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:10px;';
    var canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 150;
    canvas.style.cssText = 'background:#111;border-radius:4px;border:1px solid var(--gm-border-default);';
    _drawPrintPreview(canvas);
    canvasWrap.appendChild(canvas);
    previewSection.appendChild(canvasWrap);
    container.appendChild(previewSection);

    // 应用按钮
    container.appendChild(GM.createApplyButton('✦ 应用印刷标记', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      GM.Units.checkUnit('mm', '印刷标记');
      return GM.HostAdapter.applyPrintMarks({
        bleed: { top: printState.bleedTop, right: printState.bleedRight, bottom: printState.bleedBottom, left: printState.bleedLeft },
        marks: { trim: printState.trimMarks, registration: printState.registrationMarks, colorBar: printState.colorBar },
        spine: { width: printState.spineWidth, folds: printState.foldLines },
        visualize: printState.showBleedOverlay
      }).then(function () { GM.showToast('印刷标记已生成', 'success'); })
      .catch(function (err) { GM.showToast('生成失败: ' + err.message, 'error'); });
    }));
  };

  function _drawPrintPreview(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    var docW = w * 0.6, docH = h * 0.6;
    var dx = (w - docW) / 2, dy = (h - docH) / 2;
    if (printState.showBleedOverlay) {
      ctx.fillStyle = 'rgba(255, 55, 95, 0.15)';
      ctx.fillRect(dx - 10, dy - 10, docW + 20, docH + 20);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx, dy, docW, docH);
    if (printState.trimMarks) {
      ctx.strokeStyle = '#FF375F';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(dx - 15, dy); ctx.lineTo(dx - 5, dy);
      ctx.moveTo(dx, dy - 15); ctx.lineTo(dx, dy - 5);
      ctx.stroke();
    }
  }

})(DotGridMaster);
