export default {
  async scheduled(event, env, ctx) {
    console.log('Cron trigger executed at:', new Date().toISOString());
    
    try {
      // Configuration from environment variables
      const GITHUB_REPO = env.GITHUB_REPO || '123hi123/tg-youbike';
      const WORKFLOW_ID = env.WORKFLOW_ID || '176482748';
      const START_HOUR = parseInt(env.START_HOUR || '18');
      const END_HOUR = parseInt(env.END_HOUR || '23');
      const END_MINUTE = parseInt(env.END_MINUTE || '30');
      const INTERVAL_MINUTES = parseInt(env.INTERVAL_MINUTES || '5');
      const TIMEZONE = env.TIMEZONE || 'Asia/Taipei';
      
      // Get current time in configured timezone
      const now = new Date();
      const localTime = new Date(now.toLocaleString("en-US", {timeZone: TIMEZONE}));
      const hours = localTime.getHours();
      const minutes = localTime.getMinutes();
      const currentTimeMinutes = hours * 60 + minutes;
      
      // Check if current time is within operating hours
      const startTime = START_HOUR * 60;
      const endTime = END_HOUR * 60 + END_MINUTE;
      
      if (currentTimeMinutes < startTime || currentTimeMinutes > endTime) {
        console.log(`Outside operating hours. Current time: ${hours}:${minutes.toString().padStart(2, '0')} ${TIMEZONE}`);
        return;
      }
      
      // Check if we should trigger based on configured interval
      const KV_BINDING = env[env.KV_NAMESPACE_NAME || 'CF_TRIGGER_KV'];
      const lastRun = await KV_BINDING.get('lastRun');
      if (lastRun) {
        const lastRunTime = new Date(lastRun);
        const timeDiff = now - lastRunTime;
        const minutesDiff = Math.floor(timeDiff / 60000);
        
        if (minutesDiff < INTERVAL_MINUTES) {
          console.log(`Skipping: Only ${minutesDiff} minutes since last run (interval: ${INTERVAL_MINUTES} minutes)`);
          return;
        }
      }
      
      // Trigger GitHub Actions workflow
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${env.GITHUB_PAT}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'CF-Worker-YouBike-Trigger'
          },
          body: JSON.stringify({
            ref: 'main'
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
      
      // Update last run time in KV
      await KV_BINDING.put('lastRun', now.toISOString());
      
      // Log success with detailed info
      const stats = await KV_BINDING.get('stats', { type: 'json' }) || { total: 0, success: 0, errors: 0 };
      stats.total++;
      stats.success++;
      stats.lastSuccess = now.toISOString();
      await KV_BINDING.put('stats', JSON.stringify(stats));
      
      console.log(`✅ Workflow triggered successfully at ${hours}:${minutes.toString().padStart(2, '0')} ${TIMEZONE}`);
      
    } catch (error) {
      console.error('Error triggering workflow:', error);
      
      // Update error stats
      const KV_BINDING = env[env.KV_NAMESPACE_NAME || 'CF_TRIGGER_KV'];
      const stats = await KV_BINDING.get('stats', { type: 'json' }) || { total: 0, success: 0, errors: 0 };
      stats.total++;
      stats.errors++;
      stats.lastError = {
        time: new Date().toISOString(),
        message: error.message
      };
      await KV_BINDING.put('stats', JSON.stringify(stats));
    }
  },
  
  // Optional: Add fetch handler for manual trigger or status check
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const KV_BINDING = env[env.KV_NAMESPACE_NAME || 'CF_TRIGGER_KV'];
    const TIMEZONE = env.TIMEZONE || 'Asia/Taipei';
    
    if (url.pathname === '/status') {
      const stats = await KV_BINDING.get('stats', { type: 'json' }) || { total: 0, success: 0, errors: 0 };
      const lastRun = await KV_BINDING.get('lastRun');
      
      return new Response(JSON.stringify({
        stats,
        lastRun,
        currentTime: new Date().toLocaleString("en-US", {timeZone: TIMEZONE}) + ' ' + TIMEZONE,
        config: {
          repo: env.GITHUB_REPO || '123hi123/tg-youbike',
          workflowId: env.WORKFLOW_ID || '176482748',
          schedule: {
            start: `${env.START_HOUR || '18'}:00`,
            end: `${env.END_HOUR || '23'}:${env.END_MINUTE || '30'}`,
            interval: `${env.INTERVAL_MINUTES || '5'} minutes`
          }
        }
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/trigger' && request.method === 'POST') {
      // Manual trigger - bypass time check
      try {
        const GITHUB_REPO = env.GITHUB_REPO || '123hi123/tg-youbike';
        const WORKFLOW_ID = env.WORKFLOW_ID || '176482748';
        
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Accept': 'application/vnd.github+json',
              'Authorization': `Bearer ${env.GITHUB_PAT}`,
              'X-GitHub-Api-Version': '2022-11-28',
              'Content-Type': 'application/json',
              'User-Agent': 'CF-Worker-YouBike-Trigger'
            },
            body: JSON.stringify({
              ref: 'main'
            })
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          return new Response(`Error: ${response.status} - ${errorText}`, { status: 500 });
        }
        
        await KV_BINDING.put('lastRun', new Date().toISOString());
        return new Response('Workflow triggered successfully', { status: 200 });
        
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    }
    
    const WORKER_NAME = env.WORKER_NAME || 'CF Trigger Worker';
    return new Response(`${WORKER_NAME}\n\nEndpoints:\n- GET /status - Check worker status and configuration\n- POST /trigger - Manual trigger`, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};