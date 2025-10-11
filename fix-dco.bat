@echo off
REM Script para agregar --disable-dco a archivos .ovpn
REM Soluciona el error TDI en Windows

echo ==========================================
echo   Fix DCO Error - Windows
echo ==========================================
echo.
echo Este script agregara "disable-dco" a tus archivos .ovpn
echo para solucionar el error TDI de Windows.
echo.
pause

cd vpn-configs

for %%f in (*.ovpn) do (
    echo Procesando: %%f
    
    REM Verificar si ya tiene disable-dco
    findstr /C:"disable-dco" "%%f" >nul
    if %errorlevel% == 0 (
        echo   [OK] Ya tiene disable-dco
    ) else (
        echo   [+] Agregando disable-dco
        
        REM Buscar la linea "client" y agregar disable-dco despues
        powershell -Command "(Get-Content '%%f') -replace '(^client$)', '$1`ndisable-dco' | Set-Content '%%f'"
        
        echo   [OK] Actualizado
    )
    echo.
)

cd ..

echo.
echo ==========================================
echo   Completado
echo ==========================================
echo.
echo Todos los archivos .ovpn han sido actualizados.
echo Ahora ejecuta: npm start
echo.
pause