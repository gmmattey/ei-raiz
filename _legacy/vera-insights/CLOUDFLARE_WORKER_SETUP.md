# Vera Cloudflare Worker Setup

## Overview

Vera is deployed as a Cloudflare Worker to provide serverless API endpoints for portfolio analysis, data enrichment, and financial insights. The worker reuses the existing D1 database (Esquilo DB) and implements background job triggers for data synchronization.

## Architecture

```
┌─────────────────────────────────────────┐
│    Vera Cloudflare Worker (Hono.js)     │
├─────────────────────────────────────────┤
│ POST /api/profile/analyze               │
│ POST /api/portfolio/refresh             │
│ GET  /api/analyze/:userId/trend         │
│ POST /api/behavioral/:userId            │
│ GET  /api/health                        │
├─────────────────────────────────────────┤
│ ┌──────────────────────────────────┐   │
│ │ Core Modules                     │   │
│ │ • EsquiloEngine (analysis)       │   │
│ │ • PortfolioEnricher (data)       │   │
│ │ • CacheManager (D1 + memory)     │   │
│ └──────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ Bindings                                 │
│ • DB: D1 (Esquilo DB - reused)          │
│ • CACHE: KV (distributed cache)         │
└─────────────────────────────────────────┘
```

## Prerequisites

1. **Cloudflare Account** with:
   - Account ID (from Settings > Account)
   - API Token (from Tokens & Keys)
   - Existing D1 database (Esquilo DB)

2. **Local Setup**:
   ```bash
   npm install
   npm run build:worker
   ```

## Configuration

### 1. Set Cloudflare Credentials

Create a `.env` file:

