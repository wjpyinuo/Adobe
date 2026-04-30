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

// ============================
  // P2-13: 电商模板引擎
  // ============================

  /**
   * 电商模板状态
   */
  var ecomState = {
    selectedPlatform: null,
    selectedTemplate: null,
    safeZone: true,
    showLabels: true,
    labelColor: '#FF375F',
    safeZoneColor: '#FF6B00',
    safeZoneOpacity: 12
  };

  /**
   * 电商平台数据库
   * 每个平台包含多个模板，每个模板定义：
   * - 画板尺寸
   * - 安全区域（文字/主体不被裁切的区域）
   * - 功能区域（标题、价格、按钮等）
   */
  var ECOM_PLATFORMS = {
    taobao: {
      name: '淘宝/天猫',
      icon: '🛒',
      color: '#FF4400',
      templates: [
        {
          id: 'tb-main-800',
          name: '主图 800×800',
          width: 800,
          height: 800,
          unit: 'px',
          safeZone: { top: 50, right: 50, bottom: 100, left: 50 },
          zones: [
            { name: '标题区', x: 50, y: 50, w: 700, h: 80, color: '#FF4400' },
            { name: '主体区', x: 100, y: 150, w: 600, h: 450, color: '#0D99FF' },
            { name: '价格/促销', x: 50, y: 620, w: 350, h: 80, color: '#FF375F' },
            { name: '卖点标签', x: 450, y: 620, w: 300, h: 80, color: '#34C759' }
          ],
          desc: '商品主图，搜索列表展示'
        },
        {
          id: 'tb-main-1500',
          name: '高清主图 1500×1500',
          width: 1500,
          height: 1500,
          unit: 'px',
          safeZone: { top: 80, right: 80, bottom: 160, left: 80 },
          zones: [
            { name: '标题区', x: 80, y: 80, w: 1340, h: 120, color: '#FF4400' },
            { name: '主体区', x: 150, y: 220, w: 1200, h: 900, color: '#0D99FF' },
            { name: '价格/促销', x: 80, y: 1160, w: 650, h: 120, color: '#FF375F' },
            { name: '卖点标签', x: 800, y: 1160, w: 620, h: 120, color: '#34C759' }
          ],
          desc: '高清主图，详情页展示'
        },
        {
          id: 'tb-detail-790',
          name: '详情页 790×不限',
          width: 790,
          height: 1200,
          unit: 'px',
          safeZone: { top: 30, right: 30, bottom: 30, left: 30 },
          zones: [
            { name: '首屏焦点', x: 30, y: 30, w: 730, h: 400, color: '#FF4400' },
            { name: '卖点区', x: 30, y: 450, w: 730, h: 300, color: '#0D99FF' },
            { name: '参数区', x: 30, y: 770, w: 730, h: 200, color: '#5856D6' },
            { name: '信任背书', x: 30, y: 990, w: 730, h: 180, color: '#34C759' }
          ],
          desc: '详情页长图，宽度固定790px'
        },
        {
          id: 'tb-banner',
          name: '店铺 Banner 1920×600',
          width: 1920,
          height: 600,
          unit: 'px',
          safeZone: { top: 40, right: 360, bottom: 40, left: 360 },
          zones: [
            { name: '核心内容区', x: 360, y: 40, w: 1200, h: 520, color: '#FF4400' },
            { name: '标题', x: 410, y: 100, w: 600, h: 100, color: '#0D99FF' },
            { name: '副标题', x: 410, y: 220, w: 500, h: 60, color: '#5856D6' },
            { name: 'CTA 按钮', x: 410, y: 340, w: 200, h: 60, color: '#34C759' },
            { name: '商品图', x: 900, y: 60, w: 500, h: 480, color: '#FF9500' }
          ],
          desc: '店铺首页横幅，注意两侧裁切'
        },
        {
          id: 'tb-video-cover',
          name: '主图视频封面 800×800',
          width: 800,
          height: 800,
          unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 120, left: 60 },
          zones: [
            { name: '视频播放按钮区', x: 300, y: 300, w: 200, h: 200, color: '#FF375F' },
            { name: '标题', x: 60, y: 60, w: 680, h: 70, color: '#0D99FF' },
            { name: '底部信息', x: 60, y: 680, w: 680, h: 60, color: '#34C759' }
          ],
          desc: '主图视频封面，中心留出播放按钮'
        }
      ]
    },

    jd: {
      name: '京东',
      icon: '🏪',
      color: '#E4002B',
      templates: [
        {
          id: 'jd-main-800',
          name: '主图 800×800',
          width: 800,
          height: 800,
          unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 110, left: 60 },
          zones: [
            { name: '品牌/标题', x: 60, y: 60, w: 680, h: 80, color: '#E4002B' },
            { name: '主体商品', x: 120, y: 160, w: 560, h: 440, color: '#0D99FF' },
            { name: '促销信息', x: 60, y: 620, w: 400, h: 70, color: '#FF375F' },
            { name: '角标位', x: 600, y: 60, w: 140, h: 50, color: '#FF9500' }
          ],
          desc: '京东商品主图'
        },
        {
          id: 'jd-sku',
          name: 'SKU图 800×800',
          width: 800,
          height: 800,
          unit: 'px',
          safeZone: { top: 80, right: 80, bottom: 80, left: 80 },
          zones: [
            { name: '商品居中', x: 150, y: 150, w: 500, h: 500, color: '#0D99FF' },
            { name: '色彩/规格标注', x: 80, y: 700, w: 640, h: 60, color: '#5856D6' }
          ],
          desc: 'SKU 属性图，白底为主'
        },
        {
          id: 'jd-detail-990',
          name: '详情页 990×不限',
          width: 990,
          height: 1400,
          unit: 'px',
          safeZone: { top: 40, right: 40, bottom: 40, left: 40 },
          zones: [
            { name: '首屏大图', x: 40, y: 40, w: 910, h: 500, color: '#E4002B' },
            { name: '核心卖点', x: 40, y: 560, w: 910, h: 350, color: '#0D99FF' },
            { name: '规格参数', x: 40, y: 930, w: 910, h: 250, color: '#5856D6' },
            { name: '品牌故事', x: 40, y: 1200, w: 910, h: 160, color: '#34C759' }
          ],
          desc: '京东详情页，宽度990px'
        }
      ]
    },

    pdd: {
      name: '拼多多',
      icon: '🍊',
      color: '#E02E24',
      templates: [
        {
          id: 'pdd-main',
          name: '主图 750×750',
          width: 750,
          height: 750,
          unit: 'px',
          safeZone: { top: 50, right: 50, bottom: 100, left: 50 },
          zones: [
            { name: '商品主体', x: 100, y: 80, w: 550, h: 450, color: '#0D99FF' },
            { name: '价格标签', x: 50, y: 560, w: 300, h: 80, color: '#E02E24' },
            { name: '促销角标', x: 550, y: 50, w: 150, h: 60, color: '#FF9500' },
            { name: '销量/评价', x: 400, y: 560, w: 300, h: 80, color: '#34C759' }
          ],
          desc: '拼多多商品主图'
        },
        {
          id: 'pdd-banner',
          name: '活动 Banner 1125×330',
          width: 1125,
          height: 330,
          unit: 'px',
          safeZone: { top: 20, right: 40, bottom: 20, left: 40 },
          zones: [
            { name: '活动标题', x: 40, y: 40, w: 500, h: 80, color: '#E02E24' },
            { name: '商品展示', x: 600, y: 20, w: 485, h: 290, color: '#0D99FF' },
            { name: '利益点', x: 40, y: 150, w: 400, h: 60, color: '#FF9500' },
            { name: 'CTA', x: 40, y: 230, w: 180, h: 50, color: '#34C759' }
          ],
          desc: '活动页横幅'
        }
      ]
    },

    douyin: {
      name: '抖音电商',
      icon: '🎵',
      color: '#000000',
      templates: [
        {
          id: 'dy-main',
          name: '商品主图 800×800',
          width: 800,
          height: 800,
          unit: 'px',
          safeZone: { top: 50, right: 50, bottom: 100, left: 50 },
          zones: [
            { name: '商品主体', x: 100, y: 80, w: 600, h: 480, color: '#0D99FF' },
            { name: '价格信息', x: 50, y: 600, w: 350, h: 80, color: '#FE2C55' },
            { name: '卖点文案', x: 430, y: 600, w: 320, h: 80, color: '#25F4EE' }
          ],
          desc: '抖音小店商品主图'
        },
        {
          id: 'dy-cover-9x16',
          name: '短视频封面 1080×1920',
          width: 1080,
          height: 1920,
          unit: 'px',
          safeZone: { top: 200, right: 120, bottom: 340, left: 60 },
          zones: [
            { name: '顶部状态栏留白', x: 0, y: 0, w: 1080, h: 130, color: '#333333' },
            { name: '核心内容', x: 60, y: 200, w: 900, h: 1000, color: '#0D99FF' },
            { name: '文案区', x: 60, y: 1250, w: 700, h: 200, color: '#FE2C55' },
            { name: '右侧互动栏', x: 960, y: 600, w: 80, h: 600, color: '#25F4EE' },
            { name: '底部操作栏', x: 0, y: 1700, w: 1080, h: 220, color: '#333333' }
          ],
          desc: '竖版短视频封面，注意右侧互动栏遮挡'
        }
      ]
    },

    xhs: {
      name: '小红书',
      icon: '📕',
      color: '#FF2442',
      templates: [
        {
          id: 'xhs-3x4',
          name: '笔记图 1080×1440 (3:4)',
          width: 1080,
          height: 1440,
          unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 200, left: 60 },
          zones: [
            { name: '主视觉', x: 60, y: 60, w: 960, h: 900, color: '#0D99FF' },
            { name: '文字排版区', x: 60, y: 1000, w: 960, h: 240, color: '#FF2442' },
            { name: '底部留白(交互)', x: 0, y: 1300, w: 1080, h: 140, color: '#333333' }
          ],
          desc: '小红书推荐比例 3:4'
        },
        {
          id: 'xhs-1x1',
          name: '正方形 1080×1080',
          width: 1080,
          height: 1080,
          unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 160, left: 60 },
          zones: [
            { name: '主视觉', x: 60, y: 60, w: 960, h: 700, color: '#0D99FF' },
            { name: '文案区', x: 60, y: 800, w: 960, h: 120, color: '#FF2442' },
            { name: '底部留白', x: 0, y: 960, w: 1080, h: 120, color: '#333333' }
          ],
          desc: '正方形笔记图'
        },
        {
          id: 'xhs-cover',
          name: '封面图 1080×1440',
          width: 1080,
          height: 1440,
          unit: 'px',
          safeZone: { top: 100, right: 80, bottom: 250, left: 80 },
          zones: [
            { name: '标题区', x: 80, y: 100, w: 920, h: 200, color: '#FF2442' },
            { name: '核心画面', x: 80, y: 330, w: 920, h: 700, color: '#0D99FF' },
            { name: '副标题/标签', x: 80, y: 1060, w: 920, h: 100, color: '#5856D6' },
            { name: '底部安全区外', x: 0, y: 1200, w: 1080, h: 240, color: '#333333' }
          ],
          desc: '封面图，底部会被标题遮挡'
        }
      ]
    },

    wechat: {
      name: '微信',
      icon: '💬',
      color: '#07C160',
      templates: [
        {
          id: 'wx-moment-single',
          name: '朋友圈单图 1080×1080',
          width: 1080,
          height: 1080,
          unit: 'px',
          safeZone: { top: 40, right: 40, bottom: 40, left: 40 },
          zones: [
            { name: '核心内容', x: 100, y: 100, w: 880, h: 880, color: '#0D99FF' }
          ],
          desc: '朋友圈单图，正方形'
        },
        {
          id: 'wx-article-cover',
          name: '公众号封面 900×383',
          width: 900,
          height: 383,
          unit: 'px',
          safeZone: { top: 30, right: 60, bottom: 30, left: 60 },
          zones: [
            { name: '标题区', x: 60, y: 60, w: 500, h: 120, color: '#07C160' },
            { name: '配图区', x: 580, y: 30, w: 260, h: 323, color: '#0D99FF' },
            { name: '副标题', x: 60, y: 200, w: 400, h: 60, color: '#5856D6' }
          ],
          desc: '公众号首图，2.35:1 比例'
        },
        {
          id: 'wx-miniapp-banner',
          name: '小程序 Banner 750×400',
          width: 750,
          height: 400,
          unit: 'px',
          safeZone: { top: 20, right: 30, bottom: 20, left: 30 },
          zones: [
            { name: '核心内容', x: 30, y: 20, w: 690, h: 360, color: '#0D99FF' },
            { name: '文案', x: 50, y: 80, w: 350, h: 100, color: '#07C160' },
            { name: 'CTA', x: 50, y: 250, w: 160, h: 50, color: '#FF9500' }
          ],
          desc: '小程序首页轮播图'
        }
      ]
    }
  };

  /**
   * 渲染电商面板
   */
  function renderEcomPanel(container) {
    // 平台选择
    var platformSection = createSection('选择平台');

    var platformGrid = document.createElement('div');
    platformGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;';

    var platformKeys = Object.keys(ECOM_PLATFORMS);
    for (var pi = 0; pi < platformKeys.length; pi++) {
      (function (key) {
        var platform = ECOM_PLATFORMS[key];
        var isSelected = ecomState.selectedPlatform === key;

        var btn = document.createElement('div');
        btn.style.cssText =
          'display:flex;flex-direction:column;align-items:center;padding:8px 4px;' +
          'border-radius:4px;cursor:pointer;transition:all 0.15s;' +
          'background:' + (isSelected ? platform.color : 'var(--gm-bg-secondary)') + ';' +
          'border:1px solid ' + (isSelected ? platform.color : 'var(--gm-border-default)') + ';';

        var icon = document.createElement('div');
        icon.style.cssText = 'font-size:18px;margin-bottom:2px;';
        icon.textContent = platform.icon;

        var name = document.createElement('div');
        name.style.cssText =
          'font-size:9px;' +
          'color:' + (isSelected ? '#fff' : 'var(--gm-text-secondary)') + ';';
        name.textContent = platform.name;

        btn.appendChild(icon);
        btn.appendChild(name);

        btn.addEventListener('mouseenter', function () {
          if (!isSelected) btn.style.background = 'var(--gm-bg-tertiary)';
        });
        btn.addEventListener('mouseleave', function () {
          if (!isSelected) btn.style.background = 'var(--gm-bg-secondary)';
        });

        btn.addEventListener('click', function () {
          ecomState.selectedPlatform = key;
          ecomState.selectedTemplate = null;
          container.innerHTML = '';
          renderEcomPanel(container);
        });

        platformGrid.appendChild(btn);
      })(platformKeys[pi]);
    }

    platformSection.appendChild(platformGrid);
    container.appendChild(platformSection);

    // 模板列表
    if (ecomState.selectedPlatform) {
      var platform = ECOM_PLATFORMS[ecomState.selectedPlatform];
      var templateSection = createSection(platform.name + ' 模板');

      for (var ti = 0; ti < platform.templates.length; ti++) {
        (function (tpl) {
          var isSelected = ecomState.selectedTemplate &&
                           ecomState.selectedTemplate.id === tpl.id;

          var card = document.createElement('div');
          card.style.cssText =
            'display:flex;align-items:center;gap:8px;padding:8px;border-radius:4px;' +
            'cursor:pointer;margin-bottom:4px;transition:all 0.15s;' +
            'background:' + (isSelected ? 'var(--gm-accent-primary)' : 'var(--gm-bg-secondary)') + ';' +
            'border:1px solid ' + (isSelected ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';';

          // 缩略图（Canvas 绘制）
          var thumb = document.createElement('canvas');
          var thumbScale = 40 / Math.max(tpl.width, tpl.height);
          var thumbW = Math.round(tpl.width * thumbScale);
          var thumbH = Math.round(tpl.height * thumbScale);
          thumb.width = thumbW;
          thumb.height = thumbH;
          thumb.style.cssText =
            'border-radius:2px;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;';

          _drawEcomThumb(thumb, tpl);

          // 文字信息
          var info = document.createElement('div');
          info.style.cssText = 'flex:1;min-width:0;';

          var tplName = document.createElement('div');
          tplName.style.cssText =
            'font-size:11px;font-weight:600;' +
            'color:' + (isSelected ? '#fff' : 'var(--gm-text-primary)') + ';';
          tplName.textContent = tpl.name;

          var tplSize = document.createElement('div');
          tplSize.style.cssText =
            'font-size:9px;margin-top:1px;' +
            'color:' + (isSelected ? 'rgba(255,255,255,0.7)' : 'var(--gm-text-tertiary)') + ';';
          tplSize.textContent = tpl.width + '×' + tpl.height + tpl.unit + ' · ' + tpl.desc;

          info.appendChild(tplName);
          info.appendChild(tplSize);

          card.appendChild(thumb);
          card.appendChild(info);

          card.addEventListener('mouseenter', function () {
            if (!isSelected) card.style.background = 'var(--gm-bg-tertiary)';
          });
          card.addEventListener('mouseleave', function () {
            if (!isSelected) card.style.background = 'var(--gm-bg-secondary)';
          });

          card.addEventListener('click', function () {
            ecomState.selectedTemplate = tpl;
            container.innerHTML = '';
            renderEcomPanel(container);
          });

          templateSection.appendChild(card);
        })(platform.templates[ti]);
      }

      container.appendChild(templateSection);
    }

    // 选中模板后的操作
    if (ecomState.selectedTemplate) {
      _renderEcomTemplateOptions(container, ecomState.selectedTemplate);
    }
  }

  /**
   * 渲染选中模板的选项和操作按钮
   */
  function _renderEcomTemplateOptions(container, tpl) {
    // Canvas 预览
    var previewSection = createSection('模板预览');

    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:10px;';

    var canvas = document.createElement('canvas');
    var maxCanvasH = 180;
    var scale = maxCanvasH / Math.max(tpl.width, tpl.height);
    var cW = Math.round(tpl.width * scale);
    var cH = Math.round(tpl.height * scale);
    canvas.width = cW;
    canvas.height = cH;
    canvas.style.cssText =
      'background:#1a1a1a;border-radius:4px;border:1px solid var(--gm-border-default);';

    _drawEcomPreview(canvas, tpl, ecomState);
    canvasWrap.appendChild(canvas);
    previewSection.appendChild(canvasWrap);

    // 区域图例
    var legend = document.createElement('div');
    legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;';

    for (var zi = 0; zi < tpl.zones.length; zi++) {
      var zone = tpl.zones[zi];
      var legendItem = document.createElement('div');
      legendItem.style.cssText = 'display:flex;align-items:center;gap:3px;';

      var dot = document.createElement('div');
      dot.style.cssText =
        'width:8px;height:8px;border-radius:2px;background:' + zone.color + ';';

      var zoneName = document.createElement('span');
      zoneName.style.cssText = 'font-size:9px;color:var(--gm-text-tertiary);';
      zoneName.textContent = zone.name;

      legendItem.appendChild(dot);
      legendItem.appendChild(zoneName);
      legend.appendChild(legendItem);
    }
    previewSection.appendChild(legend);
    container.appendChild(previewSection);

    // 选项
    var optionsSection = createSection('选项');

    // 安全区域开关
    var safeRow = document.createElement('div');
    safeRow.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var safeLabel = document.createElement('span');
    safeLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    safeLabel.textContent = '显示安全区域';
    var safeToggle = _createToggleSwitch(ecomState.safeZone, function (v) {
      ecomState.safeZone = v;
    });
    safeRow.appendChild(safeLabel);
    safeRow.appendChild(safeToggle);
    optionsSection.appendChild(safeRow);

    // 区域标签开关
    var labelRow = document.createElement('div');
    labelRow.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var labelLabel = document.createElement('span');
    labelLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    labelLabel.textContent = '显示区域标签';
    var labelToggle = _createToggleSwitch(ecomState.showLabels, function (v) {
      ecomState.showLabels = v;
    });
    labelRow.appendChild(labelLabel);
    labelRow.appendChild(labelToggle);
    optionsSection.appendChild(labelRow);

    container.appendChild(optionsSection);

    // 操作按钮
    var actionsSection = createSection('操作');

    // 尺寸提示
    var sizeHint = document.createElement('div');
    sizeHint.style.cssText =
      'font-size:10px;color:var(--gm-text-tertiary);margin-bottom:8px;' +
      'padding:6px;background:var(--gm-bg-tertiary);border-radius:3px;text-align:center;';

    if (currentDocInfo) {
      var sizeMatch = currentDocInfo.width === tpl.width && currentDocInfo.height === tpl.height;
      if (sizeMatch) {
        sizeHint.textContent = '✓ 文档尺寸匹配 ' + tpl.width + '×' + tpl.height;
        sizeHint.style.color = '#34C759';
      } else {
        sizeHint.textContent =
          '⚠ 文档 ' + currentDocInfo.width + '×' + currentDocInfo.height +
          ' ≠ 模板 ' + tpl.width + '×' + tpl.height +
          '（将按比例缩放）';
        sizeHint.style.color = '#FF9500';
      }
    } else {
      sizeHint.textContent = '请先打开文档';
      sizeHint.style.color = 'var(--gm-accent-danger)';
    }
    actionsSection.appendChild(sizeHint);

    // 应用参考线按钮
    container.appendChild(actionsSection);

    container.appendChild(createApplyButton('✦ 应用电商辅助线', function () {
      if (!currentDocInfo) {
        showToast('请先打开文档', 'warning');
        return;
      }
      return _applyEcomTemplate(tpl, ecomState);
    }));

    // 仅应用安全区域
    var safeOnlyBtn = document.createElement('button');
    safeOnlyBtn.textContent = '🛡 仅应用安全区
safeOnlyBtn.textContent = '🛡 仅应用安全区域';
safeOnlyBtn.style.cssText =
'width:100%;padding:7px;border-radius:4px;font-size:11px;margin-top:4px;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';

safeOnlyBtn.addEventListener('mouseenter', function () {
safeOnlyBtn.style.borderColor = '#FF9500';
safeOnlyBtn.style.color = '#FF9500';
});
safeOnlyBtn.addEventListener('mouseleave', function () {
safeOnlyBtn.style.borderColor = 'var(--gm-border-default)';
safeOnlyBtn.style.color = 'var(--gm-text-secondary)';
});

safeOnlyBtn.addEventListener('click', function () {
if (!currentDocInfo) {
showToast('请先打开文档', 'warning');
return;
}
_applyEcomSafeZoneOnly(tpl);
});
container.appendChild(safeOnlyBtn);

// 创建新文档按钮（以模板尺寸）
var newDocBtn = document.createElement('button');
newDocBtn.textContent = '📄 以此尺寸新建文档';
newDocBtn.style.cssText =
'width:100%;padding:7px;border-radius:4px;font-size:11px;margin-top:4px;' +
'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';

newDocBtn.addEventListener('mouseenter', function () {
newDocBtn.style.borderColor = 'var(--gm-accent-primary)';
newDocBtn.style.color = 'var(--gm-accent-primary)';
});
newDocBtn.addEventListener('mouseleave', function () {
newDocBtn.style.borderColor = 'var(--gm-border-default)';
newDocBtn.style.color = 'var(--gm-text-secondary)';
});

newDocBtn.addEventListener('click', function () {
HostAdapter.createDocument(tpl.width, tpl.height, tpl.name).then(function () {
showToast('已创建 ' + tpl.width + '×' + tpl.height + ' 文档', 'success');
// 刷新文档信息
refreshDocInfo().then(function () {
// 自动应用模板
_applyEcomTemplate(tpl, ecomState);
});
}).catch(function (err) {
showToast('创建文档失败: ' + err.message, 'error');
});
});
container.appendChild(newDocBtn);
}

/**
* 应用电商模板（完整版：安全区域 + 功能区域 + 标签）
*/
function _applyEcomTemplate(tpl, state) {
if (!currentDocInfo) return Promise.reject(new Error('No document'));

var scaleX = currentDocInfo.width / tpl.width;
var scaleY = currentDocInfo.height / tpl.height;

var promises = [];

// 1. 安全区域参考线
if (state.safeZone && tpl.safeZone) {
var sz = tpl.safeZone;
var safeGuides = [
{ orientation: 'horizontal', position: sz.top * scaleY },
{ orientation: 'horizontal', position: currentDocInfo.height - sz.bottom * scaleY },
{ orientation: 'vertical', position: sz.left * scaleX },
{ orientation: 'vertical', position: currentDocInfo.width - sz.right * scaleX }
];
promises.push(HostAdapter.addGuides(safeGuides));

// 安全区域色块（半透明边框区域）
var safeZoneRects = _calculateSafeZoneRects(
currentDocInfo.width,
currentDocInfo.height,
{
top: sz.top * scaleY,
right: sz.right * scaleX,
bottom: sz.bottom * scaleY,
left: sz.left * scaleX
}
);
promises.push(HostAdapter.addEcomZones(safeZoneRects, state.safeZoneColor, state.safeZoneOpacity));
}

// 2. 功能区域线条
var zoneLines = [];
var zoneRects = [];
var zoneLabels = [];

for (var i = 0; i < tpl.zones.length; i++) {
var zone = tpl.zones[i];
var zx = zone.x * scaleX;
var zy = zone.y * scaleY;
var zw = zone.w * scaleX;
var zh = zone.h * scaleY;

// 矩形区域
zoneRects.push({
x: zx,
y: zy,
width: zw,
height: zh,
color: zone.color,
opacity: 6,
strokeColor: zone.color,
strokeWidth: 0.5,
name: zone.name
});

// 标签
if (state.showLabels) {
zoneLabels.push({
text: zone.name,
x: zx + 4,
y: zy + 12,
size: 8,
color: zone.color
});
}
}

if (zoneRects.length > 0) {
promises.push(HostAdapter.addEcomFunctionZones(zoneRects));
}

if (zoneLabels.length > 0) {
promises.push(HostAdapter.addEcomLabels(zoneLabels));
}

return Promise.all(promises).then(function () {
showToast('电商模板已应用: ' + tpl.name, 'success');
}).catch(function (err) {
showToast('应用失败: ' + err.message, 'error');
});
}

/**
* 仅应用安全区域
*/
function _applyEcomSafeZoneOnly(tpl) {
if (!currentDocInfo || !tpl.safeZone) return;

var scaleX = currentDocInfo.width / tpl.width;
var scaleY = currentDocInfo.height / tpl.height;
var sz = tpl.safeZone;

var guides = [
{ orientation: 'horizontal', position: sz.top * scaleY },
{ orientation: 'horizontal', position: currentDocInfo.height - sz.bottom * scaleY },
{ orientation: 'vertical', position: sz.left * scaleX },
{ orientation: 'vertical', position: currentDocInfo.width - sz.right * scaleX }
];

HostAdapter.addGuides(guides).then(function () {
showToast('安全区域参考线已应用', 'success');
}).catch(function (err) {
showToast('应用失败: ' + err.message, 'error');
});
}

/**
* 计算安全区域外的遮罩矩形（4个边条）
*/
function _calculateSafeZoneRects(docW, docH, margins) {
return [
// 上边条
{ x: 0, y: 0, width: docW, height: margins.top, name: 'SafeZone_Top' },
// 下边条
{ x: 0, y: docH - margins.bottom, width: docW, height: margins.bottom, name: 'SafeZone_Bottom' },
// 左边条
{ x: 0, y: margins.top, width: margins.left, height: docH - margins.top - margins.bottom, name: 'SafeZone_Left' },
// 右边条
{ x: docW - margins.right, y: margins.top, width: margins.right, height: docH - margins.top - margins.bottom, name: 'SafeZone_Right' }
];
}

/**
* 绘制电商模板缩略图
*/
function _drawEcomThumb(canvas, tpl) {
var ctx = canvas.getContext('2d');
var w = canvas.width;
var h = canvas.height;
var sx = w / tpl.width;
var sy = h / tpl.height;

ctx.fillStyle = '#222';
ctx.fillRect(0, 0, w, h);

// 功能区域色块
for (var i = 0; i < tpl.zones.length; i++) {
var z = tpl.zones[i];
ctx.fillStyle = z.color;
ctx.globalAlpha = 0.25;
ctx.fillRect(z.x * sx, z.y * sy, z.w * sx, z.h * sy);
}

ctx.globalAlpha = 1;

// 安全区域边框
if (tpl.safeZone) {
ctx.strokeStyle = '#FF6B00';
ctx.lineWidth = 0.5;
ctx.setLineDash([2, 1]);
ctx.strokeRect(
tpl.safeZone.left * sx,
tpl.safeZone.top * sy,
(tpl.width - tpl.safeZone.left - tpl.safeZone.right) * sx,
(tpl.height - tpl.safeZone.top - tpl.safeZone.bottom) * sy
);
ctx.setLineDash([]);
}
}

/**
* 绘制电商模板详细预览
*/
function _drawEcomPreview(canvas, tpl, state) {
var ctx = canvas.getContext('2d');
var w = canvas.width;
var h = canvas.height;
var sx = w / tpl.width;
var sy = h / tpl.height;

// 背景
ctx.fillStyle = '#1a1a1a';
ctx.fillRect(0, 0, w, h);

// 画板边框
ctx.strokeStyle = '#444';
ctx.lineWidth = 1;
ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

// 安全区域遮罩
if (state.safeZone && tpl.safeZone) {
var sz = tpl.safeZone;
ctx.fillStyle = 'rgba(255,107,0,0.08)';

// 上
ctx.fillRect(0, 0, w, sz.top * sy);
// 下
ctx.fillRect(0, h - sz.bottom * sy, w, sz.bottom * sy);
// 左
ctx.fillRect(0, sz.top * sy, sz.left * sx, h - sz.top * sy - sz.bottom * sy);
// 右
ctx.fillRect(w - sz.right * sx, sz.top * sy, sz.right * sx, h - sz.top * sy - sz.bottom * sy);

// 安全区域虚线框
ctx.strokeStyle = '#FF6B00';
ctx.lineWidth = 1;
ctx.setLineDash([4, 2]);
ctx.strokeRect(
sz.left * sx,
sz.top * sy,
(tpl.width - sz.left - sz.right) * sx,
(tpl.height - sz.top - sz.bottom) * sy
);
ctx.setLineDash([]);
}

// 功能区域
for (var i = 0; i < tpl.zones.length; i++) {
var zone = tpl.zones[i];
var zx = zone.x * sx;
var zy = zone.y * sy;
var zw = zone.w * sx;
var zh = zone.h * sy;

// 填充
ctx.fillStyle = zone.color;
ctx.globalAlpha = 0.12;
ctx.fillRect(zx, zy, zw, zh);

// 边框
ctx.globalAlpha = 0.6;
ctx.strokeStyle = zone.color;
ctx.lineWidth = 1;
ctx.strokeRect(zx + 0.5, zy + 0.5, zw - 1, zh - 1);

// 标签
if (state.showLabels && zw > 30 && zh > 15) {
ctx.globalAlpha = 0.9;
ctx.fillStyle = zone.color;
ctx.font = 'bold 8px sans-serif';
ctx.textAlign = 'left';
ctx.fillText(zone.name, zx + 3, zy + 10);
}
}

ctx.globalAlpha = 1;

// 尺寸标注
ctx.fillStyle = 'rgba(255,255,255,0.35)';
ctx.font = '9px sans-serif';
ctx.textAlign = 'center';
ctx.fillText(tpl.width + '×' + tpl.height, w / 2, h - 4);
}

// ============================
// HostAdapter 电商模板扩展
// ============================

HostAdapter.createDocument = function (width, height, name) {
return callHost('createDocument', [width, height, name || 'Untitled']);
};

HostAdapter.addEcomZones = function (rects, color, opacity) {
return callHost('addEcomZones', [JSON.stringify(rects), color || '#FF6B00', opacity || 12]);
};

HostAdapter.addEcomFunctionZones = function (zones) {
return callHost('addEcomFunctionZones', [JSON.stringify(zones)]);
};

HostAdapter.addEcomLabels = function (labels) {
return callHost('addEcomLabels', [JSON.stringify(labels)]);
};

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

  // ============================
  // 全局导出（供外部模块使用）
  // ============================
  window.GridMaster = {
    createSection: createSection,
    createApplyButton: createApplyButton,
    createNumberInput: createNumberInput,
    createSelect: createSelect,
    createPresetList: createPresetList,
    showToast: showToast,
    _createToggleSwitch: function (value, onChange) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';
      var toggle = document.createElement('div');
      toggle.style.cssText = 'width:36px;height:20px;border-radius:10px;cursor:pointer;transition:all 0.2s;' +
        'background:' + (value ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)') + ';' +
        'border:1px solid ' + (value ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';position:relative;';
      var knob = document.createElement('div');
      knob.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:1px;transition:left 0.2s;' +
        'left:' + (value ? '17px' : '1px') + ';box-shadow:0 1px 3px rgba(0,0,0,0.3);';
      toggle.appendChild(knob);
      toggle.addEventListener('click', function () {
        value = !value;
        toggle.style.background = value ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)';
        toggle.style.borderColor = value ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)';
        knob.style.left = value ? '17px' : '1px';
        if (onChange) onChange(value);
      });
      return { el: row, toggle: toggle, getValue: function () { return value; } };
    },
    HostAdapter: HostAdapter,
    Calculator: Calculator,
    Storage: Storage,
    PresetManager: PresetManager,
    get currentDocInfo() { return currentDocInfo; },
    get currentTab() { return currentTab; }
  };

})();
