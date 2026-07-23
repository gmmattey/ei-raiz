# Vera Worker - Quick Start (5 minutes)

## 1. Get Credentials

```bash
# From your Cloudflare Dashboard:
# 1. Go to Settings > Accounts > Copy "Account ID"
# 2. Go to Tokens & Keys > Create token with D1 + Workers permissions
# 3. Get D1 database ID:
npx wrangler d1 list
```

## 2. Update Configuration

Edit `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "esquilo-db"
database_id = "PASTE-YOUR-ID-HERE"

[[kv_namespaces]]
binding = "CACHE"
id = "PASTE-YOUR-KV-ID-HERE"  # Or create: npx wrangler kv:namespace create vera-cache
```

## 3. Login & Build

```bash
npm install
npx wrangler login
npm run build:worker
```

## 4. Apply Schema

```bash
npx wrangler d1 execute esquilo-db --file migrations/002_add_data_integration_schema.sql
```

## 5. Deploy

```bash
npm run deploy:worker
```

You'll see:
```
✓ Deployed to https://vera-worker.your-account.workers.dev
```

## 6. Test

```bash
# Health check
curl https://vera-worker.your-account.workers.dev/api/health

# Analyze profile
curl -X POST https://vera-worker.your-account.workers.dev/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "profile": {
      "income": 5000,
      "expenses": 2000,
      "debt": 10000,
      "assets": 25000
    }
  }'
```

## 7. Monitor

```bash
npx wrangler tail vera-worker
```

---

### Next Steps

- See `CLOUDFLARE_WORKER_SETUP.md` for full configuration
- See `DEPLOYMENT_CHECKLIST.md` for verification steps
- See `src/worker/index.ts` for API endpoints

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/profile/analyze` | POST | Full analysis + portfolio |
| `/api/portfolio/refresh` | POST | Refresh portfolio data |
| `/api/analyze/:userId/trend` | GET | User's financial trend |
| `/api/behavioral/:userId` | POST | Track user actions |

### Cron Jobs (Auto-scheduled)

- Stock prices: Every 30min (9am-6pm Mon-Fri)
- Fund data: Daily at 10pm
- Cache cleanup: Hourly
- Portfolio drift: Every Monday 6am

---

**Stuck?** Check logs with `npx wrangler tail vera-worker` or see DEPLOYMENT_CHECKLIST.md troubleshooting.
