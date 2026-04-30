/**
 * DotGridMaster Panel — UI 设备安全区
 * 依赖：core.js, ui-components.js
 */

(function (GM) {
  'use strict';

  var uiState = { selectedPreset: null };

  GM.renderUIPanel = function (container) {
    // 设备预设
    var presetSection = GM.createSection('选择设备');
    presetSection.appendChild(GM.createPresetList('ui', function (preset) {
      uiState.selectedPreset = preset;
      GM.renderUIPanel(container);
    }));
    container.appendChild(presetSection);

    if (uiState.selectedPreset) {
      var preset = uiState.selectedPreset;

      // 设备信息卡片
      var infoSection = GM.createSection('设备信息');
      var infoCard = document.createElement('div');
      infoCard.style.cssText = 'padding:10px;border-radius:4px;background:var(--gm-bg-secondary);border:1px solid var(--gm-border-default);margin-bottom:8px;';
      infoCard.innerHTML =
        '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">' + preset.name + '</div>' +
        '<div style="font-size:10px;color:var(--gm-text-secondary);line-height:1.6;">' +
        '逻辑分辨率: ' + preset.width + '×' + preset.height + ' pt<br>' +
        '状态栏: ' + preset.statusBar + 'pt<br>' +
        '导航栏: ' + preset.navBar + 'pt<br>' +
        '标签栏: ' + preset.tabBar + 'pt<br>' +
        'Home Indicator: ' + preset.homeIndicator + 'pt</div>';
      infoSection.appendChild(infoCard);
      container.appendChild(infoSection);

      // 可视化预览
      var previewSection = GM.createSection('区域预览');
      var previewWrap = document.createElement('div');
      previewWrap.style.cssText = 'width:100%;display:flex;justify-content:center;margin-bottom:10px;';

      var previewH = 180;
      var previewW = Math.round(previewH * (preset.width / preset.height));
      var scale = previewH / preset.height;

      var previewBox = document.createElement('div');
      previewBox.style.cssText =
        'width:' + previewW + 'px;height:' + previewH + 'px;position:relative;' +
        'background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.3);';

      if (preset.statusBar > 0) {
        var statusDiv = document.createElement('div');
        statusDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + Math.round(preset.statusBar * scale) + 'px;background:rgba(191,90,242,0.3);';
        statusDiv.title = '状态栏 ' + preset.statusBar + 'pt';
        previewBox.appendChild(statusDiv);
      }

      if (preset.navBar > 0) {
        var navDiv = document.createElement('div');
        navDiv.style.cssText = 'position:absolute;top:' + Math.round(preset.statusBar * scale) + 'px;left:0;right:0;height:' + Math.round(preset.navBar * scale) + 'px;background:rgba(13,153,255,0.25);';
        navDiv.title = '导航栏 ' + preset.navBar + 'pt';
        previewBox.appendChild(navDiv);
      }

      if (preset.tabBar > 0) {
        var tabTop = preset.height - preset.tabBar - preset.homeIndicator;
        var tabDiv = document.createElement('div');
        tabDiv.style.cssText = 'position:absolute;top:' + Math.round(tabTop * scale) + 'px;left:0;right:0;height:' + Math.round(preset.tabBar * scale) + 'px;background:rgba(13,153,255,0.25);';
        tabDiv.title = '标签栏 ' + preset.tabBar + 'pt';
        previewBox.appendChild(tabDiv);
      }

      if (preset.homeIndicator > 0) {
        var homeDiv = document.createElement('div');
        homeDiv.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:' + Math.round(preset.homeIndicator * scale) + 'px;background:rgba(150,150,150,0.25);';
        homeDiv.title = 'Home Indicator ' + preset.homeIndicator + 'pt';
        previewBox.appendChild(homeDiv);
      }

      var safeTop = preset.statusBar + preset.navBar;
      var safeBottom = preset.tabBar + preset.homeIndicator;
      var safeDiv = document.createElement('div');
      safeDiv.style.cssText =
        'position:absolute;top:' + Math.round(safeTop * scale) + 'px;bottom:' + Math.round(safeBottom * scale) + 'px;left:0;right:0;' +
        'border:1px dashed rgba(52,199,89,0.6);display:flex;align-items:center;justify-content:center;font-size:9px;color:rgba(52,199,89,0.8);';
      safeDiv.textContent = '安全区';
      previewBox.appendChild(safeDiv);

      previewWrap.appendChild(previewBox);
      previewSection.appendChild(previewWrap);
      container.appendChild(previewSection);

      // 应用按钮
      container.appendChild(GM.createApplyButton('✦ 应用 UI 安全区', function () {
        if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
        var result = GM.Calculator.calculateUISafeZone(preset, GM.currentDocInfo.width, GM.currentDocInfo.height);
        return Promise.all([GM.HostAdapter.clearGuides(), GM.HostAdapter.clearOverlays()]).then(function () {
          return Promise.all([GM.HostAdapter.addGuides(result.guides), GM.HostAdapter.addOverlays(result.overlays)]);
        }).then(function () { GM.showToast('UI 安全区已应用', 'success'); });
      }));

      // 仅参考线
      var guidesOnlyBtn = document.createElement('button');
      guidesOnlyBtn.textContent = '仅添加参考线（无覆盖层）';
      guidesOnlyBtn.style.cssText = 'width:100%;padding:6px;border-radius:4px;font-size:11px;background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);border:1px solid var(--gm-border-default);cursor:pointer;margin-top:6px;';
      guidesOnlyBtn.addEventListener('click', function () {
        if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
        var result = GM.Calculator.calculateUISafeZone(preset, GM.currentDocInfo.width, GM.currentDocInfo.height);
        GM.HostAdapter.clearGuides().then(function () { return GM.HostAdapter.addGuides(result.guides); })
        .then(function () { GM.showToast('参考线已应用', 'success'); });
      });
      container.appendChild(guidesOnlyBtn);

    } else {
      var hint = document.createElement('div');
      hint.style.cssText = 'text-align:center;padding:30px 10px;color:var(--gm-text-secondary);font-size:11px;';
      hint.textContent = '👆 请先选择一个设备预设';
      container.appendChild(hint);
    }
  };

})(DotGridMaster);
