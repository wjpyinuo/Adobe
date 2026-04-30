/**
 * DotGridMaster — 预设扩展
 * 将额外的内置预设合并到 core.js 中的 GM.PresetManager
 *
 * 依赖：core.js (GM.PresetManager 已在 core.js 中定义)
 *
 * 注意：独立的 PresetManager 模块已移除，统一使用 GM.PresetManager
 */

(function () {
  'use strict';

  var GM = (typeof DotGridMaster !== 'undefined') ? DotGridMaster : null;
  if (!GM || !GM.PresetManager) {
    console.warn('[DotGridMaster] preset-manager.js: core.js 未加载或 GM.PresetManager 不存在');
    return;
  }

  // 额外的内置预设（扩展 core.js 中已有的预设）
  var extraGridPresets = [
    { id: '__builtin_web_12col', name: 'Web 12列栅格', isBuiltIn: true, columns: 12, rows: 1, gutterH: 20, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
    { id: '__builtin_bootstrap', name: 'Bootstrap 栅格', isBuiltIn: true, columns: 12, rows: 1, gutterH: 30, gutterV: 0, marginTop: 0, marginRight: 15, marginBottom: 0, marginLeft: 15 },
    { id: '__builtin_poster_3x3', name: '海报 3×3', isBuiltIn: true, columns: 3, rows: 3, gutterH: 10, gutterV: 10, marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20 },
    { id: '__builtin_magazine_6col', name: '杂志 6列', isBuiltIn: true, columns: 6, rows: 1, gutterH: 4.233, gutterV: 0, marginTop: 15, marginRight: 10, marginBottom: 15, marginLeft: 10 }
  ];

  // 合并到 GM.PresetManager，避免重复
  var existing = GM.PresetManager._presets.grid || [];
  var existingIds = {};
  for (var i = 0; i < existing.length; i++) {
    existingIds[existing[i].id] = true;
  }
  for (var j = 0; j < extraGridPresets.length; j++) {
    if (!existingIds[extraGridPresets[j].id]) {
      existing.push(extraGridPresets[j]);
    }
  }
  GM.PresetManager._presets.grid = existing;

})();
