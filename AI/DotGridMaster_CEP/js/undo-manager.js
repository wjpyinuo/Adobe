// ============================
// P3-18: 撤销/重做系统
// ============================

/**
 * 操作历史记录管理器
 * 支持最多 30 步撤销
 */
var UndoManager = (function () {
  var _undoStack = [];
  var _redoStack = [];
  var MAX_HISTORY = 30;
  var _GM = null;

  // 操作类型枚举
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

  function _getGM() {
    if (!_GM) _GM = (typeof DotGridMaster !== 'undefined') ? DotGridMaster : null;
    return _GM;
  }

  function _toast(msg, type) {
    var gm = _getGM();
    if (gm && gm.showToast) gm.showToast(msg, type);
  }

  /**
   * 记录一个操作
   */
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

  /**
   * 撤销最近一步
   */
  function undo() {
    if (_undoStack.length === 0) {
      _toast('没有可撤销的操作', 'info');
      return Promise.resolve();
    }

    var entry = _undoStack.pop();
    _redoStack.push(entry);
    _notifyChange();

    return _executeUndo(entry).then(function () {
      _toast('已撤销: ' + entry.label, 'info');
    }).catch(function (err) {
      _toast('撤销失败: ' + err.message, 'error');
      _redoStack.pop();
      _undoStack.push(entry);
      _notifyChange();
    });
  }

  /**
   * 重做最近一步
   */
  function redo() {
    if (_redoStack.length === 0) {
      _toast('没有可重做的操作', 'info');
      return Promise.resolve();
    }

    var entry = _redoStack.pop();
    _undoStack.push(entry);
    _notifyChange();

    return _executeRedo(entry).then(function () {
      _toast('已重做: ' + entry.label, 'info');
    }).catch(function (err) {
      _toast('重做失败: ' + err.message, 'error');
      _undoStack.pop();
      _redoStack.push(entry);
      _notifyChange();
    });
  }

  /**
   * 执行撤销（反向操作）
   */
  function _executeUndo(entry) {
    var gm = _getGM();
    if (!gm) return Promise.reject(new Error('DotGridMaster not loaded'));
    var ha = gm.HostAdapter;

    switch (entry.type) {
      case ActionTypes.ADD_GUIDES:
      case ActionTypes.ADD_GRID:
        return ha.clearBaseGrid();
      case ActionTypes.ADD_COMPOSITION:
        return ha.clearComposition();
      case ActionTypes.ADD_ECOM:
        return ha.clearOverlays();
      case ActionTypes.ADD_PRINT:
        return ha.clearPrintMarks();
      case ActionTypes.ADD_OVERLAY:
        return ha.clearGridOverlay();
      case ActionTypes.CLEAR_GUIDES:
        if (entry.data.previousGuides && entry.data.previousGuides.length > 0) {
          return ha.addGuides(entry.data.previousGuides);
        }
        return Promise.resolve();
      case ActionTypes.CLEAR_ALL:
        return _restoreSnapshot(entry.data.snapshot);
      default:
        return Promise.resolve();
    }
  }

  /**
   * 执行重做（正向操作）
   */
  function _executeRedo(entry) {
    var gm = _getGM();
    if (!gm) return Promise.reject(new Error('DotGridMaster not loaded'));
    var ha = gm.HostAdapter;

    switch (entry.type) {
      case ActionTypes.ADD_GUIDES:
        return ha.addGuides(entry.data.guides);
      case ActionTypes.ADD_GRID:
        return ha.addBaseGrid(entry.data.gridParams);
      case ActionTypes.ADD_COMPOSITION:
        return ha.addCompositionLines(entry.data.lines);
      case ActionTypes.ADD_ECOM:
        return ha.addEcomFunctionZones(entry.data.zones);
      case ActionTypes.ADD_PRINT:
        return ha.applyPrintMarks(entry.data.params);
      case ActionTypes.ADD_OVERLAY:
        return ha.addGridOverlay(entry.data.overlayParams);
      case ActionTypes.CLEAR_GUIDES:
        return ha.clearGuides();
      case ActionTypes.CLEAR_ALL:
        return ha.clearAll();
      default:
        return Promise.resolve();
    }
  }

  /**
   * 恢复快照（用于撤销 clearAll）
   */
  function _restoreSnapshot(snapshot) {
    if (!snapshot) return Promise.resolve();
    var gm = _getGM();
    var promises = [];
    if (snapshot.guides && snapshot.guides.length > 0) {
      promises.push(gm.HostAdapter.addGuides(snapshot.guides));
    }
    return Promise.all(promises);
  }

  /**
   * 获取栈状态
   */
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

  /**
   * 获取完整历史列表
   */
  function getHistory() {
    return _undoStack.map(function (entry, index) {
      return {
        index: index,
        label: entry.label,
        type: entry.type,
        timestamp: entry.timestamp,
        timeAgo: _formatTimeAgo(entry.timestamp)
      };
    }).reverse();
  }

  /**
   * 撤销到指定步骤
   */
  function undoTo(index) {
    var steps = _undoStack.length - 1 - index;
    if (steps <= 0) return Promise.resolve();

    var chain = Promise.resolve();
    for (var i = 0; i < steps; i++) {
      chain = chain.then(function () { return undo(); });
    }
    return chain;
  }

  /**
   * 清空历史
   */
  function clear() {
    _undoStack = [];
    _redoStack = [];
    _notifyChange();
  }

  /**
   * 格式化时间差
   */
  function _formatTimeAgo(ts) {
    var diff = Date.now() - ts;
    if (diff < 5000) return '刚刚';
    if (diff < 60000) return Math.floor(diff / 1000) + '秒前';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    return Math.floor(diff / 3600000) + '小时前';
  }

  var _changeListeners = [];

  function _notifyChange() {
    for (var i = 0; i < _changeListeners.length; i++) {
      try { _changeListeners[i](getState()); } catch (e) {}
    }
  }

  function onChange(callback) {
    _changeListeners.push(callback);
    return function () {
      var idx = _changeListeners.indexOf(callback);
      if (idx !== -1) _changeListeners.splice(idx, 1);
    };
  }

  /**
   * 初始化：将 UndoManager 集成到 DotGridMaster 主流程
   */
  function init() {
    var GM = (typeof DotGridMaster !== 'undefined') ? DotGridMaster : null;
    if (!GM) return;

    // 监听撤销状态变化，更新按钮状态
    onChange(function (state) {
      var undoBtn = document.getElementById('btn-undo');
      if (undoBtn) {
        undoBtn.disabled = !state.canUndo;
        undoBtn.style.opacity = state.canUndo ? '1' : '0.4';
        if (state.canUndo) {
          undoBtn.textContent = '↩ 撤销 (' + state.undoCount + ')';
        } else {
          undoBtn.textContent = '↩ 撤销';
        }
      }
    });

    // 替换底部撤销按钮的处理逻辑
    var originalUndo = GM.HostAdapter.undo;
    GM.HostAdapter.undo = function () {
      if (_undoStack.length > 0) {
        return undo();
      }
      return originalUndo.call(GM.HostAdapter);
    };
  }

  return {
    ActionTypes: ActionTypes,
    init: init,
    record: record,
    undo: undo,
    redo: redo,
    getState: getState,
    getHistory: getHistory,
    undoTo: undoTo,
    clear: clear,
    onChange: onChange
  };
})();
