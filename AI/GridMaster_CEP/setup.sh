#!/bin/bash
set -e

echo "=========================================="
echo "  GridMaster CEP 安装脚本 (macOS)"
echo "=========================================="
echo ""

# 1. 设置开发模式
echo "[1/3] 设置 CEP 开发模式..."
defaults write com.adobe.CSXS.9 PlayerDebugMode 1 2>/dev/null || true
defaults write com.adobe.CSXS.10 PlayerDebugMode 1 2>/dev/null || true
defaults write com.adobe.CSXS.11 PlayerDebugMode 1 2>/dev/null || true
defaults write com.adobe.CSXS.12 PlayerDebugMode 1 2>/dev/null || true
echo "    ✓ 已设置 CSXS 9/10/11/12 PlayerDebugMode=1"

# 2. 安装到 CEP 扩展目录
echo ""
echo "[2/3] 安装到 CEP 扩展目录..."

TARGET="$HOME/Library/Application Support/Adobe/CEP/extensions/com.gridmaster.cep"

if [ -d "$TARGET" ]; then
    echo "    发现旧版本，正在清除..."
    rm -rf "$TARGET"
fi

mkdir -p "$TARGET"
cp -R . "$TARGET/"

echo "    ✓ 已安装到 $TARGET"

# 3. 完成
echo ""
echo "[3/3] 安装完成！"
echo ""
echo "=========================================="
echo "  请重启 Illustrator"
echo "  然后打开: 窗口 → 扩展 → GridMaster"
echo "=========================================="
