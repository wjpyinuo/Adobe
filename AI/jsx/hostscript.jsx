/**
 * GridMaster ExtendScript 宿主脚本
 * 运行在 Illustrator 的 ExtendScript 引擎中
 * 通过 CSInterface.evalScript() 从前端调用
 */

// ============================
// 工具函数
// ============================

function jsonStringify(obj) {
  // ExtendScript 没有 JSON.stringify，手动实现
  if (typeof JSON !== 'undefined' && JSON.stringify) {
    return JSON.stringify(obj);
  }
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return '"' + obj.replace(/"/g, '\\"') + '"';
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (obj instanceof Array) {
    var items = [];
    for (var i = 0; i < obj.length; i++) {
      items.push(jsonStringify(obj[i]));
    }
    return '[' + items.join(',') + ']';
  }
  if (typeof obj === 'object') {
    var pairs = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        pairs.push('"' + key + '":' + jsonStringify(obj[key]));
      }
    }
    return '{' + pairs.join(',') + '}';
  }
  return String(obj);
}

function hexToRGB(hex) {
  var clean = hex.replace('#', '');
  var r = parseInt(clean.substring(0, 2), 16);
  var g = parseInt(clean.substring(2, 4), 16);
  var b = parseInt(clean.substring(4, 6), 16);
  return { r: r, g: g, b: b };
}

function makeRGBColor(r, g, b) {
  var color = new RGBColor();
  color.red = r;
  color.green = g;
  color.blue = b;
  return color;
}

// ============================
// 文档信息
// ============================

function getDocumentInfo() {
  try {
    var doc = app.activeDocument;
    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    // artboardRect: [left, top, right, bottom]
    // AI 坐标系：Y 轴向上
    var width = abRect[2] - abRect[0];
    var height = abRect[1] - abRect[3];

    return jsonStringify({
      success: true,
      data: {
        name: doc.name,
        width: Math.round(width),
        height: Math.round(height),
        artboardIndex: abIndex,
        artboardCount: doc.artboards.length,
        artboardLeft: abRect[0],
        artboardTop: abRect[1],
        unit: doc.rulerUnits.toString()
      }
    });
  } catch (e) {
    return jsonStringify({
      success: false,
      error: e.message || 'No active document'
    });
  }
}

// ============================
// 参考线管理
// ============================

/**
 * 清除所有参考线
 */
