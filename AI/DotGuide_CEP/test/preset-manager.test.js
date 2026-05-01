/**
 * DotGuide PresetManager 单元测试
 * 测试 core.js 中 GM.PresetManager 的逻辑
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// 模拟 localStorage
const storage = {};
const mockStorage = {
  getItem: function (key) { return storage[key] || null; },
  setItem: function (key, value) { storage[key] = value; },
  removeItem: function (key) { delete storage[key]; }
};

// 模拟 GM.PresetManager（从 core.js 提取）
function createPresetManager() {
  var _presets = {};
  var _customPresets = {};

  function init() {
    _presets = _getBuiltInPresets();
    var saved = null;
    try {
      var val = mockStorage.getItem('dotguide_custom_presets');
      saved = val ? JSON.parse(val) : null;
    } catch (e) { saved = null; }
    if (saved) _customPresets = saved;
  }

  function getAll(category) {
    var builtIn = _presets[category] || [];
    var custom = _customPresets[category] || [];
    return builtIn.concat(custom);
  }

  function save(category, preset) {
    if (!_customPresets[category]) _customPresets[category] = [];
    preset.id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    preset.isBuiltIn = false;
    _customPresets[category].push(preset);
    mockStorage.setItem('dotguide_custom_presets', JSON.stringify(_customPresets));
    return preset;
  }

  function remove(category, presetId) {
    if (!_customPresets[category]) return;
    _customPresets[category] = _customPresets[category].filter(
      function (p) { return p.id !== presetId; }
    );
    mockStorage.setItem('dotguide_custom_presets', JSON.stringify(_customPresets));
  }

  function _getBuiltInPresets() {
    // 注意：此数据必须与 core.js GM.PresetManager._getBuiltInPresets() 保持一致
    return {
      grid: [
        { id: 'grid_12col', name: '12列网格', isBuiltIn: true, columns: 12, rows: 1, gutterH: 0, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
        { id: 'grid_6col', name: '6列网格', isBuiltIn: true, columns: 6, rows: 1, gutterH: 0, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
        { id: 'grid_3col', name: '3列网格', isBuiltIn: true, columns: 3, rows: 1, gutterH: 0, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
        { id: 'grid_4x4', name: '4×4网格', isBuiltIn: true, columns: 4, rows: 4, gutterH: 0, gutterV: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 },
      ],
      composition: [
        { id: 'comp_thirds', name: '三分法', isBuiltIn: true, type: 'rule-of-thirds' },
        { id: 'comp_golden', name: '黄金分割', isBuiltIn: true, type: 'golden-ratio' },
        { id: 'comp_diagonal', name: '对角线', isBuiltIn: true, type: 'diagonal' },
        { id: 'comp_center', name: '中心十字', isBuiltIn: true, type: 'center-cross' },
        { id: 'comp_spiral', name: '黄金螺旋', isBuiltIn: true, type: 'golden-spiral' },
      ],
      ecom: [
        { id: 'ecom_taobao_main', name: '淘宝主图 800×800', isBuiltIn: true, platform: 'taobao', width: 800, height: 800, safeZone: { top: 50, right: 30, bottom: 110, left: 30 } },
        { id: 'ecom_jd_main', name: '京东主图 800×800', isBuiltIn: true, platform: 'jd', width: 800, height: 800, safeZone: { top: 40, right: 20, bottom: 100, left: 20 } },
        { id: 'ecom_pdd_main', name: '拼多多主图 750×750', isBuiltIn: true, platform: 'pdd', width: 750, height: 750, safeZone: { top: 45, right: 25, bottom: 120, left: 25 } },
        { id: 'ecom_douyin_main', name: '抖音商品图 800×800', isBuiltIn: true, platform: 'douyin', width: 800, height: 800, safeZone: { top: 60, right: 30, bottom: 130, left: 30 } },
        { id: 'ecom_xhs', name: '小红书封面 1080×1440', isBuiltIn: true, platform: 'xiaohongshu', width: 1080, height: 1440, safeZone: { top: 80, right: 40, bottom: 160, left: 40 } },
      ],
      print: [
        { id: 'print_a4', name: 'A4 (210×297mm)', isBuiltIn: true, width: 210, height: 297, unit: 'mm', bleed: 3 },
        { id: 'print_a3', name: 'A3 (297×420mm)', isBuiltIn: true, width: 297, height: 420, unit: 'mm', bleed: 3 },
        { id: 'print_namecard', name: '名片 (90×54mm)', isBuiltIn: true, width: 90, height: 54, unit: 'mm', bleed: 2 },
        { id: 'print_poster_b2', name: '海报 B2 (515×728mm)', isBuiltIn: true, width: 515, height: 728, unit: 'mm', bleed: 3 },
        { id: 'print_trifold', name: '三折页 (297×210mm)', isBuiltIn: true, width: 297, height: 210, unit: 'mm', bleed: 3, folds: 2 },
      ],
      ui: [
        { id: 'ui_iphone15', name: 'iPhone 15 (393×852)', isBuiltIn: true, device: 'iphone15', width: 393, height: 852, statusBar: 59, homeIndicator: 34, navBar: 44, tabBar: 49 },
        { id: 'ui_iphone15pro_max', name: 'iPhone 15 Pro Max (430×932)', isBuiltIn: true, device: 'iphone15promax', width: 430, height: 932, statusBar: 59, homeIndicator: 34, navBar: 44, tabBar: 49 },
        { id: 'ui_iphone16', name: 'iPhone 16 (393×852)', isBuiltIn: true, device: 'iphone16', width: 393, height: 852, statusBar: 59, homeIndicator: 34, navBar: 44, tabBar: 49 },
        { id: 'ui_iphone16_pro', name: 'iPhone 16 Pro (402×874)', isBuiltIn: true, device: 'iphone16pro', width: 402, height: 874, statusBar: 62, homeIndicator: 34, navBar: 44, tabBar: 49 },
        { id: 'ui_iphone16_pro_max', name: 'iPhone 16 Pro Max (440×956)', isBuiltIn: true, device: 'iphone16promax', width: 440, height: 956, statusBar: 62, homeIndicator: 34, navBar: 44, tabBar: 49 },
        { id: 'ui_android_common', name: 'Android 通用 (360×800)', isBuiltIn: true, device: 'android', width: 360, height: 800, statusBar: 24, navBar: 56, tabBar: 48, homeIndicator: 0 },
        { id: 'ui_android_pixel9', name: 'Pixel 9 (412×915)', isBuiltIn: true, device: 'pixel9', width: 412, height: 915, statusBar: 24, navBar: 56, tabBar: 48, homeIndicator: 0 },
        { id: 'ui_ipad_pro_11', name: 'iPad Pro 11" (834×1194)', isBuiltIn: true, device: 'ipadpro11', width: 834, height: 1194, statusBar: 24, homeIndicator: 20, navBar: 44, tabBar: 49 },
        { id: 'ui_ipad_air_m2', name: 'iPad Air M2 11" (820×1180)', isBuiltIn: true, device: 'ipadairm2', width: 820, height: 1180, statusBar: 24, homeIndicator: 20, navBar: 44, tabBar: 49 }
      ]
    };
  }

  return {
    init: init,
    getAll: getAll,
    save: save,
    remove: remove,
    _presets: _presets,
    _customPresets: _customPresets
  };
}

describe('PresetManager 内置预设', () => {
  let pm;

  beforeEach(() => {
    // Clear storage
    for (var key in storage) delete storage[key];
    pm = createPresetManager();
    pm.init();
  });

  it('init 后应加载所有内置预设', () => {
    assert.ok(pm.getAll('grid').length >= 4);
    assert.ok(pm.getAll('composition').length >= 2);
    assert.ok(pm.getAll('ecom').length >= 1);
    assert.ok(pm.getAll('print').length >= 1);
    assert.ok(pm.getAll('ui').length >= 1);
  });

  it('内置预设应标记为 isBuiltIn', () => {
    var gridPresets = pm.getAll('grid');
    gridPresets.forEach(function (p) {
      if (p.id.startsWith('grid_')) {
        assert.equal(p.isBuiltIn, true);
      }
    });
  });

  it('不存在的分类应返回空数组', () => {
    assert.equal(pm.getAll('nonexistent').length, 0);
  });

  it('内置预设应包含必要属性', () => {
    var gridPresets = pm.getAll('grid');
    var p12col = gridPresets.find(p => p.id === 'grid_12col');
    assert.ok(p12col);
    assert.equal(p12col.columns, 12);
    assert.equal(p12col.rows, 1);
    assert.equal(p12col.gutterH, 0);
  });
});

describe('PresetManager 自定义预设', () => {
  let pm;

  beforeEach(() => {
    for (var key in storage) delete storage[key];
    pm = createPresetManager();
    pm.init();
  });

  it('save 应添加自定义预设', () => {
    pm.save('grid', { name: '我的网格', columns: 5, rows: 3 });
    var all = pm.getAll('grid');
    var custom = all.filter(p => !p.isBuiltIn);
    assert.equal(custom.length, 1);
    assert.equal(custom[0].name, '我的网格');
    assert.equal(custom[0].columns, 5);
  });

  it('save 应生成唯一 ID', () => {
    var ids = new Set();
    for (var i = 0; i < 10; i++) {
      var p = pm.save('grid', { name: 'Test' + i });
      ids.add(p.id);
      assert.ok(p.id.startsWith('custom_'));
    }
    // All IDs should be unique (Date.now + random suffix)
    assert.equal(ids.size, 10);
  });

  it('save 应持久化到 localStorage', () => {
    pm.save('grid', { name: '测试' });
    var stored = JSON.parse(mockStorage.getItem('dotguide_custom_presets'));
    assert.ok(stored.grid);
    assert.equal(stored.grid.length, 1);
    assert.equal(stored.grid[0].name, '测试');
  });

  it('remove 应删除指定预设', () => {
    var preset = pm.save('grid', { name: '要删除的' });
    assert.equal(pm.getAll('grid').filter(p => !p.isBuiltIn).length, 1);
    pm.remove('grid', preset.id);
    assert.equal(pm.getAll('grid').filter(p => !p.isBuiltIn).length, 0);
  });

  it('remove 不存在的 ID 应安全处理', () => {
    pm.remove('grid', 'nonexistent_id');
    // Should not throw
    assert.ok(true);
  });

  it('remove 不存在的分类应安全处理', () => {
    pm.remove('nonexistent', 'some_id');
    assert.ok(true);
  });

  it('init 应从 localStorage 恢复自定义预设', () => {
    pm.save('grid', { name: '持久化测试' });
    
    // 创建新实例
    var pm2 = createPresetManager();
    pm2.init();
    
    var custom = pm2.getAll('grid').filter(p => !p.isBuiltIn);
    assert.equal(custom.length, 1);
    assert.equal(custom[0].name, '持久化测试');
  });

  it('内置和自定义预设应正确合并', () => {
    pm.save('grid', { name: '自定义1' });
    pm.save('grid', { name: '自定义2' });
    
    var all = pm.getAll('grid');
    var builtIn = all.filter(p => p.isBuiltIn);
    var custom = all.filter(p => !p.isBuiltIn);
    
    assert.ok(builtIn.length >= 4);
    assert.equal(custom.length, 2);
    assert.equal(all.length, builtIn.length + custom.length);
  });
});
