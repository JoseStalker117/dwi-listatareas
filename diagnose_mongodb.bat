@echo off
echo ========================================
echo   DIAGNOSTICO DE MONGODB
echo ========================================
echo.

echo [1] Verificando configuracion...
if exist "dwi-tareasapi\config.env" (
    echo ✅ config.env encontrado
    echo Contenido:
    type dwi-tareasapi\config.env
) else (
    echo ❌ config.env no encontrado
    goto :end
)
echo.

echo [2] Probando conexion directa a MongoDB...
cd dwi-tareasapi
python test_mongodb.py
echo.

echo [3] Iniciando FastAPI para probar conexion...
start "FastAPI MongoDB Test" cmd /c "python start_server.py"
echo Esperando 10 segundos para que inicie...
timeout /t 10 /nobreak >nul

echo [4] Probando endpoint de salud...
curl -s http://localhost:8800/health || (
    echo ❌ No se pudo conectar a FastAPI
    goto :cleanup
)
echo.

echo [5] Probando endpoint de usuarios...
curl -s -X POST http://localhost:8800/usuarios/ -H "Content-Type: application/json" -d "{\"nombre\":\"test\",\"email\":\"test@test.com\",\"password\":\"123456\"}" || (
    echo ❌ Error en endpoint de usuarios
)

:cleanup
echo.
echo [6] Limpiando procesos...
taskkill /f /im python.exe /fi "WINDOWTITLE eq FastAPI MongoDB Test" >nul 2>&1

:end
echo.
echo ========================================
echo   DIAGNOSTICO COMPLETADO
echo ========================================
pause