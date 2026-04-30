/**
 * dotgridmaster-core.js — 兼容性 shim
 *
 * index.html 加载顺序中，此文件曾作为 core.js 的别名。
 * 现在 core.js 已包含全部功能，此文件仅保留命名空间初始化，
 * 防止加载顺序导致 DotGridMaster 未定义。
 *
 * 如果你看到此文件的加载警告，请确认 core.js 已正确加载。
 */

if (typeof window !== 'undefined' && !window.DotGridMaster) {
  console.warn('[DotGridMaster] core.js 未加载，dotgridmaster-core.js 创建空命名空间');
  window.DotGridMaster = {};
}
