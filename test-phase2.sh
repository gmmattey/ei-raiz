#!/bin/bash

# Teste Phase 2: D1 Persistência + Trending

echo "🧪 Testing Phase 2: D1 Persistence + Trending"
echo "=============================================="
echo ""

# Start server in background
npm run dev > /tmp/vera.log 2>&1 &
SERVER_PID=$!
sleep 4

USER_ID="test-user-$(date +%s)"

# Test 1: Analyze with persistence (GROWING stage)
echo "✓ Test 1: Save snapshot for GROWING stage"
curl -s -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
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
  }' | head -50

echo ""
echo ""

# Test 2: Record behavioral action
echo "✓ Test 2: Record user behavior (accepted recommendation)"
curl -s -X POST http://localhost:3000/api/behavioral/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "actionType": "accepted",
    "recommendationType": "HIGH_DEBT_RATIO",
    "recommendationId": "rec-123"
  }' | head -30

echo ""
echo ""

# Test 3: Get user trend
echo "✓ Test 3: Get user trend"
curl -s -X GET "http://localhost:3000/api/analyze/$USER_ID/trend?months=3" \
  -H "Content-Type: application/json" | head -50

echo ""
echo ""

# Cleanup
kill $SERVER_PID

echo "✅ Phase 2 Tests Complete!"
