// ============================
// P2-15: 印刷出血面板
// ============================

var printState = {
bleedTop: 3,
bleedRight: 3,
bleedBottom: 3,
bleedLeft: 3,
bleedLinked: true,
trimMarks: true,
registrationMarks: true,
colorBar: false,
foldLines: [],
spineWidth: 0,
showBleedOverlay: true,
bleedColor: '#FF375F',
bleedOpacity: 10
};

function renderPrintPanel(container) {
// 出血设置
var bleedSection = createSection('出血 (Bleed)');

// 链接锁
var linkRow = document.createElement('div');
linkRow.style.cssText =
'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';

var linkLabel = document.createElement('span');
linkLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
linkLabel.textContent = '四边等距';

var linkToggle = _createToggleSwitch(printState.bleedLinked, function (v) {
printState.bleedLinked = v;
if (v) {
// 同步所有值
printState.bleedRight = printState.bleedTop;
printState.bleedBottom = printState.bleedTop;
printState.bleedLeft = printState.bleedTop;
}
container.innerHTML = '';
renderPrintPanel(container);
});

linkRow.appendChild(linkLabel);
linkRow.appendChild(linkToggle);
bleedSection.appendChild(linkRow);

if (printState.bleedLinked) {
// 单一输入
var bleedInput = createNumberInput('出血值 (mm)', printState.bleedTop, 0, 20, 0.5,
function (v) {
printState.bleedTop = v;
printState.bleedRight = v;
printState.bleedBottom = v;
printState.bleedLeft = v;
}
);
bleedSection.appendChild(bleedInput.el);
} else {
// 四边独立输入
var bTop = createNumberInput('上 (mm)', printState.bleedTop, 0, 20, 0.5,
function (v) { printState.bleedTop = v; });
var bRight = createNumberInput('右 (mm)', printState.bleedRight, 0, 20, 0.5,
function (v) { printState.bleedRight = v; });
var bBottom = createNumberInput('下 (mm)', printState.bleedBottom, 0, 20, 0.5,
function (v) { printState.bleedBottom = v; });
var bLeft = createNumberInput('左 (mm)', printState.bleedLeft, 0, 20, 0.5,
function (v) { printState.bleedLeft = v; });

bleedSection.appendChild(bTop.el);
bleedSection.appendChild(bRight.el);
bleedSection.appendChild(bBottom.el);
bleedSection.appendChild(bLeft.el);
}

// 常用出血预设
var bleedPresets = document.createElement('div');
bleedPresets.style.cssText = 'display:flex;gap:4px;margin-top:6px;';

var presetValues = [
{ label: '2mm', value: 2 },
{ label: '3mm', value: 3 },
{ label: '5mm', value: 5 },
{ label: '1/8"', value: 3.175 },
{ label: '1/4"', value: 6.35 }
];

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
printState.bleedTop = preset.value;
printState.bleedRight = preset.value;
printState.bleedBottom = preset.value;
printState.bleedLeft = preset.value;
printState.bleedLinked = true;
container.innerHTML = '';
renderPrintPanel(container);
});
bleedPresets.appendChild(btn);
})(presetValues[pi]);
}

bleedSection.appendChild(bleedPresets);
container.appendChild(bleedSection);

// 印刷标记选项
var marksSection = createSection('印刷标记');

var markOptions = [
{ key: 'trimMarks', label: '裁切标记', icon: '✂' },
{ key: 'registrationMarks', label: '套准标记', icon: '⊕' },
{ key: 'colorBar', label: '色彩条', icon: '🎨' },
{ key: 'showBleedOverlay', label: '出血区域可视化', icon: '🔲' }
];

for (var mi = 0; mi < markOptions.length; mi++) {
(function (opt) {
var row = document.createElement('div');
row.style.cssText =
'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';

var label = document.createElement('span');
label.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
label.textContent = opt.icon + ' ' + opt.label;

var toggle = _createToggleSwitch(printState[opt.key], function (v) {
printState[opt.key] = v;
});

row.appendChild(label);
row.appendChild(toggle);
marksSection.appendChild(row);
})(markOptions[mi]);
}

