/**
 * DotGridMaster ExtendScript 宿主脚本 (完整版)
 * 运行在 Illustrator 的 ExtendScript 引擎中
 * 通过 CSInterface.evalScript() 从前端调用
 */

// ============================
// JSON Polyfill (ExtendScript 兼容)
// ============================

if (typeof JSON === 'undefined') {
  JSON = {};
}

if (typeof JSON.stringify !== 'function') {
  JSON.stringify = function (value) {
    return _jsonStringify(value);
  };
}

if (typeof JSON.parse !== 'function') {
  JSON.parse = function (text) {
    // ExtendScript 中使用 eval 解析 JSON
    // 基本安全校验：仅允许 JSON 合法字符
    if (/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(text.replace(/"(\\.|[^"\\])*"/g, ''))) {
      throw new Error('Invalid JSON');
    }
    return eval('(' + text + ')');
  };
}

function _jsonStringify(value, indent, currentIndent) {
  indent = indent || '';
  currentIndent = currentIndent || '';

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  var type = typeof value;

  if (type === 'boolean') return value ? 'true' : 'false';
  if (type === 'number') {
    if (isNaN(value)) return 'null';
    if (!isFinite(value)) return 'null';
    return String(value);
  }
  if (type === 'string') {
    return '"' + value
      .replace(/\/g, '\')
      .replace(/"/g, '\"')
      .replace(/\n/g, '\n')
      .replace(/\r/g, '\r')
      .replace(/\t/g, '\t') + '"';
  }

  // Array
  if (value instanceof Array) {
    if (value.length === 0) return '[]';
    var items = [];
    for (var i = 0; i < value.length; i++) {
      var itemVal = _jsonStringify(value[i], indent, currentIndent);
      if (itemVal === undefined) itemVal = 'null';
      items.push(itemVal);
    }
    return '[' + items.join(',') + ']';
  }

  // Object
  if (type === 'object') {
    var pairs = [];
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        var propVal = _jsonStringify(value[key], indent, currentIndent);
        if (propVal !== undefined) {
          pairs.push('"' + key + '":' + propVal);
        }
      }
    }
    if (pairs.length === 0) return '{}';
    return '{' + pairs.join(',') + '}';
  }

  return undefined;
}

// 保留旧接口兼容
function jsonStringify(obj) {
  return JSON.stringify(obj);
}

// ============================
// 撤销系统
// ============================

var _dotgridmasterUndoStack = [];
var _MAX_UNDO_STACK = 20;

function _pushUndoRecord(actionType, details) {
  _dotgridmasterUndoStack.push({
    type: actionType,
    details: details || {},
    timestamp: new Date().getTime()
  });
  if (_dotgridmasterUndoStack.length > _MAX_UNDO_STACK) {
    _dotgridmasterUndoStack.shift();
  }
}

