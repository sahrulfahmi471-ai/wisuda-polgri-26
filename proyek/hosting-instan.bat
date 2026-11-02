@echo off
title HOSTING INSTAN ONLINE (PUBLIC TUNNEL) - POLITEKNIK PGRI BANTEN
color 0B
cls
echo ====================================================================
echo   HOSTING INSTAN ONLINE / PUBLIC URL
echo   Sistem Scan Barcode Wisuda Ke-10 Politeknik PGRI Banten
echo ====================================================================
echo.
echo Script ini akan membuat link online HTTPS gratis secara instan
echo agar aplikasi ini bisa diakses dari HP, tablet, atau internet luar.
echo.
echo [1/2] Memastikan server lokal aktif...
netstat -ano | findstr :3000 >nul
if %ERRORLEVEL% NEQ 0 (
  echo [INFO] Server belum aktif. Menjalankan server di jendela baru...
  start "Server Wisuda" cmd /k "cd /d %~dp0 && node server.js"
  timeout /t 3 >nul
) else (
  echo [OK] Server lokal port 3000 sudah aktif!
)

echo.
echo [2/2] Menghubungkan ke Internet Tunnel (Localtunnel)...
echo.
echo --------------------------------------------------------------------
echo TUNGGU BEBERAPA DETIK HINGGA MUNCUL TULISAN:
echo "your url is: https://xxxx.loca.lt"
echo --------------------------------------------------------------------
echo.
npx -y localtunnel --port 3000

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [INFO] Jika koneksi terputus, Anda juga bisa mencoba Cloudflare Tunnel:
  echo   npx -y cloudflared tunnel --url http://localhost:3000
  pause
)
