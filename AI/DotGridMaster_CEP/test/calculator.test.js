/**
 * DotGridMaster Calculator 单元测试
 * 测试 core.js 中 Calculator 的纯计算逻辑
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// ============================================================
// 从 core.js 提取的 Calculator 逻辑（纯函数，无 DOM 依赖）
// ============================================================

const Calculator = {
  calculateGrid: function (opts) {
    var w = opts.docWidth, h = opts.docHeight;
    var cols = opts.columns || 1, rows = opts.rows || 1;
    var gH = opts.gutterH || 0, gV = opts.gutterV || 0;
    var mT = opts.marginTop || 0, mR = opts.marginRight || 0;
    var mB = opts.marginBottom || 0, mL = opts.marginLeft || 0;
    var guides = [];
    var availW = w - mL - mR, availH = h - mT - mB;
    var totalGutterH = (cols - 1) * gH;
    var colWidth = (availW - totalGutterH) / cols;
    var totalGutterV = (rows - 1) * gV;
    var rowHeight = (availH - totalGutterV) / rows;

    for (var c = 0; c <= cols; c++) {
      var x;
      if (c === 0) { x = mL; }
      else if (c === cols) { x = w - mR; }
      else {
        x = mL + c * colWidth + c * gH;
      }
      guides.push({ orientation: 'vertical', position: x });
    }

    for (var r = 0; r <= rows; r++) {
      var y;
      if (r === 0) { y = mT; }
      else if (r === rows) { y = h - mB; }
      else {
        y = mT + r * rowHeight + r * gV;
      }
      guides.push({ orientation: 'horizontal', position: y });
    }

    return { guides: guides, meta: { colWidth: colWidth, rowHeight: rowHeight } };
  },

  calculateComposition: function (type, docWidth, docHeight) {
    var w = docWidth, h = docHeight;
    var lines = [];

    switch (type) {
      case 'rule-of-thirds':
        lines.push({ x1: w / 3, y1: 0, x2: w / 3, y2: h, label: '三分线' });
        lines.push({ x1: w * 2 / 3, y1: 0, x2: w * 2 / 3, y2: h, label: '三分线' });
        lines.push({ x1: 0, y1: h / 3, x2: w, y2: h / 3, label: '三分线' });
        lines.push({ x1: 0, y1: h * 2 / 3, x2: w, y2: h * 2 / 3, label: '三分线' });
        break;
      case 'golden-ratio':
        var phi = 1.618033988749895;
        var gx1 = w / phi, gx2 = w - gx1;
        var gy1 = h / phi, gy2 = h - gy1;
        lines.push({ x1: gx2, y1: 0, x2: gx2, y2: h, label: '黄金分割' });
        lines.push({ x1: gx1, y1: 0, x2: gx1, y2: h, label: '黄金分割' });
        lines.push({ x1: 0, y1: gy2, x2: w, y2: gy2, label: '黄金分割' });
        lines.push({ x1: 0, y1: gy1, x2: w, y2: gy1, label: '黄金分割' });
        break;
      case 'diagonal':
        lines.push({ x1: 0, y1: 0, x2: w, y2: h, label: '对角线' });
        lines.push({ x1: w, y1: 0, x2: 0, y2: h, label: '对角线' });
        break;
      case 'center-cross':
        lines.push({ x1: w / 2, y1: 0, x2: w / 2, y2: h, label: '中心线' });
        lines.push({ x1: 0, y1: h / 2, x2: w, y2: h / 2, label: '中心线' });
        break;
      case 'golden-spiral':
        var rects = this._goldenRects(w, h, 8);
        for (var i = 0; i < rects.length; i++) {
          var r = rects[i];
          lines.push({ x1: r.x, y1: r.y, x2: r.x + r.w, y2: r.y, dashed: true, label: '螺旋' });
          lines.push({ x1: r.x + r.w, y1: r.y, x2: r.x + r.w, y2: r.y + r.h, dashed: true, label: '螺旋' });
        }
        break;
    }
    return { lines: lines };
  },

  _goldenRects: function (w, h, depth) {
    var phi = 1.618033988749895;
    var rects = [], x = 0, y = 0, cw = w, ch = h;
    for (var i = 0; i < depth; i++) {
      rects.push({ x: x, y: y, w: cw, h: ch });
      var side = i % 4;
      if (side === 0) { var nw = cw / phi; x = x + nw; cw = cw - nw; }
      else if (side === 1) { var nh = ch / phi; ch = ch - nh; }
      else if (side === 2) { var nw2 = cw / phi; cw = cw - nw2; }
      else { var nh2 = ch / phi; y = y + nh2; ch = ch - nh2; }
    }
    return rects;
  },

  calculateEcomSafeZone: function (preset, docWidth, docHeight) {
    var sz = preset.safeZone;
    var overlays = [];
    if (sz.top > 0) overlays.push({ x: 0, y: 0, width: docWidth, height: sz.top, color: '#FF3B30', opacity: 15, label: '顶部遮挡区' });
    if (sz.bottom > 0) overlays.push({ x: 0, y: docHeight - sz.bottom, width: docWidth, height: sz.bottom, color: '#FF3B30', opacity: 15, label: '底部遮挡区（标题/价格）' });
    if (sz.left > 0) overlays.push({ x: 0, y: sz.top, width: sz.left, height: docHeight - sz.top - sz.bottom, color: '#FF6B00', opacity: 10, label: '左侧边距' });
    if (sz.right > 0) overlays.push({ x: docWidth - sz.right, y: sz.top, width: sz.right, height: docHeight - sz.top - sz.bottom, color: '#FF6B00', opacity: 10, label: '右侧边距' });
    var guides = [];
    if (sz.top > 0) guides.push({ orientation: 'horizontal', position: sz.top });
    if (sz.bottom > 0) guides.push({ orientation: 'horizontal', position: docHeight - sz.bottom });
    if (sz.left > 0) guides.push({ orientation: 'vertical', position: sz.left });
    if (sz.right > 0) guides.push({ orientation: 'vertical', position: docWidth - sz.right });
    return { overlays: overlays, guides: guides };
  },

  calculatePrint: function (preset, docWidth, docHeight) {
    var bleed = preset.bleed || 3;
    var guides = [], overlays = [];
    var safeMargin = bleed + 3;
    guides.push({ orientation: 'horizontal', position: safeMargin });
    guides.push({ orientation: 'horizontal', position: docHeight - safeMargin });
    guides.push({ orientation: 'vertical', position: safeMargin });
    guides.push({ orientation: 'vertical', position: docWidth - safeMargin });
    overlays.push({ x: 0, y: 0, width: docWidth, height: bleed, color: '#FF2D55', opacity: 12, label: '出血区' });
    overlays.push({ x: 0, y: docHeight - bleed, width: docWidth, height: bleed, color: '#FF2D55', opacity: 12, label: '出血区' });
    overlays.push({ x: 0, y: bleed, width: bleed, height: docHeight - bleed * 2, color: '#FF2D55', opacity: 12, label: '出血区' });
    overlays.push({ x: docWidth - bleed, y: bleed, width: bleed, height: docHeight - bleed * 2, color: '#FF2D55', opacity: 12, label: '出血区' });
    if (preset.folds && preset.folds > 0) {
      var foldCount = preset.folds;
      var panelWidth = docWidth / (foldCount + 1);
      for (var f = 1; f <= foldCount; f++) guides.push({ orientation: 'vertical', position: panelWidth * f });
    }
    var trimMarks = [], markLen = 10, markOffset = bleed + 2;
    var corners = [{ x: 0, y: 0 }, { x: docWidth, y: 0 }, { x: 0, y: docHeight }, { x: docWidth, y: docHeight }];
    for (var c = 0; c < corners.length; c++) {
      var cx = corners[c].x, cy = corners[c].y;
      var dirX = cx === 0 ? -1 : 1, dirY = cy === 0 ? -1 : 1;
      trimMarks.push({ x1: cx + dirX * markOffset, y1: cy, x2: cx + dirX * (markOffset + markLen), y2: cy });
      trimMarks.push({ x1: cx, y1: cy + dirY * markOffset, x2: cx, y2: cy + dirY * (markOffset + markLen) });
    }
    return { guides: guides, overlays: overlays, trimMarks: trimMarks };
  },

  calculateUISafeZone: function (preset, docWidth, docHeight) {
    var overlays = [], guides = [];
    if (preset.statusBar > 0) {
      overlays.push({ x: 0, y: 0, width: docWidth, height: preset.statusBar, color: '#BF5AF2', opacity: 15, label: '状态栏' });
      guides.push({ orientation: 'horizontal', position: preset.statusBar });
    }
    if (preset.navBar > 0) {
      var navTop = preset.statusBar || 0;
      overlays.push({ x: 0, y: navTop, width: docWidth, height: preset.navBar, color: '#0D99FF', opacity: 12, label: '导航栏' });
      guides.push({ orientation: 'horizontal', position: navTop + preset.navBar });
    }
    if (preset.tabBar > 0) {
      var tabTop = docHeight - preset.tabBar - (preset.homeIndicator || 0);
      overlays.push({ x: 0, y: tabTop, width: docWidth, height: preset.tabBar, color: '#0D99FF', opacity: 12, label: '标签栏' });
      guides.push({ orientation: 'horizontal', position: tabTop });
    }
    if (preset.homeIndicator > 0) {
      overlays.push({ x: 0, y: docHeight - preset.homeIndicator, width: docWidth, height: preset.homeIndicator, color: '#999999', opacity: 10, label: 'Home Indicator' });
      guides.push({ orientation: 'horizontal', position: docHeight - preset.homeIndicator });
    }
    return { overlays: overlays, guides: guides };
  }
};

// ============================================================
// 测试用例
// ============================================================

describe('Calculator.calculateGrid', () => {
  it('应生成正确的 3 列网格引导线', () => {
    const result = Calculator.calculateGrid({
      docWidth: 1000, docHeight: 800,
      columns: 3, rows: 1,
      gutterH: 20, gutterV: 0,
      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
    });

    // 3 列 = 4 条垂直线（左边界 + 2 条内部线 + 右边界）
    const verticals = result.guides.filter(g => g.orientation === 'vertical');
    assert.equal(verticals.length, 4);
    // 1 行 = 2 条水平线（上下边界）
    const horizontals = result.guides.filter(g => g.orientation === 'horizontal');
    assert.equal(horizontals.length, 2);
    // colWidth = (1000 - 2*20) / 3 = 320
    assert.ok(Math.abs(result.meta.colWidth - 320) < 0.01);
  });

  it('应正确处理边距', () => {
    const result = Calculator.calculateGrid({
      docWidth: 1000, docHeight: 800,
      columns: 2, rows: 2,
      gutterH: 0, gutterV: 0,
      marginTop: 50, marginRight: 50, marginBottom: 50, marginLeft: 50
    });

    // 第一条垂直线应在 marginLeft=50
    const firstVertical = result.guides.find(g => g.orientation === 'vertical');
    assert.equal(firstVertical.position, 50);
    // 最后一条垂直线应在 docWidth - marginRight = 950
    const verticals = result.guides.filter(g => g.orientation === 'vertical');
    assert.equal(verticals[verticals.length - 1].position, 950);
  });

  it('应正确计算带间距的网格', () => {
    const result = Calculator.calculateGrid({
      docWidth: 1000, docHeight: 800,
      columns: 2, rows: 1,
      gutterH: 100, gutterV: 0,
      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
    });

    // colWidth = (1000 - 100) / 2 = 450
    assert.ok(Math.abs(result.meta.colWidth - 450) < 0.01);
  });

  it('单列网格应只有两条边线', () => {
    const result = Calculator.calculateGrid({
      docWidth: 500, docHeight: 500,
      columns: 1, rows: 1,
      gutterH: 0, gutterV: 0,
      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
    });

    const verticals = result.guides.filter(g => g.orientation === 'vertical');
    assert.equal(verticals.length, 2);
    assert.equal(verticals[0].position, 0);
    assert.equal(verticals[1].position, 500);
  });
});

describe('Calculator.calculateComposition', () => {
  it('三分法应生成 4 条线', () => {
    const result = Calculator.calculateComposition('rule-of-thirds', 900, 600);
    assert.equal(result.lines.length, 4);
    // 验证三分线位置
    const verticalLines = result.lines.filter(l => l.x1 === l.x2);
    assert.equal(verticalLines.length, 2);
    assert.ok(Math.abs(verticalLines[0].x1 - 300) < 0.01);
    assert.ok(Math.abs(verticalLines[1].x1 - 600) < 0.01);
  });

  it('黄金分割应使用 φ 比例', () => {
    const w = 1000, h = 800;
    const result = Calculator.calculateComposition('golden-ratio', w, h);
    assert.equal(result.lines.length, 4);

    const phi = 1.618033988749895;
    const expectedGx2 = w - w / phi;
    const verticals = result.lines.filter(l => l.x1 === l.x2);
    assert.ok(Math.abs(verticals[0].x1 - expectedGx2) < 0.01);
  });

  it('对角线应从角落到角落', () => {
    const result = Calculator.calculateComposition('diagonal', 800, 600);
    assert.equal(result.lines.length, 2);
    assert.equal(result.lines[0].x1, 0);
    assert.equal(result.lines[0].y1, 0);
    assert.equal(result.lines[0].x2, 800);
    assert.equal(result.lines[0].y2, 600);
  });

  it('中心十字应穿过中心点', () => {
    const result = Calculator.calculateComposition('center-cross', 1000, 800);
    assert.equal(result.lines.length, 2);
    // 垂直线穿过 x=500
    const vert = result.lines.find(l => l.x1 === l.x2);
    assert.equal(vert.x1, 500);
    // 水平线穿过 y=400
    const horiz = result.lines.find(l => l.y1 === l.y2);
    assert.equal(horiz.y1, 400);
  });

  it('黄金螺旋应生成多段弧线', () => {
    const result = Calculator.calculateComposition('golden-spiral', 1000, 800);
    assert.ok(result.lines.length > 0);
    assert.equal(result.lines[0].label, '螺旋');
    assert.equal(result.lines[0].dashed, true);
  });
});

describe('Calculator.calculateEcomSafeZone', () => {
  it('淘宝主图应生成 4 个遮挡区和 4 条参考线', () => {
    const preset = {
      name: '淘宝主图 800×800',
      safeZone: { top: 50, right: 30, bottom: 110, left: 30 }
    };
    const result = Calculator.calculateEcomSafeZone(preset, 800, 800);

    assert.equal(result.overlays.length, 4);
    assert.equal(result.guides.length, 4);

    // 顶部遮挡区
    const topOverlay = result.overlays.find(o => o.label === '顶部遮挡区');
    assert.equal(topOverlay.height, 50);
    assert.equal(topOverlay.width, 800);
  });

  it('安全区边界应与文档尺寸一致', () => {
    const preset = {
      safeZone: { top: 40, right: 20, bottom: 100, left: 20 }
    };
    const result = Calculator.calculateEcomSafeZone(preset, 800, 800);

    // 底部遮挡区应紧贴底部
    const bottomOverlay = result.overlays.find(o => o.label.includes('底部'));
    assert.equal(bottomOverlay.y, 700); // 800 - 100
    assert.equal(bottomOverlay.height, 100);
  });
});

describe('Calculator.calculatePrint', () => {
  it('应生成 4 条安全边距参考线', () => {
    const result = Calculator.calculatePrint({ bleed: 3 }, 210, 297);
    assert.equal(result.guides.length, 4);
    // safeMargin = 3 + 3 = 6
    assert.equal(result.guides[0].position, 6);
  });

  it('应生成 4 个出血区遮挡', () => {
    const result = Calculator.calculatePrint({ bleed: 3 }, 210, 297);
    assert.equal(result.overlays.length, 4);
    assert.equal(result.overlays[0].label, '出血区');
  });

  it('应生成 8 条裁切标记（4 角 × 2）', () => {
    const result = Calculator.calculatePrint({ bleed: 3 }, 210, 297);
    assert.equal(result.trimMarks.length, 8);
  });

  it('折页应生成额外参考线', () => {
    const result = Calculator.calculatePrint({ bleed: 3, folds: 2 }, 297, 210);
    // 基础 4 条 + 2 条折线
    assert.equal(result.guides.length, 6);
  });
});

describe('Calculator.calculateUISafeZone', () => {
  it('iPhone 15 应生成状态栏、导航栏、标签栏和 Home Indicator', () => {
    const preset = {
      statusBar: 59, homeIndicator: 34, navBar: 44, tabBar: 49
    };
    const result = Calculator.calculateUISafeZone(preset, 393, 852);

    assert.equal(result.overlays.length, 4);
    assert.equal(result.guides.length, 4);

    const statusBar = result.overlays.find(o => o.label === '状态栏');
    assert.equal(statusBar.height, 59);
    assert.equal(statusBar.width, 393);
  });

  it('Android（无 Home Indicator）应只生成 3 个遮挡区', () => {
    const preset = {
      statusBar: 24, navBar: 56, tabBar: 48, homeIndicator: 0
    };
    const result = Calculator.calculateUISafeZone(preset, 360, 800);

    assert.equal(result.overlays.length, 3);
    assert.equal(result.guides.length, 3);
  });
});
