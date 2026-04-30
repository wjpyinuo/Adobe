@echo off
chcp 65001 >nul
echo ==========================================
echo   GridMaster CEP 环境配置脚本 (Windows)
echo ==========================================
echo.

:: ========== 1. 设置开发模式 ==========
echo [1/5] 设置 CEP 开发模式...
reg add "HKCU\SOFTWARE\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\SOFTWARE\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
echo     ✓ 已设置 CSXS 9/10/11/12 PlayerDebugMode=1

:: ========== 2. 下载 CSInterface.js ==========
echo.
echo [2/5] 下载 CSInterface.js ...

if not exist "js" mkdir js

set CSURL=https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_11.x/CSInterface.js

:: 优先用 curl（Win10+ 内置）
where curl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
curl -sL -o "js\CSInterface.js" "%CSURL%"
if exist "js\CSInterface.js" (
echo     ✓ CSInterface.js 下载成功
) else (
echo     ✗ 下载失败，请手动下载
echo       %CSURL%
)
) else (
:: 回退到 PowerShell
powershell -Command "Invoke-WebRequest -Uri '%CSURL%' -OutFile 'js\CSInterface.js'" >nul 2>&1
if exist "js\CSInterface.js" (
echo     ✓ CSInterface.js 下载成功 (PowerShell)
) else (
echo     ✗ 下载失败，请手动下载
echo       %CSURL%
)
)

:: ========== 3. 创建图标占位 ==========
echo.
echo [3/5] 创建图标目录...
if not exist "icons" mkdir icons

:: 生成简易 SVG 图标并转为提示文件
echo ^<svg xmlns="http://www.w3.org/2000/svg" width="23" height="23"^>^<rect width="23" height="23" rx="4" fill="#0d99ff"/^>^<text x="11.5" y="16" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold"^>G^</text^>^</svg^> > "icons\icon-light.svg"
copy "icons\icon-light.svg" "icons\icon-dark.svg" >nul

echo     ✓ 图标占位已创建（SVG 格式，AI 支持直接使用）

:: ========== 4. 创建安装目录并复制 ==========
echo.
echo [4/5] 安装到 CEP 扩展目录...

set TARGET=%APPDATA%\Adobe\CEP\extensions\com.gridmaster.cep

if exist "%TARGET%" (
echo     发现旧版本，正在清除...
rmdir /s /q "%TARGET%" >nul 2>&1
)

mkdir "%TARGET%" >nul 2>&1

:: 复制所有文件
xcopy /E /I /Y "." "%TARGET%" >nul 2>&1

echo     ✓ 已安装到 %TARGET%

:: ========== 5. 完成 ==========
echo.
echo [5/5] 安装完成！
echo.
echo ==========================================
echo   请重启 Illustrator
echo   然后打开: 窗口 → 扩展 → GridMaster
echo ==========================================
echo.
pause
