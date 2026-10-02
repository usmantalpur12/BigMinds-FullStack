@echo off
echo Clearing Metro and Expo caches...
echo.

cd /d "%~dp0"

echo Stopping any running Metro processes...
taskkill /F /IM node.exe >nul 2>&1

echo Clearing caches...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo Cleared node_modules\.cache
)

if exist ".expo" (
    rmdir /s /q ".expo"
    echo Cleared .expo
)

if exist ".metro" (
    rmdir /s /q ".metro"
    echo Cleared .metro
)

echo.
echo Cache cleared! Now run: npx expo start --clear
echo.
pause

