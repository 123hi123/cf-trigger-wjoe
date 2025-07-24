# CF Trigger GH - Universal GitHub Actions Trigger for Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/123hi123/cf-trigger-gh)

A universal Cloudflare Worker framework for scheduling and triggering GitHub Actions workflows. Perfect for monitoring systems, automated deployments, scheduled backups, and any recurring automation tasks.

## 🚀 Features

- ⏰ **Smart Scheduling**: Configure operating hours to avoid unnecessary triggers
- 📊 **Interval Control**: Prevent excessive API calls with configurable intervals
- 📈 **Statistics Tracking**: Monitor success/failure rates
- 🔒 **Secure**: GitHub PAT stored as encrypted secrets
- 🌐 **REST API**: Manual triggers and status checks
- 🔧 **Flexible Configuration**: Easy customization via environment variables

## 📋 Quick Deploy

### Option 1: One-Click Deploy (Recommended)

1. Click the "Deploy to Cloudflare Workers" button above
2. Authorize with your Cloudflare account
3. Set your environment variables during deployment:
   - `GITHUB_PAT`: Your GitHub Personal Access Token
   - `GITHUB_REPO`: Your repository (e.g., `username/repo`)
   - `WORKFLOW_ID`: Your workflow ID

### Option 2: Manual Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/123hi123/cf-trigger-gh.git
   cd cf-trigger-gh
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your configuration:**
   ```env
   GITHUB_REPO=your-username/your-repo
   WORKFLOW_ID=your-workflow-id
   GITHUB_PAT=your-github-personal-access-token
   START_HOUR=18
   END_HOUR=23
   END_MINUTE=30
   INTERVAL_MINUTES=5
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create KV namespace:**
   ```bash
   npx wrangler kv:namespace create "CF_TRIGGER_KV"
   ```

6. **Add your GitHub PAT as a secret:**
   ```bash
   npx wrangler secret put GITHUB_PAT
   ```

7. **Deploy:**
   ```bash
   npx wrangler deploy
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `GITHUB_REPO` | GitHub repository | - | `username/repo` |
| `WORKFLOW_ID` | GitHub workflow ID | - | `123456789` |
| `GITHUB_PAT` | GitHub Personal Access Token | - | `ghp_xxxxx` |
| `START_HOUR` | Start hour (24h format) | `18` | `9` |
| `END_HOUR` | End hour (24h format) | `23` | `17` |
| `END_MINUTE` | End minute | `30` | `0` |
| `INTERVAL_MINUTES` | Minimum minutes between triggers | `5` | `30` |
| `WORKER_NAME` | Worker display name | `CF Trigger Worker` | `My Monitor` |
| `TIMEZONE` | Timezone for scheduling | `Asia/Taipei` | `America/New_York` |

### Finding Your Workflow ID

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Click on your workflow
4. Look at the URL: `https://github.com/username/repo/actions/workflows/[WORKFLOW_ID].yml`

## 📡 API Endpoints

### GET /
Basic information about the worker

### GET /status
Returns detailed status including:
- Statistics (total runs, successes, errors)
- Last run time
- Current configuration
- Current time in configured timezone

```bash
curl https://your-worker.workers.dev/status
```

### POST /trigger
Manually trigger the workflow (bypasses time checks)

```bash
curl -X POST https://your-worker.workers.dev/trigger
```

## 🎯 Use Cases

### 1. System Monitoring (e.g., YouBike)
Monitor bike availability during peak hours:
```env
START_HOUR=18
END_HOUR=23
INTERVAL_MINUTES=5
```

### 2. Daily Backups
Run backups at night:
```env
START_HOUR=2
END_HOUR=3
INTERVAL_MINUTES=60
```

### 3. Continuous Deployment
Deploy every 30 minutes during work hours:
```env
START_HOUR=9
END_HOUR=17
INTERVAL_MINUTES=30
```

## 📊 Monitoring

### View Logs
```bash
npx wrangler tail
```

### Check KV Storage
```bash
# List all keys
npx wrangler kv:key list --binding=CF_TRIGGER_KV

# Get specific value
npx wrangler kv:key get --binding=CF_TRIGGER_KV "stats"
```

## 🛠️ Development

### Local Development
```bash
npx wrangler dev
```

### Update Configuration
Edit `.env` file and redeploy:
```bash
npx wrangler deploy
```

## 🔒 Security

- GitHub PAT is stored as an encrypted secret
- Never commit `.env` file (it's in `.gitignore`)
- Use minimal GitHub token permissions (only `actions:write`)

## 🚨 Troubleshooting

### Workflow not triggering?
1. Check `/status` endpoint for errors
2. Verify time is within configured hours
3. Ensure GitHub PAT has correct permissions
4. Check workflow ID is correct

### Hitting Cloudflare limits?
Free accounts have a 5 cron trigger limit. Solutions:
- Remove unused cron triggers
- Upgrade your Cloudflare account
- Use external trigger service

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request