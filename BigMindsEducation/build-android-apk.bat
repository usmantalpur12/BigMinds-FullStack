@echo off
REM Build Android APK with EAS (Expo Application Services)
REM Run this from the BigMindsEducation folder (where this script lives).
REM First-time: run 1-eas-init-once.bat once, then run this script.
set EAS_NO_VCS=1
set EAS_BUILD_NO_EXPO_GO_WARNING=1
cd /d "%~dp0"

set "NPM_CMD=npm"
where npm >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\nodejs\npm.cmd" set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
  if exist "C:\Program Files (x86)\nodejs\npm.cmd" set "NPM_CMD=C:\Program Files (x86)\nodejs\npm.cmd"
)

echo Step 1: Log in to Expo (required for EAS Build)
echo A browser window may open. Sign in or create a free account at expo.dev
echo.
call npx eas-cli login
if errorlevel 1 (
  echo Login failed or was skipped. Run: npx eas-cli login
  echo Then run this script again.
  pause
  exit /b 1
)

echo.
echo Step 2: Building Android APK (production profile)...
echo.
call npx eas-cli build --platform android --profile production --non-interactive

echo.
echo When the build finishes, download the APK from the Expo dashboard.
pause
