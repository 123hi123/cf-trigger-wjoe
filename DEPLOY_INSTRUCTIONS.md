# Deployment Instructions

## Issue: Cron Trigger Limit Reached

You've reached the limit of 5 cron triggers on your Cloudflare account. Here are your options:

### Option 1: Remove an Existing Cron Trigger
1. Check your existing workers with cron triggers:
   ```bash
   wrangler list
   ```

2. Remove cron from an unused worker or delete it entirely

3. Then deploy this worker:
   ```bash
   npx wrangler deploy
   ```

### Option 2: Use External Trigger
Since you already have the worker deployed (without cron), you can:

1. Use an external service (like cron-job.org) to trigger your worker
2. Set up the external service to call:
   ```
   https://youbike-trigger.YOUR-SUBDOMAIN.workers.dev/trigger
   ```
   Method: POST

### Option 3: Combine with Existing Worker
If you have another worker with a cron trigger, you can add this logic to that worker.

## Add GitHub PAT Secret

Once deployed, add your GitHub PAT:
```bash
npx wrangler secret put GITHUB_PAT
```

## Test the Worker

1. Check status:
   ```bash
   curl https://youbike-trigger.YOUR-SUBDOMAIN.workers.dev/status
   ```

2. Manual trigger (test):
   ```bash
   curl -X POST https://youbike-trigger.YOUR-SUBDOMAIN.workers.dev/trigger
   ```

## Monitor Logs

```bash
npx wrangler tail
```