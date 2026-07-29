#!/usr/bin/env bash
# dev-iniciar.sh — Inicia o ambiente de desenvolvimento local da landing do Savro
# Frontend: http://localhost:3000

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_FILE="$ROOT/.dev-pids"

# Verifica se já está rodando
if [ -f "$PIDS_FILE" ]; then
  echo "⚠️  Ambiente já parece estar ativo (encontrei .dev-pids)."
  echo "   Para parar: ./dev-parar.sh"
  exit 1
fi

echo ""
echo "🐿️  Savro — Iniciando ambiente local"
echo "─────────────────────────────────────────────"

# Instala dependências se necessário
if [ ! -d "$ROOT/node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install --silent
fi

# Inicia o Frontend (Vite)
echo "🖥️  Iniciando Frontend → http://localhost:3000"
npm run dev --prefix "$ROOT" > "$ROOT/.dev-web.log" 2>&1 &
WEB_PID=$!

# Salva PID para o script de parada
echo "$WEB_PID" > "$PIDS_FILE"

echo ""
echo "✅ Ambiente iniciado"
echo "   Frontend: http://localhost:3000"
echo ""
echo "   Logs em tempo real:"
echo "     Frontend: tail -f .dev-web.log"
echo ""
echo "   Para parar: ./dev-parar.sh"
echo "─────────────────────────────────────────────"
