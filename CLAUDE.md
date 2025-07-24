# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個**通用的 Cloudflare Worker 框架**，設計用來定時觸發各種 GitHub Actions 工作流程。可以用於：
- 定時監控系統（如 YouBike）
- 定期備份任務
- 定時部署或測試
- 任何需要排程觸發的 GitHub workflow

目前第一個實作案例是 YouBike 監控系統，但架構設計為可輕鬆擴展到其他應用。

## 如何擴展到新的應用

### 方法 1：修改現有 Worker（簡單）
1. 修改 `src/index.js` 中的硬編碼值：
   ```javascript
   // 改成你的 GitHub 倉庫資訊
   const GITHUB_REPO = 'your-username/your-repo';
   const WORKFLOW_ID = 'your-workflow-id';
   ```

2. 調整時間設定（如需要）：
   ```javascript
   const startTime = 18 * 60;  // 開始時間
   const endTime = 23 * 60 + 30;  // 結束時間
   const INTERVAL_MINUTES = 5;  // 觸發間隔
   ```

3. 更新 KV namespace 名稱（在 `wrangler.toml`）

### 方法 2：環境變數配置（推薦）
建議將硬編碼改為環境變數：
```javascript
// src/index.js 改進範例
const GITHUB_REPO = env.GITHUB_REPO || '123hi123/tg-youbike';
const WORKFLOW_ID = env.WORKFLOW_ID || '176482748';
const START_HOUR = parseInt(env.START_HOUR || '18');
const END_HOUR = parseInt(env.END_HOUR || '23');
const END_MINUTE = parseInt(env.END_MINUTE || '30');
const INTERVAL_MINUTES = parseInt(env.INTERVAL_MINUTES || '5');
```

然後在 `wrangler.toml` 中設定：
```toml
[vars]
GITHUB_REPO = "your-username/your-repo"
WORKFLOW_ID = "your-workflow-id"
START_HOUR = "9"
END_HOUR = "17"
INTERVAL_MINUTES = "30"
```

### 方法 3：多應用支援（進階）
可以擴展支援多個 workflows：
```javascript
// 配置多個應用
const WORKFLOWS = {
  'youbike': {
    repo: '123hi123/tg-youbike',
    workflowId: '176482748',
    schedule: { start: '18:00', end: '23:30', interval: 5 }
  },
  'backup': {
    repo: 'username/backup-repo',
    workflowId: 'workflow-id',
    schedule: { start: '02:00', end: '03:00', interval: 60 }
  }
};
```

## 開發指令

### 本地開發
```bash
# 啟動本地開發伺服器
npx wrangler dev

# 尾端日誌（查看即時日誌）
npx wrangler tail
```

### 部署
```bash
# 部署到 Cloudflare Workers
npx wrangler deploy

# 設定 secrets（GitHub PAT）
npx wrangler secret put GITHUB_PAT
```

### KV 操作
```bash
# 列出 KV 鍵值
npx wrangler kv:key list --binding=CF_TRIGGER_KV

# 讀取特定鍵值
npx wrangler kv:key get --binding=CF_TRIGGER_KV "key_name"

# 刪除鍵值
npx wrangler kv:key delete --binding=CF_TRIGGER_KV "key_name"
```

## 架構說明

### 核心功能
1. **智慧排程**：設定執行時段，避免不必要的觸發
2. **間隔控制**：防止過於頻繁的 API 呼叫
3. **統計追蹤**：記錄執行成功/失敗次數
4. **手動觸發**：提供 HTTP API 進行測試
5. **錯誤處理**：完整的錯誤記錄和統計

### 核心邏輯流程
1. **Cron 觸發器** (每分鐘) → 檢查是否在執行時段
2. 檢查距離上次觸發是否超過設定間隔
3. 若符合條件，發送 GitHub API 請求觸發 workflow
4. 更新 KV 儲存的統計資料和最後觸發時間

### 重要檔案
- `src/index.js`: 主要 Worker 邏輯，包含所有路由處理和排程邏輯
- `wrangler.toml`: Worker 配置，定義 KV namespace、cron 觸發器、環境變數

### API 端點
- `GET /`: 顯示基本資訊頁面
- `GET /status`: 返回 JSON 格式的統計資料
- `POST /trigger`: 手動觸發 GitHub workflow

### 環境需求
- **GITHUB_PAT**: GitHub Personal Access Token（使用 `wrangler secret` 設定）
- **CF_TRIGGER_KV**: KV namespace（在 wrangler.toml 中配置）

### 擴展建議
1. **多 Workflow 支援**：修改程式碼支援同時管理多個 workflows
2. **動態配置**：從 KV 或 Durable Objects 讀取配置，無需重新部署
3. **Webhook 通知**：觸發成功/失敗時發送通知（Discord、Slack 等）
4. **更彈性的排程**：支援更複雜的排程規則（如只在工作日執行）
5. **API 認證**：為手動觸發 API 加入認證機制

### 注意事項
1. GitHub 倉庫資訊目前硬編碼在 `src/index.js` 中（第 37、106 行）
2. Cloudflare 免費帳號有 5 個 cron 觸發器的限制
3. 統計資料儲存在 KV 中，鍵名為 `stats`、`lastRun`
4. 時區固定為 Asia/Taipei（台灣時間）