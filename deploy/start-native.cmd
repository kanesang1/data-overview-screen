@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0native.ps1" %*
set "DEPLOY_EXIT=%ERRORLEVEL%"
pause
exit /b %DEPLOY_EXIT%
