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

需要在 GitHub Secrets 設定：
- `GCP_SA_KEY`（Cloud Run 部署）
- `FIREBASE_SERVICE_ACCOUNT_CAMPTOGETHER`（Firebase Hosting 部署）
- `ADMIN_EMAILS`（後端管理員 Email，逗號分隔）
- `VITE_FIREBASE_*`（前端 Firebase Web 設定） 

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
| GET | `/api/events` | 活動列表（支援 `limit/cursor/search/scope=mine`） |
| POST | `/api/events` | 建立活動（需登入） |
| GET | `/api/events/:id` | 活動詳情 |
| PUT | `/api/events/:id` | 更新活動（主辦或管理員） |
| DELETE | `/api/events/:id` | 刪除活動（主辦或管理員） |
| GET | `/api/events/:id/checklist` | 清單項目（需登入） |
| POST | `/api/events/:id/checklist` | 新增項目（需登入） |
| GET | `/api/events/:id/expenses` | 費用列表（需登入） |
| POST | `/api/events/:id/expenses` | 新增費用（需登入） |
| POST | `/api/events/:id/join` | 加入活動（需登入） |
| GET | `/api/events/admin/all` | 管理員活動列表 |
| GET | `/api/auth/me` | 取得/建立目前登入者 |
| GET | `/api/auth/users` | 用戶列表（管理員） |

## 環境變數

### 後端 (Cloud Run)
| 變數 | 說明 |
|------|------|
| `FIREBASE_PROJECT_ID` | Firebase/GCP 專案 ID |
| `GCP_PROJECT_ID` | GCP 專案 ID（相容舊設定） |
| `PORT` | 服務埠號 (8080) |
| `CORS_ORIGINS` | 允許的前端網域（逗號分隔） |
| `ADMIN_EMAILS` | 管理員 Email（逗號分隔） |

### 前端 (Build time)
| 變數 | 說明 |
|------|------|
| `VITE_API_URL` | 後端 API URL |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

## 認證說明

本專案採用 Firebase Auth（Google + LINE OIDC）。前端登入後會取得 Firebase ID Token，\n後端需在 `Authorization: Bearer <token>` 驗證後才可進行寫入操作與管理功能。

請在 Firebase Console 設定 LINE OIDC Provider（provider id: `oidc.line`），\n並於 GitHub Secrets 提供 `VITE_FIREBASE_*` 參數。

## 測試

```bash
cd backend
npm run test
```

## License

MIT
