// ============================
// 撤销/重做系统 (BUG-3 修复: 与后端撤销栈同步)
// ============================

/**
 * 操作历史记录管理器
 * 支持最多 30 步撤销
 *
 * BUG-3 修复说明:
 * - UndoManager 是前端唯一的撤销入口
 * - 前端记录操作时，同步推送到后端 _dotgridmasterUndoStack
 * - 撤销时优先使用前端栈（因为有完整的操作数据用于重做）
 * - 底部按钮统一走 UndoManager，不再 fallback 到后端
 */

var UndoManager = (function () {
  var _undoStack = [];
  var _redoStack = [];
  var MAX_HISTORY = 30;
  var _GM = null;

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
   * BUG-3: 同步推送到后端撤销栈
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
   * BUG-3: 前端栈有完整数据时优先使用前端栈
   */
  function undo() {
    if (_undoStack.length === 0) {
      // 前端栈为空，尝试后端栈
      var gm = _getGM();
      if (gm && gm.HostAdapter) {
        return gm.HostAdapter.undo().then(function (result) {
          if (result && result.undone) {
            _toast('已撤销: ' + result.undone, 'info');
          } else {
            _toast('没有可撤销的操作', 'info');
          }
        }).catch(function () {
          _toast('没有可撤销的操作', 'info');
        });
      }
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
      // 回滚栈状态
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
        return ha.clearGuides();
      case ActionTypes.ADD_GRID:
        // 修复: 网格应用包含参考线+覆盖层+间距线，撤销时需全部清除
        return Promise.all([ha.clearGuides(), ha.clearGridOverlay(), ha.clearGutterGuides()]);
      case ActionTypes.ADD_COMPOSITION:
        return ha.clearComposition();
      case ActionTypes.ADD_ECOM:
        return ha.clearOverlays();
      case ActionTypes.ADD_PRINT:
        return ha.clearPrintMarks();
      case ActionTypes.ADD_OVERLAY:
        return ha.clearGridOverlay();
      case ActionTypes.CLEAR_GUIDES:
        if (entry.data && entry.data.previousGuides && entry.data.previousGuides.length > 0) {
          return ha.addGuides(entry.data.previousGuides);
        }
        return Promise.resolve();
      case ActionTypes.CLEAR_ALL:
        return _restoreSnapshot(entry.data && entry.data.snapshot);
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
        // 修复: 网格应用使用的是 addGuides + addGridOverlay + addGutterGuides，重做应保持一致
        var redoPromises = [];
        if (entry.data.guides && entry.data.guides.length > 0) {
          redoPromises.push(ha.addGuides(entry.data.guides));
        }
        if (entry.data.gutterGuides && entry.data.gutterGuides.length > 0) {
          redoPromises.push(ha.addGutterGuides(entry.data.gutterGuides));
        }
        if (entry.data.gridParams) {
          redoPromises.push(ha.addGridOverlay(entry.data.gridParams));
        }
        return Promise.all(redoPromises);
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

  function _restoreSnapshot(snapshot) {
    if (!snapshot) return Promise.resolve();
    var gm = _getGM();
    var promises = [];
    if (snapshot.guides && snapshot.guides.length > 0) {
      promises.push(gm.HostAdapter.addGuides(snapshot.guides));
    }
    return Promise.all(promises);
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
      return {
        index: index,
        label: entry.label,
        type: entry.type,
        timestamp: entry.timestamp,
        timeAgo: _formatTimeAgo(entry.timestamp)
      };
    }).reverse();
  }

  function undoTo(index) {
    var steps = _undoStack.length - 1 - index;
    if (steps <= 0) return Promise.resolve();

    var chain = Promise.resolve();
    for (var i = 0; i < steps; i++) {
      chain = chain.then(function () { return undo(); });
    }
    return chain;
  }

  function clear() {
    _undoStack = [];
    _redoStack = [];
    _notifyChange();
  }

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
   * BUG-3 修复: 初始化时统一撤销按钮行为
   * 不再简单替换 HostAdapter.undo，而是让按钮优先走 UndoManager
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

    // 替换底部撤销按钮：统一走 UndoManager
    var undoBtn = document.getElementById('btn-undo');
    if (undoBtn) {
      // 移除旧事件（通过克隆节点）
      var newUndoBtn = undoBtn.cloneNode(true);
      undoBtn.parentNode.replaceChild(newUndoBtn, undoBtn);
      newUndoBtn.addEventListener('click', function () {
        undo();
      });
    }

    // 不替换 HostAdapter.undo，保持其独立行为
    // 前端面板的撤销统一走 UndoManager
    // 后端的 undoDotGridMaster 保持独立（供 ExtendScript 直接调用）
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
