/**
 * DotGuide CEP — 主入口
 * 负责：UI 构建、Tab 路由、键盘快捷键、文档监听、初始化
 *
 * 加载顺序（index.html）：
 *   CSInterface.js → themeManager.js →
 *   core.js → ui-components.js →
 *   panel-grid.js → panel-composition.js → panel-ecom.js →
 *   panel-print.js → panel-ui.js → panel-settings.js →
 *   undo-manager.js → performance-monitor.js → preset-manager.js →
 *   index.js
 *
 * BUG-7 修复: 移除 BatchProcessor 死代码
 */

(function () {
  'use strict';

  var GM = window.DotGuide;
  if (!GM) { console.error('DotGuide core.js not loaded'); return; }

  // ============================
  // 面板 UI 构建
  // ============================

  var _uiBuilt = false;

  function buildUI() {
    var root = document.getElementById('dotguide-root');
    if (!root) return;

    if (!_uiBuilt) {
      root.innerHTML = '';

      // 顶部标题栏
      var header = document.createElement('div');
      header.style.cssText =
        'padding:10px 12px;border-bottom:1px solid var(--gm-border-default);' +
        'display:flex;align-items:center;justify-content:space-between;';
      header.innerHTML =
        '<div style="font-size:13px;font-weight:600;">⊞ DotGuide <span style="font-size:9px;font-weight:400;color:var(--gm-text-secondary);">v1.0.1</span></div>' +
        '<div id="doc-info" style="font-size:10px;color:var(--gm-text-secondary);">未检测到文档</div>';
      root.appendChild(header);

      // Tab 栏
      var tabBar = document.createElement('div');
      tabBar.id = 'gm-tab-bar';
      tabBar.style.cssText =
        'display:flex;border-bottom:1px solid var(--gm-border-default);' +
        'padding:0 8px;gap:0;overflow-x:auto;';

      var tabDefs = [
        { id: 'grid', label: '网格' },
        { id: 'composition', label: '构图' },
        { id: 'ecom', label: '电商' },
        { id: 'print', label: '印刷' },
        { id: 'ui', label: 'UI' },
        { id: 'settings', label: '⚙' }
      ];

      tabDefs.forEach(function (tab) {
        var btn = document.createElement('button');
        btn.textContent = tab.label;
        btn.dataset.tab = tab.id;
        btn.className = 'gm-tab-btn';
        btn.style.cssText =
          'padding:8px 10px;font-size:11px;background:none;border:none;' +
          'border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;transition:all 0.15s;';

        btn.addEventListener('click', function () {
          switchTab(tab.id);
        });
        btn.addEventListener('mouseenter', function () {
          if (tab.id !== GM.currentTab) btn.style.color = 'var(--gm-text-primary)';
        });
        btn.addEventListener('mouseleave', function () {
          if (tab.id !== GM.currentTab) btn.style.color = 'var(--gm-text-secondary)';
        });

        tabBar.appendChild(btn);
      });
      root.appendChild(tabBar);

      // 内容区
      var content = document.createElement('div');
      content.id = 'panel-content';
      content.style.cssText = 'flex:1;overflow-y:auto;padding:12px;';

      var panels = [
        { id: 'grid', render: GM.renderGridPanel },
        { id: 'composition', render: GM.renderCompositionPanel },
        { id: 'ecom', render: GM.renderEcomPanel },
        { id: 'print', render: GM.renderPrintPanel },
        { id: 'ui', render: GM.renderUIPanel },
        { id: 'settings', render: GM.renderSettingsPanel }
      ];

      panels.forEach(function (p) {
        var wrapper = document.createElement('div');
        wrapper.dataset.panel = p.id;
        wrapper.style.display = 'none';
        if (p.render) p.render(wrapper);
        content.appendChild(wrapper);
      });
      root.appendChild(content);

      // 底部操作栏
      var footer = document.createElement('div');
      footer.style.cssText =
        'padding:8px 8px 10px 8px;border-top:1px solid var(--gm-border-default);' +
        'display:flex;gap:8px;flex-shrink:0;align-items:center;' +
        'margin:0 4px 6px 4px;';

      var undoBtn = document.createElement('button');
      undoBtn.id = 'btn-undo';
      undoBtn.textContent = '↩ 撤销';
      undoBtn.style.cssText =
        'flex:1;padding:7px 10px;border-radius:4px;' +
        'background:var(--gm-bg-tertiary);color:var(--gm-text-secondary);' +
        'font-size:11px;border:1px solid var(--gm-border-default);cursor:pointer;transition:all 0.15s;' +
        'white-space:nowrap;text-align:center;';
      undoBtn.addEventListener('mouseenter', function () { undoBtn.style.borderColor = 'var(--gm-accent-primary)'; undoBtn.style.color = 'var(--gm-accent-primary)'; });
      undoBtn.addEventListener('mouseleave', function () { undoBtn.style.borderColor = 'var(--gm-border-default)'; undoBtn.style.color = 'var(--gm-text-secondary)'; });
      undoBtn.addEventListener('click', function () {
        GM.HostAdapter.undo().then(function (r) {
          if (r && r.undone) GM.showToast('已撤销: ' + r.undone + ' (剩余' + r.remaining + '步)', 'info');
          else GM.showToast('没有可撤销的操作', 'warning');
        }).catch(function (e) { GM.showToast('撤销失败: ' + e.message, 'error'); });
      });
      footer.appendChild(undoBtn);

      var clearBtn = document.createElement('button');
      clearBtn.id = 'btn-clear-all';
      clearBtn.textContent = '✕ 清除全部';
      clearBtn.style.cssText =
        'flex:1;padding:7px 10px;border-radius:6px;' +
        'background:rgba(255,59,48,0.12);color:var(--gm-accent-danger);' +
        'font-size:11px;border:1px solid var(--gm-accent-danger);cursor:pointer;transition:all 0.15s;' +
        'white-space:nowrap;text-align:center;font-weight:500;' +
        'overflow:hidden;';
      clearBtn.addEventListener('mouseenter', function () { clearBtn.style.borderColor = 'var(--gm-accent-danger)'; clearBtn.style.background = 'rgba(255,59,48,0.1)'; });
      clearBtn.addEventListener('mouseleave', function () { clearBtn.style.borderColor = 'var(--gm-border-default)'; clearBtn.style.background = 'var(--gm-bg-tertiary)'; });
      clearBtn.addEventListener('click', function () {
        GM.HostAdapter.clearAll().then(function () {
          GM.showToast('已清除所有辅助线', 'success');
        }).catch(function (e) { GM.showToast('清除失败: ' + e.message, 'error'); });
      });
      footer.appendChild(clearBtn);
      root.appendChild(footer);

      _uiBuilt = true;
    }

    switchTab(GM.currentTab);
    GM.refreshDocInfo();
  }

  function switchTab(tabId) {
    GM.currentTab = tabId;

    var tabBtns = document.querySelectorAll('.gm-tab-btn');
    for (var i = 0; i < tabBtns.length; i++) {
      var btn = tabBtns[i];
      var isActive = btn.dataset.tab === tabId;
      btn.style.color = isActive ? 'var(--gm-accent-primary)' : 'var(--gm-text-secondary)';
      btn.style.borderBottomColor = isActive ? 'var(--gm-accent-primary)' : 'transparent';
    }

    var panels = document.querySelectorAll('#panel-content > div[data-panel]');
    for (var j = 0; j < panels.length; j++) {
      panels[j].style.display = panels[j].dataset.panel === tabId ? 'block' : 'none';
    }
  }

  // ============================
  // 键盘快捷键
  // ============================

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      if (GM.currentTab !== 'grid') switchTab('grid');
      var applyBtn = document.querySelector('#panel-content div[data-panel="grid"] button:last-of-type');
      if (applyBtn) applyBtn.click();
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      GM.HostAdapter.clearAll().then(function () { GM.showToast('已清除所有辅助线', 'success'); });
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key >= '1' && e.key <= '6') {
      e.preventDefault();
      var tabIds = ['grid', 'composition', 'ecom', 'print', 'ui', 'settings'];
      var idx = parseInt(e.key) - 1;
      if (tabIds[idx]) switchTab(tabIds[idx]);
    }
  });

  // ============================
  // 文档切换监听
  // ============================

  GM._csInterface.addEventListener('documentAfterActivate', function () {
    GM.refreshDocInfo();
  });

  GM._csInterface.addEventListener('documentAfterClose', function () {
    GM.currentDocInfo = null;
    var el = document.getElementById('doc-info');
    if (el) {
      el.textContent = '未检测到文档';
      el.style.color = 'var(--gm-accent-danger)';
    }
  });

  // ============================
  // 初始化 (BUG-7 修复: 移除 BatchProcessor.init())
  // ============================

  function init() {
    GM.PresetManager.init();
    buildUI();

    // 初始化系统模块
    if (typeof UndoManager !== 'undefined' && UndoManager.init) UndoManager.init();
    if (typeof PerfMonitor !== 'undefined' && PerfMonitor.setEnabled) PerfMonitor.setEnabled(false);
    // BatchProcessor 已移除 — 死代码，从未被实际调用

    // 初始化预览系统（默认关闭）
    var previewEnabled = GM.Storage.get('preview_enabled');
    GM.setPreviewEnabled(!!previewEnabled);

    setTimeout(GM.refreshDocInfo, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
