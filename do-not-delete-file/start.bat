@echo off
:: ==========================================
:: Qadri Distributors - SILENT LAUNCHER
:: ==========================================

:: Resolve paths
set "ROOT_DIR=%~dp0.."
set "VBS_FILE=%~dp0silent_runner.vbs"

:: Create a VBS script to start everything silently in the background
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"

:: 1. Start Laravel Backend silently (Port 8005)
echo WshShell.Run "cmd.exe /c cd /d ""%ROOT_DIR%\backend"" && php artisan serve --host=127.0.0.1 --port=8005", 0, False >> "%VBS_FILE%"

:: Wait 3 seconds for backend to start
echo WScript.Sleep 3000 >> "%VBS_FILE%"

:: 2. Start React Frontend silently (Port 4175)
echo WshShell.Run "cmd.exe /c cd /d ""%ROOT_DIR%\frontend"" && npm run preview -- --host 127.0.0.1 --port 4175", 0, False >> "%VBS_FILE%"

:: Wait 3 seconds for frontend to start
echo WScript.Sleep 3000 >> "%VBS_FILE%"

:: 3. Open browser (Port 4175)
echo WshShell.Run "http://127.0.0.1:4175", 1, False >> "%VBS_FILE%"

:: Clean up
echo Set WshShell = Nothing >> "%VBS_FILE%"

:: Launch the script asynchronously and close this CMD window immediately
start "" wscript.exe "%VBS_FILE%"
exit