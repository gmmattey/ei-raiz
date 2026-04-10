#!/bin/bash

# ========================================
# Esquilo Invest - Docker Compose Start
# ========================================
# Este script inicia a aplicação via Docker
# Requer: Docker instalado e rodando

set -e

echo ""
echo "========================================"
echo "  ESQUILO INVEST - Docker Environment"
echo "========================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "[ERRO] Docker não está instalado!"
    echo "[INFO] Instale Docker em: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar se Docker daemon está rodando
if ! docker ps &> /dev/null; then
    echo "[ERRO] Docker daemon não está rodando!"
    echo "[INFO] Inicie o Docker daemon e tente novamente."
    exit 1
fi

echo "[OK] Docker detectado:"
docker --version
echo ""

echo "[INFO] Buildando e iniciando containers..."
echo ""

# Iniciar docker-compose
docker-compose up --build