```env
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

Or configure via `wrangler login`:

```bash
npx wrangler login
```

### 2. Update wrangler.toml

Replace placeholder IDs with actual values:

```toml
[[d1_databases]]
binding = "DB"
database_name = "esquilo-db"
database_id = "your-actual-db-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-actual-kv-id"
```

**To find your D1 database ID:**

```bash
npx wrangler d1 list
```

**To create a new KV namespace:**

```bash
npx wrangler kv:namespace create "vera-cache"
npx wrangler kv:namespace create "vera-cache" --preview
```

### 3. Deploy Schema Migrations

Ensure D1 has the required schema from `migrations/002_add_data_integration_schema.sql`:

```bash
npx wrangler d1 execute esquilo-db --file migrations/002_add_data_integration_schema.sql
```

## Deployment

### Deploy to Production

```bash
npm run deploy:worker
```

### Deploy to Staging

```bash
npx wrangler deploy --env staging
```

### Monitor Deployment

```bash
npx wrangler tail vera-worker
```

## API Endpoints

### 1. Unified Analysis & Portfolio Refresh

**POST** `/api/profile/analyze`

```json
{
  "userId": "user123",
  "profile": {
    "income": 5000,
    "expenses": 2000,
    "debt": 10000,
    "assets": 25000
  },
  "portfolioUpdate": {
    "positions": [
      {
        "id": "pos1",
        "ticker": "PETR4",
        "assetClass": "stocks",
        "quantity": 100,
        "purchasePrice": 25.50,
        "name": "Petrobras"
      }
    ]
  }
}
```

**Response:**

```json
{
  "decision": { /* Esquilo analysis */ },
  "dashboard": { /* Dashboard data */ },
  "portfolio": {
    "snapshot": { /* EnrichedPosition[] */ },
    "metrics": {
      "totalValue": 50000,
      "totalCost": 45000,
      "unrealizedGain": 5000,
      "diversification": { "count": 5, "concentration": "moderate" },
      "riskScore": 42
    }
  },
  "metadata": {
    "dataFreshness": {
      "profile": "latest",
      "portfolio": "just now",
      "stocks": "5min ago",
      "funds": "24h ago"
    },
    "durationMs": 245,
    "cacheHitRate": { "stocks": 0.8, "funds": 1.0, "vehicles": 0.5 },
    "nextRefreshAt": "2024-04-18T14:35:00Z"
  }
}
```

### 2. Portfolio Refresh (Standalone)

**POST** `/api/portfolio/refresh`

```json
{
  "userId": "user123",
  "positions": [/* positions array */],
  "forceRefresh": false
}
```

### 3. User Trend History

**GET** `/api/analyze/:userId/trend?months=12`

Returns 12-month trend of user's financial stage and scores.

### 4. Behavioral Action Tracking

**POST** `/api/behavioral/:userId`

```json
{
  "actionType": "accepted",
  "recommendationType": "SAVE_EMERGENCY_FUND",
  "recommendationId": "rec123"
}
```

### 5. Health Check

**GET** `/api/health`

```json
{
  "status": "ok",
  "timestamp": "2024-04-18T14:30:00Z",
  "version": "3.0.0"
}
```

## Background Jobs (Cron Triggers)

Vera implements 4 background jobs via Cloudflare Cron Triggers:

### 1. Stock Price Sync

- **Schedule**: Every 30 minutes, 9am-6pm, Mon-Fri
- **Cron**: `*/30 9-18 * * 1-5`
- **Handler**: `triggers/stockSync`
- **Action**: Refresh BRAPI stock prices for all active users

### 2. Fund Data Sync

- **Schedule**: Daily at 10pm
- **Cron**: `0 22 * * *`
- **Handler**: `triggers/fundSync`
- **Action**: Update CVM fund data and performance metrics

### 3. Cache Cleanup

- **Schedule**: Hourly
- **Cron**: `0 * * * *`
- **Handler**: `triggers/cacheCleanup`
- **Action**: Remove expired cache entries from D1 and KV

### 4. Portfolio Drift Detection

- **Schedule**: Weekly Monday at 6am
- **Cron**: `0 6 * * 1`
- **Handler**: `triggers/driftDetection`
- **Action**: Detect concentration drift and alert users

## Data Sources

### BRAPI (Stocks)

- **API**: https://brapi.dev/
- **Cache TTL**: 5 minutes
- **Coverage**: B3 stocks (PETR4, VALE3, etc.)
- **Auth**: Optional API key via `BRAPI_API_KEY`

### CVM (Funds)

- **API**: Brazilian Securities Commission
- **Cache TTL**: 24 hours
- **Coverage**: All regulated investment funds
- **Data**: Fund codes, NAV, performance

### FIPE (Vehicles)

- **API**: Brazilian auto valuation service
- **Cache TTL**: 30 days
- **Coverage**: Brazilian cars, motorcycles, commercial vehicles
- **Data**: Current market value, deprecation rate

## Caching Strategy

Vera implements a dual-layer cache:

### Layer 1: Memory Cache (Worker)
- Fast, in-process
- Limited by Worker memory (~128MB)
- Lost on Worker restart

### Layer 2: D1 Database
- Persistent
- Shared across Workers
- TTL-based expiration
- Indexed for efficient lookups

### Layer 3: KV Namespace (Optional)
- Distributed across Cloudflare network
- ~1ms latency
- 1GB per namespace
- For high-frequency data

**Cache Hit Flow:**
```
Request → Memory Cache (1ms) → D1 (5-10ms) → External API (200-500ms)
```

## Performance Targets

- **Unified endpoint**: < 500ms (with fresh data)
- **Portfolio refresh**: < 1000ms (10+ positions)
- **Cache hit**: < 10ms
- **Background job**: < 5 seconds

## Monitoring & Debugging

### View Real-time Logs

```bash
npx wrangler tail vera-worker
```

### Query D1 Database

```bash
npx wrangler d1 execute esquilo-db --command "SELECT * FROM vera_snapshots LIMIT 10"
```

### Check KV Cache Status

```bash
npx wrangler kv:key list --namespace-id your-kv-id
```

### Monitor Cloudflare Analytics

- Dashboard: https://dash.cloudflare.com/
- Workers > vera-worker > Analytics
- View requests, latency, errors

## Troubleshooting

### Deploy Fails: "Missing database_id"

**Error:**
```
Error: Missing database_id for d1_databases binding "DB"
```

**Fix:**
```bash
npx wrangler d1 list
# Copy actual database_id to wrangler.toml
```

### Data Sync Not Triggered

**Check cron configuration:**
```bash
npx wrangler deploy --list
```

**Verify cron routes in wrangler.toml are properly formatted.**

### Slow API Response

**Check cache hit rate in metadata:**
```json
"cacheHitRate": { "stocks": 0.2 }  // Low hit rate = many API calls
```

**Solutions:**
1. Increase cache TTL in code
2. Force cache refresh via `forceRefresh: true`
3. Check BRAPI/CVM API rate limits

### D1 Query Errors

**Ensure migrations are applied:**
```bash
npx wrangler d1 execute esquilo-db --file migrations/002_add_data_integration_schema.sql
```

**Verify table names match code:**
- vera_snapshots
- vera_portfolio_snapshots
- vera_cache
- vera_data_audit

## Environment Variables

Set in `wrangler.toml` or via CLI:

```toml
[env.production.vars]
BRAPI_API_KEY = "your-brapi-key"
LOG_LEVEL = "info"
```

Or deploy-time:
```bash
npx wrangler secret put BRAPI_API_KEY
```

## Next Steps

1. **Update database IDs** in wrangler.toml
2. **Install dependencies**: `npm install`
3. **Build worker**: `npm run build:worker`
4. **Deploy**: `npm run deploy:worker`
5. **Test endpoints**: Use Postman or curl
6. **Monitor logs**: `npx wrangler tail vera-worker`

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [KV Storage](https://developers.cloudflare.com/kv/)
- [Cron Triggers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
