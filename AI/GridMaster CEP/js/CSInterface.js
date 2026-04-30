/**
 * CSInterface.js - Adobe CEP 桥接库
 *
 * 此为占位文件。正式使用前需替换为真实的 CSInterface.js。
 *
 * 获取方式（任选其其一）：
 *   1. 运行 setup.bat / setup.sh 自动下载（推荐）
 *   2. 手动下载：https://github.com/nicoleKelworthy/CSInterface
 *   3. 从已安装的 CEP 扩展中复制
 *
 * 将真实的 CSInterface.js 放置到此路径后，本文件会被覆盖。
 */

console.warn('[GridMaster] 正在使用 CSInterface 占位文件，请运行 setup 脚本下载正式版本。');
console.warn('下载地址: https://github.com/nicoleKelworthy/CSInterface');

/* eslint-disable no-unused-vars */
function CSInterface() {
  this.hostEnvironment = { appSkinInfo: { panelBackgroundColor: { color: { red: 30, green: 30, blue: 30 } } } };
  this.evalScript = function (script, callback) {
    callback('EvalScript error.');
  };
  this.addEventListener = function () {};
}
CSInterface.THEME_COLOR_CHANGED_EVENT = 'com.adobe.csxs.events.ThemeColorChanged';
