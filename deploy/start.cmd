@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
set "DEPLOY_EXIT=%ERRORLEVEL%"
if not "%DEPLOY_EXIT%"=="0" echo Deployment failed. See the error above.
pause
exit /b %DEPLOY_EXIT%
