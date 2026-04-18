# ============================================
# Esquilo Invest - Development Environment
# ============================================
# Script PowerShell para iniciar Frontend e API
# Uso: .\start-dev.ps1

param(
    [switch]$NoInstall = $false,
    [switch]$StopAll = $false
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# Cores
$Info = "Cyan"
$Success = "Green"
$Error = "Red"
$Warning = "Yellow"

Write-Host ""
Write-Host "==========================================" -ForegroundColor $Info
Write-Host "  Esquilo Invest - Dev Environment" -ForegroundColor $Info
Write-Host "==========================================" -ForegroundColor $Info
Write-Host ""

# Função para parar processos
function Stop-DevEnvironment {
    Write-Host "[*] Parando servidores..." -ForegroundColor $Warning
    
    # Parar wrangler (API)
    Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "wrangler" } | Stop-Process -Force
    
    # Parar vite (Frontend)
    Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "vite" } | Stop-Process -Force
    
    Write-Host "[✓] Servidores parados" -ForegroundColor $Success
    exit 0
}

if ($StopAll) {
    Stop-DevEnvironment
}

# Verificar Node.js
$NodeVersion = node --version 2>$null
if (-not $NodeVersion) {
    Write-Host "[ERROR] Node.js nao encontrado!" -ForegroundColor $Error
    Write-Host "Instale em: https://nodejs.org/" -ForegroundColor $Error
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "[✓] Node.js detectado: $NodeVersion" -ForegroundColor $Success
Write-Host ""

# Instalar dependências se necessário
if ((Test-Path "node_modules") -eq $false -and -not $NoInstall) {
    Write-Host "[*] Instalando dependências..." -ForegroundColor $Warning
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Falha ao instalar dependências" -ForegroundColor $Error
        Read-Host "Pressione ENTER para sair"
        exit 1
    }
    Write-Host "[✓] Dependências instaladas" -ForegroundColor $Success
}

Write-Host ""
Write-Host "Iniciando servidores..." -ForegroundColor $Info
Write-Host ""

# Função para iniciar servidor em novo terminal
function Start-ServerWindow {
    param([string]$Name, [string]$Command)
    
    $FullCommand = "cd '$ProjectRoot'; $Command; Read-Host 'Pressione ENTER para fechar'"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $FullCommand -WindowStyle Normal
}

# Iniciar API
Write-Host "[*] Iniciando API (porta 8787)..." -ForegroundColor $Info
Start-ServerWindow "Esquilo API" "cd apps\api; npm run dev"

# Aguardar API iniciar
Start-Sleep -Seconds 3

# Iniciar Frontend
Write-Host "[*] Iniciando Frontend (porta 3001)..." -ForegroundColor $Info
Start-ServerWindow "Esquilo Frontend" "cd apps\web; npm run dev"

Write-Host ""
Write-Host "==========================================" -ForegroundColor $Success
Write-Host "  Ambientes Iniciados!" -ForegroundColor $Success
Write-Host "==========================================" -ForegroundColor $Success
Write-Host ""
Write-Host "Frontend:  http://localhost:3001" -ForegroundColor $Success
Write-Host "API:       http://localhost:8787" -ForegroundColor $Success
Write-Host ""
Write-Host "Credenciais de teste:" -ForegroundColor $Info
Write-Host "  Email: teste.vera@example.com" -ForegroundColor $Info
Write-Host "  Senha: Teste@1234" -ForegroundColor $Info
Write-Host ""
Write-Host "Comandos:" -ForegroundColor $Info
Write-Host "  .\start-dev.ps1 -StopAll    : Parar todos os servidores" -ForegroundColor $Info
Write-Host ""
Write-Host "==========================================" -ForegroundColor $Info
Write-Host ""

Read-Host "Pressione ENTER para continuar monitorando"
