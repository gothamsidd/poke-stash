# How to Host PokeStash

You need to host **three things**:
1. **Backend** (Node/Express) – e.g. Render, Railway, Fly.io  
2. **Frontend** (React) – e.g. Vercel or Netlify  
3. **Database** – MongoDB Atlas (you likely already use this)

Deploy **backend first**, then use its URL when deploying the frontend.

---

## Option A: Render (Backend) + Vercel (Frontend) – free tier

### 1. Backend on Render

1. Go to [render.com](https://render.com) and sign up (free).
2. **New** → **Web Service**.
3. Connect your GitHub repo (push `poke-stash` to GitHub if you haven’t).
4. Configure:
   - **Root Directory:** leave empty (repo root).
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Instance type:** Free (or paid if you prefer).
5. **Environment** – add variables (same names as in `backend/.env`):
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a long random string (keep it secret)
   - `FRONTEND_URL` = `https://your-app.vercel.app` (you’ll set this after deploying the frontend; you can add it later and redeploy)
   - `PORT` = `5001` (Render sets `PORT` automatically; you can leave this out)
   - Optional: Razorpay, Gemini, Google OAuth, etc. if you use them.
6. Deploy. When it’s live, copy the backend URL, e.g. `https://your-app-name.onrender.com`.

### 2. Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free).
2. **Add New** → **Project** → import your GitHub repo.
3. Configure:
   - **Root Directory:** `frontend` (or set it so the project root is the frontend folder).
   - If the repo root is the repo root (not `frontend`), set **Root Directory** to `frontend`.
4. **Environment Variables** – add:
   - `REACT_APP_API_URL` = `https://your-app-name.onrender.com/api` (your Render backend URL + `/api`)
   - Optional: `REACT_APP_RAZORPAY_KEY_ID` if you use Razorpay.
5. Deploy. Copy your frontend URL, e.g. `https://poke-stash.vercel.app`.

### 3. Point backend at the frontend (CORS)

1. In **Render** → your backend service → **Environment**.
2. Set `FRONTEND_URL` = your Vercel URL, e.g. `https://poke-stash.vercel.app`.
3. Save and redeploy the backend.

---

## Option B: Railway (Backend) + Vercel (Frontend)

Railway no longer has a free tier; you pay for usage.

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Select the repo. The repo already has `railway.json`, so build/start should be detected.
3. In Railway, add the same env vars as in Option A (e.g. `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`).
4. Deploy and copy the backend URL (e.g. `https://xxx.up.railway.app`).
5. Deploy the frontend on Vercel and set `REACT_APP_API_URL` = `https://xxx.up.railway.app/api`.
6. Set `FRONTEND_URL` in Railway to your Vercel URL and redeploy if needed.

---

## MongoDB Atlas

- Use the **same** `MONGODB_URI` you use locally (or a separate Atlas database for production).
- In Atlas → **Network Access** → allow `0.0.0.0/0` so Render/Railway can connect (or add the provider’s IPs if you prefer).

---

## Checklist

| Step | Where | What |
|------|--------|------|
| 1 | Render or Railway | Deploy backend, add `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (after you have frontend URL). |
| 2 | Copy backend URL | e.g. `https://xxx.onrender.com` or `https://xxx.up.railway.app`. |
| 3 | Vercel | Deploy frontend (root = `frontend`), set `REACT_APP_API_URL` = backend URL + `/api`. |
| 4 | Backend env | Set `FRONTEND_URL` = your Vercel (or Netlify) URL so CORS works. |
| 5 | Atlas | Network Access allows your backend host to connect. |

---

## If the frontend repo root is the whole project (not `frontend`)

On Vercel, set **Root Directory** to **`frontend`** so it builds the React app. If you use Netlify, set **Base directory** to `frontend` and **Build command** to `npm run build`, **Publish directory** to `build`.

---

## After deployment

- Open your **frontend** URL (e.g. `https://poke-stash.vercel.app`). The app will call the backend URL you set in `REACT_APP_API_URL`.
- If you see “failed to fetch” or CORS errors: check `FRONTEND_URL` on the backend and that `REACT_APP_API_URL` on the frontend is exactly the backend URL + `/api`.
