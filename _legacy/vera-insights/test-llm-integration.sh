#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3002/api/profile/analyze"

# Sample profile
PROFILE='{
    "userId": "test-llm-user",
    "profile": {
      "income": { "value": 5000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.95, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "expenses": { "value": 3500, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.95, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "liquidAssets": { "value": 8000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.9, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "totalDebt": { "value": 25000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.85, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "highInterestDebt": { "value": 5000, "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.85, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "age": { "value": 35, "state": "HAS_VALUE", "origin": "user_input", "confidence": 1.0, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "investorProfile": { "value": "moderate", "state": "HAS_VALUE", "origin": "user_input", "confidence": 0.8, "lastUpdated": "2026-04-18T00:00:00Z", "isEstimated": false },
      "goals": []
    },
    "llmProvider": "PROVIDER_PLACEHOLDER",
    "userApiKey": "API_KEY_PLACEHOLDER"
}'

test_provider() {
  local provider=$1
  local api_key=$2
  local model_name=$3

  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Testing: ${provider} (${model_name})${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ -z "$api_key" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${provider}: API Key not found${NC}"
    return
  fi

  # Prepare payload
  local payload=$(echo "$PROFILE" | sed "s/PROVIDER_PLACEHOLDER/$provider/" | sed "s|API_KEY_PLACEHOLDER|$api_key|g")

  # Make request
  echo -e "${YELLOW}Sending request...${NC}"
  response=$(curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "$payload")

  # Check response
  if echo "$response" | grep -q '"llmNarrative"'; then
    echo -e "${GREEN}✅ Success!${NC}"

    # Extract LLM metadata
    echo -e "\n${BLUE}LLM Response Metadata:${NC}"
    echo "$response" | grep -o '"llmMetadata":[^}]*}' | head -1

    # Show first 500 chars of narrative
    echo -e "\n${BLUE}LLM Narrative (truncated):${NC}"
    echo "$response" | grep -o '"llmNarrative":[^}]*' | head -c 300
    echo "..."

    # Extract token usage
    echo -e "\n${BLUE}Token Usage:${NC}"
    echo "$response" | grep -o '"tokens":[^}]*}' | head -1

  else
    echo -e "${RED}❌ Failed!${NC}"
    echo -e "${RED}Response:${NC}"
    echo "$response" | head -c 300
  fi
}

echo -e "\n${GREEN}🚀 Vera AI - LLM Integration Tests${NC}"
echo -e "${GREEN}Testing different LLM providers...${NC}"

# Read environment variables
ANTHROPIC_KEY="${ANTHROPIC_API_KEY:-}"
OPENAI_KEY="${OPENAI_API_KEY:-}"
GEMINI_KEY="${GEMINI_API_KEY:-}"
CF_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

# Test each provider
test_provider "claude" "$ANTHROPIC_KEY" "Claude Opus 4.7"
test_provider "gpt" "$OPENAI_KEY" "GPT-4o"
test_provider "gemini" "$GEMINI_KEY" "Gemini 2.0 Flash"
test_provider "cloudflare" "$CF_TOKEN" "Llama 3 8B"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Tests completed!${NC}"
echo -e "${YELLOW}Tip: Set API keys in .env.local or environment variables:${NC}"
echo "  ANTHROPIC_API_KEY=your-key"
echo "  OPENAI_API_KEY=your-key"
echo "  GEMINI_API_KEY=your-key"
echo "  CLOUDFLARE_API_TOKEN=your-key"
