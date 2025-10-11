@echo off
REM Script de diagnóstico completo para Windows
REM Ejecutar como Administrador

echo ==========================================
echo   Diagnóstico Completo VPN - Windows
echo ==========================================
echo.

REM Verificar si se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Ejecutando como Administrador
) else (
    echo [AVISO] NO se esta ejecutando como Administrador
    echo Algunas pruebas pueden fallar
    echo.
    echo Haz clic derecho en el archivo y selecciona:
    echo "Ejecutar como administrador"
    echo.
    pause
)

echo.
echo ==========================================
echo 1. VERIFICACION DE OPENVPN
echo ==========================================
echo.

set "OPENVPN_PATH=C:\Program Files\OpenVPN\bin\openvpn.exe"

if exist "%OPENVPN_PATH%" (
    echo [OK] OpenVPN encontrado en: %OPENVPN_PATH%
    echo.
    echo Version:
    "%OPENVPN_PATH%" --version 2>nul | findstr "OpenVPN"
) else (
    set "OPENVPN_PATH=C:\Program Files (x86)\OpenVPN\bin\openvpn.exe"
    if exist "%OPENVPN_PATH%" (
        echo [OK] OpenVPN encontrado en: %OPENVPN_PATH%
        echo.
        echo Version:
        "%OPENVPN_PATH%" --version 2>nul | findstr "OpenVPN"
    ) else (
        echo [ERROR] OpenVPN NO encontrado
        echo.
        echo Descarga e instala desde:
        echo https://openvpn.net/community-downloads/
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ==========================================
echo 2. VERIFICACION DE ARCHIVOS
echo ==========================================
echo.

REM Archivos .ovpn
echo Archivos de configuracion (.ovpn):
echo.
if exist "vpn-configs\*.ovpn" (
    dir /b vpn-configs\*.ovpn
    echo.
    echo [OK] Archivos .ovpn encontrados
) else (
    echo [ERROR] No se encontraron archivos .ovpn en vpn-configs\
    echo.
)

echo.
REM Credenciales
if exist "vpn-credentials\auth.txt" (
    echo [OK] Archivo de credenciales encontrado
    echo.
    echo Contenido (primeras 2 lineas):
    type vpn-credentials\auth.txt 2>nul | findstr /n "^"
    echo.
    
    REM Verificar formato
    for /f %%A in ('type vpn-credentials\auth.txt ^| find /c /v ""') do set LINES=%%A
    if "%LINES%"=="2" (
        echo [OK] Formato correcto: 2 lineas
    ) else (
        echo [AVISO] Formato incorrecto: %LINES% lineas ^(deberia ser 2^)
        echo   Linea 1: email
        echo   Linea 2: contraseña
    )
) else (
    echo [ERROR] Archivo de credenciales NO encontrado
    echo Debe existir: vpn-credentials\auth.txt
    echo.
)

echo.
echo ==========================================
echo 3. VERIFICACION DE PERMISOS
echo ==========================================
echo.

REM Verificar permisos de escritura en carpeta de logs
echo Probando escritura en carpeta logs...
echo test > logs\test.txt 2>nul
if exist "logs\test.txt" (
    echo [OK] Permisos de escritura correctos
    del logs\test.txt 2>nul
) else (
    echo [ERROR] No se puede escribir en carpeta logs\
)

echo.
echo ==========================================
echo 4. TEST DE CONEXION MANUAL
echo ==========================================
echo.

echo Archivos .ovpn disponibles:
echo.
set COUNT=0
for %%F in (vpn-configs\*.ovpn) do (
    set /a COUNT+=1
    echo !COUNT!^) %%~nxF
    set "FILE!COUNT!=%%F"
)

if %COUNT%==0 (
    echo [ERROR] No hay archivos .ovpn para probar
    echo.
    pause
    exit /b 1
)

echo.
set /p CHOICE="Selecciona un archivo para probar (1-%COUNT%), o 0 para salir: "

if "%CHOICE%"=="0" goto :END

set SELECTED=!FILE%CHOICE%!

if not defined SELECTED (
    echo Opcion invalida
    goto :END
)

echo.
echo ==========================================
echo PROBANDO CONEXION...
echo ==========================================
echo.
echo Archivo: %SELECTED%
echo Credenciales: vpn-credentials\auth.txt
echo.
echo Conectando... (Presiona Ctrl+C para cancelar)
echo.
echo IMPORTANTE: Busca estos mensajes en la salida:
echo   - "Initialization Sequence Completed" = CONEXION EXITOSA
echo   - "AUTH_FAILED" = Credenciales incorrectas
echo   - "Connection refused" = No se puede conectar al servidor
echo.
pause

echo.
echo Ejecutando OpenVPN...
echo.

"%OPENVPN_PATH%" ^
  --config "%SELECTED%" ^
  --auth-user-pass vpn-credentials\auth.txt ^
  --verb 4

echo.
echo ==========================================
echo Conexion terminada
echo ==========================================
echo.

if exist "logs\vpn.log" (
    echo Ultimas lineas del log:
    echo.
    powershell -Command "Get-Content logs\vpn.log -Tail 20"
    echo.
)

:END
echo.
echo ==========================================
echo RESUMEN DE DIAGNOSTICO
echo ==========================================
echo.

if exist "%OPENVPN_PATH%" (
    echo [OK] OpenVPN instalado
) else (
    echo [X] OpenVPN NO instalado
)

if exist "vpn-configs\*.ovpn" (
    echo [OK] Archivos .ovpn presentes
) else (
    echo [X] Archivos .ovpn faltantes
)

if exist "vpn-credentials\auth.txt" (
    echo [OK] Credenciales configuradas
) else (
    echo [X] Credenciales faltantes
)

echo.
echo Si la conexion manual funciono, la app deberia funcionar tambien.
echo Si fallo, revisa los errores mostrados arriba.
echo.
pause