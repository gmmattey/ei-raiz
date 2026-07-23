#!/bin/bash

# Teste Phase 1: Recomendações Concretas + Score 0-100

echo "🧪 Testing Phase 1: Recommendations + Score 0-100"
echo "=================================================="
echo ""

# Start server in background
npm run dev > /tmp/vera.log 2>&1 &
SERVER_PID=$!
sleep 3

# Test 1: Good Financial Health
echo "✓ Test 1: Good Financial Health (GROWING stage)"
curl -s -X POST http://localhost:5173/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "income": { "value": 6000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "expenses": { "value": 3500, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "liquidAssets": { "value": 25000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "totalDebt": { "value": 5000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "highInterestDebt": { "value": 0, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "age": { "value": 35, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "investorProfile": { "value": "moderate", "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "goals": []
    },
    "portfolio": {}
  }' | jq '{stage: .user_stage, score: .simplified_score, band: .simplified_band, primary_problem: .primary_problem, primary_action: .primary_action, problems_count: (.problems | length)}'

echo ""
echo ""

# Test 2: High Debt (UNSTABLE stage)
echo "✓ Test 2: High Debt Ratio (UNSTABLE stage)"
curl -s -X POST http://localhost:5173/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "income": { "value": 4000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "expenses": { "value": 3500, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "liquidAssets": { "value": 5000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "totalDebt": { "value": 15000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "highInterestDebt": { "value": 5000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "age": { "value": 35, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "investorProfile": { "value": "moderate", "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "goals": []
    },
    "portfolio": {}
  }' | jq '{stage: .user_stage, score: .simplified_score, band: .simplified_band, primary_problem: .primary_problem, primary_action: .primary_action, problems: [.problems[] | {type: .type, action: .action}]}'

echo ""
echo ""

# Test 3: Critical (No emergency fund)
echo "✓ Test 3: Critical - No Emergency Fund"
curl -s -X POST http://localhost:5173/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "income": { "value": 3000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "expenses": { "value": 3500, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "liquidAssets": { "value": 500, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "totalDebt": { "value": 20000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "highInterestDebt": { "value": 8000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "age": { "value": 35, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "investorProfile": { "value": "conservative", "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "goals": []
    },
    "portfolio": {}
  }' | jq '{stage: .user_stage, score: .simplified_score, band: .simplified_band, urgency: .urgency, problems_count: (.problems | length)}'

echo ""
echo ""

# Cleanup
kill $SERVER_PID

echo "✅ Phase 1 Tests Complete!"
