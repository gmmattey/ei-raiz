# Vera Cloudflare Worker - Deployment Checklist

## Pre-Deployment Setup

### Step 1: Gather Cloudflare Credentials
- [ ] Account ID from Cloudflare Dashboard (Settings > Accounts)
- [ ] API Token from Tokens & Keys
- [ ] Existing D1 database ID (run `npx wrangler d1 list`)
- [ ] Existing KV namespace ID or create one: `npx wrangler kv:namespace create vera-cache`

### Step 2: Update Configuration Files

#### wrangler.toml
```bash
# Replace these placeholder values:
database_id = "your-actual-d1-id"  # e.g., "a1b2c3d4-e5f6-..."
```

Run this to find your D1 ID:
```bash
npx wrangler d1 list
```

#### .env or wrangler secret
```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
BRAPI_API_KEY=optional-brapi-key  # Only if using BRAPI beyond free tier
```

### Step 3: Install Dependencies
```bash
npm install
```

Expected packages to be added:
- [ ] hono@^4.3.3
- [ ] wrangler@^3.65.0
- [ ] esbuild@^0.21.0

Verify:
```bash
npm list hono wrangler
```

## Database & Schema Setup

### Step 4: Ensure D1 Schema is Applied

Run migration to create required tables:

```bash
npx wrangler d1 execute esquilo-db --file migrations/002_add_data_integration_schema.sql
```

Verify tables were created:

```bash
npx wrangler d1 execute esquilo-db --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'vera%';"
```

Expected output:
```
vera_cache
vera_portfolio_snapshots
vera_data_audit
```

### Step 5: Verify D1 Indexes

```bash
npx wrangler d1 execute esquilo-db --command "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%vera%';"
```

Expected indexes:
```
idx_vera_cache_type_expires
idx_vera_portfolio_user_time
idx_vera_audit_type_time
```

## Build & Deployment

### Step 6: Build the Worker

```bash
npm run build:worker
```

Check build output:
- [ ] `dist/worker.js` file created
- [ ] File size < 10MB (expected ~2-3MB)
- [ ] No build errors

### Step 7: Authenticate with Cloudflare

```bash
npx wrangler login
```

Or set API token:
```bash
export CLOUDFLARE_API_TOKEN=your-token
npx wrangler whoami
```

Verify authentication:
```bash
npx wrangler whoami
```

Should output your Cloudflare account email.

### Step 8: Deploy to Cloudflare Workers

```bash
npm run deploy:worker
```

Expected output:
```
✓ Uploaded vera-worker
✓ Deployed to https://vera-worker.your-account.workers.dev
```

## Post-Deployment Verification

### Step 9: Test Health Endpoint

```bash
curl https://vera-worker.your-account.workers.dev/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-04-18T14:30:00Z",
  "version": "3.0.0"
}
```

### Step 10: Test Unified Analyze Endpoint

```bash
curl -X POST https://vera-worker.your-account.workers.dev/api/profile/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "profile": {
      "income": 5000,
      "expenses": 2000,
      "debt": 10000,
      "assets": 25000
    }
  }'
```

Expected response should include:
```json
{
  "decision": { /* Esquilo analysis */ },
  "dashboard": { /* Dashboard data */ },
  "metadata": {
    "durationMs": 100-500,
    "nextRefreshAt": "..."
  }
}
```

### Step 11: Verify D1 Write

Check that snapshot was saved:

```bash
npx wrangler d1 execute esquilo-db --command "SELECT COUNT(*) as count FROM vera_snapshots WHERE userId = 'test-user';"
```

Should show count = 1.

### Step 12: Monitor Logs

```bash
npx wrangler tail vera-worker
```

You should see logs from your test request.

## Environment-Specific Deployment

### Deploy to Staging

```bash
npx wrangler deploy --env staging
```

### Deploy to Production

Update `wrangler.toml` with production routes:

```toml
[env.production]
routes = [
  { pattern = "api.vera.app/*", zone_name = "vera.app" }
]
```

Then deploy:

```bash
npx wrangler deploy --env production
```