function clearAllGuides() {
  try {
    var doc = app.activeDocument;

    // 方法1：遍历删除
    // AI 的 guides 集合需要倒序删除
    for (var i = doc.guides.length - 1; i >= 0; i--) {
      doc.guides[i].remove();
    }

    return jsonStringify({ success: true });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

/**
 * 添加参考线
 * @param {string} guidesJSON - JSON 字符串，格式：
 *   [{ orientation: "horizontal"|"vertical", position: number }]
 */
function addGuides(guidesJSON) {
  try {
    var doc = app.activeDocument;
    var guides = eval('(' + guidesJSON + ')');

    // 获取当前画板偏移
    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    var abLeft = abRect[0];
    var abTop = abRect[1];

    for (var i = 0; i < guides.length; i++) {
      var g = guides[i];

      // 创建参考线路径
      var guidePath = doc.pathItems.add();
      guidePath.name = 'GridMaster_Guide';

      if (g.orientation === 'horizontal') {
        // 水平参考线：Y 坐标转换
        var y = abTop - g.position;
        guidePath.setEntirePath([
          [abLeft - 1000, y],
          [abLeft + doc.width + 1000, y]
        ]);
      } else {
        // 垂直参考线：X 坐标转换
        var x = abLeft + g.position;
        guidePath.setEntirePath([
          [x, abTop + 1000],
          [x, abTop - doc.height - 1000]
        ]);
      }

      // 转换为参考线
      guidePath.guides = true;
    }

    return jsonStringify({ success: true, count: guides.length });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

// ============================
// 覆盖层管理
// ============================

var OVERLAY_LAYER_NAME = 'GridMaster_Overlays';

function getOrCreateLayer(name) {
  var doc = app.activeDocument;
  try {
    var layer = doc.layers.getByName(name);
    layer.locked = false;
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

/**
 * 添加覆盖层
 * @param {string} overlaysJSON - JSON 字符串
 */
function addOverlays(overlaysJSON) {
  try {
    var doc = app.activeDocument;
    var overlays = eval('(' + overlaysJSON + ')');
    var layer = getOrCreateLayer(OVERLAY_LAYER_NAME);
    clearLayerContents(layer);

    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    var abLeft = abRect[0];
    var abTop = abRect[1];

    for (var i = 0; i < overlays.length; i++) {
      var ov = overlays[i];
      var rect = layer.pathItems.rectangle(
        abTop - ov.y,            // top (AI Y轴)
        abLeft + ov.x,           // left
        ov.width,                // width
        ov.height                // height
      );

      // 填充
      rect.filled = true;
      rect.stroked = false;
      var rgb = hexToRGB(ov.color || '#FF0000');
      rect.fillColor = makeRGBColor(rgb.r, rgb.g, rgb.b);
      rect.opacity = ov.opacity || 20;
      rect.name = ov.label || 'Overlay';
    }

    // 锁定图层
    layer.printable = false;
    layer.locked = true;

    return jsonStringify({ success: true, count: overlays.length });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

/**
 * 清除覆盖层
 */
function clearOverlays() {
  try {
    var doc = app.activeDocument;
    var layer = doc.layers.getByName(OVERLAY_LAYER_NAME);
    layer.locked = false;
    layer.remove();
    return jsonStringify({ success: true });
  } catch (e) {
    return jsonStringify({ success: true }); // 不存在也算成功
  }
}

// ============================
// 构图辅助线（对角线、螺旋线等）
// ============================

var COMPOSITION_LAYER_NAME = 'GridMaster_Composition';

/**
 * 绘制构图线条
 * @param {string} linesJSON - JSON 数组
 */
function addCompositionLines(linesJSON) {
  try {
    var doc = app.activeDocument;
    var lines = eval('(' + linesJSON + ')');
    var layer = getOrCreateLayer(COMPOSITION_LAYER_NAME);
    clearLayerContents(layer);

    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    var abLeft = abRect[0];
    var abTop = abRect[1];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
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

      path.name = line.label || 'Composition_Line';
      path.locked = true;
    }

    layer.printable = false;
    layer.locked = true;

    return jsonStringify({ success: true, count: lines.length });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

/**
 * 绘制螺旋线
 */
function addSpiralPath(pointsJSON, color, strokeWidth) {
  try {
    var doc = app.activeDocument;
    var points = eval('(' + pointsJSON + ')');
    if (points.length < 2) return jsonStringify({ success: true });

    var layer = getOrCreateLayer(COMPOSITION_LAYER_NAME);

    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    var abLeft = abRect[0];
    var abTop = abRect[1];

    var path = layer.pathItems.add();
    var aiPoints = [];
    for (var i = 0; i < points.length; i++) {
      aiPoints.push([abLeft + points[i].x, abTop - points[i].y]);
    }
    path.setEntirePath(aiPoints);

    path.filled = false;
    path.stroked = true;
    path.strokeWidth = strokeWidth || 0.8;

    var rgb = hexToRGB(color || '#FFD700');
    path.strokeColor = makeRGBColor(rgb.r, rgb.g, rgb.b);

    path.name = 'GridMaster_Spiral';
    path.locked = true;

    return jsonStringify({ success: true });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

/**
 * 清除构图辅助线
 */
function clearComposition() {
  try {
    var doc = app.activeDocument;
    var layer = doc.layers.getByName(COMPOSITION_LAYER_NAME);
    layer.locked = false;
    layer.remove();
    return jsonStringify({ success: true });
  } catch (e) {
    return jsonStringify({ success: true });
  }
}

// ============================
// 印刷标记
// ============================

var PRINT_MARKS_LAYER_NAME = 'GridMaster_PrintMarks';

/**
 * 绘制裁切标记
 * @param {string} marksJSON - JSON 数组
 */
function addPrintMarks(marksJSON) {
  try {
    var doc = app.activeDocument;
    var marks = eval('(' + marksJSON + ')');
    var layer = getOrCreateLayer(PRINT_MARKS_LAYER_NAME);
    clearLayerContents(layer);

    var abIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[abIndex].artboardRect;
    var abLeft = abRect[0];
    var abTop = abRect[1];

    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      var path = layer.pathItems.add();

      path.setEntirePath([
        [abLeft + mark.x1, abTop - mark.y1],
        [abLeft + mark.x2, abTop - mark.y2]
      ]);

      path.filled = false;
      path.stroked = true;
      path.strokeWidth = 0.25; // 裁切标记标准线宽

      // 裁切标记用套准色（这里简化为黑色）
      path.strokeColor = makeRGBColor(0, 0, 0);

      path.name = 'TrimMark';
      path.locked = true;
    }

    layer.printable = true; // 裁切标记需要打印
    layer.locked = true;

    return jsonStringify({ success: true, count: marks.length });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

function clearPrintMarks() {
  try {
    var doc = app.activeDocument;
    var layer = doc.layers.getByName(PRINT_MARKS_LAYER_NAME);
    layer.locked = false;
    layer.remove();
    return jsonStringify({ success: true });
  } catch (e) {
    return jsonStringify({ success: true });
  }
}

// ============================
// 批量处理（遍历所有画板）
// ============================

/**
 * 获取所有画板信息
 */
function getAllArtboards() {
  try {
    var doc = app.activeDocument;
    var boards = [];
    for (var i = 0; i < doc.artboards.length; i++) {
      var ab = doc.artboards[i];
      var rect = ab.artboardRect;
      boards.push({
        index: i,
        name: ab.name,
        width: Math.round(rect[2] - rect[0]),
        height: Math.round(rect[1] - rect[3])
      });
    }
    return jsonStringify({ success: true, data: boards });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

/**
 * 切换到指定画板
 */
function setActiveArtboard(index) {
  try {
    var doc = app.activeDocument;
    doc.artboards.setActiveArtboardIndex(index);
    return jsonStringify({ success: true });
  } catch (e) {
    return jsonStringify({ success: false, error: e.message });
  }
}

// ============================
// 一键清除所有 GridMaster 内容
// ============================

function clearAll() {
  clearAllGuides();
  clearOverlays();
  clearComposition();
  clearPrintMarks();
  return jsonStringify({ success: true });
}
```
