// ============================
// P1-5: 黄金螺旋贝塞尔曲线计算
// ============================

/**
* 生成黄金螺旋的贝塞尔控制点
* 每个四分之一圆弧用一个贝塞尔段近似
* @param {number} w - 文档宽度
* @param {number} h - 文档高度
* @param {number} iterations - 递归次数
* @returns {{ lines: Array, spiralPoints: Array, spiralControlPoints: Array }}
*/
Calculator.calculateGoldenSpiral = function (w, h, iterations) {
iterations = iterations || 10;
var PHI = 1.6180339887;

var lines = []; // 矩形分割线
var arcs = [];  // 弧线数据（每段含起点、控制点、终点）

// 初始矩形
var rect = { x: 0, y: 0, w: w, h: h };

// 确保初始矩形接近黄金比例
// 如果宽高比不是黄金比例，取较短边计算
var size = Math.min(rect.w, rect.h);

// 重新定义为正方形序列
var x = 0, y = 0;
var currentW = w, currentH = h;

// 方向序列：0=底部切, 1=右侧切, 2=顶部切, 3=左侧切
var directions = [0, 1, 2, 3];

for (var i = 0; i < iterations; i++) {
var dir = directions[i % 4];
var squareSize;

if (i % 2 === 0) {
// 水平方向分割
squareSize = currentH / PHI;
if (squareSize > currentW) squareSize = currentW;
} else {
// 垂直方向分割
squareSize = currentW / PHI;
if (squareSize > currentH) squareSize = currentH;
}

var arc = _calculateArcForIteration(x, y, currentW, currentH, i, PHI);

if (arc) {
arcs.push(arc);

// 分割线
if (arc.splitLine) {
lines.push(arc.splitLine);
}
}

// 更新矩形
var update = _updateRectForIteration(x, y, currentW, currentH, i, PHI);
x = update.x;
y = update.y;
currentW = update.w;
currentH = update.h;
}

return {
lines: lines,
arcs: arcs,
spiralPoints: _arcsToPoints(arcs, 8) // 每段弧线采样 8 个点
};
};

/**
* 计算单次迭代的弧线
*/
function _calculateArcForIteration(x, y, w, h, iteration, PHI) {
var dir = iteration % 4;
var squareSize, arcCenterX, arcCenterY, startAngle, endAngle;
var splitLine = null;

switch (dir) {
case 0: // 从底部切出正方形
squareSize = Math.min(w, h * PHI / (PHI + 1));
if (h > w / PHI) squareSize = w;
else squareSize = h / PHI * PHI;

squareSize = h / (1 + 1 / PHI);
arcCenterX = x + squareSize;
arcCenterY = y + squareSize;
startAngle = Math.PI;
endAngle = Math.PI * 1.5;
splitLine = {
x1: x, y1: y + squareSize,
x2: x + w, y2: y + squareSize,
color: '#FF6B00', strokeWidth: 0.3, dashed: true
};
break;

case 1: // 从右侧切出正方形
squareSize = w / (1 + 1 / PHI);
arcCenterX = x + w - squareSize;
arcCenterY = y + squareSize;
startAngle = Math.PI * 1.5;
endAngle = Math.PI * 2;
splitLine = {
x1: x + w - squareSize, y1: y,
x2: x + w - squareSize, y2: y + h,
color: '#FF6B00', strokeWidth: 0.3, dashed: true
};
break;

case 2: // 从顶部切出正方形
squareSize = h / (1 + 1 / PHI);
arcCenterX = x + w - squareSize;
arcCenterY = y + h - squareSize;
startAngle = 0;
endAngle = Math.PI * 0.5;
splitLine = {
x1: x, y1: y + h - squareSize,
x2: x + w, y2: y + h - squareSize,
color: '#FF6B00', strokeWidth: 0.3, dashed: true
};
break;

case 3: // 从左侧切出正方形
squareSize = w / (1 + 1 / PHI);
arcCenterX = x + squareSize;
arcCenterY = y + h - squareSize;
startAngle = Math.PI * 0.5;
endAngle = Math.PI;
splitLine = {
x1: x + squareSize, y1: y,
x2: x + squareSize, y2: y + h,
color: '#FF6B00', strokeWidth: 0.3, dashed: true
};
break;
}

return {
cx: arcCenterX,
cy: arcCenterY,
radius: squareSize,
startAngle: startAngle,
endAngle: endAngle,
splitLine: splitLine
};
}

/**
* 更新矩形到下一次迭代
*/
function _updateRectForIteration(x, y, w, h, iteration, PHI) {
var dir = iteration % 4;
var squareSize;

switch (dir) {
case 0:
squareSize = h / (1 + 1 / PHI);
return { x: x, y: y + squareSize, w: w, h: h - squareSize };
case 1:
squareSize = w / (1 + 1 / PHI);
return { x: x, y: y, w: w - squareSize, h: h };
case 2:
squareSize = h / (1 + 1 / PHI);
return { x: x, y: y, w: w, h: h - squareSize };
case 3:
squareSize = w / (1 + 1 / PHI);
return { x: x + squareSize, y: y, w: w - squareSize, h: h };
}
return { x: x, y: y, w: w, h: h };
}

