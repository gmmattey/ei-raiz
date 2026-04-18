@echo off
TITLE Esquilo Invest - Ambiente de Teste
echo ===================================================
echo        ESQUILO INVEST - AMBIENTE LOCAL
echo ===================================================
echo.

cd apps/web

if not exist node_modules (
    echo [INFO] Pasta node_modules nao encontrada.
    echo [INFO] Instalando dependencias...
    call npm install
)

echo.
echo [INFO] Iniciando servidor Vite na porta 3000...
echo [INFO] O navegador deve abrir automaticamente em instantes.
echo.

call npm run dev

pause