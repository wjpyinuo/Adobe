# DotGridMaster CEP — 安装说明

## 方式一：自动安装（推荐）

### Windows
```bat
setup.bat
```

### macOS
```bash
chmod +x setup.sh && ./setup.sh
```

脚本自动完成：
1. 设置 CEP 调试模式（CSXS 9/10/11/12）
2. 将插件复制到 Adobe CEP 扩展目录

安装后重启 Illustrator → **窗口 → 扩展 → DotGridMaster**

---

## 方式二：手动安装

### 第 1 步：设置 CEP 调试模式

未开启调试模式时，Illustrator 会拒绝加载未签名的第三方 CEP 扩展。

**Windows：**

方式 A：双击注册表文件（推荐）

直接双击 `enable-debug.reg`，确认导入即可。

方式 B：手动注册表编辑

打开注册表编辑器（`regedit`），依次创建以下键值：

```
HKCU\SOFTWARE\Adobe\CSXS.9    → PlayerDebugMode (REG_SZ) = 1
HKCU\SOFTWARE\Adobe\CSXS.10   → PlayerDebugMode (REG_SZ) = 1
HKCU\SOFTWARE\Adobe\CSXS.11   → PlayerDebugMode (REG_SZ) = 1
HKCU\SOFTWARE\Adobe\CSXS.12   → PlayerDebugMode (REG_SZ) = 1
```

方式 C：CMD 命令行
```bat
reg add "HKCU\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

**macOS：**

打开终端执行：
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

### 第 2 步：复制插件到扩展目录

将整个 `AI/DotGridMaster_CEP/` 文件夹复制到以下位置：

**Windows：**
```
%APPDATA%\Adobe\CEP\extensions\com.dotgridmaster.cep\
```

完整路径示例：
```
C:\Users\你的用户名\AppData\Roaming\Adobe\CEP\extensions\com.dotgridmaster.cep\
```

**macOS：**
```
~/Library/Application Support/Adobe/CEP/extensions/com.dotgridmaster.cep/
```

完整路径示例：
```
/Users/你的用户名/Library/Application Support/Adobe/CEP/extensions/com.dotgridmaster.cep/
```

### 第 3 步：验证目录结构

复制完成后，扩展目录下应包含以下文件：

```
com.dotgridmaster.cep/
├── CSXS/
│   └── manifest.xml
├── css/
├── js/
├── jsx/
├── icons/
├── index.html
├── setup.bat
├── setup.sh
├── package.json
└── ...
```

### 第 4 步：重启 Illustrator

菜单 → **窗口 → 扩展 → DotGridMaster**

---

## 方式三：ZXP 打包安装（正式发布用）

适用于需要签名分发的场景。

### 1. 获取签名证书

自签名证书（开发/内部分发）：
```bash
ZXPSignCmd -selfSignedCert CN "Your Name" "Your Org" US cert.p12 yourPassword
```

### 2. 打包为 ZXP

```bash
# 打包前先删除调试文件
rm -rf .debug debug/

ZXPSignCmd -sign AI/DotGridMaster_CEP dotgridmaster-cep.zxp cert.p12 yourPassword
```

### 3. 安装 ZXP

**方式 A：使用 ZXPInstaller**
1. 下载 [ZXPInstaller](https://zxpinstaller.com/)
2. 拖入 `dotgridmaster-cep.zxp`

**方式 B：使用 ExManCmd（Adobe 命令行工具）**
```bash
ExManCmd /install dotgridmaster-cep.zxp
```

**方式 C：手动解压**
1. 将 `.zxp` 后缀改为 `.zip`
2. 解压到 CEP 扩展目录（同方式二的路径）
3. 重启 Illustrator

---

## 调试

插件加载后，可用 Chrome DevTools 调试面板：

1. 打开 Chrome，访问 `http://localhost:8088`
2. 选择对应的面板页面
3. 使用 Console / Elements / Sources 面板调试

> 调试端口在 `.debug` 文件中配置，默认为 `8088`。

---

## 常见问题

### Q: 扩展菜单中看不到 DotGridMaster？

- 确认已设置 `PlayerDebugMode = 1`
- 确认插件放在正确的扩展目录下
- 确认目录下有 `CSXS/manifest.xml`
- 重启 Illustrator（CEP 扩展在启动时加载）

### Q: 打开后白屏？

- 按 `F12` 打开 DevTools 检查是否有 JS 报错
- 确认 `js/CSInterface.js` 文件存在且完整
- 检查 Illustrator 版本是否为 2024+

### Q: macOS 提示"无法验证开发者"？

```bash
xattr -r -d com.apple.quarantine ~/Library/Application\ Support/Adobe/CEP/extensions/com.dotgridmaster.cep/
```
