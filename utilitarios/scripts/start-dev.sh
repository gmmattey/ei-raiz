#!/bin/bash

# ============================================
# Esquilo Invest - Development Environment
# ============================================
# Script bash para iniciar Frontend e API
# Uso: ./start-dev.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funções
log_info() {
    echo -e "${CYAN}[*]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

cleanup() {
    log_warning "Encerrando servidores..."
    kill %1 2>/dev/null || true
    kill %2 2>/dev/null || true
    log_success "Servidores parados"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Header
echo ""
echo "=========================================="
echo "  Esquilo Invest - Dev Environment"
echo "=========================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js nao encontrado!"
    echo "Instale em: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js detectado: $NODE_VERSION"
echo ""

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências..."
    npm install
    log_success "Dependências instaladas"
fi

echo ""
log_info "Iniciando servidores..."
echo ""

# Inicia API em background
log_info "Iniciando API (porta 8787)..."
(cd apps/api && npm run dev) &
API_PID=$!

# Aguarda API iniciar
sleep 3

# Inicia Frontend em background
log_info "Iniciando Frontend (porta 3001)..."
(cd apps/web && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo -e "${GREEN}  Ambientes Iniciados!${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}Frontend:  http://localhost:3001${NC}"
echo -e "${GREEN}API:       http://localhost:8787${NC}"
echo ""
echo -e "${CYAN}Credenciais de teste:${NC}"
echo -e "${CYAN}  Email: teste.vera@example.com${NC}"
echo -e "${CYAN}  Senha: Teste@1234${NC}"
echo ""
echo -e "${CYAN}Pressione Ctrl+C para parar os servidores${NC}"
echo "=========================================="
echo ""

# Aguarda processos
wait
