@echo off
REM Run this ONCE to link the app to your Expo account (EAS project).
REM After this, you can run build-android-apk.bat to build the APK.
cd /d "%~dp0"

set EAS_NO_VCS=1
echo Linking this project to your Expo account...
echo When prompted, choose "Create a new project" (or link existing if you have one).
echo.
npx eas-cli init
echo.
echo If init succeeded, run build-android-apk.bat to build the APK.
pause
