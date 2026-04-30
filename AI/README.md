# GridMaster CEP — Illustrator 插件

> 从 UXP 架构切换到 CEP 架构，适配 Illustrator 2024+

---

## 一、背景：为什么切换到 CEP

| 宿主 | UXP 支持 | 说明 |
|------|---------|------|
| Photoshop | ✅ 完整 | 原生 UXP 面板、完整 API |
| Illustrator | ⚠️ 极其有限 | AI 2024 仅支持 UXP 脚本，**不支持 UXP 面板** |
| InDesign | ⚠️ 有限 | 类似 AI 的状态 |

**结论：Illustrator 插件应使用 CEP（Common Extensibility Platform），不是 UXP。**

### CEP vs UXP 架构差异

```
UXP:  前端 → 受限 HTML/CSS/JS  |  后端 → UXP API 直接调用宿主
CEP:  前端 → Chrome 内嵌浏览器  |  后端 → ExtendScript (.jsx) 通过 CSInterface 桥接
```

---

## 二、项目结构

```
gridmaster-cep/
├── CSXS/
│   └── manifest.xml              ← CEP 清单（宿主兼容性、面板尺寸、CEF 参数）
├── .debug                        ← 开发调试端口配置（ILST:8088, PHXS:8089）
├── index.html                    ← 面板入口 HTML
├── setup.bat                     ← Windows 一键安装脚本
├── setup.sh                      ← macOS 一键安装脚本
│
├── css/
│   └── style.css                 ← CSS 变量主题系统（暗色/亮色自适应）
│
├── js/
│   ├── CSInterface.js            ← Adobe 官方桥接库（需手动下载或 setup 脚本获取）
│   ├── themeManager.js           ← 宿主主题同步（读取 AI/PS 皮肤色更新 CSS 变量）
│   ├── index.js                  ← 前端主逻辑（已集成所有 P0/P1 补丁，1,969 行）
│   ├── golden-spiral.js          ← P1: 黄金螺旋贝塞尔曲线
│   ├── color-picker.js           ← P1: 颜色选择器组件
│   ├── preview-system.js         ← P1: 实时预览系统
│   ├── ecom-templates.js         ← P2: 电商模板引擎（淘宝/京东/拼多多/抖音/小红书）
│   ├── print-panel.js            ← P2: 印刷出血面板
│   ├── undo-manager.js           ← P3: 撤销/重做系统（命令模式）
│   ├── batch-processor.js        ← P3: 批处理引擎
│   ├── performance-monitor.js    ← P3: 性能监控面板
│   ├── preset-manager.js         ← P3: 预设管理系统（导入/导出）
│   └── enhanced-grid-panel.js    ← P1: 增强版网格面板（参考代码）
│
├── jsx/
│   ├── hostscript.jsx            ← ExtendScript 宿主脚本（基础版）
│   ├── hostscript-complete.jsx   ← ExtendScript 宿主脚本（P0 完整版，含撤销+JSON polyfill）
│   ├── undo-wrapper.jsx          ← P0: 撤销系统包装器（合并到 hostscript.jsx）
│   ├── preview-layer.jsx         ← P1: 预览图层支持（追加到 hostscript.jsx）
│   └── print-marks.jsx           ← P2: 印刷标记支持（追加到 hostscript.jsx）
│
├── debug/
│   ├── grid-validator.js         ← 网格计算验证器
│   ├── composition-validator.js  ← 构图辅助线验证器
│   ├── undo-state-monitor.js     ← 撤销栈状态监控
│   ├── batch-queue-diag.js       ← 批处理队列诊断
│   └── batch-injection-fix.js    ← 批处理脚本注入修复
│
├── icons/                        ← 图标目录（SVG/PNG）
└── lib/                          ← 第三方库目录
    └── gridmaster-core.js        ← @gridmaster/core 打包产物（需自行打包）
```

---

## 三、快速开始

### 1. 环境配置

**Windows：**
```cmd
setup.bat
```

**macOS：**
```bash
chmod +x setup.sh
./setup.sh
```

脚本自动完成：
1. 设置 CEP 开发模式（`PlayerDebugMode=1`）
2. 下载 `CSInterface.js`
3. 创建图标占位
4. 安装到 CEP 扩展目录

### 2. 重启 Illustrator

菜单：**窗口 → 扩展 → GridMaster**

### 3. 调试

Chrome 浏览器访问 `http://localhost:8088` 即可 DevTools 调试面板。

---

## 四、功能模块与优先级

### P0 — 必须有才能正常运行

| 模块 | 说明 |
|------|------|
| CSInterface.js | Adobe 官方桥接库 |
| 撤销支持 | `undo-wrapper.jsx` → 合并到 `hostscript.jsx` |
| 完整版宿主脚本 | `hostscript-complete.jsx`（含 JSON polyfill + 撤销） |
| 键盘快捷键 | Ctrl+Z 撤销、Ctrl+Y 重做 |
| 底部操作栏 | Undo / Redo / Clear All 按钮 |

### P1 — 体验关键

| 模块 | 说明 |
|------|------|
| 网格覆盖层可视化 | Canvas 覆盖层绘制（列/行高亮、间距标注） |
| 黄金螺旋弧线 | 贝塞尔曲线版黄金螺旋路径 |
| 颜色选择器 | HSL 色盘 + 滑块 + 预设色板 |
| 实时预览系统 | Canvas 预览层，300ms 防抖刷新 |
| 增强版构图面板 | 集成螺旋 + 颜色选择器 + 预览 |
| 增强版网格面板 | 集成覆盖层 + 颜色选择器 + 预览 |