/**
* 将弧线数据转为采样点序列（用于发送给 ExtendScript）
*/
function _arcsToPoints(arcs, samplesPerArc) {
var points = [];
for (var i = 0; i < arcs.length; i++) {
var arc = arcs[i];
var angleRange = arc.endAngle - arc.startAngle;

for (var s = 0; s <= samplesPerArc; s++) {
var t = s / samplesPerArc;
var angle = arc.startAngle + angleRange * t;
points.push({
x: arc.cx + Math.cos(angle) * arc.radius,
y: arc.cy + Math.sin(angle) * arc.radius
});
}
}
return points;
}

/**
* 增强版 calculateComposition — 替换原有方法
*/
Calculator.calculateComposition = function (type, docWidth, docHeight) {
var lines = [];
var spiralPoints = null;

switch (type) {
case 'rule-of-thirds':
var thirdW = docWidth / 3;
var thirdH = docHeight / 3;
lines = [
{ x1: thirdW, y1: 0, x2: thirdW, y2: docHeight, color: '#FF6B00', strokeWidth: 0.5 },
{ x1: thirdW * 2, y1: 0, x2: thirdW * 2, y2: docHeight, color: '#FF6B00', strokeWidth: 0.5 },
{ x1: 0, y1: thirdH, x2: docWidth, y2: thirdH, color: '#FF6B00', strokeWidth: 0.5 },
{ x1: 0, y1: thirdH * 2, x2: docWidth, y2: thirdH * 2, color: '#FF6B00', strokeWidth: 0.5 }
];
break;

case 'golden-ratio':
var PHI = 1.6180339887;
var gW = docWidth / PHI;
var gH = docHeight / PHI;
lines = [
{ x1: gW, y1: 0, x2: gW, y2: docHeight, color: '#BF5AF2', strokeWidth: 0.5 },
{ x1: docWidth - gW, y1: 0, x2: docWidth - gW, y2: docHeight, color: '#BF5AF2', strokeWidth: 0.5 },
{ x1: 0, y1: gH, x2: docWidth, y2: gH, color: '#BF5AF2', strokeWidth: 0.5 },
{ x1: 0, y1: docHeight - gH, x2: docWidth, y2: docHeight - gH, color: '#BF5AF2', strokeWidth: 0.5 }
];
break;

case 'diagonal':
lines = [
{ x1: 0, y1: 0, x2: docWidth, y2: docHeight, color: '#34C759', strokeWidth: 0.5 },
{ x1: docWidth, y1: 0, x2: 0, y2: docHeight, color: '#34C759', strokeWidth: 0.5 }
];
break;

case 'center-cross':
var midX = docWidth / 2;
var midY = docHeight / 2;
lines = [
{ x1: midX, y1: 0, x2: midX, y2: docHeight, color: '#FF9500', strokeWidth: 0.5 },
{ x1: 0, y1: midY, x2: docWidth, y2: midY, color: '#FF9500', strokeWidth: 0.5 }
];
break;

case 'golden-spiral':
var spiralResult = Calculator.calculateGoldenSpiral(docWidth, docHeight, 8);
lines = spiralResult.lines;
spiralPoints = spiralResult.spiralPoints;
break;

case 'dynamic-symmetry':
// 动态对称网格（Baroque & Sinister 对角线）
lines = [
// 主对角线
{ x1: 0, y1: 0, x2: docWidth, y2: docHeight, color: '#FF375F', strokeWidth: 0.4 },
{ x1: docWidth, y1: 0, x2: 0, y2: docHeight, color: '#FF375F', strokeWidth: 0.4 },
// 倒数对角线（从角到对边中点）
{ x1: 0, y1: 0, x2: docWidth, y2: docHeight / 2, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: 0, y1: 0, x2: docWidth / 2, y2: docHeight, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: docWidth, y1: 0, x2: 0, y2: docHeight / 2, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: docWidth, y1: 0, x2: docWidth / 2, y2: docHeight, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: 0, y1: docHeight, x2: docWidth, y2: docHeight / 2, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: 0, y1: docHeight, x2: docWidth / 2, y2: 0, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: docWidth, y1: docHeight, x2: 0, y2: docHeight / 2, color: '#FF375F', strokeWidth: 0.3, dashed: true },
{ x1: docWidth, y1: docHeight, x2: docWidth / 2, y2: 0, color: '#FF375F', strokeWidth: 0.3, dashed: true }
];
break;

case 'fibonacci-grid':
// 斐波那契网格
var fib = [1, 1, 2, 3, 5, 8, 13, 21, 34];
var fibTotal = 0;
for (var fi = 0; fi < fib.length; fi++) fibTotal += fib[fi];

var accumulated = 0;
for (var fj = 0; fj < fib.length - 1; fj++) {
accumulated += fib[fj];
var ratio = accumulated / fibTotal;
lines.push({
x1: docWidth * ratio, y1: 0,
x2: docWidth * ratio, y2: docHeight,
color: '#5856D6', strokeWidth: 0.4, dashed: (fj < 3)
});
lines.push({
x1: 0, y1: docHeight * ratio,
x2: docWidth, y2: docHeight * ratio,
color: '#5856D6', strokeWidth: 0.4, dashed: (fj < 3)
});
}
break;
}

return {
type: type,
lines: lines,
spiralPoints: spiralPoints
};
};
