// ============================
// P1-7: 实时预览系统
// ============================

var _previewDebounceTimer = null;
var _previewEnabled = false;
var _lastPreviewParams = null;

/**
* 启用/禁用实时预览
  /**
   * 启用/禁用实时预览
   */
  function setPreviewEnabled(enabled) {
    _previewEnabled = enabled;
    if (!enabled) {
      // 关闭预览时清除预览内容
      clearPreview();
    }
    Storage.set('preview_enabled', enabled);
  }

  /**
   * 清除预览内容
   */
  function clearPreview() {
    if (_previewDebounceTimer) {
      clearTimeout(_previewDebounceTimer);
      _previewDebounceTimer = null;
    }
    _lastPreviewParams = null;
    // 清除预览图层（使用独立图层避免影响正式内容）
    HostAdapter.clearPreviewLayer();
  }

  /**
   * 触发实时预览（防抖 300ms）
   * @param {string} type - 预览类型 'grid'|'composition'|'ecom'|'print'|'ui'
   * @param {object} params - 参数对象
   */
  function triggerPreview(type, params) {
    if (!_previewEnabled || !currentDocInfo) return;

    // 参数未变化则跳过
    var paramsKey = type + '_' + JSON.stringify(params);
    if (paramsKey === _lastPreviewParams) return;
    _lastPreviewParams = paramsKey;

    if (_previewDebounceTimer) {
      clearTimeout(_previewDebounceTimer);
    }

    _previewDebounceTimer = setTimeout(function () {
      _executePreview(type, params);
    }, 300);
  }

  /**
   * 执行预览
   */
  function _executePreview(type, params) {
    switch (type) {
      case 'grid':
        _previewGrid(params);
        break;
      case 'composition':
        _previewComposition(params);
        break;
      default:
        // 其他类型暂不支持实时预览
        break;
    }
  }

  /**
   * 预览网格
   */
  function _previewGrid(params) {
    var result = Calculator.calculateGrid({
      docWidth: currentDocInfo.width,
      docHeight: currentDocInfo.height,
      columns: params.columns,
      rows: params.rows,
      gutterH: params.gutterH,
      gutterV: params.gutterV,
      marginTop: params.marginTop,
      marginRight: params.marginRight,
      marginBottom: params.marginBottom,
      marginLeft: params.marginLeft
    });

    // 使用预览图层（半透明线条，不是正式参考线）
    HostAdapter.addPreviewLines(result.guides.map(function (g) {
      return {
        orientation: g.orientation,
        position: g.position,
        color: '#0D99FF',
        opacity: 40
      };
    })).catch(function () {
      // 预览失败静默处理
    });
  }

  /**
   * 预览构图
   */
  function _previewComposition(params) {
    var result = Calculator.calculateComposition(
      params.type,
      currentDocInfo.width,
      currentDocInfo.height
    );

    HostAdapter.addPreviewLines(result.lines.map(function (line) {
      return {
        x1: line.x1, y1: line.y1,
        x2: line.x2, y2: line.y2,
        color: line.color || '#FF6B00',
        opacity: 40
      };
    })).catch(function () {
      // 预览失败静默处理
    });
  }

  // ============================
  // HostAdapter 预览图层扩展
  // ============================

  HostAdapter.addPreviewLines = function (lines) {
    return callHost('addPreviewLines', [JSON.stringify(lines)]);
  };

  HostAdapter.clearPreviewLayer = function () {
    return callHost('clearPreviewLayer', []);
  };

  // ============================
  // 实时预览开关 UI 组件
  // ============================

  /**
   * 创建实时预览开关
   * @returns {HTMLElement}
   */
  function createPreviewToggle() {
    var saved = Storage.get('preview_enabled');
    _previewEnabled = saved === true;

    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:6px 0;margin-bottom:6px;' +
      'border-bottom:1px solid var(--gm-border-default);';

    var label = document.createElement('span');
    label.style.cssText = 'font-size:10px;color:var(--gm-text-tertiary);';
    label.textContent = '⚡ 实时预览';

    var toggle = document.createElement('div');
    toggle.style.cssText =
      'width:32px;height:18px;border-radius:9px;cursor:pointer;transition:all 0.2s;' +
      'background:' + (_previewEnabled ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)') + ';' +
      'border:1px solid ' + (_previewEnabled ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';' +
      'position:relative;flex-shrink:0;';

    var knob = document.createElement('div');
    knob.style.cssText =
      'width:14px;height:14px;border-radius:50%;background:#fff;' +
      'position:absolute;top:1px;transition:left 0.2s;' +
      'left:' + (_previewEnabled ? '15px' : '1px') + ';' +
      'box-shadow:0 1px 2px rgba(0,0,0,0.3);';
    toggle.appendChild(knob);

    toggle.addEventListener('click', function () {
      _previewEnabled = !_previewEnabled;

      toggle.style.background = _previewEnabled ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)';
      toggle.style.borderColor = _previewEnabled ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)';
      knob.style.left = _previewEnabled ? '15px' : '1px';

      setPreviewEnabled(_previewEnabled);

      showToast(_previewEnabled ? '实时预览已开启' : '实时预览已关闭', 'info');
    });

    row.appendChild(label);
    row.appendChild(toggle);

    return row;
  }

  // ============================
  // 增强 createNumberInput：添加实时预览触发
  // ============================

  /**
   * 替换原有 createNumberInput，增加 previewCallback 参数
   * 在 index.js 中找到 createNumberInput 函数定义，替换为以下版本
   */
  var _originalCreateNumberInput = createNumberInput;

  createNumberInput = function (label, value, min, max, step, onChange) {
    var result = _originalCreateNumberInput(label, value, min, max, step, function (newVal) {
      // 调用原始回调
      if (onChange) onChange(newVal);

      // 触发实时预览
      if (_previewEnabled && currentTab === 'grid') {
        triggerPreview('grid', {
          columns: gridState.columns,
          rows: gridState.rows,
          gutterH: gridState.gutterH,
          gutterV: gridState.gutterV,
          marginTop: gridState.marginTop,
          marginRight: gridState.marginRight,
          marginBottom: gridState.marginBottom,
          marginLeft: gridState.marginLeft
        });
      }
    });
    return result;
  };
