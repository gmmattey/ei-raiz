#!/bin/bash
# Kill any existing Node processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start server in background
npm run dev > server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Test the API
echo "Testing /api/analyze endpoint..."
curl -s -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {"idade": 35, "renda_mensal": 5000, "patrimonio": 50000},
    "portfolio": {"acoes": 20000, "renda_fixa": 15000, "caixa": 15000}
  }' | jq . 2>/dev/null || echo "Request failed or jq not available"

# Kill server
kill $SERVER_PID 2>/dev/null || true
