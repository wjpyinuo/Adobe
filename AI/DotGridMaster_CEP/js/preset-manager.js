// ============================
// P3-21: 预设管理系统
// ============================

var PresetManager = (function () {

var STORAGE_KEY = 'dotgridmaster_presets';
var BUILTIN_PREFIX = '__builtin_';

/**
* 内置预设
*/
var builtinPresets = [
{
id: BUILTIN_PREFIX + 'web_12col',
name: 'Web 12列栅格',
category: 'grid',
builtin: true,
data: {
columns: 12, rows: 1,
gutterH: 20, gutterV: 0,
marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
}
},
{
id: BUILTIN_PREFIX + 'bootstrap',
name: 'Bootstrap 栅格',
category: 'grid',
builtin: true,
data: {
columns: 12, rows: 1,
gutterH: 30, gutterV: 0,
marginTop: 0, marginRight: 15, marginBottom: 0, marginLeft: 15
}
},
{
id: BUILTIN_PREFIX + 'poster_3x3',
name: '海报 3×3',
category: 'grid',
builtin: true,
data: {
columns: 3, rows: 3,
gutterH: 10, gutterV: 10,
marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20
}
},
{
id: BUILTIN_PREFIX + 'magazine_6col',
name: '杂志 6列',
category: 'grid',
builtin: true,
data: {
columns: 6, rows: 1,
gutterH: 4.233,
          gutterV: 0,
          marginTop: 15, marginRight: 10, marginBottom: 15, marginLeft: 10
        }
      }
    ];

    /**
     * 获取所有可用预设（内置 + 用户）
     */
    function getAll() {
      var userPresets = _getUserPresets();
      return builtinPresets.concat(userPresets);
    }

    /**
     * 保存用户预设
     */
    function save(name, category, data) {
      var userPresets = _getUserPresets();
      var id = 'u_' + Date.now();
      userPresets.push({
        id: id,
        name: name,
        category: category,
        builtin: false,
        data: data
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
      return id;
    }

    /**
     * 删除用户预设
     */
    function remove(id) {
      var userPresets = _getUserPresets();
      var filtered = userPresets.filter(function (p) { return p.id !== id; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }

    /**
     * 导出所有预设（JSON 字符串）
     */
    function exportAll() {
      return JSON.stringify(_getUserPresets());
    }

    /**
     * 导入预设
     */
    function importPresets(jsonStr) {
      try {
        var imported = JSON.parse(jsonStr);
        if (Array.isArray(imported)) {
          var userPresets = _getUserPresets();
          var merged = userPresets.concat(imported);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    }

    function _getUserPresets() {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    return {
      getAll: getAll,
      save: save,
      remove: remove,
      exportAll: exportAll,
      importPresets: importPresets
    };
  })();

// ============================
// 与 GM.PresetManager 集成
// ============================

// 将独立 PresetManager 的内置预设合并到 GM.PresetManager
(function () {
  var GM = (typeof DotGridMaster !== 'undefined') ? DotGridMaster : null;
  if (!GM || !GM.PresetManager) return;

  // 将额外的内置预设添加到 GM.PresetManager
  var extraPresets = [
    { id: '__builtin_web_12col', name: 'Web 12列栅格', isBuiltIn: true, columns: 12, rows: 1, gutterH: 20, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
    { id: '__builtin_bootstrap', name: 'Bootstrap 栅格', isBuiltIn: true, columns: 12, rows: 1, gutterH: 30, gutterV: 0, marginTop: 0, marginRight: 15, marginBottom: 0, marginLeft: 15 },
    { id: '__builtin_poster_3x3', name: '海报 3×3', isBuiltIn: true, columns: 3, rows: 3, gutterH: 10, gutterV: 10, marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20 },
    { id: '__builtin_magazine_6col', name: '杂志 6列', isBuiltIn: true, columns: 6, rows: 1, gutterH: 4.233, gutterV: 0, marginTop: 15, marginRight: 10, marginBottom: 15, marginLeft: 10 }
  ];

  var existing = GM.PresetManager._presets.grid || [];
  var existingIds = {};
  for (var i = 0; i < existing.length; i++) {
    existingIds[existing[i].id] = true;
  }
  for (var j = 0; j < extraPresets.length; j++) {
    if (!existingIds[extraPresets[j].id]) {
      existing.push(extraPresets[j]);
    }
  }
  GM.PresetManager._presets.grid = existing;
})();
