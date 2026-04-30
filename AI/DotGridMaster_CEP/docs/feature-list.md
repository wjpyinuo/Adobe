# DotGridMaster CEP 插件 — 完整功能清单

---

## 一、网格引擎

| 功能 | 说明 |
|------|------|
| 自定义网格生成 | 列数、行数、水平间距、垂直间距、四边边距 |
| 网格覆盖层可视化 | 色块覆盖（颜色可选、透明度可调 1-50%） |
| 基础网格叠加 | 在覆盖层下方绘制参考线网格 |
| 网格预设 | 12 列、6 列、3 列、4×4 |
| 自定义预设保存 | 保存/删除用户自定义网格预设 |

---

## 二、构图辅助线

| 功能 | 说明 |
|------|------|
| 三分法 | 两横两竖 4 条线 |
| 黄金分割 | 基于 φ (1.618) 的 4 条线 |
| 对角线 | 画板两条对角线 |
| 中心十字 | 水平+垂直中线 |
| 黄金螺旋 | 贝塞尔曲线弧线路径 |
| 构图线颜色 | 自定义颜色 |
| 构图线样式 | 实线/虚线可选 |

---

## 三、电商模板引擎（5 平台 20+ 模板）

### 平台模板

| 平台 | 模板 |
|------|------|
| **淘宝/天猫** | 主图 800×800、高清主图 1500×1500、详情页 790×不限、店铺 Banner 1920×600、主图视频封面 800×800 |
| **京东** | 主图 800×800、SKU 图 800×800、详情页 990×不限 |
| **拼多多** | 主图 750×750、Banner 1000×375 |
| **抖音** | 商品主图 800×800 |
| **小红书** | 封面 1080×1440 |

### 电商功能

- 安全区域绘制（半透明覆盖层）
- 功能区域标注（标题区/主体区/价格区/卖点区）
- 文字标签（区域名称标注）
- 仅应用安全区（不添加覆盖层）
- 缩略图预览（Canvas 绘制）
- 实时预览（防抖 300ms）

---

## 四、印刷出血面板

| 功能 | 说明 |
|------|------|
| 出血设置 | 上/下/左/右独立设置，支持链接锁定 |
| 裁切标记 | 四角 L 型标记 |
| 注册标记 | 十字套准标记 |
| 色标 | CMYK 标准色条 |
| 折线 | 自定义折线位置 |
| 书脊宽度 | 胶装/精装书脊计算 |
| 印刷预设 | A4、A3、名片、B2 海报、三折页 |

---

## 五、UI 设备辅助

| 设备 | 尺寸 |
|------|------|
| iPhone 15 | 393×852 |
| iPhone 15 Pro Max | 430×932 |
| Android 通用 | 360×800 |
| iPad Pro 11" | 834×1194 |

包含状态栏、导航栏、标签栏、Home 指示器安全区标注。

---

## 六、撤销/重做系统

| 功能 | 说明 |
|------|------|
| 操作记录 | 最多 30 步历史 |
| 撤销 | Ctrl+Z 或点击按钮 |
| 操作类型追踪 | guides / overlays / composition / printmarks / all |
| 栈状态查询 | 前端可查询剩余步数 |

---

## 七、批处理引擎

| 功能 | 说明 |
|------|------|
| 调用合并 | 将多次 evalScript 合并为单次执行 |
| 队列管理 | 16ms 延迟（60fps 一帧） |
| 进度回调 | 实时进度通知 |
| 错误恢复 | 失败自动重试 |

---

## 八、性能监控

| 指标 | 说明 |
|------|------|
| 执行时间 | 每次宿主调用耗时统计 |
| 调用次数 | 函数调用频率 |
| 内存使用 | ExtendScript 堆内存 |

---

## 九、预设管理

| 功能 | 说明 |
|------|------|
| 内置预设 | 网格/构图/电商/印刷/UI 共 20+ 个 |
| 自定义预设 | 保存/删除用户预设 |
| 导入/导出 | JSON 格式 |
| localStorage 持久化 | CEP 本地存储 |

---

## 十、系统功能

| 功能 | 说明 |
|------|------|
| 主题同步 | 自动读取 AI/PS 暗色/亮色主题并同步 CSS 变量 |
| 文档信息 | 显示当前画板尺寸、名称、单位 |
| 多画板支持 | 获取所有画板列表、切换活动画板 |
| 一键清除 | 清除所有 DotGridMaster 创建的内容 |
| 健康检查 | 验证宿主连接状态 |
| Toast 提示 | 操作反馈（成功/错误/警告/信息） |
| 键盘快捷键 | Ctrl+Z 撤销 |
| 实时预览 | 网格/构图辅助线 Canvas 预览 |
| 自动创建文档 | 电商模板可一键创建对应尺寸文档 |

---

## 十一、宿主脚本能力（41 个 ExtendScript 函数）

### 文档操作
- `getDocumentInfo` — 获取当前文档/画板信息
- `createDocument` — 创建新文档
- `getAllArtboards` — 获取所有画板列表
- `setActiveArtboard` — 切换活动画板

### 参考线
- `addGuides` — 批量添加参考线
- `clearAllGuides` — 清除所有参考线
- `_clearDotGridMasterGuides` — 仅清除 DotGridMaster 创建的参考线

### 覆盖层
- `addOverlays` — 添加半透明色块覆盖层
- `clearOverlays` — 清除覆盖层

