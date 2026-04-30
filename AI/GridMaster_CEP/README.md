# GridMaster CEP — Illustrator 插件

> 从 UXP 架构切换到 CEP 架构，适配 Illustrator 2024+
>
> 📂 仓库路径：`AI/GridMaster_CEP/`

---

## 效果预览

<!-- TODO: 替换为实际截图 -->
<!-- ![网格面板](docs/screenshots/grid-panel.png) -->
<!-- ![构图辅助](docs/screenshots/composition.png) -->
<!-- ![电商模板](docs/screenshots/ecom-template.png) -->
<!-- ![印刷标记](docs/screenshots/print-marks.png) -->

---

## 一、背景

| 宿主 | UXP 支持 | 说明 |
|------|---------|------|
| Photoshop | ✅ 完整 | 原生 UXP 面板、完整 API |
| Illustrator | ⚠️ 极其有限 | AI 2024 仅支持 UXP 脚本，**不支持 UXP 面板** |

**结论：Illustrator 插件应使用 CEP，不是 UXP。**

---

## 二、项目结构

```
gridmaster-cep/
├── CSXS/
│   └── manifest.xml              ← CEP 清单（仅 Illustrator）
├── .debug                        ← 调试端口（ILST:8088）
├── index.html                    ← 面板入口（脚本加载顺序）
├── setup.bat / setup.sh          ← 一键安装脚本
├── package.json                  ← 项目配置 & lint 脚本
├── .eslintrc.json                ← ESLint 规则
│
├── css/
│   └── style.css                 ← 主题系统（CSS 变量）
│
├── js/
│   ├── CSInterface.js            ← Adobe 桥接库（需下载，见下方说明）
│   ├── themeManager.js           ← 宿主主题同步
│   ├── core.js                   ← 核心基础设施（命名空间、桥接、计算引擎、预设、存储）
│   ├── ui-components.js          ← 通用 UI 组件工厂
│   ├── panel-grid.js             ← 网格面板
│   ├── panel-composition.js      ← 构图面板
│   ├── panel-ecom.js             ← 电商面板（含平台数据库）
│   ├── panel-print.js            ← 印刷出血面板
│   ├── panel-ui.js               ← UI 设备安全区面板
│   ├── panel-settings.js         ← 设置面板
│   ├── undo-manager.js           ← 撤销/重做系统
│   ├── batch-processor.js        ← 批处理引擎
│   ├── performance-monitor.js    ← 性能监控
│   ├── preset-manager.js         ← 预设管理
│   └── index.js                  ← 主入口（UI 构建、Tab 路由、初始化）
│
├── jsx/
│   ├── hostscript.jsx            ← ExtendScript 宿主脚本（41 个函数）
│   └── print-marks.jsx           ← 印刷标记
│
├── icons/
│   ├── icon-light.svg            ← 亮色主题图标
│   └── icon-dark.svg             ← 暗色主题图标
│
├── debug/                        ← 调试工具
├── docs/
│   ├── debug-manual.md           ← 调试手册
│   └── index-html-complete.html  ← 完整版 HTML 参考
└── README.md
```

---

## 三、快速开始

### 1. CSInterface.js

已内置，无需额外操作。

如需更新到最新版本，可从 https://github.com/Adobe-CEP/CEP-Resources 下载 `CEP_11.x/CSInterface.js` 覆盖 `js/CSInterface.js`。

### 2. 重启 Illustrator

菜单：**窗口 → 扩展 → GridMaster**

### 3. 调试

Chrome 访问 `http://localhost:8088`

### 4. 开发（可选）

```bash
cd AI
npm install
npm run lint        # 检查代码规范
npm run lint -- --fix  # 自动修复
```

---

## 四、功能模块

| 模块 | 文件 | 说明 |
|------|------|------|
| 网格引擎 | `panel-grid.js` | 列/行/间距/边距 → 参考线 |
| 构图辅助 | `panel-composition.js` | 三分法/黄金分割/对角线/螺旋 |
| 电商模板 | `panel-ecom.js` | 淘宝/京东/拼多多/抖音/小红书/微信安全区 |
| 印刷出血 | `panel-print.js` | 裁切标记/色标/注册标记/出血可视化 |
| UI 安全区 | `panel-ui.js` | iPhone/Android/iPad 状态栏/导航栏/标签栏 |
| 撤销/重做 | `undo-manager.js` | 30 步历史，命令模式 |
| 批处理 | `batch-processor.js` | 合并 ExtendScript 调用，减少通信开销 |
| 预设管理 | `preset-manager.js` | 内置 + 自定义预设，支持导入/导出 |

---

## 五、开发模式

**Windows 注册表：**
```
HKCU\SOFTWARE\Adobe\CSXS.11 → PlayerDebugMode = "1"
```

**macOS：**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

---

## 六、打包发布

```bash
ZXPSignCmd -sign gridmaster-cep gridmaster-cep.zxp cert.p12 password
```

打包前：删除 `.debug` 和 `debug/` 目录。

---

*基于 GridMaster CEP 技术方案文档整理*
