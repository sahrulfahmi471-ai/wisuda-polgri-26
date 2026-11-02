@echo off
title SISTEM SCAN BARCODE WISUDA - POLITEKNIK PGRI BANTEN
color 0A
cls
echo ========================================================
echo   SISTEM SCAN BARCODE WISUDA KE-10 POLITEKNIK PGRI BANTEN
echo ========================================================
echo.
echo [1/2] Menyiapkan direktori aplikasi...
cd /d "%~dp0"
if exist "proyek\server.js" (
  cd proyek
)
echo [2/2] Membuka browser ke Panel Admin / Operator...
start "" "http://localhost:3000/operator.html"
echo.
echo Server berjalan di http://localhost:3000
echo Tekan Ctrl+C di jendela ini jika ingin menghentikan server.
echo.
node server.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Gagal menjalankan server. Pastikan Node.js sudah terinstall.
  pause
)
