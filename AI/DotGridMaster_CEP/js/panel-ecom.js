/**
 * DotGridMaster Panel — 电商
 * 依赖：core.js, ui-components.js
 */

(function (GM) {
  'use strict';

  var ecomState = {
    selectedPlatform: null,
    selectedTemplate: null,
    safeZone: true,
    showLabels: true,
    labelColor: '#FF375F',
    safeZoneColor: '#FF6B00',
    safeZoneOpacity: 12
  };

  // ============================
  // 电商平台数据库
  // ============================

  var ECOM_PLATFORMS = {
    taobao: {
      name: '淘宝/天猫', icon: '🛒', color: '#FF4400',
      templates: [
        { id: 'tb-main-800', name: '主图 800×800', width: 800, height: 800, unit: 'px',
          safeZone: { top: 50, right: 50, bottom: 100, left: 50 },
          zones: [
            { name: '标题区', x: 50, y: 50, w: 700, h: 80, color: '#FF4400' },
            { name: '主体区', x: 100, y: 150, w: 600, h: 450, color: '#0D99FF' },
            { name: '价格/促销', x: 50, y: 620, w: 350, h: 80, color: '#FF375F' },
            { name: '卖点标签', x: 450, y: 620, w: 300, h: 80, color: '#34C759' }
          ], desc: '商品主图，搜索列表展示' },
        { id: 'tb-main-1500', name: '高清主图 1500×1500', width: 1500, height: 1500, unit: 'px',
          safeZone: { top: 80, right: 80, bottom: 160, left: 80 },
          zones: [
            { name: '标题区', x: 80, y: 80, w: 1340, h: 120, color: '#FF4400' },
            { name: '主体区', x: 150, y: 220, w: 1200, h: 900, color: '#0D99FF' },
            { name: '价格/促销', x: 80, y: 1160, w: 650, h: 120, color: '#FF375F' },
            { name: '卖点标签', x: 800, y: 1160, w: 620, h: 120, color: '#34C759' }
          ], desc: '高清主图，详情页展示' },
        { id: 'tb-detail-790', name: '详情页 790×不限', width: 790, height: 1200, unit: 'px',
          safeZone: { top: 30, right: 30, bottom: 30, left: 30 },
          zones: [
            { name: '首屏焦点', x: 30, y: 30, w: 730, h: 400, color: '#FF4400' },
            { name: '卖点区', x: 30, y: 450, w: 730, h: 300, color: '#0D99FF' },
            { name: '参数区', x: 30, y: 770, w: 730, h: 200, color: '#5856D6' },
            { name: '信任背书', x: 30, y: 990, w: 730, h: 180, color: '#34C759' }
          ], desc: '详情页长图，宽度固定790px' },
        { id: 'tb-banner', name: '店铺 Banner 1920×600', width: 1920, height: 600, unit: 'px',
          safeZone: { top: 40, right: 360, bottom: 40, left: 360 },
          zones: [
            { name: '核心内容区', x: 360, y: 40, w: 1200, h: 520, color: '#FF4400' },
            { name: '标题', x: 410, y: 100, w: 600, h: 100, color: '#0D99FF' },
            { name: '副标题', x: 410, y: 220, w: 500, h: 60, color: '#5856D6' },
            { name: 'CTA 按钮', x: 410, y: 340, w: 200, h: 60, color: '#34C759' },
            { name: '商品图', x: 900, y: 60, w: 500, h: 480, color: '#FF9500' }
          ], desc: '店铺首页横幅，注意两侧裁切' },
        { id: 'tb-video-cover', name: '主图视频封面 800×800', width: 800, height: 800, unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 120, left: 60 },
          zones: [
            { name: '视频播放按钮区', x: 300, y: 300, w: 200, h: 200, color: '#FF375F' },
            { name: '标题', x: 60, y: 60, w: 680, h: 70, color: '#0D99FF' },
            { name: '底部信息', x: 60, y: 680, w: 680, h: 60, color: '#34C759' }
          ], desc: '主图视频封面，中心留出播放按钮' }
      ]
    },
    jd: {
      name: '京东', icon: '🏪', color: '#E4002B',
      templates: [
        { id: 'jd-main-800', name: '主图 800×800', width: 800, height: 800, unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 110, left: 60 },
          zones: [
            { name: '品牌/标题', x: 60, y: 60, w: 680, h: 80, color: '#E4002B' },
            { name: '主体商品', x: 120, y: 160, w: 560, h: 440, color: '#0D99FF' },
            { name: '促销信息', x: 60, y: 620, w: 400, h: 70, color: '#FF375F' },
            { name: '角标位', x: 600, y: 60, w: 140, h: 50, color: '#FF9500' }
          ], desc: '京东商品主图' },
        { id: 'jd-sku', name: 'SKU图 800×800', width: 800, height: 800, unit: 'px',
          safeZone: { top: 80, right: 80, bottom: 80, left: 80 },
          zones: [
            { name: '商品居中', x: 150, y: 150, w: 500, h: 500, color: '#0D99FF' },
            { name: '色彩/规格标注', x: 80, y: 700, w: 640, h: 60, color: '#5856D6' }
          ], desc: 'SKU 属性图，白底为主' },
        { id: 'jd-detail-990', name: '详情页 990×不限', width: 990, height: 1400, unit: 'px',
          safeZone: { top: 40, right: 40, bottom: 40, left: 40 },
          zones: [
            { name: '首屏大图', x: 40, y: 40, w: 910, h: 500, color: '#E4002B' },
            { name: '核心卖点', x: 40, y: 560, w: 910, h: 350, color: '#0D99FF' },
            { name: '规格参数', x: 40, y: 930, w: 910, h: 250, color: '#5856D6' },
            { name: '品牌故事', x: 40, y: 1200, w: 910, h: 160, color: '#34C759' }
          ], desc: '京东详情页，宽度990px' }
      ]
    },
    pdd: {
      name: '拼多多', icon: '🍊', color: '#E02E24',
      templates: [
        { id: 'pdd-main', name: '主图 750×750', width: 750, height: 750, unit: 'px',
          safeZone: { top: 50, right: 50, bottom: 100, left: 50 },
          zones: [
            { name: '商品主体', x: 100, y: 80, w: 550, h: 450, color: '#0D99FF' },
            { name: '价格标签', x: 50, y: 560, w: 300, h: 80, color: '#E02E24' },
            { name: '促销角标', x: 550, y: 50, w: 150, h: 60, color: '#FF9500' },
            { name: '销量/评价', x: 400, y: 560, w: 300, h: 80, color: '#34C759' }
          ], desc: '拼多多商品主图' },
        { id: 'pdd-banner', name: '活动 Banner 1125×330', width: 1125, height: 330, unit: 'px',
          safeZone: { top: 20, right: 40, bottom: 20, left: 40 },
          zones: [
            { name: '活动标题', x: 40, y: 40, w: 500, h: 80, color: '#E02E24' },
            { name: '商品展示', x: 600, y: 20, w: 485, h: 290, color: '#0D99FF' },
            { name: '利益点', x: 40, y: 150, w: 400, h: 60, color: '#FF9500' },
            { name: 'CTA', x: 40, y: 230, w: 180, h: 50, color: '#34C759' }
          ], desc: '活动页横幅' }
      ]
    },
    douyin: {
      name: '抖音电商', icon: '🎵', color: '#000000',
      templates: [
        { id: 'dy-main', name: '商品主图 800×800', width: 800, height: 800, unit: 'px',
          safeZone: { top: 50, right: 50, bottom: 100, left: 50 },
          zones: [
            { name: '商品主体', x: 100, y: 80, w: 600, h: 480, color: '#0D99FF' },
            { name: '价格信息', x: 50, y: 600, w: 350, h: 80, color: '#FE2C55' },
            { name: '卖点文案', x: 430, y: 600, w: 320, h: 80, color: '#25F4EE' }
          ], desc: '抖音小店商品主图' },
        { id: 'dy-cover-9x16', name: '短视频封面 1080×1920', width: 1080, height: 1920, unit: 'px',
          safeZone: { top: 200, right: 120, bottom: 340, left: 60 },
          zones: [
            { name: '顶部状态栏留白', x: 0, y: 0, w: 1080, h: 130, color: '#333333' },
            { name: '核心内容', x: 60, y: 200, w: 900, h: 1000, color: '#0D99FF' },
            { name: '文案区', x: 60, y: 1250, w: 700, h: 200, color: '#FE2C55' },
            { name: '右侧互动栏', x: 960, y: 600, w: 80, h: 600, color: '#25F4EE' },
            { name: '底部操作栏', x: 0, y: 1700, w: 1080, h: 220, color: '#333333' }
          ], desc: '竖版短视频封面，注意右侧互动栏遮挡' }
      ]
    },
    xhs: {
      name: '小红书', icon: '📕', color: '#FF2442',
      templates: [
        { id: 'xhs-3x4', name: '笔记图 1080×1440 (3:4)', width: 1080, height: 1440, unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 200, left: 60 },
          zones: [
            { name: '主视觉', x: 60, y: 60, w: 960, h: 900, color: '#0D99FF' },
            { name: '文字排版区', x: 60, y: 1000, w: 960, h: 240, color: '#FF2442' },
            { name: '底部留白(交互)', x: 0, y: 1300, w: 1080, h: 140, color: '#333333' }
          ], desc: '小红书推荐比例 3:4' },
        { id: 'xhs-1x1', name: '正方形 1080×1080', width: 1080, height: 1080, unit: 'px',
          safeZone: { top: 60, right: 60, bottom: 160, left: 60 },
          zones: [
            { name: '主视觉', x: 60, y: 60, w: 960, h: 700, color: '#0D99FF' },
            { name: '文案区', x: 60, y: 800, w: 960, h: 120, color: '#FF2442' },
            { name: '底部留白', x: 0, y: 960, w: 1080, h: 120, color: '#333333' }
          ], desc: '正方形笔记图' },
        { id: 'xhs-cover', name: '封面图 1080×1440', width: 1080, height: 1440, unit: 'px',
          safeZone: { top: 100, right: 80, bottom: 250, left: 80 },
          zones: [
            { name: '标题区', x: 80, y: 100, w: 920, h: 200, color: '#FF2442' },
            { name: '核心画面', x: 80, y: 330, w: 920, h: 700, color: '#0D99FF' },
            { name: '副标题/标签', x: 80, y: 1060, w: 920, h: 100, color: '#5856D6' },
            { name: '底部安全区外', x: 0, y: 1200, w: 1080, h: 240, color: '#333333' }
          ], desc: '封面图，底部会被标题遮挡' }
      ]
    },
    wechat: {
      name: '微信', icon: '💬', color: '#07C160',
      templates: [
        { id: 'wx-moment-single', name: '朋友圈单图 1080×1080', width: 1080, height: 1080, unit: 'px',
          safeZone: { top: 40, right: 40, bottom: 40, left: 40 },
          zones: [{ name: '核心内容', x: 100, y: 100, w: 880, h: 880, color: '#0D99FF' }],
          desc: '朋友圈单图，正方形' },
        { id: 'wx-article-cover', name: '公众号封面 900×383', width: 900, height: 383, unit: 'px',
          safeZone: { top: 30, right: 60, bottom: 30, left: 60 },
          zones: [
            { name: '标题区', x: 60, y: 60, w: 500, h: 120, color: '#07C160' },
            { name: '配图区', x: 580, y: 30, w: 260, h: 323, color: '#0D99FF' },
            { name: '副标题', x: 60, y: 200, w: 400, h: 60, color: '#5856D6' }
          ], desc: '公众号首图，2.35:1 比例' },
        { id: 'wx-miniapp-banner', name: '小程序 Banner 750×400', width: 750, height: 400, unit: 'px',
          safeZone: { top: 20, right: 30, bottom: 20, left: 30 },
          zones: [
            { name: '核心内容', x: 30, y: 20, w: 690, h: 360, color: '#0D99FF' },
            { name: '文案', x: 50, y: 80, w: 350, h: 100, color: '#07C160' },
            { name: 'CTA', x: 50, y: 250, w: 160, h: 50, color: '#FF9500' }
          ], desc: '小程序首页轮播图' }
      ]
    }
  };

  // ============================
  // 渲染电商面板
  // ============================

  GM.renderEcomPanel = function (container) {
    // 平台选择
    var platformSection = GM.createSection('选择平台');
    var platformGrid = document.createElement('div');
    platformGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;';

    var platformKeys = Object.keys(ECOM_PLATFORMS);
    for (var pi = 0; pi < platformKeys.length; pi++) {
      (function (key) {
        var platform = ECOM_PLATFORMS[key];
        var isSelected = ecomState.selectedPlatform === key;

        var btn = document.createElement('div');
        btn.style.cssText =
          'display:flex;flex-direction:column;align-items:center;padding:8px 4px;' +
          'border-radius:4px;cursor:pointer;transition:all 0.15s;' +
          'background:' + (isSelected ? platform.color : 'var(--gm-bg-secondary)') + ';' +
          'border:1px solid ' + (isSelected ? platform.color : 'var(--gm-border-default)') + ';';

        var icon = document.createElement('div');
        icon.style.cssText = 'font-size:18px;margin-bottom:2px;';
        icon.textContent = platform.icon;

        var name = document.createElement('div');
        name.style.cssText = 'font-size:9px;color:' + (isSelected ? '#fff' : 'var(--gm-text-secondary)') + ';';
        name.textContent = platform.name;

        btn.appendChild(icon);
        btn.appendChild(name);

        btn.addEventListener('mouseenter', function () { if (!isSelected) btn.style.background = 'var(--gm-bg-tertiary)'; });
        btn.addEventListener('mouseleave', function () { if (!isSelected) btn.style.background = 'var(--gm-bg-secondary)'; });
        btn.addEventListener('click', function () {
          ecomState.selectedPlatform = key;
          ecomState.selectedTemplate = null;
          container.innerHTML = '';
          GM.renderEcomPanel(container);
        });

        platformGrid.appendChild(btn);
      })(platformKeys[pi]);
    }

    platformSection.appendChild(platformGrid);
    container.appendChild(platformSection);

    // 模板列表
    if (ecomState.selectedPlatform) {
      var platform = ECOM_PLATFORMS[ecomState.selectedPlatform];
      var templateSection = GM.createSection(platform.name + ' 模板');

      for (var ti = 0; ti < platform.templates.length; ti++) {
        (function (tpl) {
          var isSelected = ecomState.selectedTemplate && ecomState.selectedTemplate.id === tpl.id;

          var card = document.createElement('div');
          card.style.cssText =
            'display:flex;align-items:center;gap:8px;padding:8px;border-radius:4px;' +
            'cursor:pointer;margin-bottom:4px;transition:all 0.15s;' +
            'background:' + (isSelected ? 'var(--gm-accent-primary)' : 'var(--gm-bg-secondary)') + ';' +
            'border:1px solid ' + (isSelected ? 'var(--gm-accent-primary)' : 'var(--gm-border-default)') + ';';

          // 缩略图
          var thumb = document.createElement('canvas');
          var thumbScale = 40 / Math.max(tpl.width, tpl.height);
          thumb.width = Math.round(tpl.width * thumbScale);
          thumb.height = Math.round(tpl.height * thumbScale);
          thumb.style.cssText = 'border-radius:2px;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;';
          _drawEcomThumb(thumb, tpl);

          var info = document.createElement('div');
          info.style.cssText = 'flex:1;min-width:0;';

          var tplName = document.createElement('div');
          tplName.style.cssText = 'font-size:11px;font-weight:600;color:' + (isSelected ? '#fff' : 'var(--gm-text-primary)') + ';';
          tplName.textContent = tpl.name;

          var tplSize = document.createElement('div');
          tplSize.style.cssText = 'font-size:9px;margin-top:1px;color:' + (isSelected ? 'rgba(255,255,255,0.7)' : 'var(--gm-text-tertiary)') + ';';
          tplSize.textContent = tpl.width + '×' + tpl.height + tpl.unit + ' · ' + tpl.desc;

          info.appendChild(tplName);
          info.appendChild(tplSize);
          card.appendChild(thumb);
          card.appendChild(info);

          card.addEventListener('mouseenter', function () { if (!isSelected) card.style.background = 'var(--gm-bg-tertiary)'; });
          card.addEventListener('mouseleave', function () { if (!isSelected) card.style.background = 'var(--gm-bg-secondary)'; });
          card.addEventListener('click', function () {
            ecomState.selectedTemplate = tpl;
            container.innerHTML = '';
            GM.renderEcomPanel(container);
          });

          templateSection.appendChild(card);
        })(platform.templates[ti]);
      }
      container.appendChild(templateSection);
    }

    // 选中模板后的操作
    if (ecomState.selectedTemplate) {
      _renderEcomTemplateOptions(container, ecomState.selectedTemplate);
    }
  };

  // ============================
  // 模板选项 & 操作
  // ============================

  function _renderEcomTemplateOptions(container, tpl) {
    // Canvas 预览
    var previewSection = GM.createSection('模板预览');
    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:10px;';

    var canvas = document.createElement('canvas');
    var maxCanvasH = 180;
    var scale = maxCanvasH / Math.max(tpl.width, tpl.height);
    canvas.width = Math.round(tpl.width * scale);
    canvas.height = Math.round(tpl.height * scale);
    canvas.style.cssText = 'background:#1a1a1a;border-radius:4px;border:1px solid var(--gm-border-default);';
    _drawEcomPreview(canvas, tpl, ecomState);
    canvasWrap.appendChild(canvas);
    previewSection.appendChild(canvasWrap);

    // 区域图例
    var legend = document.createElement('div');
    legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;';
    for (var zi = 0; zi < tpl.zones.length; zi++) {
      var zone = tpl.zones[zi];
      var legendItem = document.createElement('div');
      legendItem.style.cssText = 'display:flex;align-items:center;gap:3px;';
      var dot = document.createElement('div');
      dot.style.cssText = 'width:8px;height:8px;border-radius:2px;background:' + zone.color + ';';
      var zoneName = document.createElement('span');
      zoneName.style.cssText = 'font-size:9px;color:var(--gm-text-tertiary);';
      zoneName.textContent = zone.name;
      legendItem.appendChild(dot);
      legendItem.appendChild(zoneName);
      legend.appendChild(legendItem);
    }
    previewSection.appendChild(legend);
    container.appendChild(previewSection);

    // 选项
    var optionsSection = GM.createSection('选项');

    var safeRow = document.createElement('div');
    safeRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var safeLabel = document.createElement('span');
    safeLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    safeLabel.textContent = '显示安全区域';
    safeRow.appendChild(safeLabel);
    safeRow.appendChild(GM.createToggleSwitch(ecomState.safeZone, function (v) { ecomState.safeZone = v; }));
    optionsSection.appendChild(safeRow);

    var labelRow = document.createElement('div');
    labelRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    var labelLabel = document.createElement('span');
    labelLabel.style.cssText = 'font-size:11px;color:var(--gm-text-secondary);';
    labelLabel.textContent = '显示区域标签';
    labelRow.appendChild(labelLabel);
    labelRow.appendChild(GM.createToggleSwitch(ecomState.showLabels, function (v) { ecomState.showLabels = v; }));
    optionsSection.appendChild(labelRow);
    container.appendChild(optionsSection);

    // 操作
    var actionsSection = GM.createSection('操作');
    var sizeHint = document.createElement('div');
    sizeHint.style.cssText = 'font-size:10px;color:var(--gm-text-tertiary);margin-bottom:8px;padding:6px;background:var(--gm-bg-tertiary);border-radius:3px;text-align:center;';

    if (GM.currentDocInfo) {
      var sizeMatch = GM.currentDocInfo.width === tpl.width && GM.currentDocInfo.height === tpl.height;
      if (sizeMatch) {
        sizeHint.textContent = '✓ 文档尺寸匹配 ' + tpl.width + '×' + tpl.height;
        sizeHint.style.color = '#34C759';
      } else {
        sizeHint.textContent = '⚠ 文档 ' + GM.currentDocInfo.width + '×' + GM.currentDocInfo.height + ' ≠ 模板 ' + tpl.width + '×' + tpl.height + '（将按比例缩放）';
        sizeHint.style.color = '#FF9500';
      }
    } else {
      sizeHint.textContent = '请先打开文档';
      sizeHint.style.color = 'var(--gm-accent-danger)';
    }
    actionsSection.appendChild(sizeHint);
    container.appendChild(actionsSection);

    // 应用按钮
    container.appendChild(GM.createApplyButton('✦ 应用电商辅助线', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      GM.Units.checkUnit('px', '电商模板');
      return _applyEcomTemplate(tpl, ecomState);
    }));

    // 仅安全区域
    var safeOnlyBtn = document.createElement('button');
    safeOnlyBtn.textContent = '🛡 仅应用安全区域';
    safeOnlyBtn.style.cssText =
      'width:100%;padding:7px;border-radius:4px;font-size:11px;margin-top:4px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';
    safeOnlyBtn.addEventListener('mouseenter', function () { safeOnlyBtn.style.borderColor = '#FF9500'; safeOnlyBtn.style.color = '#FF9500'; });
    safeOnlyBtn.addEventListener('mouseleave', function () { safeOnlyBtn.style.borderColor = 'var(--gm-border-default)'; safeOnlyBtn.style.color = 'var(--gm-text-secondary)'; });
    safeOnlyBtn.addEventListener('click', function () {
      if (!GM.currentDocInfo) { GM.showToast('请先打开文档', 'warning'); return; }
      _applyEcomSafeZoneOnly(tpl);
    });
    container.appendChild(safeOnlyBtn);

    // 新建文档
    var newDocBtn = document.createElement('button');
    newDocBtn.textContent = '📄 以此尺寸新建文档';
    newDocBtn.style.cssText =
      'width:100%;padding:7px;border-radius:4px;font-size:11px;margin-top:4px;' +
      'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
      'border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;';
    newDocBtn.addEventListener('mouseenter', function () { newDocBtn.style.borderColor = 'var(--gm-accent-primary)'; newDocBtn.style.color = 'var(--gm-accent-primary)'; });
    newDocBtn.addEventListener('mouseleave', function () { newDocBtn.style.borderColor = 'var(--gm-border-default)'; newDocBtn.style.color = 'var(--gm-text-secondary)'; });
    newDocBtn.addEventListener('click', function () {
      GM.HostAdapter.createDocument(tpl.width, tpl.height, tpl.name).then(function () {
        GM.showToast('已创建 ' + tpl.width + '×' + tpl.height + ' 文档', 'success');
        GM.refreshDocInfo();
      }).catch(function (err) { GM.showToast('创建文档失败: ' + err.message, 'error'); });
    });
    container.appendChild(newDocBtn);
  }

  // ============================
  // 应用逻辑
  // ============================

  function _applyEcomTemplate(tpl, state) {
    if (!GM.currentDocInfo) return Promise.reject(new Error('No document'));
    var scaleX = GM.currentDocInfo.width / tpl.width;
    var scaleY = GM.currentDocInfo.height / tpl.height;
    var promises = [];

    // 安全区域参考线
    if (state.safeZone && tpl.safeZone) {
      var sz = tpl.safeZone;
      promises.push(GM.HostAdapter.addGuides([
        { orientation: 'horizontal', position: sz.top * scaleY },
        { orientation: 'horizontal', position: GM.currentDocInfo.height - sz.bottom * scaleY },
        { orientation: 'vertical', position: sz.left * scaleX },
        { orientation: 'vertical', position: GM.currentDocInfo.width - sz.right * scaleX }
      ]));
      promises.push(GM.HostAdapter.addEcomZones(_calculateSafeZoneRects(
        GM.currentDocInfo.width, GM.currentDocInfo.height,
        { top: sz.top * scaleY, right: sz.right * scaleX, bottom: sz.bottom * scaleY, left: sz.left * scaleX }
      ), state.safeZoneColor, state.safeZoneOpacity));
    }

    // 功能区域
    var zoneRects = [], zoneLabels = [];
    for (var i = 0; i < tpl.zones.length; i++) {
      var zone = tpl.zones[i];
      var zx = zone.x * scaleX, zy = zone.y * scaleY;
      var zw = zone.w * scaleX, zh = zone.h * scaleY;
      zoneRects.push({ x: zx, y: zy, width: zw, height: zh, color: zone.color, opacity: 6, strokeColor: zone.color, strokeWidth: 0.5, name: zone.name });
      if (state.showLabels) zoneLabels.push({ text: zone.name, x: zx + 4, y: zy + 12, size: 8, color: zone.color });
    }
    if (zoneRects.length > 0) promises.push(GM.HostAdapter.addEcomFunctionZones(zoneRects));
    if (zoneLabels.length > 0) promises.push(GM.HostAdapter.addEcomLabels(zoneLabels));

    return Promise.all(promises).then(function () {
      GM.showToast('电商模板已应用: ' + tpl.name, 'success');
    }).catch(function (err) { GM.showToast('应用失败: ' + err.message, 'error'); });
  }

  function _applyEcomSafeZoneOnly(tpl) {
    if (!GM.currentDocInfo || !tpl.safeZone) return;
    var scaleX = GM.currentDocInfo.width / tpl.width;
    var scaleY = GM.currentDocInfo.height / tpl.height;
    var sz = tpl.safeZone;
    GM.HostAdapter.addGuides([
      { orientation: 'horizontal', position: sz.top * scaleY },
      { orientation: 'horizontal', position: GM.currentDocInfo.height - sz.bottom * scaleY },
      { orientation: 'vertical', position: sz.left * scaleX },
      { orientation: 'vertical', position: GM.currentDocInfo.width - sz.right * scaleX }
    ]).then(function () { GM.showToast('安全区域参考线已应用', 'success'); })
    .catch(function (err) { GM.showToast('应用失败: ' + err.message, 'error'); });
  }

  function _calculateSafeZoneRects(docW, docH, margins) {
    return [
      { x: 0, y: 0, w: docW, h: margins.top, name: 'SafeZone_Top' },
      { x: 0, y: docH - margins.bottom, w: docW, h: margins.bottom, name: 'SafeZone_Bottom' },
      { x: 0, y: margins.top, w: margins.left, h: docH - margins.top - margins.bottom, name: 'SafeZone_Left' },
      { x: docW - margins.right, y: margins.top, w: margins.right, h: docH - margins.top - margins.bottom, name: 'SafeZone_Right' }
    ];
  }

  // ============================
  // Canvas 绘制
  // ============================

  function _drawEcomThumb(canvas, tpl) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var sx = w / tpl.width, sy = h / tpl.height;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < tpl.zones.length; i++) {
      var z = tpl.zones[i];
      ctx.fillStyle = z.color;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(z.x * sx, z.y * sy, z.w * sx, z.h * sy);
    }
    ctx.globalAlpha = 1;
    if (tpl.safeZone) {
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 1]);
      ctx.strokeRect(
        tpl.safeZone.left * sx, tpl.safeZone.top * sy,
        (tpl.width - tpl.safeZone.left - tpl.safeZone.right) * sx,
        (tpl.height - tpl.safeZone.top - tpl.safeZone.bottom) * sy
      );
      ctx.setLineDash([]);
    }
  }

  function _drawEcomPreview(canvas, tpl, state) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var sx = w / tpl.width, sy = h / tpl.height;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    if (state.safeZone && tpl.safeZone) {
      var sz = tpl.safeZone;
      ctx.fillStyle = 'rgba(255,107,0,0.08)';
      ctx.fillRect(0, 0, w, sz.top * sy);
      ctx.fillRect(0, h - sz.bottom * sy, w, sz.bottom * sy);
      ctx.fillRect(0, sz.top * sy, sz.left * sx, h - sz.top * sy - sz.bottom * sy);
      ctx.fillRect(w - sz.right * sx, sz.top * sy, sz.right * sx, h - sz.top * sy - sz.bottom * sy);
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(sz.left * sx, sz.top * sy, (tpl.width - sz.left - sz.right) * sx, (tpl.height - sz.top - sz.bottom) * sy);
      ctx.setLineDash([]);
    }

    for (var i = 0; i < tpl.zones.length; i++) {
      var zone = tpl.zones[i];
      var zx = zone.x * sx, zy = zone.y * sy, zw = zone.w * sx, zh = zone.h * sy;
      ctx.fillStyle = zone.color;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(zx, zy, zw, zh);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(zx + 0.5, zy + 0.5, zw - 1, zh - 1);
      if (state.showLabels && zw > 30 && zh > 15) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = zone.color;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(zone.name, zx + 3, zy + 10);
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tpl.width + '×' + tpl.height, w / 2, h - 4);
  }

})(DotGridMaster);
