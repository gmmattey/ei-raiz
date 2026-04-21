#!/usr/bin/env bash
# dev-iniciar.sh — Inicia o ambiente de desenvolvimento local do Esquilo Invest
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8787

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
echo "🐿️  Esquilo Invest — Iniciando ambiente local"
echo "─────────────────────────────────────────────"

# Instala dependências se necessário
if [ ! -d "$ROOT/node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install --silent
fi

# Inicia o Backend (Cloudflare Worker via Wrangler)
echo "🔧 Iniciando Backend  → http://localhost:8787"
npm run dev:api --prefix "$ROOT" > "$ROOT/.dev-api.log" 2>&1 &
API_PID=$!

# Aguarda o backend subir
sleep 2

# Inicia o Frontend (Vite)
echo "🖥️  Iniciando Frontend → http://localhost:3000"
npm run dev --prefix "$ROOT" > "$ROOT/.dev-web.log" 2>&1 &
WEB_PID=$!

# Salva PIDs para o script de parada
echo "$API_PID" > "$PIDS_FILE"
echo "$WEB_PID" >> "$PIDS_FILE"

echo ""
echo "✅ Ambiente iniciado"
echo "   Backend:  http://localhost:8787"
echo "   Frontend: http://localhost:3000"
echo ""
echo "   Logs em tempo real:"
echo "     Backend:  tail -f .dev-api.log"
echo "     Frontend: tail -f .dev-web.log"
echo ""
echo "   Para parar: ./dev-parar.sh"
echo "─────────────────────────────────────────────"
