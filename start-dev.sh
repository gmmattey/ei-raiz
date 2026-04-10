#!/bin/bash

# ========================================
# Esquilo Invest - Local Development Start
# ========================================
# Este script inicia a aplicação em modo desenvolvimento
# Acesso: http://localhost:3000

set -e

echo ""
echo "========================================"
echo "  ESQUILO INVEST - Desenvolvimento Local"
echo "========================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não está instalado!"
    echo "[INFO] Instale via: brew install node (macOS) ou apt-get install nodejs (Linux)"
    exit 1
fi

echo "[OK] Node.js detectado:"
node --version
echo ""

# Ir para o diretório web
cd "$(dirname "$0")/apps/web"

echo "[INFO] Instalando dependências (se necessário)..."
npm ci --silent

echo ""
echo "========================================"
echo "[INFO] Iniciando servidor de desenvolvimento..."
echo "[INFO] Porta: 3000"
echo "[INFO] URL: http://localhost:3000"
echo "========================================"
echo ""

# Iniciar servidor com Hot Module Replacement
npm run dev
