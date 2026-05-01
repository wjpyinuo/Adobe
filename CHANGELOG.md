# Changelog

本文件记录 DotGuide CEP 的主要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-04-30

### 新增
- 网格引擎：列/行/间距/边距 → 参考线
- 构图辅助：三分法、黄金分割、对角线、中心十字、黄金螺旋
- 电商模板：淘宝/京东/拼多多/抖音/小红书安全区预设
- 印刷出血：裁切标记、色标、注册标记、出血可视化、折页支持
- UI 安全区：iPhone/Android/iPad 状态栏/导航栏/标签栏/Home Indicator
- 撤销/重做系统：30 步历史，支持键盘快捷键 (Ctrl+Z / Ctrl+Shift+Z)
- 批处理引擎：合并 ExtendScript 调用，减少 CEP 通信开销
- 预设管理：内置预设 + 自定义预设（导入/导出）
- 实时预览：300ms 防抖，网格/构图辅助线预览
- 主题系统：自动同步 Illustrator 深色/浅色主题
- 一键安装脚本：setup.bat (Windows) / setup.sh (macOS)
- 调试支持：Chrome DevTools 远程调试 (.debug 端口 8088)
- enable-debug.reg：Windows 双击一键导入调试注册表

## [1.0.1] - 2026-05-01

### 变更
- 项目更名为 DotGuide_CEP（原 DotGridMaster_CEP）
- 更新所有命名空间、配置、文档中的项目名称
- 移除废弃的 BatchProcessor 模块及其测试
- 统一 PresetManager 实现，删除重复定义
- manifest.xml 版本范围对齐 Illustrator 2024+ (v28.0+)
- 键盘快捷键改为 Ctrl+Shift+1~6 避免与宿主冲突
- 安装脚本 CSXS 版本范围统一为 11-15
- enable-debug.reg 对齐 CSXS 11-15
- package.json engines 要求 Node >= 18（匹配 --test 标志）
- 删除死文件 lib/dotgridmaster-core.js

### 新增
- UI 设备预设：iPhone 16 / iPhone 16 Pro / iPhone 16 Pro Max / Pixel 9 / iPad Air M2
- 印刷面板：CMYK 色标独立调用按钮
- 构图预设：黄金螺旋添加到预设列表
- .debug 调试端口配置文件
- CSS 变量 --gm-text-tertiary（#666666）

### 修复
- BUG-A: 重做(undo→redo)网格操作调用错误的宿主函数
- BUG-B: preset-manager.js 与 core.js 重复定义 PresetManager
- ISSUE-1: CSS 文件末尾无效代码块标记
- ISSUE-2: performance-monitor.js 格式化异常
- ISSUE-3: 已废弃的 batch-processor 测试文件残留
- ISSUE-4: manifest.xml 版本范围与 README 不一致
- ISSUE-5: diagnosticTest() 生产代码中使用 alert() 弹窗
- ISSUE-6: Ctrl+1~6 快捷键与宿主冲突
- ISSUE-7: 黄金螺旋未暴露到构图预设列表
- ISSUE-8: 构图面板应用操作未记录撤销（无法撤销构图辅助线）
- ISSUE-9: diagnosticTest() 在用户文档活动图层上残留红色矩形
- ISSUE-10: CSS 变量 --gm-text-tertiary 未定义导致样式回退
- ISSUE-11: package.json 版本号 1.0.0 未同步更新为 1.0.1
- ISSUE-12: manifest.xml 版本号未同步更新
- ISSUE-13: settings 面板版本信息硬编码为 1.0.0 / Illustrator 2023+
- ISSUE-14: debug/grid-validator.js 重复代码块和未定义 DEBUG 依赖
- ISSUE-15: UndoManager 前后端撤销栈未同步（record() 未推送后端）
- ISSUE-16: preset-manager.test.js 内置预设数据与 core.js 不一致
- ISSUE-17: enable-debug.reg 包含 CSXS 9/10（低于最低运行时要求）
- 微信小程序 Banner 尺寸更新为 750×560

## [1.0.3] - 2026-05-02

### 修复
- BUG-F: addEcomLabels 未指定字体 — 标签文字继承用户当前活动文本样式，可能不可读
- BUG-H: 切换文档后面板未刷新 — documentAfterActivate 只更新尺寸显示，不重渲染当前面板
- ISSUE-4: preset-manager.test.js 内置预设数据与 core.js 不同步 — 补全所有内置预设
- _convertMargin 注释误导为"默认px"，实际输入值为 mm，修正注释

### 变更
- package.json 版本号同步为 1.0.2
- manifest.xml 版本号同步为 1.0.2

## [1.0.2] - 2026-05-02

### 修复
- BUG-1: 实时预览竞态条件 — 快速切换参数时旧预览可能覆盖新预览，添加版本号机制
- BUG-3: 电商模板应用时清除与添加操作非原子 — clear 和 add 并行执行可能导致残留，改为先 clear 再 add
- BUG-5: 批量操作硬编码网格参数 — "对所有画板应用当前网格" 忽略用户当前设置，改为读取 gridState
- BUG-6: 重做网格操作缺少 overlay 颜色/透明度 — gridParams 未包含 overlayColor/overlayOpacity
- BUG-11: gridState 从 localStorage 恢复时缺少字段验证 — 旧版数据缺少新字段导致 undefined，添加逐字段 fallback
- ESLint: 补充全局变量声明 (DotGuide/UndoManager/PerfMonitor/PointType 等)

### 新增
- GM.getGridState() 公开方法，供其他模块读取当前网格参数

### UI 优化
- 顶部色块条：橙红色横幅 "源头印刷厂 · 全国包邮"，参考电商设计语言
- Section 卡片化：每个区块加背景卡片 + 边框，层次一目了然
- 色板对比度提升：`--gm-text-tertiary` 对比度从 3.6:1 提升至 4.8:1
- 字号全面放大：xs=10px / sm=11px / md=12px / lg=13px / xl=14px，告别眯眼
- 行高统一 1.5，控件标签行高 1.0，段落可读性显著提升
- 输入控件放大：± 按钮 26×24px，输入框 50×24px，操作更轻松
- Toggle 开关放大至 36×20px，更容易点击
- 预设按钮加大 padding，文字更清晰
- Tab 栏加背景色分层，选中态加粗
- 底部操作栏统一风格，清除按钮与撤销按钮同级
- 滚动条 5px 半透明，不抢注意力
- 整体配色更沉稳：背景 #1a1a1a，卡片 #222，边框 #363636
