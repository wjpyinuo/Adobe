/**
 * DotGridMaster Panel — 构图
 * 依赖：core.js, ui-components.js
 */

(function (GM) {
  'use strict';

  var compositionState = {
    type: 'rule-of-thirds',
    color: '#FF6B00',
    showAsGuides: true
  };

  GM.renderCompositionPanel = function (container) {
    // 预设
    var presetSection = GM.createSection('构图模式');
    presetSection.appendChild(GM.createPresetList('composition', function (preset) {
      compositionState.type = preset.type;
      GM.renderCompositionPanel(container);
    }));
    container.appendChild(presetSection);

    // 当前模式
    var modeNames = {
      'rule-of-thirds': '三分法', 'golden-ratio': '黄金分割',
      'diagonal': '对角线', 'center-cross': '中心十字', 'golden-spiral': '黄金螺旋'
    };
    var descriptions = {
      'rule-of-thirds': '将画面分为 3×3 的九宫格，关键元素放在交叉点上。',
      'golden-ratio': '基于 1:1.618 的黄金比例分割线，产生自然和谐的构图。',
      'diagonal': '两条对角线引导视线从一角到另一角，增加动感。',
      'center-cross': '水平和垂直中心线，适合对称构图。',
      'golden-spiral': '黄金螺旋递归分割，引导视线聚焦到螺旋中心。'
    };

    var infoSection = GM.createSection('当前模式');
    var infoText = document.createElement('div');
    infoText.style.cssText =
      'padding:8px 10px;border-radius:4px;background:var(--gm-bg-secondary);' +
      'font-size:12px;color:var(--gm-accent-primary);font-weight:600;' +
      'text-align:center;margin-bottom:8px;';
    infoText.textContent = modeNames[compositionState.type] || compositionState.type;
    infoSection.appendChild(infoText);

    var descText = document.createElement('div');
    descText.style.cssText = 'font-size:10px;color:var(--gm-text-secondary);line-height:1.5;margin-bottom:10px;';
    descText.textContent = descriptions[compositionState.type] || '';
    infoSection.appendChild(descText);
    container.appendChild(infoSection);

    // 选项
    var optSection = GM.createSection('选项');
    var renderModeSelect = GM.createSelect('渲染方式', [
      { value: 'guides', label: '参考线' },
      { value: 'paths', label: '路径线条' },
      { value: 'both', label: '参考线 + 路径' }
    ], compositionState.showAsGuides ? 'guides' : 'paths', function (v) {
      compositionState.showAsGuides = (v === 'guides' || v === 'both');
      compositionState.showAsPaths = (v === 'paths' || v === 'both');
    });
    optSection.appendChild(renderModeSelect.el);
    container.appendChild(optSection);

    // 应用
    container.appendChild(GM.createApplyButton('✦ 应用构图辅助线', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      var result = GM.Calculator.calculateComposition(compositionState.type, GM.currentDocInfo.width, GM.currentDocInfo.height);
      var promises = [];
      promises.push(GM.HostAdapter.clearComposition());

      if (compositionState.showAsGuides &&
        (compositionState.type === 'rule-of-thirds' || compositionState.type === 'golden-ratio' || compositionState.type === 'center-cross')) {
        var guides = [];
        result.lines.forEach(function (line) {
          if (line.x1 === line.x2) guides.push({ orientation: 'vertical', position: line.x1 });
          else if (line.y1 === line.y2) guides.push({ orientation: 'horizontal', position: line.y1 });
        });
        promises.push(GM.HostAdapter.addGuides(guides));
      }

      if (compositionState.type === 'diagonal' || compositionState.type === 'golden-spiral' || compositionState.showAsPaths) {
        promises.push(GM.HostAdapter.addCompositionLines(result.lines));
      }

      return Promise.all(promises).then(function () {
        GM.showToast('构图辅助线已应用', 'success');
      });
    }));
  };

})(DotGridMaster);
