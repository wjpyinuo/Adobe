/**
* 宿主主题同步
* 读取 AI/PS 当前主题色并同步到 CSS 变量
*/

(function () {
'use strict';

var csInterface = new CSInterface();

function updateThemeWithAppSkinInfo(skinInfo) {
if (!skinInfo) return;

var panelBg = skinInfo.panelBackgroundColor.color;
var r = Math.round(panelBg.red);
var g = Math.round(panelBg.green);
var b = Math.round(panelBg.blue);

var brightness = (r + g + b) / 3;
var isDark = brightness < 128;

var root = document.documentElement;

if (isDark) {
root.style.setProperty('--gm-bg-primary', rgbToHex(r, g, b));
root.style.setProperty('--gm-bg-secondary', rgbToHex(
Math.min(r + 8, 255),
Math.min(g + 8, 255),
Math.min(b + 8, 255)
));
root.style.setProperty('--gm-bg-tertiary', rgbToHex(
Math.min(r + 16, 255),
Math.min(g + 16, 255),
Math.min(b + 16, 255)
));
root.style.setProperty('--gm-text-primary', '#ffffff');
root.style.setProperty('--gm-text-secondary', '#999999');
root.style.setProperty('--gm-text-tertiary', '#666666');
root.style.setProperty('--gm-border-default', rgbToHex(
Math.min(r + 28, 255),
Math.min(g + 28, 255),
Math.min(b + 28, 255)
));
root.style.setProperty('--gm-border-subtle', rgbToHex(
Math.min(r + 14, 255),
Math.min(g + 14, 255),
Math.min(b + 14, 255)
));
} else {
root.style.setProperty('--gm-bg-primary', rgbToHex(r, g, b));
root.style.setProperty('--gm-bg-secondary', rgbToHex(
Math.max(r - 8, 0),
Math.max(g - 8, 0),
Math.max(b - 8, 0)
));
root.style.setProperty('--gm-bg-tertiary', rgbToHex(
Math.max(r - 16, 0),
Math.max(g - 16, 0),
Math.max(b - 16, 0)
));
root.style.setProperty('--gm-text-primary', '#1a1a1a');
root.style.setProperty('--gm-text-secondary', '#666666');
root.style.setProperty('--gm-text-tertiary', '#999999');
root.style.setProperty('--gm-border-default', rgbToHex(
Math.max(r - 25, 0),
Math.max(g - 25, 0),
Math.max(b - 25, 0)
));
root.style.setProperty('--gm-border-subtle', rgbToHex(
Math.max(r - 12, 0),
Math.max(g - 12, 0),
Math.max(b - 12, 0)
));
}

document.body.style.background = rgbToHex(r, g, b);
}

function rgbToHex(r, g, b) {
return '#' +
((1 << 24) + (r << 16) + (g << 8) + b)
.toString(16)
.slice(1)
.toUpperCase();
}

// 初始化主题
csInterface.addEventListener(
CSInterface.THEME_COLOR_CHANGED_EVENT,
function () {
updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);
}
);

// 首次加载
updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);
})();
