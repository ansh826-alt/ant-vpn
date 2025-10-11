@echo off
REM Script para limpiar procesos OpenVPN bloqueados
REM Ejecutar como Administrador

echo ==========================================
echo   Limpieza de Procesos OpenVPN
echo ==========================================
echo.

echo Buscando procesos OpenVPN...
tasklist | findstr /i "openvpn.exe"

if %errorlevel% == 0 (
    echo.
    echo Encontrados procesos OpenVPN. Cerrando...
    taskkill /IM openvpn.exe /F /T
    
    timeout /t 2 /nobreak >nul
    
    echo.
    echo Verificando...
    tasklist | findstr /i "openvpn.exe"
    
    if %errorlevel% == 0 (
        echo [ERROR] Aun hay procesos OpenVPN ejecutandose
        echo Reinicia Windows para limpiar completamente
    ) else (
        echo [OK] Todos los procesos OpenVPN cerrados
    )
) else (
    echo [OK] No hay procesos OpenVPN ejecutandose
)

echo.
echo Limpiando archivos de log bloqueados...
if exist "logs\vpn.log" (
    del /F /Q "logs\vpn.log" 2>nul
    if %errorlevel% == 0 (
        echo [OK] Log limpiado
    ) else (
        echo [AVISO] Log no se pudo limpiar ^(puede estar en uso^)
        echo Se renombrara automaticamente al conectar
    )
) else (
    echo [OK] No hay archivos de log
)

echo.
echo ==========================================
echo   Limpieza completada
echo ==========================================
echo.
echo Ahora puedes ejecutar: npm start
echo.
pause