function undoDotGridMaster() {
  try {
    if (_dotgridmasterUndoStack.length === 0) {
      return JSON.stringify({ success: false, error: 'No DotGridMaster actions to undo' });
    }

    var lastAction = _dotgridmasterUndoStack.pop();

    switch (lastAction.type) {
      case 'guides':
        _clearDotGridMasterGuides();
        break;
      case 'overlays':
        _removeLayerByName(OVERLAY_LAYER_NAME);
        break;
      case 'composition':
        _removeLayerByName(COMPOSITION_LAYER_NAME);
        break;
      case 'printmarks':
        _removeLayerByName(PRINT_MARKS_LAYER_NAME);
        break;
      case 'all':
        _clearDotGridMasterGuides();
        _removeLayerByName(OVERLAY_LAYER_NAME);
        _removeLayerByName(COMPOSITION_LAYER_NAME);
        _removeLayerByName(PRINT_MARKS_LAYER_NAME);
        break;
    }

    return JSON.stringify({
      success: true,
      undone: lastAction.type,
      remaining: _dotgridmasterUndoStack.length
    });
  } catch (e) {
alert("DotGridMaster Error: " + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

function getUndoState() {
  return JSON.stringify({
    success: true,
    data: {
      count: _dotgridmasterUndoStack.length,
      lastAction: _dotgridmasterUndoStack.length > 0
        ? _dotgridmasterUndoStack[_dotgridmasterUndoStack.length - 1].type
        : null
    }
  });
}

// ============================
// 工具函数
// ============================

function hexToRGB(hex) {
  var clean = hex.replace('#', '');
  // 支持 3 位简写
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  var r = parseInt(clean.substring(0, 2), 16);
  var g = parseInt(clean.substring(2, 4), 16);
  var b = parseInt(clean.substring(4, 6), 16);
  return { r: r, g: g, b: b };
}

function makeRGBColor(r, g, b) {
  var color = new RGBColor();
  color.red = Math.max(0, Math.min(255, r));
  color.green = Math.max(0, Math.min(255, g));
  color.blue = Math.max(0, Math.min(255, b));
  return color;
}

function getActiveArtboardRect() {
  var doc = app.activeDocument;
  var abIndex = doc.artboards.getActiveArtboardIndex();
  return doc.artboards[abIndex].artboardRect;
}

function _removeLayerByName(name) {
  try {
    var doc = app.activeDocument;
    var layer = doc.layers.getByName(name);
    layer.locked = false;
    layer.remove();
  } catch (e) {
    // 图层不存在，忽略
  }
}

function getOrCreateLayer(name) {
  var doc = app.activeDocument;
  try {
    var layer = doc.layers.getByName(name);
    layer.locked = false;
    layer.visible = true;
    return layer;
  } catch (e) {
    var newLayer = doc.layers.add();
    newLayer.name = name;
    return newLayer;
  }
}

function clearLayerContents(layer) {
  layer.locked = false;
  for (var i = layer.pageItems.length - 1; i >= 0; i--) {
    layer.pageItems[i].remove();
  }
}

// ============================
// 文档信息
// ============================

function getDocumentInfo() {
  try {
    if (app.documents.length === 0) {
      return JSON.stringify({
        success: false,
        error: 'No document open'
      });
    }

    var doc = app.activeDocument;
    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    // artboardRect: [left, top, right, bottom]
    // AI 坐标系：Y 轴向上，top > bottom
    var width = abRect[2] - abRect[0];
    var height = abRect[1] - abRect[3];

    // 获取文档单位
    var unitStr = 'unknown';
    try {
      var ru = doc.rulerUnits;
      if (ru == RulerUnits.Pixels) unitStr = 'px';
      else if (ru == RulerUnits.Points) unitStr = 'pt';
      else if (ru == RulerUnits.Millimeters) unitStr = 'mm';
      else if (ru == RulerUnits.Centimeters) unitStr = 'cm';
      else if (ru == RulerUnits.Inches) unitStr = 'in';
      else if (ru == RulerUnits.Picas) unitStr = 'pica';
      else unitStr = ru.toString();
    } catch (ue) {
      unitStr = 'unknown';
    }

    return JSON.stringify({
      success: true,
      data: {
        name: doc.name,
        width: Math.round(width * 1000) / 1000,
        height: Math.round(height * 1000) / 1000,
        artboardIndex: abIndex,
        artboardCount: doc.artboards.length,
        artboardLeft: abRect[0],
        artboardTop: abRect[1],
        artboardRight: abRect[2],
        artboardBottom: abRect[3],
        unit: unitStr,
        colorSpace: doc.documentColorSpace == DocumentColorSpace.CMYK ? 'CMYK' : 'RGB'
      }
    });
  } catch (e) {
    return JSON.stringify({
      success: false,
      error: e.message || 'Failed to get document info'
    });
  }
}

// ============================
// 参考线管理
// ============================

// DotGridMaster 创建的参考线使用特殊命名前缀
var GM_GUIDE_PREFIX = 'DotGridMaster_';

/**
 * 清除所有参考线（AI 原生参考线没有命名，只能全部清除）
 */
function clearAllGuides() {
  try {
    if (app.documents.length === 0) {
      return JSON.stringify({ success: false, error: 'No document open' });
    }
    var doc = app.activeDocument;

    // 清除原生参考线
    for (var i = doc.guides.length - 1; i >= 0; i--) {
      doc.guides[i].remove();
    }

    // 清除 DotGridMaster 创建的参考线图层
    _removeLayerByName('DotGridMaster_Guides');

    _pushUndoRecord('guides', { action: 'clear' });
    return JSON.stringify({ success: true, cleared: true });
  } catch (e) {
alert("DotGridMaster Error: " + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

/**
 * 仅清除 DotGridMaster 创建的参考线
 * 通过遍历带 GM_GUIDE_PREFIX 名称的 guide path 来识别
 */
function _clearDotGridMasterGuides() {
  try {
    var doc = app.activeDocument;
    // 遍历所有图层中的 guide 路径
    for (var li = 0; li < doc.layers.length; li++) {
      var layer = doc.layers[li];
      for (var pi = layer.pathItems.length - 1; pi >= 0; pi--) {
        var item = layer.pathItems[pi];
        if (item.guides && item.name &&
            item.name.indexOf(GM_GUIDE_PREFIX) === 0) {
          item.remove();
        }
      }
    }
    // 同时清除原生 guides
    for (var gi = doc.guides.length - 1; gi >= 0; gi--) {
      doc.guides[gi].remove();
    }
  } catch (e) {
    // 静默失败
  }
}

/**
 * 添加参考线
 * @param {string} guidesJSON - JSON 字符串
 *   [{ orientation: "horizontal"|"vertical", position: number }]
 */
function addGuides(guidesJSON) {
  try {
    if (app.documents.length === 0) {
      return JSON.stringify({ success: false, error: 'No document open' });
    }

    var doc = app.activeDocument;
    var guides = JSON.parse(guidesJSON);

    if (!guides || guides.length === 0) {
      return JSON.stringify({ success: true, count: 0 });
    }

    // 获取当前画板偏移
    var abRect = getActiveArtboardRect();
    var abLeft = abRect[0];
    var abTop = abRect[1];
    var abRight = abRect[2];
    var abBottom = abRect[3];
    var abWidth = abRight - abLeft;
    var abHeight = abTop - abBottom;

    var addedCount = 0;

    // 创建参考线（使用可见路径 + 尝试原生参考线）
    var layer = getOrCreateLayer('DotGridMaster_Guides');
    clearLayerContents(layer);

    // 设置参考线样式颜色
    var guideColor = new RGBColor();
    guideColor.red = 13; guideColor.green = 153; guideColor.blue = 255;

    for (var i = 0; i < guides.length; i++) {
      var g = guides[i];
      var pos = g.position;

      if (typeof pos !== 'number' || isNaN(pos)) continue;

      try {
        // 创建可见路径作为参考线
        var guidePath = layer.pathItems.add();
        guidePath.name = GM_GUIDE_PREFIX + g.orientation + '_' + Math.round(pos);

        if (g.orientation === 'horizontal') {
          var aiY = abTop - pos;
          guidePath.setEntirePath([
            [abLeft - 200, aiY],
            [abRight + 200, aiY]
          ]);
        } else {
          var aiX = abLeft + pos;
          guidePath.setEntirePath([
            [aiX, abTop + 200],
            [aiX, abBottom - 200]
          ]);
        }

        // 设置为蓝色虚线（可见）
        guidePath.filled = false;
        guidePath.stroked = true;
        guidePath.strokeWidth = 0.5;
        guidePath.strokeColor = guideColor;
        guidePath.strokeDashes = [6, 3];
        guidePath.opacity = 80;

        // 尝试转为原生参考线（如果不支持则保持为可见路径）
        try { guidePath.guides = true; } catch (eg) {}

        addedCount++;
      } catch (ge) {
        // 忽略单条失败
      }
    }

    layer.printable = false;
    layer.locked = true;

    _pushUndoRecord('guides', { action: 'add', count: addedCount });
    return JSON.stringify({ success: true, count: addedCount, method: 'fallback' });
  } catch (e) {
alert("DotGridMaster Error: " + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

// ============================
// 覆盖层管理
// ============================

var OVERLAY_LAYER_NAME = 'DotGridMaster_Overlays';

/**
 * 添加覆盖层
 * @param {string} overlaysJSON - JSON 字符串
 *   [{ x, y, width, height, color, opacity, label }]
 */
function addOverlays(overlaysJSON) {
  try {
    if (app.documents.length === 0) {
      return JSON.stringify({ success: false, error: 'No document open' });
    }

    var doc = app.activeDocument;
    var overlays = JSON.parse(overlaysJSON);

    if (!overlays || overlays.length === 0) {
      return JSON.stringify({ success: true, count: 0 });
    }

    var layer = getOrCreateLayer(OVERLAY_LAYER_NAME);
    clearLayerContents(layer);

    var abRect = getActiveArtboardRect();
    var abLeft = abRect[0];
    var abTop = abRect[1];

    for (var i = 0; i < overlays.length; i++) {
      var ov = overlays[i];

      try {
        // pathItems.rectangle(top, left, width, height)
        // top 是矩形顶边的 AI Y 坐标
        var rectTop = abTop - ov.y;
        var rectLeft = abLeft + ov.x;

        var rect = layer.pathItems.rectangle(
          rectTop,
          rectLeft,
          ov.width,
          ov.height
        );

        // 填充
        rect.filled = true;
        rect.stroked = false;
        var rgb = hexToRGB(ov.color || '#FF0000');
        rect.fillColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
        rect.opacity = ov.opacity || 20;
        rect.name = ov.label || 'Overlay_' + i;
      } catch (re) {
        // 单个矩形失败不影响其他
      }
    }

    // 锁定图层，不可打印
    layer.printable = false;
    layer.locked = true;

    _pushUndoRecord('overlays', { action: 'add', count: overlays.length });

    return JSON.stringify({ success: true, count: overlays.length });
  } catch (e) {
alert("DotGridMaster Error: " + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

/**
 * 清除覆盖层
 */
function clearOverlays() {
  _removeLayerByName(OVERLAY_LAYER_NAME);
  _pushUndoRecord('overlays', { action: 'clear' });
  return JSON.stringify({ success: true });
}

// ============================
// 构图辅助线
// ============================

var COMPOSITION_LAYER_NAME = 'DotGridMaster_Composition';

/**
 * 绘制构图线条
 * @param {string} linesJSON - JSON 数组
 *   [{ x1, y1, x2, y2, color, strokeWidth, dashed, label }]
 */
function addCompositionLines(linesJSON) {
  try {
    if (app.documents.length === 0) {
      return JSON.stringify({ success: false, error: 'No document open' });
    }

    var doc = app.activeDocument;
    var lines = JSON.parse(linesJSON);

    if (!lines || lines.length === 0) {
      return JSON.stringify({ success: true, count: 0 });
    }

    var layer = getOrCreateLayer(COMPOSITION_LAYER_NAME);
    clearLayerContents(layer);

    var abRect = getActiveArtboardRect();
    var abLeft = abRect[0];
    var abTop = abRect[1];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      try {
        var path = layer.pathItems.add();

        path.setEntirePath([
          [abLeft + line.x1, abTop - line.y1],
          [abLeft + line.x2, abTop - line.y2]
        ]);

        path.filled = false;
        path.stroked = true;
        path.strokeWidth = line.strokeWidth || 0.5;

        var rgb = hexToRGB(line.color || '#FF6B00');
        path.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);

        if (line.dashed) {
          path.strokeDashes = [4, 3];
        }

        path.name = line.label || 'Comp_Line_' + i;
      } catch (le) {
        // 单条线失败不影响其他
      }
    }

    layer.printable = false;
    layer.locked = true;

    _pushUndoRecord('composition', { action: 'add', count: lines.length });

    return JSON.stringify({ success: true, count: lines.length });
  } catch (e) {
alert("DotGridMaster Error: " + e.message);
    return JSON.stringify({ success: false, error: e.message });
  }
}

/**
 * 绘制螺旋线（多点路径）
/**
* 绘制螺旋线（多点路径）
* @param {string} pointsJSON - [{ x, y }, ...]
* @param {string} color - 十六进制颜色
* @param {number} strokeWidth - 线宽
*/
function addSpiralPath(pointsJSON, color, strokeWidth) {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
var points = JSON.parse(pointsJSON);

if (!points || points.length < 2) {
return JSON.stringify({ success: false, error: 'Need at least 2 points' });
}

var layer = getOrCreateLayer(COMPOSITION_LAYER_NAME);

var abRect = getActiveArtboardRect();
var abLeft = abRect[0];
var abTop = abRect[1];

var path = layer.pathItems.add();
var pathPoints = [];

for (var i = 0; i < points.length; i++) {
pathPoints.push([
abLeft + points[i].x,
abTop - points[i].y
]);
}

path.setEntirePath(pathPoints);
path.filled = false;
path.stroked = true;
path.strokeWidth = strokeWidth || 0.75;

var rgb = hexToRGB(color || '#FF6B00');
path.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
path.name = 'DotGridMaster_Spiral';

// 如果点数足够，尝试平滑曲线
if (points.length >= 4) {
for (var p = 0; p < path.pathPoints.length; p++) {
path.pathPoints[p].pointType = PointType.SMOOTH;
}
}

layer.printable = false;
layer.locked = true;

return JSON.stringify({ success: true, pointCount: points.length });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

/**
* 清除构图辅助
*/
function clearComposition() {
_removeLayerByName(COMPOSITION_LAYER_NAME);
_pushUndoRecord('composition', { action: 'clear' });
return JSON.stringify({ success: true });
}

// ============================
// 印刷标记
// ============================

var PRINT_MARKS_LAYER_NAME = 'DotGridMaster_PrintMarks';

/**
* 添加裁切/印刷标记
* @param {string} marksJSON - JSON 数组
*   [{ x1, y1, x2, y2, color, strokeWidth }]
*/
function addPrintMarks(marksJSON) {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
var marks = JSON.parse(marksJSON);

if (!marks || marks.length === 0) {
return JSON.stringify({ success: true, count: 0 });
}

var layer = getOrCreateLayer(PRINT_MARKS_LAYER_NAME);
clearLayerContents(layer);

var abRect = getActiveArtboardRect();
var abLeft = abRect[0];
var abTop = abRect[1];

for (var i = 0; i < marks.length; i++) {
var mark = marks[i];

try {
var path = layer.pathItems.add();

path.setEntirePath([
[abLeft + mark.x1, abTop - mark.y1],
[abLeft + mark.x2, abTop - mark.y2]
]);

path.filled = false;
path.stroked = true;
path.strokeWidth = mark.strokeWidth || 0.3;

var rgb = hexToRGB(mark.color || '#000000');
path.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
path.name = 'TrimMark_' + i;
} catch (me) {
// 单条标记失败不影响其他
}
}

// 添加套准标记（十字 + 圆）
_addRegistrationMarks(layer, abRect);

layer.printable = true; // 印刷标记需要打印
layer.locked = true;

_pushUndoRecord('printmarks', { action: 'add', count: marks.length });

return JSON.stringify({ success: true, count: marks.length });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

/**
* 添加套准标记（四边中点）
*/
function _addRegistrationMarks(layer, abRect) {
var abLeft = abRect[0];
var abTop = abRect[1];
var abRight = abRect[2];
var abBottom = abRect[3];
var abWidth = abRight - abLeft;
var abHeight = abTop - abBottom;

var midX = abLeft + abWidth / 2;
var midY = abBottom + abHeight / 2;
var offset = 15; // 标记距画板边缘的距离
var markSize = 5; // 标记大小

// 四个位置：上中、下中、左中、右中
var positions = [
{ x: midX, y: abTop + offset },     // 上
{ x: midX, y: abBottom - offset },   // 下
{ x: abLeft - offset, y: midY },     // 左
{ x: abRight + offset, y: midY }     // 右
];

for (var i = 0; i < positions.length; i++) {
var pos = positions[i];

try {
// 十字线 - 水平
var hLine = layer.pathItems.add();
hLine.setEntirePath([
[pos.x - markSize, pos.y],
[pos.x + markSize, pos.y]
]);
hLine.filled = false;
hLine.stroked = true;
hLine.strokeWidth = 0.25;
hLine.strokeColor = makeRGBColor(0, 0, 0);
hLine.name = 'RegMark_H_' + i;

// 十字线 - 垂直
var vLine = layer.pathItems.add();
vLine.setEntirePath([
[pos.x, pos.y - markSize],
[pos.x, pos.y + markSize]
]);
vLine.filled = false;
vLine.stroked = true;
vLine.strokeWidth = 0.25;
vLine.strokeColor = makeRGBColor(0, 0, 0);
vLine.name = 'RegMark_V_' + i;

// 圆圈
var circleSize = markSize * 0.7;
var circle = layer.pathItems.ellipse(
pos.y + circleSize,   // top
pos.x - circleSize,   // left
circleSize * 2,       // width
circleSize * 2        // height
);
circle.filled = false;
circle.stroked = true;
circle.strokeWidth = 0.25;
circle.strokeColor = makeRGBColor(0, 0, 0);
circle.name = 'RegMark_Circle_' + i;
} catch (re) {
// 忽略单个标记失败
}
}
}

/**
* 清除印刷标记
*/
function clearPrintMarks() {
_removeLayerByName(PRINT_MARKS_LAYER_NAME);
_pushUndoRecord('printmarks', { action: 'clear' });
return JSON.stringify({ success: true });
}

// ============================
// 画板管理
// ============================

/**
* 获取所有画板信息
*/
function getAllArtboards() {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
var boards = [];

for (var i = 0; i < doc.artboards.length; i++) {
var ab = doc.artboards[i];
var rect = ab.artboardRect;
boards.push({
index: i,
name: ab.name,
width: Math.round((rect[2] - rect[0]) * 1000) / 1000,
height: Math.round((rect[1] - rect[3]) * 1000) / 1000,
left: rect[0],
top: rect[1],
right: rect[2],
bottom: rect[3]
});
}

return JSON.stringify({ success: true, data: boards });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

/**
* 设置活动画板
*/
function setActiveArtboard(index) {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
if (index < 0 || index >= doc.artboards.length) {
return JSON.stringify({ success: false, error: 'Invalid artboard index: ' + index });
}

doc.artboards.setActiveArtboardIndex(index);

return JSON.stringify({ success: true, activeIndex: index });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 全部清除
// ============================

/**
* 清除 DotGridMaster 创建的所有内容
*/
function clearAll() {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

// 清除参考线
_clearDotGridMasterGuides();

// 清除所有 DotGridMaster 图层
_removeLayerByName(OVERLAY_LAYER_NAME);
_removeLayerByName(COMPOSITION_LAYER_NAME);
_removeLayerByName(PRINT_MARKS_LAYER_NAME);
_removeLayerByName('DotGridMaster_Guides');
_removeLayerByName(GRID_OVERLAY_LAYER_NAME);
_removeLayerByName(ECOM_LAYER_NAME);
_removeLayerByName(BASEGRID_LAYER_NAME);
_removeLayerByName(PREVIEW_LAYER_NAME);

_pushUndoRecord('all', { action: 'clear' });

return JSON.stringify({ success: true, message: 'All DotGridMaster content cleared' });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 高级功能：网格覆盖层
// ============================

var GRID_OVERLAY_LAYER_NAME = 'DotGridMaster_GridOverlay';

/**
* 添加网格可视化覆盖层（半透明列/行色块）
* @param {string} gridJSON - JSON 对象
*   { columns, rows, gutterH, gutterV, marginTop, marginRight, marginBottom, marginLeft, color, opacity }
*/
function addGridOverlay(gridJSON) {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
var opts = JSON.parse(gridJSON);

var abRect = getActiveArtboardRect();
var abLeft = abRect[0];
var abTop = abRect[1];
var abRight = abRect[2];
var abBottom = abRect[3];
var docWidth = abRight - abLeft;
var docHeight = abTop - abBottom;

var cols = opts.columns || 1;
var rows = opts.rows || 1;
var gH = opts.gutterH || 0;
var gV = opts.gutterV || 0;
var mT = opts.marginTop || 0;
var mR = opts.marginRight || 0;
var mB = opts.marginBottom || 0;
var mL = opts.marginLeft || 0;

var availW = docWidth - mL - mR;
var availH = docHeight - mT - mB;
var totalGutterH = (cols - 1) * gH;
var totalGutterV = (rows - 1) * gV;
var colWidth = (availW - totalGutterH) / cols;
var rowHeight = (availH - totalGutterV) / rows;

var layer = getOrCreateLayer(GRID_OVERLAY_LAYER_NAME);
clearLayerContents(layer);

var rgb = hexToRGB(opts.color || '#0D99FF');
var opacity = opts.opacity || 8;

var count = 0;

for (var c = 0; c < cols; c++) {
for (var r = 0; r < rows; r++) {
var x = mL + c * (colWidth + gH);
var y = mT + r * (rowHeight + gV);

var rectTop = abTop - y;
var rectLeft = abLeft + x;

try {
var rect = layer.pathItems.rectangle(
rectTop,
rectLeft,
colWidth,
rowHeight
);
rect.filled = true;
rect.stroked = false;
rect.fillColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
rect.opacity = opacity;
rect.name = 'GridCell_' + c + '_' + r;
count++;
} catch (ce) {
// 忽略
}
}
}

layer.printable = false;
layer.locked = true;

return JSON.stringify({ success: true, count: count, colWidth: colWidth, rowHeight: rowHeight });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

/**
* 清除网格覆盖层
*/
function clearGridOverlay() {
_removeLayerByName(GRID_OVERLAY_LAYER_NAME);
return JSON.stringify({ success: true });
}

// ============================
// 高级功能：颜色条（印刷用）
// ============================

/**
* 添加色彩条（CMYK 校准色块）
*/
function addColorBar() {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
var layer = getOrCreateLayer(PRINT_MARKS_LAYER_NAME);

var abRect = getActiveArtboardRect();
var abLeft = abRect[0];
var abTop = abRect[1];
var abRight = abRect[2];
var abBottom = abRect[3];
var abWidth = abRight - abLeft;

// 色彩条放在画板下方
var barTop = abBottom - 8;
var barHeight = 5;
var barWidth = abWidth * 0.6;
var barLeft = abLeft + (abWidth - barWidth) / 2;

// CMYK 基础色块
var colors = [
{ c: 100, m: 0, y: 0, k: 0, label: 'C' },
{ c: 0, m: 100, y: 0, k: 0, label: 'M' },
{ c: 0, m: 0, y: 100, k: 0, label: 'Y' },
{ c: 0, m: 0, y: 0, k: 100, label: 'K' },
{ c: 100, m: 100, y: 0, k: 0, label: 'CM' },
{ c: 100, m: 0, y: 100, k: 0, label: 'CY' },
{ c: 0, m: 100, y: 100, k: 0, label: 'MY' },
{ c: 100, m: 100, y: 100, k: 0, label: 'CMY' },
{ c: 0, m: 0, y: 0, k: 25, label: '25K' },
{ c: 0, m: 0, y: 0, k: 50, label: '50K' },
{ c: 0, m: 0, y: 0, k: 75, label: '75K' },
{ c: 0, m: 0, y: 0, k: 100, label: '100K' }
];

var cellWidth = barWidth / colors.length;

for (var i = 0; i < colors.length; i++) {
var col = colors[i];
try {
var rect = layer.pathItems.rectangle(
barTop,
barLeft + i * cellWidth,
cellWidth,
barHeight
);
rect.filled = true;
rect.stroked = true;
rect.strokeWidth = 0.1;

// 使用 CMYK 颜色
if (doc.documentColorSpace == DocumentColorSpace.CMYK) {
var cmykColor = new CMYKColor();
cmykColor.cyan = col.c;
cmykColor.magenta = col.m;
cmykColor.yellow = col.y;
cmykColor.black = col.k;
rect.fillColor = cmykColor;
rect.strokeColor = cmykColor;
} else {
// RGB 模式下的近似
var r = 255 * (1 - col.c / 100) * (1 - col.k / 100);
var g = 255 * (1 - col.m / 100) * (1 - col.k / 100);
var b = 255 * (1 - col.y / 100) * (1 - col.k / 100);
rect.fillColor = makeRGBColor(r, g, b);
rect.strokeColor = makeRGBColor(0, 0, 0);
}

rect.name = 'ColorBar_' + col.label;
} catch (cbe) {
// 忽略
}
}

return JSON.stringify({ success: true, count: colors.length });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 高级功能：8pt 基准网格
// ============================

var BASEGRID_LAYER_NAME = 'DotGridMaster_BaseGrid';

/**
* 添加 8pt 基准网格线
* @param {string} optionsJSON - { gridSize: 8, color: '#EEEEEE', opacity: 30 }
*/
function addBaseGrid(optionsJSON) {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}

var doc = app.activeDocument;
var opts = optionsJSON ? JSON.parse(optionsJSON) : {};
var gridSize = opts.gridSize || 8;
var color = opts.color || '#DDDDDD';
var opacity = opts.opacity || 20;

var abRect = getActiveArtboardRect();
var abLeft = abRect[0];
var abTop = abRect[1];
var abRight = abRect[2];
var abBottom = abRect[3];
var abWidth = abRight - abLeft;
var abHeight = abTop - abBottom;

var layer = getOrCreateLayer(BASEGRID_LAYER_NAME);
clearLayerContents(layer);

var rgb = hexToRGB(color);
var lineCount = 0;

// 垂直线
for (var x = 0; x <= abWidth; x += gridSize) {
try {
var vPath = layer.pathItems.add();
vPath.setEntirePath([
[abLeft + x, abTop],
[abLeft + x, abBottom]
]);
vPath.filled = false;
vPath.stroked = true;
vPath.strokeWidth = 0.25;
vPath.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
vPath.opacity = opacity;
vPath.name = 'BaseGrid_V_' + x;
lineCount++;
} catch (ve) {}
}

// 水平线
for (var y = 0; y <= abHeight; y += gridSize) {
try {
var hPath = layer.pathItems.add();
hPath.setEntirePath([
[abLeft, abTop - y],
[abRight, abTop - y]
]);
hPath.filled = false;
hPath.stroked = true;
hPath.strokeWidth = 0.25;
hPath.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
hPath.opacity = opacity;
hPath.name = 'BaseGrid_H_' + y;
lineCount++;
} catch (he) {}
}

layer.printable = false;
layer.locked = true;

return JSON.stringify({ success: true, count: lineCount, gridSize: gridSize });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

/**
* 清除基准网格
*/
function clearBaseGrid() {
_removeLayerByName(BASEGRID_LAYER_NAME);
return JSON.stringify({ success: true });
}

// ============================
// 辅助：检测运行环境
// ============================

/**
* 健康检查 - 前端调用验证宿主连接
*/
function healthCheck() {
try {
var info = {
host: 'Illustrator',
version: app.version,
scriptEngine: 'ExtendScript',
hasDocument: app.documents.length > 0,
timestamp: new Date().getTime()
};
return JSON.stringify({ success: true, data: info });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 预览图层（实时预览用）
// ============================

var PREVIEW_LAYER_NAME = 'DotGridMaster_Preview';

function addPreviewLines(linesJSON) {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}
var doc = app.activeDocument;
var lines = JSON.parse(linesJSON);
if (!lines || lines.length === 0) {
return JSON.stringify({ success: true, count: 0 });
}
var layer = getOrCreateLayer(PREVIEW_LAYER_NAME);
clearLayerContents(layer);
var abRect = getActiveArtboardRect();
var abLeft = abRect[0];
var abTop = abRect[1];
var count = 0;
for (var i = 0; i < lines.length; i++) {
var line = lines[i];
try {
var path = layer.pathItems.add();
if (line.orientation) {
if (line.orientation === 'horizontal') {
var aiY = abTop - line.position;
path.setEntirePath([[abLeft - 1000, aiY], [abLeft + 5000, aiY]]);
} else {
var aiX = abLeft + line.position;
path.setEntirePath([[aiX, abTop + 1000], [aiX, abTop - 5000]]);
}
} else {
path.setEntirePath([[abLeft + line.x1, abTop - line.y1], [abLeft + line.x2, abTop - line.y2]]);
}
path.filled = false;
path.stroked = true;
path.strokeWidth = 0.25;
var rgb = hexToRGB(line.color || '#0D99FF');
path.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
if (line.opacity) path.opacity = line.opacity;
count++;
} catch (e) { /* skip invalid line */ }
}
layer.printable = false;
layer.locked = true;
return JSON.stringify({ success: true, count: count });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

function clearPreviewLayer() {
try {
var doc = app.activeDocument;
var layer = doc.layers.getByName(PREVIEW_LAYER_NAME);
layer.locked = false;
layer.remove();
return JSON.stringify({ success: true });
} catch (e) {
return JSON.stringify({ success: true });
}
}

// ============================
// 电商功能区绘制
// ============================

var ECOM_LAYER_NAME = 'DotGridMaster_Ecom';

function addEcomZones(rectsJSON, color, opacity) {
try {
var doc = app.activeDocument;
var rects = JSON.parse(rectsJSON);
var layer = getOrCreateLayer(ECOM_LAYER_NAME);
var abIndex = doc.artboards.getActiveArtboardIndex();
var abRect = doc.artboards[abIndex].artboardRect;
var abLeft = abRect[0];
var abTop = abRect[1];
for (var i = 0; i < rects.length; i++) {
var r = rects[i];
var rw = r.w || r.width || 0;
var rh = r.h || r.height || 0;
var rect = layer.pathItems.rectangle(abTop - r.y, abLeft + r.x, rw, rh);
rect.filled = true;
rect.stroked = false;
var rgb = hexToRGB(color || '#FF6B00');
rect.fillColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
rect.opacity = opacity || 12;
}
layer.printable = false;
layer.locked = true;
return JSON.stringify({ success: true, count: rects.length });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

function addEcomLabels(labelsJSON) {
try {
var doc = app.activeDocument;
var labels = JSON.parse(labelsJSON);
var layer = getOrCreateLayer(ECOM_LAYER_NAME);
layer.locked = false;
var abIndex = doc.artboards.getActiveArtboardIndex();
var abRect = doc.artboards[abIndex].artboardRect;
var abLeft = abRect[0];
var abTop = abRect[1];
for (var i = 0; i < labels.length; i++) {
var lb = labels[i];
var textFrame = layer.textFrames.add();
textFrame.contents = lb.text || lb.name || '';
textFrame.position = [abLeft + (lb.x || 0), abTop - (lb.y || 0)];
textFrame.textRange.characterAttributes.size = lb.fontSize || lb.size || 8;
var rgb = hexToRGB(lb.color || '#FFFFFF');
textFrame.textRange.characterAttributes.fillColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
}
layer.printable = false;
layer.locked = true;
return JSON.stringify({ success: true, count: labels.length });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

function addEcomFunctionZones(zonesJSON) {
try {
var doc = app.activeDocument;
var zones = JSON.parse(zonesJSON);
var layer = getOrCreateLayer(ECOM_LAYER_NAME);
layer.locked = false;
var abIndex = doc.artboards.getActiveArtboardIndex();
var abRect = doc.artboards[abIndex].artboardRect;
var abLeft = abRect[0];
var abTop = abRect[1];
for (var i = 0; i < zones.length; i++) {
var z = zones[i];
var zw = z.w || z.width || 0;
var zh = z.h || z.height || 0;
var rect = layer.pathItems.rectangle(abTop - z.y, abLeft + z.x, zw, zh);
rect.filled = true;
rect.stroked = true;
var fillRgb = hexToRGB(z.color || '#0D99FF');
rect.fillColor = makeRGBColor(fillRgb.r, fillRgb.g, fillRgb.b);
rect.opacity = z.opacity || 8;
rect.strokeWidth = 0.5;
var strokeRgb = hexToRGB(z.color || '#0D99FF');
rect.strokeColor = makeRGBColor(strokeRgb.r, strokeRgb.g, strokeRgb.b);
}
layer.printable = false;
layer.locked = true;
return JSON.stringify({ success: true, count: zones.length });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 印刷标记（完整版）
// ============================

function applyPrintMarks(paramsJSON) {
try {
var doc = app.activeDocument;
var abIndex = doc.artboards.getActiveArtboardIndex();
var abRect = doc.artboards[abIndex].artboardRect;
var abLeft = abRect[0];
var abTop = abRect[1];
var abRight = abRect[2];
var abBottom = abRect[3];
var layer = getOrCreateLayer('DotGridMaster_PrintMarks');
clearLayerContents(layer);

var params = {};
if (paramsJSON) {
  try { params = (typeof paramsJSON === 'string') ? JSON.parse(paramsJSON) : paramsJSON; } catch(e) { params = {}; }
}

var bleed = params.bleed || { top: 3, right: 3, bottom: 3, left: 3 };
var marks = params.marks || { trim: true, registration: true, colorBar: false };
var markLength = 10;
var markOffset = (bleed.top || 3) + 2;

if (marks.trim) {
  var trimMarks = [
    [[abLeft - markOffset - markLength, abTop + markOffset], [abLeft - markOffset, abTop + markOffset]],
    [[abLeft - markOffset, abTop + markOffset + markLength], [abLeft - markOffset, abTop + markOffset]],
    [[abRight + markOffset, abTop + markOffset], [abRight + markOffset + markLength, abTop + markOffset]],
    [[abRight + markOffset, abTop + markOffset + markLength], [abRight + markOffset, abTop + markOffset]],
    [[abLeft - markOffset - markLength, abBottom - markOffset], [abLeft - markOffset, abBottom - markOffset]],
    [[abLeft - markOffset, abBottom - markOffset - markLength], [abLeft - markOffset, abBottom - markOffset]],
    [[abRight + markOffset, abBottom - markOffset], [abRight + markOffset + markLength, abBottom - markOffset]],
    [[abRight + markOffset, abBottom - markOffset - markLength], [abRight + markOffset, abBottom - markOffset]]
  ];
  for (var i = 0; i < trimMarks.length; i++) {
    var path = layer.pathItems.add();
    path.setEntirePath(trimMarks[i]);
    path.filled = false;
    path.stroked = true;
    path.strokeWidth = 0.25;
    path.strokeColor = makeRGBColor(0, 0, 0);
    path.name = 'TrimMark';
  }
}

if (marks.registration) {
  _addRegistrationMarks(layer, abRect);
}

if (params.visualize) {
  var bleedRect = layer.pathItems.rectangle(abTop, abLeft, abRight - abLeft, abTop - abBottom);
  bleedRect.filled = false;
  bleedRect.stroked = true;
  bleedRect.strokeWidth = 0.5;
  bleedRect.strokeDashes = [4, 2];
  bleedRect.strokeColor = makeRGBColor(255, 55, 95);
  bleedRect.name = 'BleedOutline';
}

layer.printable = true;
layer.locked = true;
_pushUndoRecord('printmarks', { action: 'add' });
return JSON.stringify({ success: true });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 创建文档
// ============================

function createDocument(width, height, name) {
try {
var doc = app.documents.add(DocumentColorSpace.RGB, width, height);
if (name) doc.name = name;
return JSON.stringify({ success: true, data: { name: doc.name, width: width, height: height } });
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}

// ============================
// 诊断测试
// ============================

/**
 * 创建一个红色矩形来验证 ExtendScript 实际执行
 */
function diagnosticTest() {
try {
if (app.documents.length === 0) {
return JSON.stringify({ success: false, error: 'No document open' });
}
var doc = app.activeDocument;
var abIndex = doc.artboards.getActiveArtboardIndex();
var abRect = doc.artboards[abIndex].artboardRect;

var layer = doc.activeLayer;
var rect = layer.pathItems.rectangle(abRect[1] - 50, abRect[0] + 50, 200, 100);
rect.filled = true;
rect.stroked = false;
var rgb = new RGBColor();
rgb.red = 255; rgb.green = 0; rgb.blue = 0;
rect.fillColor = rgb;
rect.opacity = 50;
rect.name = 'DotGridMaster_DIAG_TEST';

alert("DotGridMaster Diagnostic:\nLayer: " + layer.name + "\nLocked: " + layer.locked + "\nABRect: " + abRect.join(", ") + "\nRect: " + rect.name);

return JSON.stringify({
success: true,
data: {
layerName: layer.name,
layerLocked: layer.locked,
abRect: abRect,
rectCreated: true
}
});
} catch (e) {
alert("DotGridMaster Error: " + e.message);
return JSON.stringify({ success: false, error: e.message });
}
}
