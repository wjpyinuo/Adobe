#!/bin/bash
set -e

echo "=========================================="
echo "  DotGridMaster CEP 安装脚本 (macOS)"
echo "=========================================="
echo ""

# 1. 设置开发模式
echo "[1/2] 设置 CEP 开发模式..."
for v in 9 10 11 12 13 14 15; do
    defaults write com.adobe.CSXS.$v PlayerDebugMode 1 2>/dev/null || true
done
echo "    ✓ 已设置 CSXS 9-15 PlayerDebugMode=1"

# 2. 安装到 CEP 扩展目录
echo ""
echo "[2/2] 安装到 CEP 扩展目录..."

TARGET="$HOME/Library/Application Support/Adobe/CEP/extensions/com.dotgridmaster.cep"

if [ -d "$TARGET" ]; then
    echo "    发现旧版本，正在清除..."
    rm -rf "$TARGET"
fi

mkdir -p "$TARGET"

# 复制所有文件（含内置 CSInterface.js，无需额外下载）
cp -R . "$TARGET/"

echo "    ✓ 已安装到 $TARGET"
echo ""
echo "=========================================="
echo "  安装完成！请重启 Illustrator"
echo "  窗口 → 扩展 → DotGridMaster"
echo "=========================================="
