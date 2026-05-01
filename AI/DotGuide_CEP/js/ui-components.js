/**
 * DotGuide UI Components — 通用 UI 工厂函数
 * 依赖：core.js (DotGuide 命名空间)
 */

(function (GM) {
  'use strict';

  // ============================
  // Section
  // ============================

  GM.createSection = function (title) {
    var section = document.createElement('div');
    section.style.cssText = 'margin-bottom:var(--gm-section-gap);' +
      'padding:2px 0;';
    if (title) {
      var titleEl = document.createElement('div');
      titleEl.style.cssText =
        'font-size:var(--gm-font-size-xs);font-weight:600;color:var(--gm-text-tertiary);' +
        'margin-bottom:7px;letter-spacing:0.3px;line-height:1;';
      titleEl.textContent = title;
      section.appendChild(titleEl);
    }
    return section;
  };

  // ============================
  // Number Input (±)
  // ============================

  GM.createNumberInput = function (label, value, min, max, step, onChange) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'margin-bottom:6px;height:28px;';

    var labelEl = document.createElement('span');
    labelEl.style.cssText = 'font-size:var(--gm-font-size-sm);color:var(--gm-text-primary);line-height:1;';
    labelEl.textContent = label;

    var inputWrap = document.createElement('div');
    inputWrap.style.cssText = 'display:flex;align-items:center;gap:1px;';

    var btnStyle =
      'width:26px;height:24px;border-radius:var(--gm-radius-sm);background:var(--gm-bg-tertiary);' +
      'color:var(--gm-text-secondary);font-size:15px;display:flex;align-items:center;' +
      'justify-content:center;cursor:pointer;border:1px solid var(--gm-border-default);' +
      'transition:all 0.12s;';

    var btnMinus = document.createElement('button');
    btnMinus.textContent = '−';
    btnMinus.style.cssText = btnStyle;
    btnMinus.addEventListener('mouseenter', function () { btnMinus.style.color = 'var(--gm-accent-primary)'; btnMinus.style.borderColor = 'var(--gm-accent-primary)'; });
    btnMinus.addEventListener('mouseleave', function () { btnMinus.style.color = 'var(--gm-text-secondary)'; btnMinus.style.borderColor = 'var(--gm-border-default)'; });

    var input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.min = min;
    input.max = max;
    input.step = step || 1;
    input.style.cssText =
      'width:50px;height:24px;text-align:center;border-radius:0;' +
      'background:var(--gm-bg-secondary);color:var(--gm-text-primary);' +
      'border:1px solid var(--gm-border-default);border-left:none;border-right:none;' +
      'font-size:var(--gm-font-size-md);-moz-appearance:textfield;' +
      'line-height:1;';

    var btnPlus = document.createElement('button');
    btnPlus.textContent = '+';
    btnPlus.style.cssText = btnStyle;
    btnPlus.addEventListener('mouseenter', function () { btnPlus.style.color = 'var(--gm-accent-primary)'; btnPlus.style.borderColor = 'var(--gm-accent-primary)'; });
    btnPlus.addEventListener('mouseleave', function () { btnPlus.style.color = 'var(--gm-text-secondary)'; btnPlus.style.borderColor = 'var(--gm-border-default)'; });

    btnMinus.addEventListener('click', function () {
      var v = parseFloat(input.value) - (parseFloat(step) || 1);
      if (v < min) v = min;
      input.value = v;
      if (onChange) onChange(v);
    });

    btnPlus.addEventListener('click', function () {
      var v = parseFloat(input.value) + (parseFloat(step) || 1);
      if (max !== undefined && v > max) v = max;
      input.value = v;
      if (onChange) onChange(v);
    });

    input.addEventListener('change', function () {
      var v = parseFloat(input.value);
      if (isNaN(v)) v = min;
      if (v < min) v = min;
      if (max !== undefined && v > max) v = max;
      input.value = v;
      if (onChange) onChange(v);
    });

    inputWrap.appendChild(btnMinus);
    inputWrap.appendChild(input);
    inputWrap.appendChild(btnPlus);
    row.appendChild(labelEl);
    row.appendChild(inputWrap);

    return { el: row, getValue: function () { return parseFloat(input.value); } };
  };

  // ============================
  // Select
  // ============================

  GM.createSelect = function (label, options, selectedValue, onChange) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'margin-bottom:6px;height:28px;';

    var labelEl = document.createElement('span');
    labelEl.style.cssText = 'font-size:var(--gm-font-size-sm);color:var(--gm-text-primary);line-height:1;';
    labelEl.textContent = label;

    var select = document.createElement('select');
    select.style.cssText =
      'width:130px;height:24px;border-radius:var(--gm-radius-sm);' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
      'border:1px solid var(--gm-border-default);font-size:var(--gm-font-size-sm);padding:0 4px;';

    options.forEach(function (opt) {
      var option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === selectedValue) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      if (onChange) onChange(select.value);
    });

    row.appendChild(labelEl);
    row.appendChild(select);

    return { el: row, getValue: function () { return select.value; } };
  };

  // ============================
  // Preset List (button chips)
  // ============================

  GM.createPresetList = function (category, onSelect, onDelete) {
    var presets = GM.PresetManager.getAll(category);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;';

    // 跟踪当前选中的预设 ID
    var selectedId = null;

    function _updateSelection() {
      var btns = wrap.querySelectorAll('[data-preset-btn]');
      for (var i = 0; i < btns.length; i++) {
        var btn = btns[i];
        var isSelected = btn.dataset.presetId === selectedId;
        btn.style.background = isSelected ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)';
        btn.style.color = isSelected ? '#fff' : 'var(--gm-text-primary)';
        btn.style.borderColor = isSelected ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)';
      }
    }

    presets.forEach(function (preset) {
      var isCustom = !preset.isBuiltIn;

      if (isCustom) {
        // 自定义预设：带删除按钮的分组
        var group = document.createElement('div');
        group.style.cssText = 'display:inline-flex;align-items:center;border-radius:3px;overflow:hidden;' +
          'border:1px solid var(--gm-border-default);transition:all 0.15s;';

        var nameBtn = document.createElement('button');
        nameBtn.textContent = preset.name;
        nameBtn.dataset.presetBtn = '1';
        nameBtn.dataset.presetId = preset.id;
        nameBtn.style.cssText =
          'padding:5px 9px;font-size:var(--gm-font-size-sm);cursor:pointer;border:none;outline:none;' +
          'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);transition:all 0.15s;line-height:1;';
        nameBtn.addEventListener('mouseenter', function () {
          if (nameBtn.dataset.presetId !== selectedId) {
            nameBtn.style.background = 'var(--gm-bg-hover)';
            group.style.borderColor = 'var(--gm-accent-primary)';
          }
        });
        nameBtn.addEventListener('mouseleave', function () {
          if (nameBtn.dataset.presetId !== selectedId) {
            nameBtn.style.background = 'var(--gm-bg-tertiary)';
            group.style.borderColor = 'var(--gm-border-default)';
          }
        });
        nameBtn.addEventListener('click', function () {
          selectedId = preset.id;
          _updateSelection();
          if (onSelect) onSelect(preset);
        });

        var delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.title = '删除此预设';
        delBtn.style.cssText =
          'padding:4px 6px;font-size:11px;cursor:pointer;border:none;outline:none;font-weight:700;' +
          'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);transition:all 0.15s;border-left:1px solid var(--gm-border-default);';
        delBtn.addEventListener('mouseenter', function () {
          delBtn.style.background = 'rgba(255,59,48,0.2)';
          delBtn.style.color = 'var(--gm-accent-danger)';
        });
        delBtn.addEventListener('mouseleave', function () {
          delBtn.style.background = 'var(--gm-bg-tertiary)';
          delBtn.style.color = 'var(--gm-text-secondary)';
        });
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          GM.PresetManager.remove(category, preset.id);
          GM.showToast('已删除预设: ' + preset.name, 'info');
          if (selectedId === preset.id) selectedId = null;
          if (onDelete) onDelete();
        });

        group.appendChild(nameBtn);
        group.appendChild(delBtn);
        wrap.appendChild(group);
      } else {
        // 内置预设：带 hover 和选中效果
        var btn = document.createElement('button');
        btn.textContent = preset.name;
        btn.dataset.presetBtn = '1';
        btn.dataset.presetId = preset.id;
        btn.style.cssText =
          'padding:5px 9px;border-radius:var(--gm-radius-sm);font-size:var(--gm-font-size-sm);cursor:pointer;' +
          'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
          'border:1px solid var(--gm-border-default);transition:all 0.15s;line-height:1;';

        btn.addEventListener('mouseenter', function () {
          if (btn.dataset.presetId !== selectedId) {
            btn.style.borderColor = 'var(--gm-accent-primary)';
            btn.style.color = 'var(--gm-accent-primary)';
            btn.style.background = 'var(--gm-bg-hover)';
          }
        });
        btn.addEventListener('mouseleave', function () {
          if (btn.dataset.presetId !== selectedId) {
            btn.style.borderColor = 'var(--gm-border-default)';
            btn.style.color = 'var(--gm-text-primary)';
            btn.style.background = 'var(--gm-bg-tertiary)';
          }
        });
        btn.addEventListener('click', function () {
          selectedId = preset.id;
          _updateSelection();
          if (onSelect) onSelect(preset);
        });
        wrap.appendChild(btn);
      }
    });

    return wrap;
  };
  GM.createApplyButton = function (text, onClick) {
    var btn = document.createElement('button');
    btn.textContent = text || '应用';
    btn.style.cssText =
      'width:100%;padding:8px;border-radius:var(--gm-radius-md);font-size:var(--gm-font-size-lg);font-weight:600;' +
      'background:var(--gm-accent-primary);color:#fff;cursor:pointer;' +
      'border:none;transition:all 0.15s;margin-top:10px;line-height:1;';

    btn.addEventListener('mouseenter', function () { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '1'; });

    btn.addEventListener('click', function () {
      btn.textContent = '处理中...';
      btn.disabled = true;
      btn.style.opacity = '0.6';

      var result;
      try { result = onClick(); }
      catch (e) {
        GM.showToast('错误: ' + e.message, 'error');
        btn.textContent = text || '应用';
        btn.disabled = false;
        btn.style.opacity = '1';
        return;
      }

      if (result && typeof result.then === 'function') {
        result.then(function () {
          btn.textContent = text || '应用';
          btn.disabled = false;
          btn.style.opacity = '1';
        }).catch(function (err) {
          GM.showToast('错误: ' + err.message, 'error');
          btn.textContent = text || '应用';
          btn.disabled = false;
          btn.style.opacity = '1';
        });
      } else {
        btn.textContent = text || '应用';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });

    return btn;
  };

  // ============================
  // Toggle Switch
  // ============================

  GM.createToggleSwitch = function (value, onChange) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';
    var toggle = document.createElement('div');
    toggle.style.cssText = 'width:36px;height:20px;border-radius:10px;cursor:pointer;transition:all 0.2s;' +
      'background:' + (value ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)') + ';' +
      'border:1px solid ' + (value ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';position:relative;';
    var knob = document.createElement('div');
    knob.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:1px;transition:left 0.2s;' +
      'left:' + (value ? '17px' : '1px') + ';box-shadow:0 1px 2px rgba(0,0,0,0.35);';
    toggle.appendChild(knob);
    toggle.addEventListener('click', function () {
      value = !value;
      toggle.style.background = value ? 'var(--gm-accent-primary)' : 'var(--gm-bg-tertiary)';
      toggle.style.borderColor = value ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)';
      knob.style.left = value ? '17px' : '1px';
      if (onChange) onChange(value);
    });
    return toggle;
  };

})(DotGuide);
