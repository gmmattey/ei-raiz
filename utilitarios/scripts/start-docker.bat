@echo off
REM ========================================
REM Esquilo Invest - Docker Compose Start
REM ========================================
REM Este script inicia a aplicação via Docker
REM Requer: Docker Desktop instalado e rodando

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   ESQUILO INVEST - Docker Environment
echo ========================================
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker não está instalado!
    echo [INFO] Baixe Docker Desktop em: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verificar se Docker daemon está rodando
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker daemon não está rodando!
    echo [INFO] Inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo [OK] Docker detectado:
docker --version
echo.

echo [INFO] Buildando e iniciando containers...
echo.

REM Iniciar docker-compose
docker-compose up --build

echo.
pause
