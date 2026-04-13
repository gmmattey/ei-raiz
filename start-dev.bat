@echo off
REM ============================================
REM Esquilo Invest - Development Environment
REM ============================================
REM Este script inicia Frontend (3001) e API (8787)
REM em terminais separados para facilitar debug

setlocal enabledelayedexpansion

cd /d "%~dp0"

REM Cores e formatação
echo.
echo ==========================================
echo  Esquilo Invest - Dev Environment
echo ==========================================
echo.

REM Verificar se Node está instalado
node --version >/dev/null 2>&1
if errorlevel 1 (
    echo ERROR: Node.js nao encontrado!
    echo Instale Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js detectado
echo.

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo [*] Instalando dependências globais...
    call npm install
    if errorlevel 1 (
        echo ERROR: Falha ao instalar dependências
        pause
        exit /b 1
    )
    echo [✓] Dependências instaladas
)

echo.
echo Iniciando servidores...
echo.

REM Inicia API em um novo terminal
echo [*] Iniciando API (porta 8787)...
start "Esquilo API" cmd /k "cd apps\api && npm run dev"

REM Aguarda a API iniciar
timeout /t 3 /nobreak

REM Inicia Frontend em um novo terminal
echo [*] Iniciando Frontend (porta 3001)...
start "Esquilo Frontend" cmd /k "cd apps\web && npm run dev"

echo.
echo ==========================================
echo  Ambientes Iniciados!
echo ==========================================
echo.
echo Frontend:  http://localhost:3001
echo API:       http://localhost:8787
echo.
echo Credenciais de teste:
echo   Email: teste.vera@example.com
echo   Senha: Teste@1234
echo.
echo Para fechar: encerre os terminais ou pressione Ctrl+C
echo ==========================================
echo.

pause
