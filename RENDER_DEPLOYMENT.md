# Render Deployment Setup - One Link Frontend + Backend

## Files Created for Deployment

- **package.json** (root) — Orchestrates builds for both frontend and backend
- **render.yaml** — Render service configuration

## How to Deploy on Render

### Step 1: Connect Your Repository
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the branch to deploy

### Step 2: Configure Render Service
When prompted in Render dashboard, use these settings:

| Setting | Value |
|---------|-------|
| **Name** | carbonsmart-backend |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build --prefix server && npm run build --prefix client` |
| **Start Command** | `npm start --prefix server` |
| **Region** | Oregon (or your preference) |

### Step 3: Add Environment Variables in Render Dashboard
Click "Environment" and add:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your-very-secure-secret-key
PORT=3001
```

### Step 4: Deploy
Click "Deploy" — Render will build both frontend and backend, then start the backend.

---

## Result

- **Backend API**: `https://your-service-name.onrender.com/api/v1/*`
- **Frontend**: `https://your-service-name.onrender.com/` (requires backend to serve static files)

---

## ⚠️ Important Note

**Current Setup:** The backend only serves API routes, not the frontend build.

For the frontend to be accessible at `https://your-service-name.onrender.com/`, you would need to modify `server/src/index.ts` to serve the client build as static files (one line addition).

**Option A:** Add this to `server/src/index.ts` after line 45 (before error handler):
```typescript
app.use(express.static('../client/dist'))
```

**Option B:** Use two separate Render services:
- Backend: http://api.yourdomain.com (Web Service)
- Frontend: http://yourdomain.com (Static Site)

---

## Quick Reference: Render Commands

Copy these exact commands into Render dashboard:

**Build:**
```bash
npm install && npm run build --prefix server && npm run build --prefix client
```

**Start:**
```bash
npm start --prefix server
```
