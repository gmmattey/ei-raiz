@echo off
REM ========================================
REM Esquilo Invest - Local Development Start
REM ========================================
REM Este script inicia a aplicação em modo desenvolvimento
REM Acesso: http://localhost:3000

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   ESQUILO INVEST - Desenvolvimento Local
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js não está instalado!
    echo [INFO] Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado:
node --version
echo.

REM Ir para o diretório web
cd /d "%~dp0apps\web"

echo [INFO] Instalando dependências (se necessário)...
call npm ci --silent

echo.
echo ========================================
echo [INFO] Iniciando servidor de desenvolvimento...
echo [INFO] Porta: 3000
echo [INFO] URL: http://localhost:3000
echo ========================================
echo.

REM Iniciar servidor com Hot Module Replacement
call npm run dev

pause
