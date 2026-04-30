@echo off
chcp 437 >nul 2>&1
echo ==========================================
echo   DotGuide CEP Setup (Windows)
echo ==========================================
echo.

:: Step 1: Enable CEP debug mode
echo [1/2] Enabling CEP debug mode...
for %%v in (11 12 13 14 15) do (
    reg add "HKCU\SOFTWARE\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo     [OK] CSXS 9-15 PlayerDebugMode=1

:: Step 2: Copy to CEP extensions directory
echo.
echo [2/2] Installing to CEP extensions directory...

set "TARGET=%APPDATA%\Adobe\CEP\extensions\com.dotguide.cep"

if exist "%TARGET%" (
    echo     Removing old version...
    rmdir /s /q "%TARGET%" >nul 2>&1
)

mkdir "%TARGET%" >nul 2>&1
xcopy /E /I /Y "." "%TARGET%" >nul 2>&1

echo     [OK] Installed to %TARGET%
echo.
echo ==========================================
echo   Done! Restart Illustrator.
echo   Window ^> Extensions ^> DotGuide
echo ==========================================
echo.
pause
