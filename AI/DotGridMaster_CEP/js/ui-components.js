/**
 * DotGridMaster UI Components — 通用 UI 工厂函数
 * 依赖：core.js (DotGridMaster 命名空间)
 */

(function (GM) {
  'use strict';

  // ============================
  // Section
  // ============================

  GM.createSection = function (title) {
    var section = document.createElement('div');
    section.style.cssText = 'margin-bottom:16px;';
    if (title) {
      var titleEl = document.createElement('div');
      titleEl.style.cssText =
        'font-size:11px;font-weight:600;color:var(--gm-text-secondary);' +
        'margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;';
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
    labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    labelEl.textContent = label;

    var inputWrap = document.createElement('div');
    inputWrap.style.cssText = 'display:flex;align-items:center;gap:2px;';

    var btnStyle =
      'width:22px;height:22px;border-radius:3px;background:var(--gm-bg-tertiary);' +
      'color:var(--gm-text-primary);font-size:13px;display:flex;align-items:center;' +
      'justify-content:center;cursor:pointer;border:1px solid var(--gm-border-default);';

    var btnMinus = document.createElement('button');
    btnMinus.textContent = '−';
    btnMinus.style.cssText = btnStyle;

    var input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.min = min;
    input.max = max;
    input.step = step || 1;
    input.style.cssText =
      'width:52px;height:22px;text-align:center;border-radius:3px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
      'border:1px solid var(--gm-border-default);font-size:11px;' +
      '-moz-appearance:textfield;';

    var btnPlus = document.createElement('button');
    btnPlus.textContent = '+';
    btnPlus.style.cssText = btnStyle;

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
    labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    labelEl.textContent = label;

    var select = document.createElement('select');
    select.style.cssText =
      'width:130px;height:22px;border-radius:3px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
      'border:1px solid var(--gm-border-default);font-size:11px;padding:0 4px;';

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

  GM.createPresetList = function (category, onSelect) {
    var presets = GM.PresetManager.getAll(category);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;';

    presets.forEach(function (preset) {
      var btn = document.createElement('button');
      btn.textContent = preset.name;
      btn.style.cssText =
        'padding:4px 8px;border-radius:3px;font-size:10px;cursor:pointer;' +
        'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
        'border:1px solid var(--gm-border-default);transition:all 0.15s;';

      btn.addEventListener('mouseenter', function () {
        btn.style.borderColor = 'var(--gm-accent-primary)';
        btn.style.color = 'var(--gm-accent-primary)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.borderColor = 'var(--gm-border-default)';
        btn.style.color = 'var(--gm-text-primary)';
      });
      btn.addEventListener('click', function () {
        if (onSelect) onSelect(preset);
      });

      wrap.appendChild(btn);
    });

    return wrap;
  };

  // ============================
  // Apply Button
  // ============================

  GM.createApplyButton = function (text, onClick) {
    var btn = document.createElement('button');
    btn.textContent = text || '应用';
    btn.style.cssText =
      'width:100%;padding:8px;border-radius:4px;font-size:12px;font-weight:600;' +
      'background:var(--gm-accent-primary);color:#fff;cursor:pointer;' +
      'border:none;transition:opacity 0.15s;margin-top:8px;';

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
      'left:' + (value ? '17px' : '1px') + ';box-shadow:0 1px 3px rgba(0,0,0,0.3);';
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

})(DotGridMaster);
