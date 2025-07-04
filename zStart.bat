REM Definir nombre del entorno virtual
set VENV_NAME=venv

REM Verificar si el entorno virtual existe
if not exist "%VENV_NAME%" (
    echo Creando entorno virtual...
    python -m venv %VENV_NAME%
    if errorlevel 1 (
        echo ERROR: No se pudo crear el entorno virtual
        pause
        exit /b 1
    )
    echo Entorno virtual creado exitosamente.
) else (
    echo Entorno virtual ya existe.
)

REM Activar el entorno virtual
echo Activando entorno virtual...
call %VENV_NAME%\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: No se pudo activar el entorno virtual
    pause
    exit /b 1
)

echo Entorno virtual activado.

REM Instalar dependencias
echo Instalando dependencias desde requirements.txt...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)

echo Dependencias instaladas exitosamente.

REM Ejecutar migraciones de Django
echo Ejecutando migraciones de Django...
python manage.py migrate
if errorlevel 1 (
    echo ADVERTENCIA: Las migraciones fallaron, pero continuando...
)

REM Iniciar el servidor de desarrollo
python manage.py runserver