### P2 — 功能扩展

| 模块 | 说明 |
|------|------|
| 电商模板引擎 | 5 平台模板（淘宝/京东/拼多多/抖音/小红书） |
| 印刷出血面板 | 出血设置、裁切标记、色标、注册标记 |

### P3 — 系统集成与性能优化

| 模块 | 说明 |
|------|------|
| 撤销/重做系统 | 命令模式，状态快照，20 步历史 |
| 批处理引擎 | 队列管理、进度回调、错误恢复、画板遍历 |
| 性能监控面板 | 执行时间统计、内存使用、调用次数 |
| 预设管理系统 | 导入/导出 JSON、云同步准备 |

---

## 五、内置预设

### 网格预设
- 12 列网格、6 列网格、3 列网格、4×4 网格

### 构图预设
- 三分法、黄金分割、对角线、中心十字

### 电商模板
- 淘宝主图 800×800、京东主图 800×800、拼多多主图 750×750
- 抖音商品图 800×800、小红书封面 1080×1440

### 印刷预设
- A4 (210×297mm)、A3 (297×420mm)、名片 (90×54mm)
- 海报 B2 (515×728mm)、三折页 (297×210mm)

### UI 设备预设
- iPhone 15 (393×852)、iPhone 15 Pro Max (430×932)
- Android 通用 (360×800)、iPad Pro 11" (834×1194)

---

## 六、技术架构

```
┌──────────────────────────────────────────────────────────┐
│                    GridMaster CEP                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  CSInterface.evalScript()  ┌─────────┐│
│  │ 前端 (CEF)    │ ◄───────────────────────► │ 宿主引擎 ││
│  │ HTML/CSS/JS   │                           │ExtendScript│
│  └───────┬──────┘                           └─────┬───┘│
│          │                                        │     │
│  ┌───────┴──────┐                          ┌──────┴───┐│
│  │ index.js      │                          │hostscript││
│  │ ├ HostAdapter │                          │ ├ 参考线  ││
│  │ ├ Calculator  │                          │ ├ 覆盖层  ││
│  │ ├ PresetMgr   │                          │ ├ 构图线  ││
│  │ ├ UndoManager │                          │ ├ 印刷标记││
│  │ ├ BatchProc   │                          │ ├ 电商模板││
│  │ └ UI Builder  │                          │ └ 撤销支持││
│  └──────────────┘                          └──────────┘│
└──────────────────────────────────────────────────────────┘
```

### 通信流程

```
用户操作 → index.js (前端)
  → Calculator.calculateGrid() (前端计算)
  → HostAdapter.addGuides() (桥接调用)
    → CSInterface.evalScript("addGuides('...')")
      → ExtendScript 执行 (宿主)
        → AI 文档操作
          → 返回 JSON 结果
```

---

## 七、CEP 关键配置

### manifest.xml 要点

| 配置项 | 说明 |
|--------|------|
| `HostList` | 宿主兼容性：ILST (Illustrator 27+) / PHXS / PHSP |
| `CEFCommandLine` | `--enable-nodejs` + `--mixed-context` |
| `UI.Geometry` | 默认 280×600，最小 260×400，最大 400×1200 |
| `Lifecycle.AutoVisible` | 启动时自动显示面板 |

### 开发模式（绕过签名验证）

**Windows 注册表：**
```
HKCU\SOFTWARE\Adobe\CSXS.11 → PlayerDebugMode = "1"
```

**macOS 终端：**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

---

## 八、调试指南

### Chrome DevTools 远程调试

1. 确保 `.debug` 文件中端口已配置（ILST:8088）
2. 重启 Illustrator，打开插件面板
3. Chrome 访问 `http://localhost:8088`
4. 点击面板链接进入 DevTools

### ExtendScript 调试

- **Windows**: 使用 ESTK (ExtendScript Toolkit) 或 VSCode + ExtendScript 调试插件
- **macOS**: `File > Scripts > Open Script Editor`

### 全局调试开关

在 `js/index.js` 顶部添加：
```javascript
var DEBUG = true;
function debugLog() { if (DEBUG) console.log.apply(console, arguments); }
```

---

## 九、打包发布

### 生成 .zxp

```bash
# 1. 安装 ZXPSignCmd
# 2. 创建自签名证书
ZXPSignCmd -selfSignedCert CN "GridMaster" OU "Dev" O "GridMaster" \
  -country CN -validityYears 10 cert.p12 password

# 3. 打包
ZXPSignCmd -sign gridmaster-cep gridmaster-cep.zxp cert.p12 password
```

### 打包前检查清单

- [ ] 删除 `.debug` 文件
- [ ] 删除 `debug/` 目录
- [ ] 确认 `manifest.xml` 版本号正确
- [ ] 确认所有图标文件存在
- [ ] 测试所有功能正常

---

## 十、文件编码说明

> ⚠️ 文档中部分代码出现 `中断对接处` 标记，表示该处代码在源文档中被分段展示。
> 已尽可能合并，使用时如有问题请参考源文档对应章节。

---

*基于 GridMaster CEP 技术方案文档整理*
