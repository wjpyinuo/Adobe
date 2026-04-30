// ============================
// P3-21: 预设管理系统
// ============================

var PresetManager = (function () {

var STORAGE_KEY = 'gridmaster_presets';
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
  // P3-22: 核心初始化集成
  // ============================

  /**
   * 初始化入口
   */
  function initApp() {
    // 1. 设置性能监控
    PerfMonitor.setEnabled(false); // 生产环境默认关闭

    // 2. 检查宿主环境
    HostAdapter.healthCheck().then(function (res) {
      console.log('Host connected:', res);

      // 3. 渲染主界面
      var mainContainer = document.getElementById('app-root');
      if (mainContainer) {
        // 渲染顶部导航
        mainContainer.appendChild(createHeader());

        // 渲染主面板区域
        var content = document.createElement('div');
        content.id = 'content-area';
        mainContainer.appendChild(content);

        // 默认显示网格面板
        renderGridPanel(content);

        // 渲染底部状态栏
        mainContainer.appendChild(createStatusBar());
      }
    }).catch(function (err) {
      showToast('无法连接到 Adobe Host: ' + err.message, 'error');
    });
  }

  /**
   * 底部状态栏（包含撤销/重做）
   */
  function createStatusBar() {
    var bar = document.createElement('div');
    bar.style.cssText =
      'height:30px;background:var(--gm-bg-secondary);border-top:1px solid var(--gm-border-default);' +
      'display:flex;align-items:center;justify-content:space-between;padding:0 10px;';

    // 左侧：撤销工具栏
    bar.appendChild(createUndoToolbar());

    // 右侧：版本信息
    var ver = document.createElement('span');
    ver.style.cssText = 'font-size:9px;color:var(--gm-text-tertiary);';
    ver.textContent = 'GridMaster v2.0.0';
    bar.appendChild(ver);

    return bar;
  }
