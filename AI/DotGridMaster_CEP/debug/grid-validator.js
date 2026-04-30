// ============================
// 网格引擎调试工具
// ============================

var GridDebugger = (function () {

  // 兼容 DEBUG 对象（可选依赖 chrome devtools 面板）
  var _log = (typeof DEBUG !== 'undefined' && DEBUG.log) ? DEBUG.log.bind(DEBUG) : function () { console.log.apply(console, arguments); };
  var _warn = (typeof DEBUG !== 'undefined' && DEBUG.warn) ? DEBUG.warn.bind(DEBUG) : function () { console.warn.apply(console, arguments); };
  var _error = (typeof DEBUG !== 'undefined' && DEBUG.error) ? DEBUG.error.bind(DEBUG) : function () { console.error.apply(console, arguments); };

  // 获取当前文档信息（兼容前端和调试环境）
  function _getDocInfo() {
    if (typeof DotGuide !== 'undefined' && DotGuide.currentDocInfo) {
      return DotGuide.currentDocInfo;
    }
    if (typeof currentDocInfo !== 'undefined') {
      return currentDocInfo;
    }
    return null;
  }

  /**
   * 验证网格参数合法性
   */
  function validateParams(params) {
    _log('grid', '=== 网格参数验证 ===');

    var errors = [];
    var warnings = [];

    // 必填字段检查
    var required = ['columns', 'rows', 'gutterH', 'gutterV',
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
    for (var i = 0; i < required.length; i++) {
      if (params[required[i]] === undefined || params[required[i]] === null) {
        errors.push('缺少必填参数: ' + required[i]);
      }
    }

    // 类型检查
    var numericFields = required;
    for (var j = 0; j < numericFields.length; j++) {
      var val = params[numericFields[j]];
      if (typeof val !== 'number' || isNaN(val)) {
        errors.push(numericFields[j] + ' 必须是有效数字，当前值: ' + JSON.stringify(val));
      }
    }

    // 范围检查
    if (params.columns < 1 || params.columns > 100) {
      errors.push('columns 超出合理范围 [1, 100]，当前值: ' + params.columns);
    }
    if (params.rows < 1 || params.rows > 100) {
      errors.push('rows 超出合理范围 [1, 100]，当前值: ' + params.rows);
    }
    if (params.gutterH < 0) {
      errors.push('gutterH 不能为负数');
    }
    if (params.gutterV < 0) {
      errors.push('gutterV 不能为负数');
    }

    // 逻辑检查（需要文档尺寸）
    var docInfo = _getDocInfo();
    if (docInfo) {
      var availableWidth = docInfo.width - params.marginLeft - params.marginRight;
      var availableHeight = docInfo.height - params.marginTop - params.marginBottom;
      var totalGutterH = (params.columns - 1) * params.gutterH;
      var totalGutterV = (params.rows - 1) * params.gutterV;

      if (totalGutterH >= availableWidth) {
        errors.push('水平间距总和 (' + totalGutterH.toFixed(1) +
          'pt) 超过可用宽度 (' + availableWidth.toFixed(1) + 'pt)');
      }

      if (totalGutterV >= availableHeight) {
        errors.push('垂直间距总和 (' + totalGutterV.toFixed(1) +
          'pt) 超过可用高度 (' + availableHeight.toFixed(1) + 'pt)');
      }

      var colWidth = (availableWidth - totalGutterH) / params.columns;
      var rowHeight = (availableHeight - totalGutterV) / params.rows;

      if (colWidth < 1) {
        warnings.push('列宽过小: ' + colWidth.toFixed(2) + 'pt，可能无法正常显示');
      }
      if (rowHeight < 1) {
        warnings.push('行高过小: ' + rowHeight.toFixed(2) + 'pt，可能无法正常显示');
      }

      _log('grid', '计算结果预览:', {
        availableWidth: availableWidth.toFixed(1) + 'pt',
        availableHeight: availableHeight.toFixed(1) + 'pt',
        columnWidth: colWidth.toFixed(2) + 'pt',
        rowHeight: rowHeight.toFixed(2) + 'pt',
        totalGutterH: totalGutterH.toFixed(1) + 'pt',
        totalGutterV: totalGutterV.toFixed(1) + 'pt'
      });
    } else {
      warnings.push('无法获取文档信息，跳过尺寸逻辑校验');
    }

    // 输出结果
    if (errors.length > 0) {
      _error('grid', '✗ 验证失败 (' + errors.length + ' 个错误):');
      for (var k = 0; k < errors.length; k++) {
        _error('grid', '  [E' + (k + 1) + '] ' + errors[k]);
      }
    }

    if (warnings.length > 0) {
      _warn('grid', '⚠ 警告 (' + warnings.length + ' 条):');
      for (var l = 0; l < warnings.length; l++) {
        _warn('grid', '  [W' + (l + 1) + '] ' + warnings[l]);
      }
    }

    if (errors.length === 0 && warnings.length === 0) {
      _log('grid', '✓ 所有参数验证通过');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * 模拟网格计算（不实际绘制）
   */
  function simulateGrid(params) {
    _log('grid', '=== 网格模拟计算 ===');

    var docInfo = _getDocInfo();
    if (!docInfo) {
      _error('grid', '无法模拟：没有打开的文档');
      return null;
    }

    var w = docInfo.width;
    var h = docInfo.height;
    var availW = w - params.marginLeft - params.marginRight;
    var availH = h - params.marginTop - params.marginBottom;
    var gutterTotalH = (params.columns - 1) * params.gutterH;
    var gutterTotalV = (params.rows - 1) * params.gutterV;
    var colW = (availW - gutterTotalH) / params.columns;
    var rowH = (availH - gutterTotalV) / params.rows;

    var guides = { vertical: [], horizontal: [] };

    // 计算垂直参考线
    for (var c = 0; c <= params.columns; c++) {
      var x;
      if (c === 0) {
        x = params.marginLeft;
      } else {
        x = params.marginLeft + c * colW + (c - 1) * params.gutterH;
        // 间距右边线
        if (c < params.columns) {
          guides.vertical.push({
            position: x + params.gutterH,
            type: 'gutter_right',
            label: 'G' + c + 'R'
          });
        }
      }
      guides.vertical.push({
        position: x,
        type: c === 0 || c === params.columns ? 'margin' : 'gutter_left',
        label: c === 0 ? 'ML' : (c === params.columns ? 'MR' : 'G' + c + 'L')
      });
    }

    // 计算水平参考线
    for (var r = 0; r <= params.rows; r++) {
      var y;
      if (r === 0) {
        y = params.marginTop;
      } else {
        y = params.marginTop + r * rowH + (r - 1) * params.gutterV;
        if (r < params.rows) {
          guides.horizontal.push({
            position: y + params.gutterV,
            type: 'gutter_bottom',
            label: 'G' + r + 'B'
          });
        }
      }
      guides.horizontal.push({
        position: y,
        type: r === 0 || r === params.rows ? 'margin' : 'gutter_top',
        label: r === 0 ? 'MT' : (r === params.rows ? 'MB' : 'G' + r + 'T')
      });
    }

    var totalGuides = guides.vertical.length + guides.horizontal.length;

    _log('grid', '模拟结果:', {
      documentSize: w.toFixed(0) + ' × ' + h.toFixed(0) + 'pt',
      availableArea: availW.toFixed(1) + ' × ' + availH.toFixed(1) + 'pt',
      columnWidth: colW.toFixed(2) + 'pt',
      rowHeight: rowH.toFixed(2) + 'pt',
      verticalGuides: guides.vertical.length,
      horizontalGuides: guides.horizontal.length,
      totalGuides: totalGuides
    });

    // 打印参考线详情
    console.group('[GM:GRID] 垂直参考线 (' + guides.vertical.length + ')');
    for (var vi = 0; vi < guides.vertical.length; vi++) {
      var vg = guides.vertical[vi];
      console.log('  ' + vg.label + ': ' + vg.position.toFixed(2) + 'pt (' + vg.type + ')');
    }
    console.groupEnd();

    console.group('[GM:GRID] 水平参考线 (' + guides.horizontal.length + ')');
    for (var hi = 0; hi < guides.horizontal.length; hi++) {
      var hg = guides.horizontal[hi];
      console.log('  ' + hg.label + ': ' + hg.position.toFixed(2) + 'pt (' + hg.type + ')');
    }
    console.groupEnd();

    return guides;
  }

  // 暴露到全局
  window.__GM_GRID_DEBUG = {
    validateParams: validateParams,
    simulateGrid: simulateGrid
  };

  return {
    validateParams: validateParams,
    simulateGrid: simulateGrid
  };
})();
