Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run "cmd.exe /c cd /d ""C:\xampp\htdocs\qadri\do-not-delete-file\..\backend"" && php artisan serve --host=127.0.0.1 --port=8005", 0, False 
WScript.Sleep 3000 
WshShell.Run "cmd.exe /c cd /d ""C:\xampp\htdocs\qadri\do-not-delete-file\..\frontend"" && npm run preview -- --host 127.0.0.1 --port 4175", 0, False 
WScript.Sleep 3000 
WshShell.Run "http://127.0.0.1:4175", 1, False 
Set WshShell = Nothing 
