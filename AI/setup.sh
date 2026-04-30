#!/bin/bash
set -e

echo "=========================================="
echo "  GridMaster CEP 环境配置脚本 (macOS)"
echo "=========================================="
echo ""

# 1. 设置开发模式
echo "[1/5] 设置 CEP 开发模式..."
defaults write com.adobe.CSXS.9 PlayerDebugMode 1 2>/dev/null || true
defaults write com.adobe.CSXS.10 PlayerDebugMode 1 2>/dev/null || true
defaults write com.adobe.CSXS.11 PlayerDebugMode 1 2>/dev/null || true
defaults write com.adobe.CSXS.12 PlayerDebugMode 1 2>/dev/null || true
echo "    ✓ 已设置 CSXS 9/10/11/12 PlayerDebugMode=1"

# 2. 下载 CSInterface.js
echo ""
echo "[2/5] 下载 CSInterface.js ..."
mkdir -p js

CSURL="https://raw.githubusercontent.com/nicoleKelworthy/CSInterface/master/CSInterface.js"

if command -v curl &>/dev/null; then
    curl -sL -o "js/CSInterface.js" "$CSURL"
elif command -v wget &>/dev/null; then
    wget -q -O "js/CSInterface.js" "$CSURL"
fi

if [ -f "js/CSInterface.js" ]; then
    echo "    ✓ CSInterface.js 下载成功"
else
    echo "    ✗ 下载失败，请手动下载: $CSURL"
fi

# 3. 图标
echo ""
echo "[3/5] 创建图标..."
mkdir -p icons
cat > icons/icon-light.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="23" height="23"><rect width="23" height="23" rx="4" fill="#0d99ff"/><text x="11.5" y="16" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">G</text></svg>
EOF
cp icons/icon-light.svg icons/icon-dark.svg
echo "    ✓ 图标已创建"

# 4. 安装
echo ""
echo "[4/5] 安装到 CEP 扩展目录..."

TARGET="$HOME/Library/Application Support/Adobe/CEP/extensions/com.gridmaster.cep"

if [ -d "$TARGET" ]; then
    echo "    发现旧版本，正在清除..."
    rm -rf "$TARGET"
fi

mkdir -p "$TARGET"
cp -R . "$TARGET/"

echo "    ✓ 已安装到 $TARGET"

# 5. 完成
echo ""
echo "[5/5] 安装完成！"
echo ""
echo "=========================================="
echo "  请重启 Illustrator"
echo "  然后打开: 窗口 → 扩展 → GridMaster"
echo "=========================================="
