# Changelog

本文件记录 DotGridMaster CEP 的主要变更。

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
- 项目更名为 DotGridMaster_CEP（原 GridMaster_CEP）
- 更新所有命名空间、配置、文档中的项目名称
