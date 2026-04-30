/**
 * GridMaster UndoManager 单元测试
 * 测试 undo-manager.js 的撤销/重做逻辑
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ============================================================
// 从 undo-manager.js 提取的 UndoManager（去除 DOM 依赖）
// ============================================================

function createUndoManager() {
  var _undoStack = [];
  var _redoStack = [];
  var MAX_HISTORY = 30;

  var ActionTypes = {
    ADD_GUIDES: 'add_guides',
    CLEAR_GUIDES: 'clear_guides',
    ADD_GRID: 'add_grid',
    ADD_COMPOSITION: 'add_composition',
    ADD_ECOM: 'add_ecom',
    ADD_PRINT: 'add_print',
    ADD_OVERLAY: 'add_overlay',
    CLEAR_ALL: 'clear_all'
  };

  var _changeListeners = [];

  function _notifyChange() {
    for (var i = 0; i < _changeListeners.length; i++) {
      try { _changeListeners[i](getState()); } catch (e) {}
    }
  }

  function record(type, data, label) {
    var entry = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: type,
      data: data,
      label: label || type,
      timestamp: Date.now()
    };
    _undoStack.push(entry);
    if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
    _redoStack = [];
    _notifyChange();
    return entry.id;
  }

  function undo() {
    if (_undoStack.length === 0) return Promise.resolve();
    var entry = _undoStack.pop();
    _redoStack.push(entry);
    _notifyChange();
    return Promise.resolve({ undone: entry.type, label: entry.label });
  }

  function redo() {
    if (_redoStack.length === 0) return Promise.resolve();
    var entry = _redoStack.pop();
    _undoStack.push(entry);
    _notifyChange();
    return Promise.resolve({ redone: entry.type, label: entry.label });
  }

  function getState() {
    return {
      canUndo: _undoStack.length > 0,
      canRedo: _redoStack.length > 0,
      undoCount: _undoStack.length,
      redoCount: _redoStack.length,
      undoLabel: _undoStack.length > 0 ? _undoStack[_undoStack.length - 1].label : '',
      redoLabel: _redoStack.length > 0 ? _redoStack[_redoStack.length - 1].label : ''
    };
  }

  function getHistory() {
    return _undoStack.map(function (entry, index) {
      return { index: index, label: entry.label, type: entry.type, timestamp: entry.timestamp };
    }).reverse();
  }

  function clear() {
    _undoStack = [];
    _redoStack = [];
    _notifyChange();
  }

  function onChange(callback) {
    _changeListeners.push(callback);
    return function () {
      var idx = _changeListeners.indexOf(callback);
      if (idx !== -1) _changeListeners.splice(idx, 1);
    };
  }

  return {
    ActionTypes: ActionTypes,
    record: record,
    undo: undo,
    redo: redo,
    getState: getState,
    getHistory: getHistory,
    clear: clear,
    onChange: onChange
  };
}

// ============================================================
// 测试用例
// ============================================================

describe('UndoManager 基础操作', () => {
  let um;

  beforeEach(() => {
    um = createUndoManager();
  });

  it('初始状态应为空', () => {
    const state = um.getState();
    assert.equal(state.canUndo, false);
    assert.equal(state.canRedo, false);
    assert.equal(state.undoCount, 0);
    assert.equal(state.redoCount, 0);
  });

  it('record 后应可撤销', () => {
    um.record(um.ActionTypes.ADD_GUIDES, { guides: [] }, '添加参考线');
    const state = um.getState();
    assert.equal(state.canUndo, true);
    assert.equal(state.undoCount, 1);
    assert.equal(state.undoLabel, '添加参考线');
  });

  it('撤销后应可重做', async () => {
    um.record(um.ActionTypes.ADD_GRID, { params: {} }, '添加网格');
    await um.undo();
    const state = um.getState();
    assert.equal(state.canUndo, false);
    assert.equal(state.canRedo, true);
    assert.equal(state.redoCount, 1);
    assert.equal(state.redoLabel, '添加网格');
  });

  it('重做后应恢复撤销状态', async () => {
    um.record(um.ActionTypes.ADD_COMPOSITION, { lines: [] }, '添加构图');
    await um.undo();
    await um.redo();
    const state = um.getState();
    assert.equal(state.canUndo, true);
    assert.equal(state.canRedo, false);
    assert.equal(state.undoCount, 1);
  });

  it('空栈撤销应安全返回', async () => {
    const result = await um.undo();
    assert.equal(result, undefined);
  });

  it('空栈重做应安全返回', async () => {
    const result = await um.redo();
    assert.equal(result, undefined);
  });
});

describe('UndoManager 历史记录', () => {
  let um;

  beforeEach(() => {
    um = createUndoManager();
  });

  it('应记录操作历史', () => {
    um.record(um.ActionTypes.ADD_GUIDES, {}, '添加参考线');
    um.record(um.ActionTypes.ADD_GRID, {}, '添加网格');
    um.record(um.ActionTypes.ADD_ECOM, {}, '添加电商安全区');

    const history = um.getHistory();
    assert.equal(history.length, 3);
    // 最新在前
    assert.equal(history[0].label, '添加电商安全区');
    assert.equal(history[1].label, '添加网格');
    assert.equal(history[2].label, '添加参考线');
  });

  it('超过上限应自动移除最早的记录', () => {
    for (let i = 0; i < 35; i++) {
      um.record(um.ActionTypes.ADD_GUIDES, {}, '操作' + i);
    }
    assert.equal(um.getState().undoCount, 30);
    const history = um.getHistory();
    assert.equal(history.length, 30);
    // 最早的 5 条应被移除，history 最后一条应是 "操作5"
    assert.equal(history[history.length - 1].label, '操作5');
  });

  it('撤销后新操作应清空重做栈', async () => {
    um.record(um.ActionTypes.ADD_GRID, {}, '网格');
    um.record(um.ActionTypes.ADD_ECOM, {}, '电商');
    await um.undo();
    assert.equal(um.getState().canRedo, true);

    // 新操作应清空 redo 栈
    um.record(um.ActionTypes.ADD_PRINT, {}, '印刷');
    assert.equal(um.getState().canRedo, false);
  });

  it('clear 应清空所有历史', () => {
    um.record(um.ActionTypes.ADD_GUIDES, {}, '操作1');
    um.record(um.ActionTypes.ADD_GRID, {}, '操作2');
    um.clear();
    assert.equal(um.getState().undoCount, 0);
    assert.equal(um.getState().redoCount, 0);
    assert.equal(um.getHistory().length, 0);
  });
});

describe('UndoManager 事件通知', () => {
  let um;

  beforeEach(() => {
    um = createUndoManager();
  });

  it('record 应触发 onChange 回调', () => {
    let notified = false;
    um.onChange(() => { notified = true; });
    um.record(um.ActionTypes.ADD_GUIDES, {}, 'test');
    assert.equal(notified, true);
  });

  it('undo 应触发 onChange 回调', async () => {
    um.record(um.ActionTypes.ADD_GUIDES, {}, 'test');
    let notified = false;
    um.onChange(() => { notified = true; });
    await um.undo();
    assert.equal(notified, true);
  });

  it('clear 应触发 onChange 回调', () => {
    um.record(um.ActionTypes.ADD_GUIDES, {}, 'test');
    let notified = false;
    um.onChange(() => { notified = true; });
    um.clear();
    assert.equal(notified, true);
  });

  it('onChange 应返回取消订阅函数', () => {
    let count = 0;
    const unsub = um.onChange(() => { count++; });
    um.record(um.ActionTypes.ADD_GUIDES, {}, 'test1');
    assert.equal(count, 1);
    unsub();
    um.record(um.ActionTypes.ADD_GRID, {}, 'test2');
    assert.equal(count, 1); // 不应再增加
  });
});

describe('UndoManager 操作类型枚举', () => {
  it('应包含所有预期的操作类型', () => {
    const um = createUndoManager();
    const types = um.ActionTypes;
    assert.equal(types.ADD_GUIDES, 'add_guides');
    assert.equal(types.CLEAR_GUIDES, 'clear_guides');
    assert.equal(types.ADD_GRID, 'add_grid');
    assert.equal(types.ADD_COMPOSITION, 'add_composition');
    assert.equal(types.ADD_ECOM, 'add_ecom');
    assert.equal(types.ADD_PRINT, 'add_print');
    assert.equal(types.ADD_OVERLAY, 'add_overlay');
    assert.equal(types.CLEAR_ALL, 'clear_all');
  });
});