### 构图线
- `addCompositionLines` — 添加构图辅助线
- `addSpiralPath` — 绘制螺旋曲线路径
- `clearComposition` — 清除构图辅助线

### 印刷标记
- `addPrintMarks` — 添加裁切标记
- `clearPrintMarks` — 清除裁切标记
- `applyPrintMarks` — 应用完整印刷标记（裁切+注册+色标）
- `_addRegistrationMarks` — 绘制注册标记
- `addColorBar` — 绘制 CMYK 色标

### 网格覆盖
- `addGridOverlay` — 添加网格色块覆盖层
- `clearGridOverlay` — 清除网格覆盖层
- `addBaseGrid` — 添加基础参考线网格
- `clearBaseGrid` — 清除基础网格

### 电商区域
- `addEcomZones` — 绘制电商安全区域
- `addEcomLabels` — 添加区域文字标签
- `addEcomFunctionZones` — 绘制功能区域标注

### 预览
- `addPreviewLines` — 添加预览线条（轻量级）
- `clearPreviewLayer` — 清除预览图层

### 撤销
- `undoDotGridMaster` — 撤销上一次操作
- `getUndoState` — 获取撤销栈状态
- `_pushUndoRecord` — 记录操作到撤销栈

### 工具函数
- `healthCheck` — 宿主连接健康检查
- `jsonStringify` / `_jsonStringify` — JSON 序列化（ExtendScript 兼容）
- `hexToRGB` — 十六进制颜色转 RGB
- `makeRGBColor` — 创建 RGBColor 对象
- `getActiveArtboardRect` — 获取当前画板矩形

### 图层管理
- `getOrCreateLayer` — 获取或创建命名图层
- `clearLayerContents` — 清空图层内容
- `_removeLayerByName` — 按名称删除图层

### 总清除
- `clearAll` — 一键清除所有 DotGridMaster 内容（参考线+覆盖层+构图线+印刷标记）

---

## 内置预设汇总

### 网格预设（4 个）
12 列、6 列、3 列、4×4

### 构图预设（4 个）
三分法、黄金分割、对角线、中心十字

### 电商模板（10+ 个）
淘宝主图 800×800、淘宝高清主图 1500×1500、淘宝详情页 790×不限、淘宝 Banner 1920×600、淘宝视频封面 800×800、京东主图 800×800、京东 SKU 800×800、京东详情页 990×不限、拼多多主图 750×750、拼多多 Banner 1000×375、抖音商品图 800×800、小红书封面 1080×1440

### 印刷预设（5 个）
A4 (210×297mm)、A3 (297×420mm)、名片 (90×54mm)、海报 B2 (515×728mm)、三折页 (297×210mm)

### UI 设备预设（4 个）
iPhone 15 (393×852)、iPhone 15 Pro Max (430×932)、Android 通用 (360×800)、iPad Pro 11" (834×1194)

---

## 前端-宿主通信接口（28 个 HostAdapter 方法）

| 方法 | 调用的宿主函数 |
|------|--------------|
| `getDocumentInfo()` | `getDocumentInfo` |
| `addGuides(guides)` | `addGuides` |
| `clearGuides()` | `clearAllGuides` |
| `addOverlays(overlays)` | `addOverlays` |
| `clearOverlays()` | `clearOverlays` |
| `addCompositionLines(lines)` | `addCompositionLines` |
| `addSpiralPath(points, color, strokeWidth)` | `addSpiralPath` |
| `clearComposition()` | `clearComposition` |
| `addPrintMarks(marks)` | `addPrintMarks` |
| `clearPrintMarks()` | `clearPrintMarks` |
| `getAllArtboards()` | `getAllArtboards` |
| `setActiveArtboard(index)` | `setActiveArtboard` |
| `clearAll()` | `clearAll` |
| `undo()` | `undoDotGridMaster` |
| `getUndoState()` | `getUndoState` |
| `healthCheck()` | `healthCheck` |
| `addGridOverlay(opts)` | `addGridOverlay` |
| `clearGridOverlay()` | `clearGridOverlay` |
| `addBaseGrid(options)` | `addBaseGrid` |
| `clearBaseGrid()` | `clearBaseGrid` |
| `addColorBar()` | `addColorBar` |
| `addPreviewLines(lines)` | `addPreviewLines` |
| `clearPreviewLayer()` | `clearPreviewLayer` |
| `createDocument(w, h, name)` | `createDocument` |
| `addEcomZones(rects, color, opacity)` | `addEcomZones` |
| `addEcomFunctionZones(zones)` | `addEcomFunctionZones` |
| `addEcomLabels(labels)` | `addEcomLabels` |
| `applyPrintMarks(params)` | `applyPrintMarks` |

---

## 图层结构

| 图层名 | 用途 |
|--------|------|
| `DotGridMaster_Overlays` | 半透明覆盖层 |
| `DotGridMaster_Composition` | 构图辅助线 |
| `DotGridMaster_PrintMarks` | 印刷标记 |
| `DotGridMaster_GridOverlay` | 网格色块覆盖 |
| `DotGridMaster_BaseGrid` | 基础参考线网格 |
| `DotGridMaster_Preview` | 实时预览线条 |
| `DotGridMaster_Ecom` | 电商安全区/标签/功能区 |

---

*共 6 大功能板块、20+ 内置预设、41 个宿主函数、28 个通信接口、7 个专用图层*
