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

    /**
     * 记录一个操作
     * @param {string} type - ActionTypes 中的值
     * @param {object} data - 操作数据（用于恢复）
     * @param {string} label - 可读描述
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

      // 超出上限则移除最早的
      if (_undoStack.length > MAX_HISTORY) {
        _undoStack.shift();
      }

      // 新操作后清空 redo 栈
      _redoStack = [];

      // 通知 UI 更新
      _notifyChange();

      return entry.id;
    }

    /**
     * 撤销最近一步
     * @returns {Promise}
     */
    function undo() {
      if (_undoStack.length === 0) {
        showToast('没有可撤销的操作', 'info');
        return Promise.resolve();
      }

      var entry = _undoStack.pop();
      _redoStack.push(entry);

      _notifyChange();

      return _executeUndo(entry).then(function () {
        showToast('已撤销: ' + entry.label, 'info');
      }).catch(function (err) {
        showToast('撤销失败: ' + err.message, 'error');
        // 回滚栈状态
        _redoStack.pop();
        _undoStack.push(entry);
        _notifyChange();
      });
    }

    /**
     * 重做最近一步
     * @returns {Promise}
     */
    function redo() {
      if (_redoStack.length === 0) {
        showToast('没有可重做的操作', 'info');
        return Promise.resolve();
      }

      var entry = _redoStack.pop();
      _undoStack.push(entry);

      _notifyChange();

      return _executeRedo(entry).then(function () {
        showToast('已重做: ' + entry.label, 'info');
      }).catch(function (err) {
        showToast('重做失败: ' + err.message, 'error');
        _undoStack.pop();
        _redoStack.push(entry);
        _notifyChange();
      });
    }

    /**
     * 执行撤销（反向操作）
     */
    function _executeUndo(entry) {
      switch (entry.type) {
        case ActionTypes.ADD_GUIDES:
          // 撤销添加参考线 → 移除这些参考线
          return HostAdapter.removeGuidesByIds(entry.data.guideIds);

        case ActionTypes.ADD_GRID:
          // 撤销网格 → 清除网格图层
          return HostAdapter.clearBaseGrid();

        case ActionTypes.ADD_COMPOSITION:
          return HostAdapter.clearComposition();

        case ActionTypes.ADD_ECOM:
          return HostAdapter.clearEcom();

        case ActionTypes.ADD_PRINT:
          return HostAdapter.clearPrintMarks();

        case ActionTypes.ADD_OVERLAY:
          return HostAdapter.clearGridOverlay();

        case ActionTypes.CLEAR_GUIDES:
          // 撤销清除 → 恢复之前的参考线
          if (entry.data.previousGuides && entry.data.previousGuides.length > 0) {
            return HostAdapter.addGuides(entry.data.previousGuides);
          }
          return Promise.resolve();

        case ActionTypes.CLEAR_ALL:
          // 撤销全部清除 → 恢复之前的所有内容
          return _restoreSnapshot(entry.data.snapshot);

        default:
          return Promise.resolve();
      }
    }

    /**
     * 执行重做（正向操作）
     */
    function _executeRedo(entry) {
      switch (entry.type) {
        case ActionTypes.ADD_GUIDES:
          return HostAdapter.addGuides(entry.data.guides);

        case ActionTypes.ADD_GRID:
          return HostAdapter.addBaseGrid(entry.data.gridParams);

        case ActionTypes.ADD_COMPOSITION:
          return HostAdapter.addCompositionLines(entry.data.lines);

        case ActionTypes.ADD_ECOM:
          return HostAdapter.addEcomFunctionZones(entry.data.zones);

        case ActionTypes.ADD_PRINT:
          return HostAdapter.applyPrintMarks(entry.data.params);

        case ActionTypes.ADD_OVERLAY:
          return HostAdapter.addGridOverlay(entry.data.overlayParams);

        case ActionTypes.CLEAR_GUIDES:
          return HostAdapter.clearGuides();

        case ActionTypes.CLEAR_ALL:
          return HostAdapter.clearAll();

        default:
          return Promise.resolve();
      }
    }

    /**
     * 恢复快照（用于撤销 clearAll）
     */
    function _restoreSnapshot(snapshot) {
      if (!snapshot) return Promise.resolve();

      var promises = [];

      if (snapshot.guides && snapshot.guides.length > 0) {
        promises.push(HostAdapter.addGuides(snapshot.guides));
      }

      return Promise.all(promises);
    }

    /**
     * 在清除全部之前保存快照
     */
    function captureSnapshot() {
      return HostAdapter.getDocumentGuides().then(function (guides) {
        return { guides: guides };
      }).catch(function () {
        return { guides: [] };
      });
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
      }).reverse(); // 最新在前
    }

    /**
     * 撤销到指定步骤
     */
    function undoTo(index) {
      var steps = _undoStack.length - 1 - index;
      if (steps <= 0) return Promise.resolve();

      var chain = Promise.resolve();
      for (var i = 0; i < steps; i++) {
        chain = chain.then(function () {
          return undo();
        });
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

    // UI 变更通知回调
    var _changeListeners = [];

    function _notifyChange() {
      for (var i = 0; i < _changeListeners.length; i++) {
        try {
          _changeListeners[i](getState());
        } catch (e) {
          // 忽略回调错误
        }
      }
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
      undoTo: undoTo,
      captureSnapshot: captureSnapshot,
      clear: clear,
      onChange: onChange
    };
  })();

  // ============================
  // 撤销/重做 UI 组件
  // ============================

  /**
   * 创建撤销/重做工具栏（嵌入底部状态栏）
   */
  function createUndoToolbar() {
    var bar = document.createElement('div');
    bar.style.cssText =
      'display:flex;align-items:center;gap:2px;';

    var undoBtn = document.createElement('button');
    undoBtn.title = '撤销';
    undoBtn.textContent = '↶';
    undoBtn.style.cssText = _undoBtnStyle(false);

    var redoBtn = document.createElement('button');
    redoBtn.title = '重做';
    redoBtn.textContent = '↷';
    redoBtn.style.cssText = _undoBtnStyle(false);

    var historyBtn = document.createElement('button');
    historyBtn.title = '操作历史';
    historyBtn.textContent = '⏱';
    historyBtn.style.cssText = _undoBtnStyle(true);

    // 事件
    undoBtn.addEventListener('click', function () {
      UndoManager.undo();
    });

    redoBtn.addEventListener('click', function () {
      UndoManager.redo();
    });

    historyBtn.addEventListener('click', function () {
      _showHistoryPanel();
    });

    // 状态更新
    function updateButtons(state) {
      undoBtn.disabled = !state.canUndo;
      redoBtn.disabled = !state.canRedo;
      undoBtn.style.opacity = state.canUndo ? '1' : '0.3';
      redoBtn.style.opacity = state.canRedo ? '1' : '0.3';
      undoBtn.style.cursor = state.canUndo ? 'pointer' : 'default';
      redoBtn.style.cursor = state.canRedo ? 'pointer' : 'default';

      undoBtn.title = state.canUndo ? ('撤销: ' + state.undoLabel) : '无可撤销';
      redoBtn.title = state.canRedo ? ('重做: ' + state.redoLabel) : '无可重做';
    }

    UndoManager.onChange(updateButtons);
    updateButtons(UndoManager.getState());

    bar.appendChild(undoBtn);
    bar.appendChild(redoBtn);
    bar.appendChild(historyBtn);

    return bar;
  }

  function _undoBtnStyle(alwaysActive) {
    return 'width:24px;height:24px;border-radius:3px;border:none;' +
      'background:transparent;color:var(--gm-text-secondary);' +
      'font-size:14px;cursor:pointer;display:flex;align-items:center;' +
      'justify-content:center;transition:all 0.15s;' +
      (alwaysActive ? 'opacity:1;' : 'opacity:0.3;');
  }

  /**
   * 显示历史面板（弹出层）
   */
  function _showHistoryPanel() {
    var history = UndoManager.getHistory();

    // 创建遮罩
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);' +
      'z-index:9999;display:flex;align-items:center;justify-content:center;';

    var panel = document.createElement('div');
    panel.style.cssText =
      'width:260px;max-height:400px;background:var(--gm-bg-primary);' +
      'border-radius:8px;border:1px solid var(--gm-border-default);' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.4);overflow:hidden;';

    // 标题栏
    var header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:10px 12px;border-bottom:1px solid var(--gm-border-default);';

    var title = document.createElement('span');
    title.style.cssText = 'font-size:12px;font-weight:600;color:var(--gm-text-primary);';
    title.textContent = '⏱ 操作历史';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText =
      'border:none;background:none;color:var(--gm-text-tertiary);font-size:14px;' +
      'cursor:pointer;padding:0;line-height:1;';
    closeBtn.addEventListener('click', function () {
      document.body.removeChild(overlay);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // 列表
    var list = document.createElement('div');
    list.style.cssText =
      'max-height:320px;overflow-y:auto;padding:6px;';

    if (history.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText =
        'text-align:center;padding:30px 10px;color:var(--gm-text-tertiary);font-size:11px;';
      empty.textContent = '暂无操作记录';
      list.appendChild(empty);
    } else {
      for (var i = 0; i < history.length; i++) {
        (function (item, idx) {
          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;justify-content:space-between;' +
            'padding:6px 8px;border-radius:3px;margin-bottom:2px;cursor:pointer;' +
            'transition:background 0.1s;';

          row.addEventListener('mouseenter', function () {
            row.style.background = 'var(--gm-bg-tertiary)';
          });
          row.addEventListener('mouseleave', function () {
            row.style.background = 'transparent';
          });

          var labelEl = document.createElement('span');
          labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-primary);';
          labelEl.textContent = (idx === 0 ? '● ' : '  ') + item.label;

          var timeEl = document.createElement('span');
          timeEl.style.cssText = 'font-size:9px;color:var(--gm-text-tertiary);flex-shrink:0;';
          timeEl.textContent = item.timeAgo;

          row.appendChild(labelEl);
          row.appendChild(timeEl);

          row.addEventListener('click', function () {
            UndoManager.undoTo(item.index);
            document.body.removeChild(overlay);
          });

          list.appendChild(row);
        })(history[i], i);
      }
    }

    panel.appendChild(list);

    // 底部操作
    var footer = document.createElement('div');
    footer.style.cssText =
      'padding:8px 12px;border-top:1px solid var(--gm-border-default);';

    var clearHistoryBtn = document.createElement('button');
    clearHistoryBtn.textContent = '清空历史';
    clearHistoryBtn.style.cssText =
      'width:100%;padding:5px;border-radius:3px;font-size:10px;' +
      'background:transparent;color:var(--gm-accent-danger);' +
      'border:1px solid var(--gm-accent-danger);cursor:pointer;';
    clearHistoryBtn.addEventListener('click', function () {
      UndoManager.clear();
      document.body.removeChild(overlay);
      showToast('历史已清空', 'info');
    });
    footer.appendChild(clearHistoryBtn);
    panel.appendChild(footer);

    overlay.appendChild(panel);

    // 点击遮罩关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    document.body.appendChild(overlay);
  }

  // ============================
  // 键盘快捷键支持
  // ============================

  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + Z → 撤销
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      UndoManager.undo();
    }
    // Ctrl/Cmd + Shift + Z → 重做
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      UndoManager.redo();
    }
    // Ctrl/Cmd + Y → 重做（Windows 习惯）
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      UndoManager.redo();
    }
  });
