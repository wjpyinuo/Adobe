/**
* 构图辅助线调试：检查坐标计算
*/
function debugCompositionBounds() {
callHost('getDocumentInfo', []).then(function(doc) {
var info = JSON.parse(doc);
var target = info.selectionBounds || {left: 0, top: 0, width: info.width, height: info.height};

DEBUG.log('composition', '当前计算边界:', target);

// 验证黄金分割线
var golden = target.width * 0.618;
DEBUG.log('composition', '黄金分割线 X 坐标: ' + (target.left + golden).toFixed(2));
});
}
