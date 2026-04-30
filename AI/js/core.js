/**
 * GridMaster Core — 共享基础设施
 * 提供：命名空间、CSInterface 桥接、存储、计算器、预设管理、Toast
 *
 * 加载顺序：CSInterface.js → themeManager.js → core.js
 */

var GridMaster = GridMaster || {};

(function (GM) {
  'use strict';

  // ============================
  // 共享状态
  // ============================

  var cs = new CSInterface();
  GM._csInterface = cs;
  GM.currentDocInfo = null;
  GM.currentTab = 'grid';

  // ============================
  // ExtendScript 桥接封装
  // ============================

  function callHost(funcName, args) {
    return new Promise(function (resolve, reject) {
      var argsStr = '';
      if (args && args.length > 0) {
        var parts = [];
        for (var i = 0; i < args.length; i++) {
          var arg = args[i];
          if (typeof arg === 'string') {
            parts.push("'" + arg.replace(/'/g, "\\'") + "'");
          } else if (typeof arg === 'number') {
            parts.push(String(arg));
          } else {
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
          resolve(result);
        }
      });
    });
  }

  GM.callHost = callHost;

  // ============================
  // 宿主适配器
  // ============================

  GM.HostAdapter = {
    getDocumentInfo: function () { return callHost('getDocumentInfo', []); },
    addGuides: function (guides) { return callHost('addGuides', [JSON.stringify(guides)]); },
    clearGuides: function () { return callHost('clearAllGuides', []); },
    addOverlays: function (overlays) { return callHost('addOverlays', [JSON.stringify(overlays)]); },
    clearOverlays: function () { return callHost('clearOverlays', []); },
    addCompositionLines: function (lines) { return callHost('addCompositionLines', [JSON.stringify(lines)]); },
    addSpiralPath: function (points, color, strokeWidth) { return callHost('addSpiralPath', [JSON.stringify(points), color, strokeWidth]); },
    clearComposition: function () { return callHost('clearComposition', []); },
    addPrintMarks: function (marks) { return callHost('addPrintMarks', [JSON.stringify(marks)]); },
    clearPrintMarks: function () { return callHost('clearPrintMarks', []); },
    getAllArtboards: function () { return callHost('getAllArtboards', []); },
    setActiveArtboard: function (index) { return callHost('setActiveArtboard', [index]); },
    clearAll: function () { return callHost('clearAll', []); },
    undo: function () { return callHost('undoGridMaster', []); },
    getUndoState: function () { return callHost('getUndoState', []); },
    healthCheck: function () { return callHost('healthCheck', []); },
    addGridOverlay: function (opts) { return callHost('addGridOverlay', [JSON.stringify(opts)]); },
    clearGridOverlay: function () { return callHost('clearGridOverlay', []); },
    addBaseGrid: function (options) { return callHost('addBaseGrid', [JSON.stringify(options)]); },
    clearBaseGrid: function () { return callHost('clearBaseGrid', []); },
    addColorBar: function () { return callHost('addColorBar', []); },
    addPreviewLines: function (lines) { return callHost('addPreviewLines', [JSON.stringify(lines)]); },
    clearPreviewLayer: function () { return callHost('clearPreviewLayer', []); },
    createDocument: function (width, height, name) { return callHost('createDocument', [width, height, name || 'Untitled']); },
    addEcomZones: function (rects, color, opacity) { return callHost('addEcomZones', [JSON.stringify(rects), color || '#FF6B00', opacity || 12]); },
    addEcomFunctionZones: function (zones) { return callHost('addEcomFunctionZones', [JSON.stringify(zones)]); },
    addEcomLabels: function (labels) { return callHost('addEcomLabels', [JSON.stringify(labels)]); },
    applyPrintMarks: function (params) { return callHost('applyPrintMarks', [JSON.stringify(params)]); }
  };

  // ============================
  // 本地存储
  // ============================

  GM.Storage = {
    get: function (key) {
      try {
        var val = localStorage.getItem('gridmaster_' + key);
        return val ? JSON.parse(val) : null;
      } catch (e) { return null; }
    },
    set: function (key, value) {
      try {
        localStorage.setItem('gridmaster_' + key, JSON.stringify(value));
        return true;
      } catch (e) { return false; }
    },
    remove: function (key) {
      localStorage.removeItem('gridmaster_' + key);
    }
  };

  // ============================
  // 计算引擎
  // ============================

  GM.Calculator = {

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
          x = mL + c * colWidth + (c - 1) * gH;
          guides.push({ orientation: 'vertical', position: x });
          x = mL + c * colWidth + c * gH;
        }
        guides.push({ orientation: 'vertical', position: x });
      }

      for (var r = 0; r <= rows; r++) {
        var y;
        if (r === 0) { y = mT; }
        else if (r === rows) { y = h - mB; }
        else {
          y = mT + r * rowHeight + (r - 1) * gV;
          guides.push({ orientation: 'horizontal', position: y });
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

  // ============================
  // 预设管理器
  // ============================

  GM.PresetManager = {
    _presets: {},
    _customPresets: {},

    init: function () {
      this._presets = this._getBuiltInPresets();
      var saved = GM.Storage.get('custom_presets');
      if (saved) this._customPresets = saved;
    },

    getAll: function (category) {
      var builtIn = this._presets[category] || [];
      var custom = this._customPresets[category] || [];
      return builtIn.concat(custom);
    },

    save: function (category, preset) {
      if (!this._customPresets[category]) this._customPresets[category] = [];
      preset.id = 'custom_' + Date.now();
      preset.isBuiltIn = false;
      this._customPresets[category].push(preset);
      GM.Storage.set('custom_presets', this._customPresets);
      return preset;
    },

    remove: function (category, presetId) {
      if (!this._customPresets[category]) return;
      this._customPresets[category] = this._customPresets[category].filter(
        function (p) { return p.id !== presetId; }
      );
      GM.Storage.set('custom_presets', this._customPresets);
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
  // 实时预览系统
  // ============================

  var _previewDebounceTimer = null;
  var _previewEnabled = false;

  GM.setPreviewEnabled = function (enabled) {
    _previewEnabled = enabled;
    if (!enabled) GM.clearPreview();
    GM.Storage.set('preview_enabled', enabled);
  };

  GM.clearPreview = function () {
    if (_previewDebounceTimer) { clearTimeout(_previewDebounceTimer); _previewDebounceTimer = null; }
    GM.HostAdapter.clearPreviewLayer();
  };

  GM.triggerPreview = function (type, params) {
    if (!_previewEnabled) return;
    if (_previewDebounceTimer) clearTimeout(_previewDebounceTimer);
    _previewDebounceTimer = setTimeout(function () { _doPreview(type, params); }, 300);
  };

  function _doPreview(type, params) {
    if (!GM.currentDocInfo) return;
    var previewLines = [];
    if (type === 'grid') {
      var result = GM.Calculator.calculateGrid({
        docWidth: GM.currentDocInfo.width, docHeight: GM.currentDocInfo.height,
        columns: params.columns, rows: params.rows,
        gutterH: params.gutterH, gutterV: params.gutterV,
        marginTop: params.marginTop, marginRight: params.marginRight,
        marginBottom: params.marginBottom, marginLeft: params.marginLeft
      });
      previewLines = result.guides.map(function (g) {
        return { orientation: g.orientation, position: g.position, color: '#0D99FF', opacity: 30 };
      });
    } else if (type === 'composition') {
      var compResult = GM.Calculator.calculateComposition(params.type, GM.currentDocInfo.width, GM.currentDocInfo.height);
      previewLines = compResult.lines.map(function (l) {
        return { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, color: '#FF6B00', opacity: 30 };
      });
    }
    if (previewLines.length > 0) {
      GM.HostAdapter.addPreviewLines(previewLines).catch(function () {});
    }
  }

  // ============================
  // Toast 提示
  // ============================

  GM.showToast = function (message, type) {
    type = type || 'info';
    var colors = { success: '#34c759', error: '#ff3b30', warning: '#ffd60a', info: '#0d99ff' };
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
  };

  // ============================
  // 文档信息刷新
  // ============================

  GM.refreshDocInfo = function () {
    GM.HostAdapter.getDocumentInfo().then(function (info) {
      GM.currentDocInfo = info;
      var el = document.getElementById('doc-info');
      if (el && info) {
        el.textContent = info.width + '×' + info.height;
        el.style.color = 'var(--gm-accent-success)';
      }
    }).catch(function () {
      GM.currentDocInfo = null;
      var el = document.getElementById('doc-info');
      if (el) {
        el.textContent = '未检测到文档';
        el.style.color = 'var(--gm-accent-danger)';
      }
    });
  };

})(GridMaster);
