# CampTogether 🏕️

露營揪團平台 - 和朋友一起規劃露營活動，分配裝備、紀錄費用、輕鬆分帳

## 技術架構

| 層級 | 技術 | 部署 |
|------|------|------|
| 前端 | React + TypeScript + Vite | Firebase Hosting |
| 後端 | Node.js + Express + TypeScript | Cloud Run |
| 資料庫 | Firestore | GCP |
| CI/CD | GitHub Actions | 自動部署 |

## 專案結構

```
camptogether/
├── frontend/          # React SPA
├── backend/           # Express API
├── .github/workflows/ # CI/CD
└── scripts/           # 工具腳本
```

## 本地開發

### 後端
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# API 運行在 http://localhost:8080
```

### 前端
```bash
cd frontend
npm install
npm run dev
# 前端運行在 http://localhost:5173
```

## 部署

推送到 `main` 分支自動觸發 CI/CD：
- `backend/**` 變更 → 部署到 Cloud Run
- `frontend/**` 變更 → 部署到 Firebase Hosting

### 手動部署

```bash
# 後端
cd backend
gcloud builds submit --tag gcr.io/camptogether/camptogether-api
gcloud run deploy camptogether-api --image gcr.io/camptogether/camptogether-api --region asia-east1

# 前端
cd frontend
npm run build
firebase deploy --only hosting
```

## API 端點

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/health` | 健康檢查 |
| GET | `/api/events` | 活動列表 |
| POST | `/api/events` | 建立活動 |
| GET | `/api/events/:id` | 活動詳情 |
| PUT | `/api/events/:id` | 更新活動 |
| DELETE | `/api/events/:id` | 刪除活動 |
| GET | `/api/events/:id/checklist` | 清單項目 |
| POST | `/api/events/:id/checklist` | 新增項目 |
| GET | `/api/events/:id/expenses` | 費用列表 |
| POST | `/api/events/:id/expenses` | 新增費用 |
| GET | `/api/auth/users` | 用戶列表 |
| POST | `/api/auth/line` | LINE 登入 |

## 環境變數

### 後端 (Cloud Run)
| 變數 | 說明 |
|------|------|
| `GCP_PROJECT_ID` | GCP 專案 ID |
| `PORT` | 服務埠號 (8080) |

### 前端 (Build time)
| 變數 | 說明 |
|------|------|
| `VITE_API_URL` | 後端 API URL |

## License

MIT
