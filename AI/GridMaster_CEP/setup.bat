@echo off
chcp 65001 >nul
echo ==========================================
echo   GridMaster CEP 安装脚本 (Windows)
echo ==========================================
echo.

:: ========== 1. 设置开发模式 ==========
echo [1/2] 设置 CEP 开发模式...
reg add "HKCU\SOFTWARE\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
echo     ✓ 已设置 CSXS 9/10/11/12 PlayerDebugMode=1

:: ========== 2. 安装到 CEP 扩展目录 ==========
echo.
echo [2/2] 安装到 CEP 扩展目录...

set TARGET=%APPDATA%\Adobe\CEP\extensions\com.gridmaster.cep

if exist "%TARGET%" (
    echo     发现旧版本，正在清除...
    rmdir /s /q "%TARGET%" >nul 2>&1
)

mkdir "%TARGET%" >nul 2>&1

:: 复制所有文件（含内置 CSInterface.js，无需额外下载）
xcopy /E /I /Y "." "%TARGET%" >nul 2>&1

echo     ✓ 已安装到 %TARGET%
echo.
echo ==========================================
echo   安装完成！请重启 Illustrator
echo   窗口 → 扩展 → GridMaster
echo ==========================================
echo.
pause
