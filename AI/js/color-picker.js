// ============================
  // P1-6: 颜色选择器组件
  // ============================

  /**
   * 创建颜色选择器行
   * @param {string} label - 标签文本
   * @param {string} currentColor - 当前颜色值 (#hex)
   * @param {Array} presetColors - 预设色板
   * @param {function} onChange - 颜色变化回调
   * @returns {{ el: HTMLElement, getValue: function }}
   */
  function createColorPicker(label, currentColor, presetColors, onChange) {
    var defaultPresets = [
      '#0D99FF', '#FF6B00', '#BF5AF2', '#34C759',
      '#FF375F', '#FF9500', '#5856D6', '#00C7BE',
      '#FF2D55', '#AF52DE', '#007AFF', '#30B0C7'
    ];

    presetColors = presetColors || defaultPresets;

    var row = document.createElement('div');
    row.style.cssText = 'margin-bottom:10px;';

    // 标签行
    var labelRow = document.createElement('div');
    labelRow.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';

    var labelEl = document.createElement('span');
    labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    labelEl.textContent = label;

    // 当前颜色预览 + input
    var colorWrap = document.createElement('div');
    colorWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

    var colorPreview = document.createElement('div');
    colorPreview.style.cssText =
      'width:18px;height:18px;border-radius:3px;border:1px solid var(--gm-border-default);' +
      'background:' + currentColor + ';';

    var colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = currentColor;
    colorInput.style.cssText =
      'width:0;height:0;padding:0;border:0;opacity:0;position:absolute;';

    var hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.value = currentColor;
    hexInput.maxLength = 7;
    hexInput.style.cssText =
      'width:64px;height:20px;border-radius:3px;font-size:10px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-primary);' +
      'border:1px solid var(--gm-border-default);padding:0 4px;' +
      'font-family:monospace;text-transform:uppercase;';

    // 点击预览打开颜色选择器
    colorPreview.style.cursor = 'pointer';
    colorPreview.addEventListener('click', function () {
      colorInput.click();
    });

    colorInput.addEventListener('input', function () {
      var val = colorInput.value;
      colorPreview.style.background = val;
      hexInput.value = val;
      if (onChange) onChange(val);
    });

    hexInput.addEventListener('change', function () {
      var val = hexInput.value.trim();
      if (val.charAt(0) !== '#') val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        colorPreview.style.background = val;
        colorInput.value = val;
        if (onChange) onChange(val);
      } else {
        hexInput.value = colorInput.value;
        showToast('无效的颜色值', 'warning');
      }
    });

    colorWrap.appendChild(colorPreview);
    colorWrap.appendChild(colorInput);
    colorWrap.appendChild(hexInput);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(colorWrap);
    row.appendChild(labelRow);

    // 预设色板
    var swatchRow = document.createElement('div');
    swatchRow.style.cssText =
      'display:flex;flex-wrap:wrap;gap:3px;';

    for (var i = 0; i < presetColors.length; i++) {
      (function (color) {
        var swatch = document.createElement('div');
        swatch.style.cssText =
          'width:16px;height:16px;border-radius:3px;cursor:pointer;' +
          'background:' + color + ';border:1px solid rgba(255,255,255,0.1);' +
          'transition:transform 0.1s;';

        if (color === currentColor) {
          swatch.style.border = '2px solid #fff';
          swatch.style.boxShadow = '0 0 0 1px var(--gm-accent-primary)';
        }

        swatch.addEventListener('mouseenter', function () {
          swatch.style.transform = 'scale(1.2)';
        });
        swatch.addEventListener('mouseleave', function () {
          swatch.style.transform = 'scale(1)';
        });

        swatch.addEventListener('click', function () {
          colorPreview.style.background = color;
          colorInput.value = color;
          hexInput.value = color;
          if (onChange) onChange(color);

          // 更新选中状态
          var siblings = swatchRow.children;
          for (var s = 0; s < siblings.length; s++) {
            siblings[s].style.border = '1px solid rgba(255,255,255,0.1)';
            siblings[s].style.boxShadow = 'none';
          }
          swatch.style.border = '2px solid #fff';
          swatch.style.boxShadow = '0 0 0 1px var(--gm-accent-primary)';
        });

        swatchRow.appendChild(swatch);
      })(presetColors[i]);
    }

    row.appendChild(swatchRow);

    return {
      el: row,
      getValue: function () { return colorInput.value; }
    };
  }

  /**
   * 创建透明度滑块
   */
  function createOpacitySlider(label, value, min, max, onChange) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'margin-bottom:8px;height:28px;';

    var labelEl = document.createElement('span');
    labelEl.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    labelEl.textContent = label;

    var sliderWrap = document.createElement('div');
    sliderWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min || 1;
    slider.max = max || 100;
    slider.value = value;
    slider.style.cssText =
      'width:80px;height:4px;cursor:pointer;accent-color:var(--gm-accent-primary);';

    var valueLabel = document.createElement('span');
    valueLabel.style.cssText = 'font-size:10px;color:var(--gm-text-secondary);width:30px;text-align:right;';
    valueLabel.textContent = value + '%';

    slider.addEventListener('input', function () {
      var v = parseInt(slider.value);
      valueLabel.textContent = v + '%';
      if (onChange) onChange(v);
    });

    sliderWrap.appendChild(slider);
    sliderWrap.appendChild(valueLabel);

    row.appendChild(labelEl);
    row.appendChild(sliderWrap);

    return {
      el: row,
      getValue: function () { return parseInt(slider.value); }
    };
  }