## Cron Jobs Setup

### Step 13: Verify Cron Triggers

Cron jobs are configured in `wrangler.toml` and automatically execute on schedule:

- **Stock Sync**: `*/30 9-18 * * 1-5` (every 30min, 9am-6pm, Mon-Fri)
- **Fund Sync**: `0 22 * * *` (daily at 10pm)
- **Cache Cleanup**: `0 * * * *` (hourly)
- **Drift Detection**: `0 6 * * 1` (Monday 6am)

To test a cron trigger locally:

```bash
npx wrangler dev
```

Then in another terminal, trigger a test:

```bash
curl -X POST http://localhost:8787/__scheduled
```

## Troubleshooting

### Issue: Deploy fails with "Missing database_id"

**Solution:**
```bash
npx wrangler d1 list
# Copy the database_id from the esquilo-db entry
# Update wrangler.toml with the correct ID
```

### Issue: 404 errors on endpoints

**Solution:**
1. Verify worker URL is correct
2. Check Cloudflare dashboard for any deployment issues
3. View logs: `npx wrangler tail vera-worker`

### Issue: D1 queries return empty results

**Solution:**
1. Verify tables exist: `npx wrangler d1 execute esquilo-db --command "SELECT name FROM sqlite_master;"`
2. Run migration again: `npx wrangler d1 execute esquilo-db --file migrations/002_add_data_integration_schema.sql`
3. Check table structure: `npx wrangler d1 execute esquilo-db --command "PRAGMA table_info(vera_snapshots);"`

### Issue: Cron jobs not executing

**Solution:**
1. Verify cron syntax in wrangler.toml is valid
2. Deploy and wait for the next scheduled time
3. Check logs: `npx wrangler tail vera-worker --format pretty`
4. Look for `[scheduled]` events in logs

### Issue: Slow API response

**Solution:**
1. Check cache hit rate in response metadata
2. Verify BRAPI/CVM API is responding
3. Profile with: `await worker.scheduled(event, env, ctx)` locally
4. Consider increasing cache TTL

## Monitoring & Maintenance

### Step 14: Set Up Monitoring

Enable analytics in Cloudflare Dashboard:
- Dashboard > Workers > vera-worker > Analytics
- Monitor: Requests, Errors, Latency

### Step 15: Regular Maintenance

Schedule recurring tasks:

- **Weekly**: Review error logs and analytics
- **Monthly**: Check D1 storage usage and cleanup old snapshots
- **Quarterly**: Review cache hit rates and optimize TTLs

### Step 16: Database Cleanup (Monthly)

```bash
# Archive old snapshots (older than 90 days)
npx wrangler d1 execute esquilo-db --command "
  DELETE FROM vera_snapshots 
  WHERE timestamp < datetime('now', '-90 days')
  AND userId NOT IN (
    SELECT DISTINCT userId FROM vera_snapshots 
    WHERE timestamp > datetime('now', '-30 days')
  );
"
```

## Rollback Plan

### If deployment breaks production:

1. **Revert to previous worker version:**
   ```bash
   git checkout HEAD~1 src/worker/
   npm run deploy:worker
   ```

2. **Or deploy to staging first:**
   ```bash
   npm run deploy:worker -- --env staging
   # Test thoroughly
   npm run deploy:worker -- --env production
   ```

3. **Check D1 consistency:**
   ```bash
   npx wrangler d1 execute esquilo-db --command "SELECT COUNT(*) FROM vera_snapshots;"
   ```

## Success Criteria

- [x] Worker deployed successfully
- [x] Health endpoint returns 200
- [x] Profile analyze endpoint returns Esquilo decision + portfolio data
- [x] D1 snapshots are persisted
- [x] Cron jobs execute without errors
- [x] Monitoring dashboard shows < 5% error rate
- [x] API latency < 500ms for typical requests

## Support & Documentation

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Hono Framework: https://hono.dev/
- D1 Database: https://developers.cloudflare.com/d1/
- Vera Setup: See `CLOUDFLARE_WORKER_SETUP.md`
