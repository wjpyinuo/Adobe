# Adobe 工具集

Adobe 系列产品的扩展插件与工具集合。

## 📦 包含项目

| 项目 | 宿主 | 类型 | 说明 |
|------|------|------|------|
| [DotGridMaster CEP](AI/DotGridMaster_CEP/) | Illustrator 2024+ | CEP 扩展 | 网格/构图/电商/印刷/UI 安全区插件 |

## 快速开始

每个子项目都有独立的 README 和安装说明，进入对应目录查看即可。

```bash
# 示例：安装 DotGridMaster CEP
cd AI/DotGridMaster_CEP
# Windows
setup.bat
# macOS
chmod +x setup.sh && ./setup.sh
```

## 开发

```bash
cd AI/DotGridMaster_CEP
npm install
npm run lint        # 检查代码规范
npm run lint -- --fix  # 自动修复
npm test            # 运行测试
```

## 仓库结构

```
Adobe/
├── README.md              ← 本文件
├── CHANGELOG.md           ← 变更日志
├── .github/workflows/     ← CI/CD
└── AI/
    └── DotGridMaster_CEP/    ← Illustrator CEP 插件
```

## 许可证

各子项目独立许可证，详见各目录下的 LICENSE 文件。