container.appendChild(marksSection);

// 书脊设置（可选）
var spineSection = createSection('书脊 / 折线（可选）');

var spineInput = createNumberInput('书脊宽度 (mm)', printState.spineWidth, 0, 50, 0.5,
function (v) { printState.spineWidth = v; }
);
spineSection.appendChild(spineInput.el);

// 折线位置
var foldHint = document.createElement('div');
foldHint.style.cssText =
'font-size:9px;color:var(--gm-text-tertiary);margin-bottom:6px;';
foldHint.textContent = '折线位置（从左边距，逗号分隔，单位mm）';
spineSection.appendChild(foldHint);

var foldInput = document.createElement('input');
foldInput.type = 'text';
foldInput.placeholder = '例: 100, 200, 300';
foldInput.value = printState.foldLines.join(', ');
foldInput.style.cssText =
'width:100%;padding:5px 8px;border-radius:3px;font-size:11px;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
'border:1px solid var(--gm-border-default);box-sizing:border-box;';
foldInput.addEventListener('change', function () {
var val = foldInput.value.trim();
if (val === '') {
printState.foldLines = [];
} else {
printState.foldLines = val.split(',').map(function (s) {
return parseFloat(s.trim());
}).filter(function (n) {
return !isNaN(n) && n > 0;
});
}
});
spineSection.appendChild(foldInput);

container.appendChild(spineSection);

// Canvas 预览
var previewSection = createSection('预览');
var canvasWrap = document.createElement('div');
canvasWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:10px;';

var canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 150;
canvas.style.cssText =
'background:#111;border-radius:4px;border:1px solid var(--gm-border-default);';

_drawPrintPreview(canvas);
canvasWrap.appendChild(canvas);
previewSection.appendChild(canvasWrap);
container.appendChild(previewSection);

// 应用按钮
container.appendChild(createApplyButton('✦ 应用印刷标记', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}
return _applyPrintMarks();
}));
    // 应用按钮
    container.appendChild(createApplyButton('✦ 应用印刷标记', function () {
      if (!currentDocInfo) {
        showToast('请先打开文档', 'warning');
        return;
      }
      return _applyPrintMarks();
    }));
  }

  /**
   * 执行印刷标记的应用逻辑
   */
  function _applyPrintMarks() {
    return HostAdapter.applyPrintMarks({
      bleed: {
        top: printState.bleedTop,
        right: printState.bleedRight,
        bottom: printState.bleedBottom,
        left: printState.bleedLeft
      },
      marks: {
        trim: printState.trimMarks,
        registration: printState.registrationMarks,
        colorBar: printState.colorBar
      },
      spine: {
        width: printState.spineWidth,
        folds: printState.foldLines
      },
      visualize: printState.showBleedOverlay
    }).then(function () {
      showToast('印刷标记已生成', 'success');
    }).catch(function (err) {
      showToast('生成失败: ' + err.message, 'error');
    });
  }

  /**
   * 绘制印刷预览
   */
  function _drawPrintPreview(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    // 画板中心
    var docW = w * 0.6;
    var docH = h * 0.6;
    var dx = (w - docW) / 2;
    var dy = (h - docH) / 2;

    // 出血区域
    if (printState.showBleedOverlay) {
      ctx.fillStyle = 'rgba(255, 55, 95, 0.15)';
      ctx.fillRect(dx - 10, dy - 10, docW + 20, docH + 20);
    }

    // 文档主体
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx, dy, docW, docH);

    // 裁切标记模拟
    if (printState.trimMarks) {
      ctx.strokeStyle = '#FF375F';
      ctx.lineWidth = 0.5;
      // 角线
      ctx.beginPath();
      ctx.moveTo(dx - 15, dy); ctx.lineTo(dx - 5, dy); // 左上
      ctx.moveTo(dx, dy - 15); ctx.lineTo(dx, dy - 5);
      ctx.stroke();
    }
  }

  // ============================
  // HostAdapter 印刷扩展
  // ============================

  HostAdapter.applyPrintMarks = function (params) {
    return callHost('applyPrintMarks', [JSON.stringify(params)]);
  };
