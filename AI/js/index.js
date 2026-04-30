/**
* GridMaster CEP 前端主逻辑
* 负责：
* 1. 初始化 CSInterface 桥接
* 2. 创建面板 UI
* 3. 将用户操作转换为 ExtendScript 调用
*/

(function () {
  'use strict';

  var cs = new CSInterface();

  // ============================
  // ExtendScript 桥接封装
  // ============================

  /**
   * 调用 ExtendScript 函数并返回 Promise
   */
  function callHost(funcName, args) {
    return new Promise(function (resolve, reject) {
      var argsStr = '';
      if (args && args.length > 0) {
        var parts = [];
        for (var i = 0; i < args.length; i++) {
          var arg = args[i];
          if (typeof arg === 'string') {
            // 字符串参数需要转义引号
            parts.push("'" + arg.replace(/'/g, "\\'") + "'");
          } else if (typeof arg === 'number') {
            parts.push(String(arg));
          } else {
            // 对象/数组转 JSON 字符串传递
            parts.push("'" + JSON.stringify(arg).replace(/'/g, "\\'") + "'");
          }
        }
        argsStr = parts.join(',');
      }

      var script = funcName + '(' + argsStr + ')';

      cs.evalScript(script, function (result) {
        try {
          if (result === 'EvalScript error.') {
            reject(new Error('ExtendScript execution error'));
            return;
          }
          var parsed = JSON.parse(result);
          if (parsed.success) {
            resolve(parsed.data || parsed);
          } else {
            reject(new Error(parsed.error || 'Unknown host error'));
          }
        } catch (e) {
          // 返回值不是 JSON，直接返回原始字符串
          resolve(result);
        }
      });
    });
  }

  // ============================
  // 宿主适配器（CEP 版）
  // ============================

  var HostAdapter = {
    getDocumentInfo: function () {
      return callHost('getDocumentInfo', []);
    },

    addGuides: function (guides) {
      return callHost('addGuides', [JSON.stringify(guides)]);
    },

    clearGuides: function () {
      return callHost('clearAllGuides', []);
    },

    addOverlays: function (overlays) {
      return callHost('addOverlays', [JSON.stringify(overlays)]);
    },

    clearOverlays: function () {
      return callHost('clearOverlays', []);
    },

    addCompositionLines: function (lines) {
      return callHost('addCompositionLines', [JSON.stringify(lines)]);
    },

    addSpiralPath: function (points, color, strokeWidth) {
      return callHost('addSpiralPath', [JSON.stringify(points), color, strokeWidth]);
    },

    clearComposition: function () {
      return callHost('clearComposition', []);
    },

    addPrintMarks: function (marks) {
      return callHost('addPrintMarks', [JSON.stringify(marks)]);
    },

    clearPrintMarks: function () {
      return callHost('clearPrintMarks', []);
    },

    getAllArtboards: function () {
      return callHost('getAllArtboards', []);
    },

    setActiveArtboard: function (index) {
      return callHost('setActiveArtboard', [index]);
    },

    clearAll: function () {
      return callHost('clearAll', []);
    },

    // === P0：撤销支持 ===
    undo: function () {
      return callHost('undoGridMaster', []);
    },
    getUndoState: function () {
      return callHost('getUndoState', []);
    },
    healthCheck: function () {
      return callHost('healthCheck', []);
    },

    // === P1：覆盖层 & 预览 ===
    addGridOverlay: function (opts) {
      return callHost('addGridOverlay', [JSON.stringify(opts)]);
    },
    clearGridOverlay: function () {
      return callHost('clearGridOverlay', []);
    },
    addBaseGrid: function (options) {
      return callHost('addBaseGrid', [JSON.stringify(options)]);
    },
    clearBaseGrid: function () {
      return callHost('clearBaseGrid', []);
    },
    addColorBar: function () {
      return callHost('addColorBar', []);
    },
    addPreviewLines: function (lines) {
      return callHost('addPreviewLines', [JSON.stringify(lines)]);
    },
    clearPreviewLayer: function () {
      return callHost('clearPreviewLayer', []);
    }
  };

  // ============================
  // 本地存储（CEP 使用 localStorage）
  // ============================

  var Storage = {
    get: function (key) {
      try {
        var val = localStorage.getItem('gridmaster_' + key);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return null;
      }
    },

    set: function (key, value) {
      try {
        localStorage.setItem('gridmaster_' + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },

    remove: function (key) {
      localStorage.removeItem('gridmaster_' + key);
    }
  };

  // ============================
  // 预设管理器（CEP 版）
  // ============================

  var PresetManager = {
    _presets: {},
    _customPresets: {},

    init: function () {
      // 加载内置预设
      this._presets = this._getBuiltInPresets();
      // 加载用户自定义预设
      var saved = Storage.get('custom_presets');
      if (saved) {
        this._customPresets = saved;
      }
    },

    getAll: function (category) {
      var result = [];
      var builtIn = this._presets[category] || [];
      var custom = this._customPresets[category] || [];
      return builtIn.concat(custom);
    },

    save: function (category, preset) {
      if (!this._customPresets[category]) {
        this._customPresets[category] = [];
      }
      preset.id = 'custom_' + Date.now();
      preset.isBuiltIn = false;
      this._customPresets[category].push(preset);
      Storage.set('custom_presets', this._customPresets);
      return preset;
    },

    remove: function (category, presetId) {
      if (!this._customPresets[category]) return;
      this._customPresets[category] = this._customPresets[category].filter(
        function (p) { return p.id !== presetId; }
      );
      Storage.set('custom_presets', this._customPresets);
    },

    _getBuiltInPresets: function () {
      return {
        grid: [
          { id: 'grid_12col', name: '12列网格', isBuiltIn: true, columns: 12, rows: 1, gutterH: 20, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
          { id: 'grid_6col', name: '6列网格', isBuiltIn: true, columns: 6, rows: 1, gutterH: 20, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
          { id: 'grid_3col', name: '3列网格', isBuiltIn: true, columns: 3, rows: 1, gutterH: 20, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
          { id: 'grid_4x4', name: '4×4网格', isBuiltIn: true, columns: 4, rows: 4, gutterH: 10, gutterV: 10, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
        ],
        composition: [
          { id: 'comp_thirds', name: '三分法', isBuiltIn: true, type: 'rule-of-thirds' },
          { id: 'comp_golden', name: '黄金分割', isBuiltIn: true, type: 'golden-ratio' },
          { id: 'comp_diagonal', name: '对角线', isBuiltIn: true, type: 'diagonal' },
          { id: 'comp_center', name: '中心十字', isBuiltIn: true, type: 'center-cross' },
        ],
        ecom: [
          { id: 'ecom_taobao_main', name: '淘宝主图 800×800', isBuiltIn: true, platform: 'taobao', width: 800, height: 800, safeZone: { top: 50, right: 30, bottom: 110, left: 30 } },
          { id: 'ecom_jd_main', name: '京东主图 800×800', isBuiltIn: true, platform: 'jd', width: 800, height: 800, safeZone: { top: 40, right: 20, bottom: 100, left: 20 } },
          { id: 'ecom_pdd_main', name: '拼多多主图 750×750', isBuiltIn: true, platform: 'pdd', width: 750, height: 750, safeZone: { top: 45, right: 25, bottom: 120, left: 25 } },
          { id: 'ecom_douyin_main', name: '抖音商品图 800×800', isBuiltIn: true, platform: 'douyin', width: 800, height: 800, safeZone: { top: 60, right: 30, bottom: 130, left: 30 } },
          { id: 'ecom_xhs', name: '小红书封面 1080×1440', isBuiltIn: true, platform: 'xiaohongshu', width: 1080, height: 1440, safeZone: { top: 80, right: 40, bottom: 160, left: 40 } },
        ],
        print: [
          { id: 'print_a4', name: 'A4 (210×297mm)', isBuiltIn: true, width: 210, height: 297, unit: 'mm', bleed: 3 },
          { id: 'print_a3', name: 'A3 (297×420mm)', isBuiltIn: true, width: 297, height: 420, unit: 'mm', bleed: 3 },
          { id: 'print_namecard', name: '名片 (90×54mm)', isBuiltIn: true, width: 90, height: 54, unit: 'mm', bleed: 2 },
          { id: 'print_poster_b2', name: '海报 B2 (515×728mm)', isBuiltIn: true, width: 515, height: 728, unit: 'mm', bleed: 3 },
          { id: 'print_trifold', name: '三折页 (297×210mm)', isBuiltIn: true, width: 297, height: 210, unit: 'mm', bleed: 3, folds: 2 },
        ],
        ui: [
          { id: 'ui_iphone15', name: 'iPhone 15 (393×852)', isBuiltIn: true, device: 'iphone15', width: 393, height: 852, statusBar: 59, homeIndicator: 34, navBar: 44, tabBar: 49 },
          { id: 'ui_iphone15pro_max', name: 'iPhone 15 Pro Max (430×932)', isBuiltIn: true, device: 'iphone15promax', width: 430, height: 932, statusBar: 59, homeIndicator: 34, navBar: 44, tabBar: 49 },
          { id: 'ui_android_common', name: 'Android 通用 (360×800)', isBuiltIn: true, device: 'android', width: 360, height: 800, statusBar: 24, navBar: 56, tabBar: 48, homeIndicator: 0 },
          { id: 'ui_ipad_pro_11', name: 'iPad Pro 11" (834×1194)', isBuiltIn: true, device: 'ipadpro11', width: 834, height: 1194, statusBar: 24, homeIndicator: 20, navBar: 44, tabBar: 49 },
        ]
      };
    }
  };

  // ============================
  // 计算引擎（前端直接运行）
  // ============================

  var Calculator = {

    /**
     * 网格计算
     */
    calculateGrid: function (opts) {
      var w = opts.docWidth;
      var h = opts.docHeight;
      var cols = opts.columns || 1;
      var rows = opts.rows || 1;
      var gH = opts.gutterH || 0;
      var gV = opts.gutterV || 0;
      var mT = opts.marginTop || 0;
      var mR = opts.marginRight || 0;
      var mB = opts.marginBottom || 0;
      var mL = opts.marginLeft || 0;

      var guides = [];

      // 可用区域
      var availW = w - mL - mR;
      var availH = h - mT - mB;

      // 列宽
      var totalGutterH = (cols - 1) * gH;
      var colWidth = (availW - totalGutterH) / cols;

      // 行高
      var totalGutterV = (rows - 1) * gV;
      var rowHeight = (availH - totalGutterV) / rows;

      // 垂直参考线（列边界）
      for (var c = 0; c <= cols; c++) {
        var x;
        if (c === 0) {
          x = mL;
        } else if (c === cols) {
          x = w - mR;
        } else {
          x = mL + c * colWidth + (c - 1) * gH;
          // 列右边缘
          guides.push({ orientation: 'vertical', position: x });
          // 间距右边缘 = 下一列左边缘
          x = mL + c * colWidth + c * gH;
        }
        guides.push({ orientation: 'vertical', position: x });
      }

      // 水平参考线（行边界）
      for (var r = 0; r <= rows; r++) {
        var y;
        if (r === 0) {
          y = mT;
        } else if (r === rows) {
          y = h - mB;
        } else {
          y = mT + r * rowHeight + (r - 1) * gV;
          guides.push({ orientation: 'horizontal', position: y });
          y = mT + r * rowHeight + r * gV;
        }
        guides.push({ orientation: 'horizontal', position: y });
      }

      return {
        guides: guides,
        meta: { colWidth: colWidth, rowHeight: rowHeight }
      };
    },

    /**
     * 构图计算
     */
    calculateComposition: function (type, docWidth, docHeight) {
      var w = docWidth;
      var h = docHeight;
      var lines = [];

      switch (type) {
        case 'rule-of-thirds':
          // 三分法：两横两竖
          lines.push({ x1: w / 3, y1: 0, x2: w / 3, y2: h, label: '三分线' });
          lines.push({ x1: w * 2 / 3, y1: 0, x2: w * 2 / 3, y2: h, label: '三分线' });
          lines.push({ x1: 0, y1: h / 3, x2: w, y2: h / 3, label: '三分线' });
          lines.push({ x1: 0, y1: h * 2 / 3, x2: w, y2: h * 2 / 3, label: '三分线' });
          break;

        case 'golden-ratio':
          var phi = 1.618033988749895;
          var gx1 = w / phi;
          var gx2 = w - gx1;
          var gy1 = h / phi;
          var gy2 = h - gy1;
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
          // 黄金螺旋的矩形分割线
          var phi2 = 1.618033988749895;
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
      var rects = [];
      var x = 0, y = 0;
      var cw = w, ch = h;

      for (var i = 0; i < depth; i++) {
        rects.push({ x: x, y: y, w: cw, h: ch });
        var side = i % 4;
        if (side === 0) {
          var nw = cw / phi;
          x = x + nw;
          cw = cw - nw;
        } else if (side === 1) {
          var nh = ch / phi;
          ch = ch - nh;
        } else if (side === 2) {
          var nw2 = cw / phi;
          cw = cw - nw2;
        } else {
          var nh2 = ch / phi;
          y = y + nh2;
          ch = ch - nh2;
        }
      }
      return rects;
    },

    /**
     * 电商安全区计算
     */
    calculateEcomSafeZone: function (preset, docWidth, docHeight) {
      var sz = preset.safeZone;
      var overlays = [];

      // 顶部遮挡区
      if (sz.top > 0) {
        overlays.push({
          x: 0, y: 0,
          width: docWidth, height: sz.top,
          color: '#FF3B30', opacity: 15,
          label: '顶部遮挡区'
        });
      }

      // 底部遮挡区
      if (sz.bottom > 0) {
        overlays.push({
          x: 0, y: docHeight - sz.bottom,
          width: docWidth, height: sz.bottom,
          color: '#FF3B30', opacity: 15,
          label: '底部遮挡区（标题/价格）'
        });
      }

      // 左侧遮挡区
      if (sz.left > 0) {
        overlays.push({
          x: 0, y: sz.top,
          width: sz.left, height: docHeight - sz.top - sz.bottom,
          color: '#FF6B00', opacity: 10,
          label: '左侧边距'
        });
      }

      // 右侧遮挡区
      if (sz.right > 0) {
        overlays.push({
          x: docWidth - sz.right, y: sz.top,
          width: sz.right, height: docHeight - sz.top - sz.bottom,
          color: '#FF6B00', opacity: 10,
          label: '右侧边距'
        });
      }

      // 安全区参考线
      var guides = [];
      if (sz.top > 0) guides.push({ orientation: 'horizontal', position: sz.top });
      if (sz.bottom > 0) guides.push({ orientation: 'horizontal', position: docHeight - sz.bottom });
      if (sz.left > 0) guides.push({ orientation: 'vertical', position: sz.left });
      if (sz.right > 0) guides.push({ orientation: 'vertical', position: docWidth - sz.right });

      return { overlays: overlays, guides: guides };
    },

    /**
     * 印刷出血/安全区计算
     */
    calculatePrint: function (preset, docWidth, docHeight) {
      var bleed = preset.bleed || 3;
      var guides = [];
      var overlays = [];

      // 出血线（文档边缘外扩）
      // 在 AI 中出血区在画板外，这里用参考线标记安全区
      var safeMargin = bleed + 3; // 安全区比出血再内缩 3mm

      guides.push({ orientation: 'horizontal', position: safeMargin });
      guides.push({ orientation: 'horizontal', position: docHeight - safeMargin });
      guides.push({ orientation: 'vertical', position: safeMargin });
      guides.push({ orientation: 'vertical', position: docWidth - safeMargin });

      // 出血区覆盖层
      // 顶部
      overlays.push({
        x: 0, y: 0,
        width: docWidth, height: bleed,
        color: '#FF2D55', opacity: 12,
        label: '出血区'
      });
      // 底部
      overlays.push({
        x: 0, y: docHeight - bleed,
        width: docWidth, height: bleed,
        color: '#FF2D55', opacity: 12,
        label: '出血区'
      });
      // 左侧
      overlays.push({
        x: 0, y: bleed,
        width: bleed, height: docHeight - bleed * 2,
        color: '#FF2D55', opacity: 12,
        label: '出血区'
      });
      // 右侧
      overlays.push({
        x: docWidth - bleed, y: bleed,
        width: bleed, height: docHeight - bleed * 2,
        color: '#FF2D55', opacity: 12,
        label: '出血区'
      });

      // 折线（如果有）
      if (preset.folds && preset.folds > 0) {
        var foldCount = preset.folds;
        var panelWidth = docWidth / (foldCount + 1);
        for (var f = 1; f <= foldCount; f++) {
          guides.push({ orientation: 'vertical', position: panelWidth * f });
        }
      }

      // 裁切标记
      var trimMarks = [];
      var markLen = 10;
      var markOffset = bleed + 2;

      // 四个角的裁切标记
      var corners = [
        { x: 0, y: 0 },
        { x: docWidth, y: 0 },
        { x: 0, y: docHeight },
        { x: docWidth, y: docHeight }
      ];

      for (var c = 0; c < corners.length; c++) {
        var cx = corners[c].x;
        var cy = corners[c].y;
        var dirX = cx === 0 ? -1 : 1;
        var dirY = cy === 0 ? -1 : 1;

        // 水平标记
        trimMarks.push({
          x1: cx + dirX * markOffset,
          y1: cy,
          x2: cx + dirX * (markOffset + markLen),
          y2: cy
        });
        // 垂直标记
        trimMarks.push({
          x1: cx,
          y1: cy + dirY * markOffset,
          x2: cx,
          y2: cy + dirY * (markOffset + markLen)
        });
      }

      return {
        guides: guides,
        overlays: overlays,
        trimMarks: trimMarks
      };
    },

    /**
     * UI 安全区计算
     */
    calculateUISafeZone: function (preset, docWidth, docHeight) {
      var overlays = [];
      var guides = [];

      // 状态栏
      if (preset.statusBar > 0) {
        overlays.push({
          x: 0, y: 0,
          width: docWidth, height: preset.statusBar,
          color: '#BF5AF2', opacity: 15,
          label: '状态栏'
        });
        guides.push({ orientation: 'horizontal', position: preset.statusBar });
      }

      // 导航栏
      if (preset.navBar > 0) {
        var navTop = preset.statusBar || 0;
        overlays.push({
          x: 0, y: navTop,
          width: docWidth, height: preset.navBar,
          color: '#0D99FF', opacity: 12,
          label: '导航栏'
        });
        guides.push({ orientation: 'horizontal', position: navTop + preset.navBar });
      }

      // 标签栏
      if (preset.tabBar > 0) {
        var tabTop = docHeight - preset.tabBar - (preset.homeIndicator || 0);
        overlays.push({
          x: 0, y: tabTop,
          width: docWidth, height: preset.tabBar,
          color: '#0D99FF', opacity: 12,
          label: '标签栏'
        });
        guides.push({ orientation: 'horizontal', position: tabTop });
      }

      // Home Indicator
      if (preset.homeIndicator > 0) {
        overlays.push({
          x: 0, y: docHeight - preset.homeIndicator,
          width: docWidth, height: preset.homeIndicator,
          color: '#999999', opacity: 10,
          label: 'Home Indicator'
        });
        guides.push({ orientation: 'horizontal', position: docHeight - preset.homeIndicator });
      }

      return { overlays: overlays, guides: guides };
    }
  };

  // ============================
  // ============================
  // 实时预览系统
  // ============================

  var _previewDebounceTimer = null;
  var _previewEnabled = false;

  function setPreviewEnabled(enabled) {
    _previewEnabled = enabled;
    if (!enabled) clearPreview();
    Storage.set('preview_enabled', enabled);
  }

  function clearPreview() {
    if (_previewDebounceTimer) { clearTimeout(_previewDebounceTimer); _previewDebounceTimer = null; }
    HostAdapter.clearPreviewLayer();
  }

  function triggerPreview(type, params) {
    if (!_previewEnabled) return;
    if (_previewDebounceTimer) clearTimeout(_previewDebounceTimer);
    _previewDebounceTimer = setTimeout(function () { _doPreview(type, params); }, 300);
  }

  function _doPreview(type, params) {
    if (!currentDocInfo) return;
    var previewLines = [];
    if (type === 'grid') {
      var result = Calculator.calculateGrid({
        docWidth: currentDocInfo.width, docHeight: currentDocInfo.height,
        columns: params.columns, rows: params.rows,
        gutterH: params.gutterH, gutterV: params.gutterV,
        marginTop: params.marginTop, marginRight: params.marginRight,
        marginBottom: params.marginBottom, marginLeft: params.marginLeft
      });
      previewLines = result.guides.map(function (g) {
        return { orientation: g.orientation, position: g.position, color: '#0D99FF', opacity: 30 };
      });
    } else if (type === 'composition') {
      var compResult = Calculator.calculateComposition(params.type, currentDocInfo.width, currentDocInfo.height);
      previewLines = compResult.lines.map(function (l) {
        return { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, color: '#FF6B00', opacity: 30 };
      });
    }
    if (previewLines.length > 0) {
      HostAdapter.addPreviewLines(previewLines).catch(function () {});
    }
  }

  // Toast 提示
  // ============================

  function showToast(message, type) {
    type = type || 'info';
    var colors = {
      success: '#34c759',
      error: '#ff3b30',
      warning: '#ffd60a',
      info: '#0d99ff'
    };

    var existing = document.querySelector('.gm-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'gm-toast';
    toast.style.cssText =
      'position:fixed;top:8px;left:50%;transform:translateX(-50%);' +
      'padding:6px 16px;border-radius:4px;font-size:11px;z-index:9999;' +
      'color:#fff;pointer-events:none;transition:opacity 0.3s;' +
      'background:' + (colors[type] || colors.info) + ';';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  // ============================
  // 面板 UI 构建
  // ============================

  var currentTab = 'grid';
  var currentDocInfo = null;

  function buildUI() {
    var root = document.getElementById('gridmaster-root');
    if (!root) return;
    root.innerHTML = '';

    // 顶部标题栏
    var header = document.createElement('div');
    header.style.cssText =
      'padding:10px 12px;border-bottom:1px solid var(--gm-border-default);' +
      'display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML =
      '<div style="font-size:13px;font-weight:600;">⊞ GridMaster</div>' +
      '<div id="doc-info" style="font-size:10px;color:var(--gm-text-secondary);">未检测到文档</div>';
    root.appendChild(header);

    // Tab 栏
    var tabs = [
      { id: 'grid', label: '网格' },
      { id: 'composition', label: '构图' },
      { id: 'ecom', label: '电商' },
      { id: 'print', label: '印刷' },
      { id: 'ui', label: 'UI' },
      { id: 'settings', label: '⚙' }
    ];

    var tabBar = document.createElement('div');
    tabBar.style.cssText =
      'display:flex;border-bottom:1px solid var(--gm-border-default);' +
      'padding:0 8px;gap:0;overflow-x:auto;';

    tabs.forEach(function (tab) {
      var btn = document.createElement('button');
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      var isActive = tab.id === currentTab;
      btn.style.cssText =
        'padding:8px 10px;font-size:11px;background:none;color:' +
        (isActive ? 'var(--gm-accent-primary)' : 'var(--gm-text-secondary)') +
        ';border:none;border-bottom:2px solid ' +
        (isActive ? 'var(--gm-accent-primary)' : 'transparent') +
        ';cursor:pointer;white-space:nowrap;transition:all 0.15s;';

      btn.addEventListener('click', function () {
        currentTab = tab.id;
        buildUI();
      });

      btn.addEventListener('mouseenter', function () {
        if (tab.id !== currentTab) {
          btn.style.color = 'var(--gm-text-primary)';
        }
      });
      btn.addEventListener('mouseleave', function () {
        if (tab.id !== currentTab) {
          btn.style.color = 'var(--gm-text-secondary)';
        }
      });

      tabBar.appendChild(btn);
    });
    root.appendChild(tabBar);

    // 内容区
    var content = document.createElement('div');
    content.id = 'panel-content';
    content.style.cssText = 'flex:1;overflow-y:auto;padding:12px;';
    root.appendChild(content);

    // 根据当前 tab 渲染内容
    switch (currentTab) {
      case 'grid': renderGridPanel(content); break;
      case 'composition': renderCompositionPanel(content); break;
      case 'ecom': renderEcomPanel(content); break;
      case 'print': renderPrintPanel(content); break;
      case 'ui': renderUIPanel(content); break;
      case 'settings': renderSettingsPanel(content); break;
    }

    // 底部操作栏（含撤销 + 清除全部）
    var footer = document.createElement('div');
    footer.style.cssText =
      'padding:8px 12px;border-top:1px solid var(--gm-border-default);' +
      'display:flex;gap:6px;';

    var undoBtn = document.createElement('button');
    undoBtn.id = 'btn-undo';
    undoBtn.textContent = '↩ 撤销';
    undoBtn.style.cssText =
      'flex:1;padding:6px;border-radius:4px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
      'font-size:11px;border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';
    undoBtn.addEventListener('mouseenter', function () { undoBtn.style.borderColor = 'var(--gm-accent-primary)'; undoBtn.style.color = 'var(--gm-accent-primary)'; });
    undoBtn.addEventListener('mouseleave', function () { undoBtn.style.borderColor = 'var(--gm-border-default)'; undoBtn.style.color = 'var(--gm-text-secondary)'; });
    undoBtn.addEventListener('click', function () {
      HostAdapter.undo().then(function (r) {
        if (r && r.undone) showToast('已撤销: ' + r.undone + ' (剩余' + r.remaining + '步)', 'info');
        else showToast('没有可撤销的操作', 'warning');
      }).catch(function (e) { showToast('撤销失败: ' + e.message, 'error'); });
    });
    footer.appendChild(undoBtn);

    var clearBtn = document.createElement('button');
    clearBtn.id = 'btn-clear-all';
    clearBtn.textContent = '✕ 清除全部';
    clearBtn.style.cssText =
      'flex:1;padding:6px;border-radius:4px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-accent-danger);' +
      'font-size:11px;border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';
    clearBtn.addEventListener('mouseenter', function () { clearBtn.style.borderColor = 'var(--gm-accent-danger)'; clearBtn.style.background = 'rgba(255,59,48,0.1)'; });
    clearBtn.addEventListener('mouseleave', function () { clearBtn.style.borderColor = 'var(--gm-border-default)'; clearBtn.style.background = 'var(--gm-bg-tertiary)'; });
    clearBtn.addEventListener('click', function () {
      HostAdapter.clearAll().then(function () {
        showToast('已清除所有辅助线', 'success');
      }).catch(function (e) { showToast('清除失败: ' + e.message, 'error'); });
    });
    footer.appendChild(clearBtn);
    root.appendChild(footer);

document.getElementById('btn-clear-all').addEventListener('click', function () {
HostAdapter.clearAll().then(function () {
showToast('已清除所有辅助线', 'success');
}).catch(function (err) {
showToast('清除失败: ' + err.message, 'error');
});
});

// 刷新文档信息
refreshDocInfo();

// 键盘快捷键
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
    if (document.activeElement && document.activeElement.closest('#gridmaster-root')) {
      e.preventDefault();
      HostAdapter.undo().then(function (r) {
        if (r && r.undone) showToast('已撤销: ' + r.undone, 'info');
        else showToast('没有可撤销的操作', 'warning');
      }).catch(function (e) { showToast('撤销失败: ' + e.message, 'error'); });
    }
  }
});
}

// ============================
// 文档信息刷新
// ============================

function refreshDocInfo() {
HostAdapter.getDocumentInfo().then(function (info) {
currentDocInfo = info;
var el = document.getElementById('doc-info');
if (el && info) {
el.textContent = info.width + '×' + info.height;
el.style.color = 'var(--gm-accent-success)';
}
}).catch(function () {
currentDocInfo = null;
var el = document.getElementById('doc-info');
if (el) {
el.textContent = '未检测到文档';
el.style.color = 'var(--gm-accent-danger)';
}
});
}

// ============================
// 通用 UI 组件工厂
// ============================

function createSection(title) {
var section = document.createElement('div');
section.style.cssText = 'margin-bottom:16px;';

if (title) {
var titleEl = document.createElement('div');
titleEl.style.cssText =
'font-size:11px;font-weight:600;color:var(--gm-text-secondary);' +
'margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;';
titleEl.textContent = title;
section.appendChild(titleEl);
}

return section;
}

function createNumberInput(label, value, min, max, step, onChange) {
var row = document.createElement('div');
row.style.cssText =
'display:flex;align-items:center;justify-content:space-between;' +
'margin-bottom:6px;height:28px;';

var labelEl = document.createElement('span');
labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
labelEl.textContent = label;

var inputWrap = document.createElement('div');
inputWrap.style.cssText = 'display:flex;align-items:center;gap:2px;';

var btnMinus = document.createElement('button');
btnMinus.textContent = '−';
btnMinus.style.cssText =
'width:22px;height:22px;border-radius:3px;background:var(--gm-bg-tertiary);' +
'color:var(--gm-text-primary);font-size:13px;display:flex;align-items:center;' +
'justify-content:center;cursor:pointer;border:1px solid var(--gm-border-default);';

var input = document.createElement('input');
input.type = 'number';
input.value = value;
input.min = min;
input.max = max;
input.step = step || 1;
input.style.cssText =
'width:52px;height:22px;text-align:center;border-radius:3px;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
'border:1px solid var(--gm-border-default);font-size:11px;' +
'-moz-appearance:textfield;';

var btnPlus = document.createElement('button');
btnPlus.textContent = '+';
btnPlus.style.cssText = btnMinus.style.cssText;

btnMinus.addEventListener('click', function () {
var v = parseFloat(input.value) - (parseFloat(step) || 1);
if (v < min) v = min;
input.value = v;
if (onChange) onChange(v);
});

btnPlus.addEventListener('click', function () {
var v = parseFloat(input.value) + (parseFloat(step) || 1);
if (max !== undefined && v > max) v = max;
input.value = v;
if (onChange) onChange(v);
});

input.addEventListener('change', function () {
var v = parseFloat(input.value);
if (isNaN(v)) v = min;
if (v < min) v = min;
if (max !== undefined && v > max) v = max;
input.value = v;
if (onChange) onChange(v);
});

inputWrap.appendChild(btnMinus);
inputWrap.appendChild(input);
inputWrap.appendChild(btnPlus);

row.appendChild(labelEl);
row.appendChild(inputWrap);

return { el: row, getValue: function () { return parseFloat(input.value); } };
}

function createSelect(label, options, selectedValue, onChange) {
var row = document.createElement('div');
row.style.cssText =
'display:flex;align-items:center;justify-content:space-between;' +
'margin-bottom:6px;height:28px;';

var labelEl = document.createElement('span');
labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
labelEl.textContent = label;

var select = document.createElement('select');
select.style.cssText =
'width:130px;height:22px;border-radius:3px;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
'border:1px solid var(--gm-border-default);font-size:11px;padding:0 4px;';

options.forEach(function (opt) {
var option = document.createElement('option');
option.value = opt.value;
option.textContent = opt.label;
if (opt.value === selectedValue) option.selected = true;
select.appendChild(option);
});

select.addEventListener('change', function () {
if (onChange) onChange(select.value);
});

row.appendChild(labelEl);
row.appendChild(select);

return { el: row, getValue: function () { return select.value; } };
}

function createPresetList(category, onSelect) {
var presets = PresetManager.getAll(category);
var wrap = document.createElement('div');
wrap.style.cssText =
'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;';

presets.forEach(function (preset) {
var btn = document.createElement('button');
btn.textContent = preset.name;
btn.style.cssText =
'padding:4px 8px;border-radius:3px;font-size:10px;cursor:pointer;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
'border:1px solid var(--gm-border-default);transition:all 0.15s;';

btn.addEventListener('mouseenter', function () {
btn.style.borderColor = 'var(--gm-accent-primary)';
btn.style.color = 'var(--gm-accent-primary)';
});
btn.addEventListener('mouseleave', function () {
btn.style.borderColor = 'var(--gm-border-default)';
btn.style.color = 'var(--gm-text-primary)';
});

btn.addEventListener('click', function () {
if (onSelect) onSelect(preset);
});

wrap.appendChild(btn);
});

return wrap;
}

function createApplyButton(text, onClick) {
var btn = document.createElement('button');
btn.textContent = text || '应用';
btn.style.cssText =
'width:100%;padding:8px;border-radius:4px;font-size:12px;font-weight:600;' +
'background:var(--gm-accent-primary);color:#fff;cursor:pointer;' +
'border:none;transition:opacity 0.15s;margin-top:8px;';

btn.addEventListener('mouseenter', function () { btn.style.opacity = '0.85'; });
btn.addEventListener('mouseleave', function () { btn.style.opacity = '1'; });

btn.addEventListener('click', function () {
btn.textContent = '处理中...';
btn.disabled = true;
btn.style.opacity = '0.6';

var result;
try {
result = onClick();
} catch (e) {
showToast('错误: ' + e.message, 'error');
btn.textContent = text || '应用';
btn.disabled = false;
btn.style.opacity = '1';
return;
}

// 支持同步和异步
if (result && typeof result.then === 'function') {
result.then(function () {
btn.textContent = text || '应用';
btn.disabled = false;
btn.style.opacity = '1';
}).catch(function (err) {
showToast('错误: ' + err.message, 'error');
btn.textContent = text || '应用';
btn.disabled = false;
btn.style.opacity = '1';
});
} else {
btn.textContent = text || '应用';
btn.disabled = false;
btn.style.opacity = '1';
}
});

return btn;
}

// ============================
// 网格面板
// ============================

var gridState = {
columns: 12, rows: 1,
gutterH: 20, gutterV: 0,
marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
marginLock: true
};

function renderGridPanel(container) {
// 预设
var presetSection = createSection('快速预设');
presetSection.appendChild(createPresetList('grid', function (preset) {
gridState.columns = preset.columns;
gridState.rows = preset.rows;
gridState.gutterH = preset.gutterH;
gridState.gutterV = preset.gutterV;
gridState.marginTop = preset.marginTop;
gridState.marginRight = preset.marginRight;
gridState.marginBottom = preset.marginBottom;
gridState.marginLeft = preset.marginLeft;
renderGridPanel(container);
showToast('已加载预设: ' + preset.name, 'info');
}));
container.appendChild(presetSection);

// 列/行设置
var gridSection = createSection('网格设置');

var colInput = createNumberInput('列数', gridState.columns, 1, 100, 1, function (v) {
gridState.columns = v;
});
gridSection.appendChild(colInput.el);

var rowInput = createNumberInput('行数', gridState.rows, 1, 100, 1, function (v) {
gridState.rows = v;
});
gridSection.appendChild(rowInput.el);

var gutterHInput = createNumberInput('列间距', gridState.gutterH, 0, 500, 1, function (v) {
gridState.gutterH = v;
});
gridSection.appendChild(gutterHInput.el);

var gutterVInput = createNumberInput('行间距', gridState.gutterV, 0, 500, 1, function (v) {
gridState.gutterV = v;
});
gridSection.appendChild(gutterVInput.el);

container.appendChild(gridSection);

// 边距设置
var marginSection = createSection('边距');

// 锁定按钮
var lockRow = document.createElement('div');
lockRow.style.cssText =
'display:flex;align-items:center;gap:6px;margin-bottom:6px;';
var lockBtn = document.createElement('button');
lockBtn.textContent = gridState.marginLock ? '🔗 统一边距' : '🔓 独立边距';
lockBtn.style.cssText =
'padding:3px 8px;border-radius:3px;font-size:10px;cursor:pointer;' +
'background:' + (gridState.marginLock ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)') + ';' +
'color:#fff;border:none;';
lockBtn.addEventListener('click', function () {
gridState.marginLock = !gridState.marginLock;
renderGridPanel(container);
});
lockRow.appendChild(lockBtn);
marginSection.appendChild(lockRow);

if (gridState.marginLock) {
var marginAllInput = createNumberInput('全部边距', gridState.marginTop, 0, 500, 1, function (v) {
gridState.marginTop = v;
gridState.marginRight = v;
gridState.marginBottom = v;
gridState.marginLeft = v;
});
marginSection.appendChild(marginAllInput.el);
} else {
var mT = createNumberInput('上', gridState.marginTop, 0, 500, 1, function (v) { gridState.marginTop = v; });
var mR = createNumberInput('右', gridState.marginRight, 0, 500, 1, function (v) { gridState.marginRight = v; });
var mB = createNumberInput('下', gridState.marginBottom, 0, 500, 1, function (v) { gridState.marginBottom = v; });
var mL = createNumberInput('左', gridState.marginLeft, 0, 500, 1, function (v) { gridState.marginLeft = v; });
marginSection.appendChild(mT.el);
marginSection.appendChild(mR.el);
marginSection.appendChild(mB.el);
marginSection.appendChild(mL.el);
}

container.appendChild(marginSection);

// 应用按钮
container.appendChild(createApplyButton('✦ 应用网格', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}

var result = Calculator.calculateGrid({
docWidth: currentDocInfo.width,
docHeight: currentDocInfo.height,
columns: gridState.columns,
rows: gridState.rows,
gutterH: gridState.gutterH,
gutterV: gridState.gutterV,
marginTop: gridState.marginTop,
marginRight: gridState.marginRight,
marginBottom: gridState.marginBottom,
marginLeft: gridState.marginLeft
});

return HostAdapter.clearGuides().then(function () {
return HostAdapter.addGuides(result.guides);
}).then(function () {
showToast('网格已应用 (' + result.guides.length + ' 条参考线)', 'success');
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
PresetManager.save('grid', {
name: name,
columns: gridState.columns,
rows: gridState.rows,
gutterH: gridState.gutterH,
gutterV: gridState.gutterV,
marginTop: gridState.marginTop,
marginRight: gridState.marginRight,
marginBottom: gridState.marginBottom,
marginLeft: gridState.marginLeft
});
showToast('预设已保存', 'success');
renderGridPanel(container);
});
container.appendChild(saveBtn);
}

// ============================
// 构图面板
// ============================

var compositionState = {
type: 'rule-of-thirds',
color: '#FF6B00',
showAsGuides: true
};

function renderCompositionPanel(container) {
// 预设
var presetSection = createSection('构图模式');
presetSection.appendChild(createPresetList('composition', function (preset) {
compositionState.type = preset.type;
renderCompositionPanel(container);
}));
container.appendChild(presetSection);

// 当前模式
var modeNames = {
'rule-of-thirds': '三分法',
'golden-ratio': '黄金分割',
'diagonal': '对角线',
'center-cross': '中心十字',
'golden-spiral': '黄金螺旋'
};

var infoSection = createSection('当前模式');
var infoText = document.createElement('div');
infoText.style.cssText =
'padding:8px 10px;border-radius:4px;background:var(--gm-bg-secondary);' +
'font-size:12px;color:var(--gm-accent-primary);font-weight:600;' +
'text-align:center;margin-bottom:8px;';
infoText.textContent = modeNames[compositionState.type] || compositionState.type;
infoSection.appendChild(infoText);

// 模式说明
var descriptions = {
'rule-of-thirds': '将画面分为 3×3 的九宫格，关键元素放在交叉点上。',
'golden-ratio': '基于 1:1.618 的黄金比例分割线，产生自然和谐的构图。',
'diagonal': '两条对角线引导视线从一角到另一角，增加动感。',
'center-cross': '水平和垂直中心线，适合对称构图。',
'golden-spiral': '黄金螺旋递归分割，引导视线聚焦到螺旋中心。'
};

var descText = document.createElement('div');
descText.style.cssText =
'font-size:10px;color:var(--gm-text-secondary);line-height:1.5;' +
'margin-bottom:10px;';
descText.textContent = descriptions[compositionState.type] || '';
infoSection.appendChild(descText);

container.appendChild(infoSection);

// 选项
var optSection = createSection('选项');

var renderModeSelect = createSelect('渲染方式', [
{ value: 'guides', label: '参考线' },
{ value: 'paths', label: '路径线条' },
{ value: 'both', label: '参考线 + 路径' }
], compositionState.showAsGuides ? 'guides' : 'paths', function (v) {
compositionState.showAsGuides = (v === 'guides' || v === 'both');
compositionState.showAsPaths = (v === 'paths' || v === 'both');
});
optSection.appendChild(renderModeSelect.el);
container.appendChild(optSection);

// 应用
container.appendChild(createApplyButton('✦ 应用构图辅助线', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}

var result = Calculator.calculateComposition(
compositionState.type,
currentDocInfo.width,
currentDocInfo.height
);

var promises = [];

// 清除旧内容
promises.push(HostAdapter.clearComposition());

// 如果是简单的横竖线（三分法/黄金分割），可以用参考线
if (compositionState.showAsGuides &&
(compositionState.type === 'rule-of-thirds' ||
compositionState.type === 'golden-ratio' ||
compositionState.type === 'center-cross')) {
var guides = [];
result.lines.forEach(function (line) {
if (line.x1 === line.x2) {
guides.push({ orientation: 'vertical', position: line.x1 });
} else if (line.y1 === line.y2) {
guides.push({ orientation: 'horizontal', position: line.y1 });
}
});
promises.push(HostAdapter.addGuides(guides));
}

// 对角线/螺旋必须用路径
if (compositionState.type === 'diagonal' ||
compositionState.type === 'golden-spiral' ||
compositionState.showAsPaths) {
promises.push(HostAdapter.addCompositionLines(result.lines));
}

return Promise.all(promises).then(function () {
showToast('构图辅助线已应用', 'success');
});
}));
}

// ============================
// 电商面板
// ============================

var ecomState = {
selectedPreset: null
};

function renderEcomPanel(container) {
// 平台选择
var presetSection = createSection('选择平台/场景');
presetSection.appendChild(createPresetList('ecom', function (preset) {
ecomState.selectedPreset = preset;
renderEcomPanel(container);
}));
container.appendChild(presetSection);

// 当前选择信息
if (ecomState.selectedPreset) {
var preset = ecomState.selectedPreset;

var infoSection = createSection('当前选择');
var infoCard = document.createElement('div');
infoCard.style.cssText =
'padding:10px;border-radius:4px;background:var(--gm-bg-secondary);' +
'border:1px solid var(--gm-border-default);margin-bottom:8px;';
infoCard.innerHTML =
'<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' +
preset.name + '</div>' +
'<div style="font-size:10px;color:var(--gm-text-secondary);line-height:1.6;">' +
'尺寸: ' + preset.width + '×' + preset.height + '<br>' +
'安全区: 上' + preset.safeZone.top + ' 右' + preset.safeZone.right +
' 下' + preset.safeZone.bottom + ' 左' + preset.safeZone.left +
'</div>';
infoSection.appendChild(infoCard);
container.appendChild(infoSection);

// 应用
container.appendChild(createApplyButton('✦ 应用电商安全区', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}

var result = Calculator.calculateEcomSafeZone(
preset,
currentDocInfo.width,
currentDocInfo.height
);

return Promise.all([
HostAdapter.clearGuides(),
HostAdapter.clearOverlays()
]).then(function () {
return Promise.all([
HostAdapter.addGuides(result.guides),
HostAdapter.addOverlays(result.overlays)
]);
}).then(function () {
showToast('电商安全区已应用', 'success');
});
}));

// 仅添加参考线（不添加覆盖层）
var guidesOnlyBtn = document.createElement('button');
guidesOnlyBtn.textContent = '仅添加参考线（无覆盖层）';
guidesOnlyBtn.style.cssText =
'width:100%;padding:6px;border-radius:4px;font-size:11px;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
'border:1px solid var(--gm-border-default);cursor:pointer;margin-top:6px;';
guidesOnlyBtn.addEventListener('click', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}
var result = Calculator.calculateEcomSafeZone(
preset, currentDocInfo.width, currentDocInfo.height
);
HostAdapter.clearGuides().then(function () {
return HostAdapter.addGuides(result.guides);
}).then(function () {
showToast('参考线已应用', 'success');
});
});
container.appendChild(guidesOnlyBtn);

} else {
var hint = document.createElement('div');
hint.style.cssText =
'text-align:center;padding:30px 10px;color:var(--gm-text-secondary);font-size:11px;';
hint.textContent = '👆 请先选择一个电商平台预设';
container.appendChild(hint);
}
}

// ============================
// 印刷面板
// ============================

var printState = {
selectedPreset: null,
bleed: 3,
showTrimMarks: true,
showBleedOverlay: true
};

function renderPrintPanel(container) {
// 预设
var presetSection = createSection('纸张/场景');
presetSection.appendChild(createPresetList('print', function (preset) {
printState.selectedPreset = preset;
printState.bleed = preset.bleed || 3;
renderPrintPanel(container);
}));
container.appendChild(presetSection);

// 出血设置
var bleedSection = createSection('出血设置');
var bleedInput = createNumberInput(
'出血量 (mm)', printState.bleed, 0, 20, 0.5,
function (v) { printState.bleed = v; }
);
bleedSection.appendChild(bleedInput.el);
container.appendChild(bleedSection);

// 选项
var optSection = createSection('显示选项');

var trimRow = document.createElement('div');
trimRow.style.cssText =
'display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:11px;';
var trimCb = document.createElement('input');
trimCb.type = 'checkbox';
trimCb.checked = printState.showTrimMarks;
trimCb.addEventListener('change', function () {
printState.showTrimMarks = trimCb.checked;
});
trimRow.appendChild(trimCb);
trimRow.appendChild(document.createTextNode('裁切标记'));
optSection.appendChild(trimRow);

var bleedRow = document.createElement('div');
bleedRow.style.cssText = trimRow.style.cssText;
var bleedCb = document.createElement('input');
bleedCb.type = 'checkbox';
bleedCb.checked = printState.showBleedOverlay;
bleedCb.addEventListener('change', function () {
printState.showBleedOverlay = bleedCb.checked;
});
bleedRow.appendChild(bleedCb);
bleedRow.appendChild(document.createTextNode('出血区覆盖层'));
optSection.appendChild(bleedRow);

container.appendChild(optSection);

// 应用
container.appendChild(createApplyButton('✦ 应用印刷辅助', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}

var preset = printState.selectedPreset || { bleed: printState.bleed };
preset.bleed = printState.bleed;

var result = Calculator.calculatePrint(
preset,
currentDocInfo.width,
currentDocInfo.height
);

var promises = [
HostAdapter.clearGuides(),
HostAdapter.clearOverlays(),
HostAdapter.clearPrintMarks()
];

return Promise.all(promises).then(function () {
var applyPromises = [];

// 参考线
applyPromises.push(HostAdapter.addGuides(result.guides));

// 覆盖层
if (printState.showBleedOverlay && result.overlays.length > 0) {
applyPromises.push(HostAdapter.addOverlays(result.overlays));
}

// 裁切标记
if (printState.showTrimMarks && result.trimMarks.length > 0) {
applyPromises.push(HostAdapter.addPrintMarks(result.trimMarks));
}

return Promise.all(applyPromises);
}).then(function () {
showToast('印刷辅助已应用', 'success');
});
}));
}

// ============================
// UI 安全区面板
// ============================

var uiState = {
selectedPreset: null
};

function renderUIPanel(container) {
// 设备预设
var presetSection = createSection('选择设备');
presetSection.appendChild(createPresetList('ui', function (preset) {
uiState.selectedPreset = preset;
renderUIPanel(container);
}));
container.appendChild(presetSection);

if (uiState.selectedPreset) {
var preset = uiState.selectedPreset;

// 设备信

      // 设备信息卡片
      var infoSection = createSection('设备信息');
      var infoCard = document.createElement('div');
      infoCard.style.cssText =
        'padding:10px;border-radius:4px;background:var(--gm-bg-secondary);' +
        'border:1px solid var(--gm-border-default);margin-bottom:8px;';
      infoCard.innerHTML =
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' +
        preset.name + '</div>' +
        '<div style="font-size:10px;color:var(--gm-text-secondary);line-height:1.6;">' +
        '逻辑分辨率: ' + preset.width + '×' + preset.height + ' pt<br>' +
        '状态栏: ' + preset.statusBar + 'pt<br>' +
        '导航栏: ' + preset.navBar + 'pt<br>' +
        '标签栏: ' + preset.tabBar + 'pt<br>' +
        'Home Indicator: ' + preset.homeIndicator + 'pt' +
        '</div>';
      infoSection.appendChild(infoCard);
      container.appendChild(infoSection);

      // 可视化预览（简易示意图）
      var previewSection = createSection('区域预览');
      var previewWrap = document.createElement('div');
      previewWrap.style.cssText =
        'width:100%;display:flex;justify-content:center;margin-bottom:10px;';

      var previewH = 180;
      var previewW = Math.round(previewH * (preset.width / preset.height));
      var scale = previewH / preset.height;

      var previewBox = document.createElement('div');
      previewBox.style.cssText =
        'width:' + previewW + 'px;height:' + previewH + 'px;position:relative;' +
        'background:#fff;border-radius:8px;overflow:hidden;' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.3);';

      // 状态栏
      if (preset.statusBar > 0) {
        var statusDiv = document.createElement('div');
        statusDiv.style.cssText =
          'position:absolute;top:0;left:0;right:0;' +
          'height:' + Math.round(preset.statusBar * scale) + 'px;' +
          'background:rgba(191,90,242,0.3);';
        statusDiv.title = '状态栏 ' + preset.statusBar + 'pt';
        previewBox.appendChild(statusDiv);
      }

      // 导航栏
      if (preset.navBar > 0) {
        var navDiv = document.createElement('div');
        navDiv.style.cssText =
          'position:absolute;top:' + Math.round(preset.statusBar * scale) + 'px;' +
          'left:0;right:0;' +
          'height:' + Math.round(preset.navBar * scale) + 'px;' +
          'background:rgba(13,153,255,0.25);';
        navDiv.title = '导航栏 ' + preset.navBar + 'pt';
        previewBox.appendChild(navDiv);
      }

      // 标签栏
      if (preset.tabBar > 0) {
        var tabTop = preset.height - preset.tabBar - preset.homeIndicator;
        var tabDiv = document.createElement('div');
        tabDiv.style.cssText =
          'position:absolute;top:' + Math.round(tabTop * scale) + 'px;' +
          'left:0;right:0;' +
          'height:' + Math.round(preset.tabBar * scale) + 'px;' +
          'background:rgba(13,153,255,0.25);';
        tabDiv.title = '标签栏 ' + preset.tabBar + 'pt';
        previewBox.appendChild(tabDiv);
      }

      // Home Indicator
      if (preset.homeIndicator > 0) {
        var homeDiv = document.createElement('div');
        homeDiv.style.cssText =
          'position:absolute;bottom:0;left:0;right:0;' +
          'height:' + Math.round(preset.homeIndicator * scale) + 'px;' +
          'background:rgba(150,150,150,0.25);';
        homeDiv.title = 'Home Indicator ' + preset.homeIndicator + 'pt';
        previewBox.appendChild(homeDiv);
      }

      // 安全区标注
      var safeTop = preset.statusBar + preset.navBar;
      var safeBottom = preset.tabBar + preset.homeIndicator;
      var safeDiv = document.createElement('div');
      safeDiv.style.cssText =
        'position:absolute;' +
        'top:' + Math.round(safeTop * scale) + 'px;' +
        'bottom:' + Math.round(safeBottom * scale) + 'px;' +
        'left:0;right:0;' +
        'border:1px dashed rgba(52,199,89,0.6);' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:9px;color:rgba(52,199,89,0.8);';
      safeDiv.textContent = '安全区';
      previewBox.appendChild(safeDiv);

      previewWrap.appendChild(previewBox);
      previewSection.appendChild(previewWrap);
      container.appendChild(previewSection);

      // 应用按钮
      container.appendChild(createApplyButton('✦ 应用 UI 安全区', function () {
        if (!currentDocInfo) {
          showToast('请先打开文档', 'warning');
          return;
        }

        var result = Calculator.calculateUISafeZone(
          preset,
          currentDocInfo.width,
          currentDocInfo.height
        );

        return Promise.all([
          HostAdapter.clearGuides(),
          HostAdapter.clearOverlays()
        ]).then(function () {
          return Promise.all([
            HostAdapter.addGuides(result.guides),
            HostAdapter.addOverlays(result.overlays)
          ]);
        }).then(function () {
          showToast('UI 安全区已应用', 'success');
        });
      }));

      // 仅参考线
      var guidesOnlyBtn = document.createElement('button');
      guidesOnlyBtn.textContent = '仅添加参考线（无覆盖层）';
      guidesOnlyBtn.style.cssText =
        'width:100%;padding:6px;border-radius:4px;font-size:11px;' +
        'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
        'border:1px solid var(--gm-border-default);cursor:pointer;margin-top:6px;';
      guidesOnlyBtn.addEventListener('click', function () {
        if (!currentDocInfo) {
          showToast('请先打开文档', 'warning');
          return;
        }
        var result = Calculator.calculateUISafeZone(
          preset, currentDocInfo.width, currentDocInfo.height
        );
        HostAdapter.clearGuides().then(function () {
          return HostAdapter.addGuides(result.guides);
        }).then(function () {
          showToast('参考线已应用', 'success');
        });
      });
      container.appendChild(guidesOnlyBtn);

    } else {
      var hint = document.createElement('div');
      hint.style.cssText =
        'text-align:center;padding:30px 10px;color:var(--gm-text-secondary);font-size:11px;';
      hint.textContent = '👆 请先选择一个设备预设';
      container.appendChild(hint);
    }
  }

  // ============================
  // 设置面板
  // ============================

  function renderSettingsPanel(container) {
    // 版本信息
    var aboutSection = createSection('关于');
    var aboutCard = document.createElement('div');
    aboutCard.style.cssText =
      'padding:12px;border-radius:4px;background:var(--gm-bg-secondary);' +
      'border:1px solid var(--gm-border-default);margin-bottom:12px;';
    aboutCard.innerHTML =
      '<div style="font-size:14px;font-weight:700;margin-bottom:4px;">⊞ GridMaster</div>' +
      '<div style="font-size:10px;color:var(--gm-text-secondary);line-height:1.6;">' +
      '版本: 1.0.0 (CEP)<br>' +
      '引擎: GridMaster Core<br>' +
      '兼容: Illustrator 2023+<br>' +
      '架构: CEP + ExtendScript' +
      '</div>';
    aboutSection.appendChild(aboutCard);
    container.appendChild(aboutSection);

    // 批量操作
    var batchSection = createSection('批量操作');

    var batchAllBtn = document.createElement('button');
    batchAllBtn.textContent = '📋 对所有画板应用当前网格';
    batchAllBtn.style.cssText =
      'width:100%;padding:8px;border-radius:4px;font-size:11px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;margin-bottom:6px;';
    batchAllBtn.addEventListener('click', function () {
      if (!currentDocInfo) {
        showToast('请先打开文档', 'warning');
        return;
      }

      HostAdapter.getAllArtboards().then(function (boards) {
        if (!boards || boards.length === 0) {
          showToast('未找到画板', 'warning');
          return;
        }

        var applyToBoard = function (index) {
          if (index >= boards.length) {
            showToast('已对 ' + boards.length + ' 个画板应用网格', 'success');
            return;
          }

          var board = boards[index];
          return HostAdapter.setActiveArtboard(board.index).then(function () {
            var result = Calculator.calculateGrid({
              docWidth: board.width,
              docHeight: board.height,
              columns: gridState.columns,
              rows: gridState.rows,
              gutterH: gridState.gutterH,
              gutterV: gridState.gutterV,
              marginTop: gridState.marginTop,
              marginRight: gridState.marginRight,
              marginBottom: gridState.marginBottom,
              marginLeft: gridState.marginLeft
            });
            return HostAdapter.addGuides(result.guides);
          }).then(function () {
            return applyToBoard(index + 1);
          });
        };

        return applyToBoard(0);
      }).catch(function (err) {
        showToast('批量操作失败: ' + err.message, 'error');
      });
    });
    batchSection.appendChild(batchAllBtn);
    container.appendChild(batchSection);

    // 数据管理
    var dataSection = createSection('数据管理');

    var exportBtn = document.createElement('button');
    exportBtn.textContent = '📤 导出所有预设';
    exportBtn.style.cssText =
      'width:100%;padding:6px;border-radius:4px;font-size:11px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;margin-bottom:6px;';
    exportBtn.addEventListener('click', function () {
      var data = Storage.get('custom_presets');
      if (!data || Object.keys(data).length === 0) {
        showToast('没有自定义预设可导出', 'warning');
        return;
      }
      var json = JSON.stringify(data, null, 2);
      // CEP 环境下可以写文件，这里简化为复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(json).then(function () {
          showToast('预设 JSON 已复制到剪贴板', 'success');
        });
      } else {
        prompt('复制以下内容：', json);
      }
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
        Storage.set('custom_presets', data);
        PresetManager._customPresets = data;
        showToast('预设已导入', 'success');
      } catch (e) {
        showToast('JSON 格式错误', 'error');
      }
    });
    dataSection.appendChild(importBtn);

    var clearDataBtn = document.createElement('button');
    clearDataBtn.textContent = '🗑 清除所有自定义预设';
    clearDataBtn.style.cssText =
      'width:100%;padding:6px;border-radius:4px;font-size:11px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-accent-danger);' +
      'border:1px solid var(--gm-accent-danger);cursor:pointer;margin-bottom:6px;';
    clearDataBtn.addEventListener('click', function () {
      if (!confirm('确定清除所有自定义预设？此操作不可恢复。')) return;
      Storage.remove('custom_presets');
      PresetManager._customPresets = {};
      showToast('已清除', 'success');
    });
    dataSection.appendChild(clearDataBtn);
    container.appendChild(dataSection);

    // 调试
    var debugSection = createSection('调试');
    var refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 刷新文档信息';
    refreshBtn.style.cssText =
      'width:100%;padding:6px;border-radius:4px;font-size:11px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;margin-bottom:6px;';
    refreshBtn.addEventListener('click', function () {
      refreshDocInfo();
      showToast('已刷新', 'info');
    });
    debugSection.appendChild(refreshBtn);

    var testBtn = document.createElement('button');
    testBtn.textContent = '🧪 测试宿主连接';
    testBtn.style.cssText = refreshBtn.style.cssText;
    testBtn.addEventListener('click', function () {
      HostAdapter.getDocumentInfo().then(function (info) {
        showToast('连接正常: ' + info.name + ' (' + info.width + '×' + info.height + ')', 'success');
      }).catch(function (err) {
        showToast('连接失败: ' + err.message, 'error');
      });
    });
    debugSection.appendChild(testBtn);
    container.appendChild(debugSection);
  }

  // ============================
  // 键盘快捷键
  // ============================

  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + Shift + G = 应用网格
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      if (currentTab !== 'grid') {
        currentTab = 'grid';
        buildUI();
      }
      // 触发应用
      var applyBtn = document.querySelector('#panel-content button:last-of-type');
      if (applyBtn) applyBtn.click();
    }

    // Ctrl/Cmd + Shift + D = 清除全部
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      HostAdapter.clearAll().then(function () {
        showToast('已清除所有辅助线', 'success');
      });
    }

    // Tab 切换：Ctrl + 1-6
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
      e.preventDefault();
      var tabIds = ['grid', 'composition', 'ecom', 'print', 'ui', 'settings'];
      var idx = parseInt(e.key) - 1;
      if (tabIds[idx]) {
        currentTab = tabIds[idx];
        buildUI();
      }
    }
  });

  // ============================
  // 文档切换监听
  // ============================

  // CEP 事件：文档激活变化
  cs.addEventListener('documentAfterActivate', function () {
    refreshDocInfo();
  });

  // 定时刷新（兜底）
  setInterval(function () {
    refreshDocInfo();
  }, 5000);

  // ============================
  // 初始化
  // ============================

  function init() {
    PresetManager.init();
    buildUI();

    // 延迟刷新文档信息（等待 AI 完全加载）
    setTimeout(refreshDocInfo, 1000);
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
