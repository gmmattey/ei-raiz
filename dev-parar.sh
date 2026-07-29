#!/usr/bin/env bash
# dev-parar.sh — Para o ambiente de desenvolvimento local da landing do Savro

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_FILE="$ROOT/.dev-pids"

echo ""
echo "🐿️  Savro — Parando ambiente local"
echo "────────────────────────────────────────────"

if [ ! -f "$PIDS_FILE" ]; then
  echo "ℹ️  Nenhum ambiente ativo encontrado (.dev-pids não existe)."
  echo "   Se processos ainda estiverem rodando, use:"
  echo "     pkill -f 'vite'"
  exit 0
fi

# Para os processos salvos
while IFS= read -r pid; do
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null && echo "   Processo $pid encerrado."
  fi
done < "$PIDS_FILE"

# Limpa arquivos temporários
rm -f "$PIDS_FILE"
rm -f "$ROOT/.dev-web.log"

# Garante que não sobrou nenhum processo vite órfão
pkill -f "vite" 2>/dev/null || true

echo ""
echo "✅ Ambiente encerrado."
echo "────────────────────────────────────────────"
