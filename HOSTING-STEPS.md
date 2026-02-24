# PokeStash – Step-by-step hosting guide

Backend on **Render**, frontend on **Vercel**. Do the steps in order.

---

## Before you start

- [ ] Project is pushed to **GitHub** (create a repo and push if needed).
- [ ] You have your **MongoDB Atlas** connection string (from `backend/.env` → `MONGODB_URI`).
- [ ] You have your **JWT_SECRET** (from `backend/.env`).

---

## PART 1: Backend on Render

### Step 1.1 – Open Render

- Go to: **https://render.com**
- Sign up or log in (use “Sign in with GitHub” if you like).

---

### Step 1.2 – Create a new Web Service

- Click the blue **“New +”** button (top right).
- Click **“Web Service”**.

---

### Step 1.3 – Connect your GitHub repo

- If asked, connect your GitHub account and give Render access to your repos.
- In the list, find the repo that contains your PokeStash project (the one with `backend` and `frontend` folders).
- Click **“Connect”** next to that repo.

---

### Step 1.4 – Fill in build settings

Use these exactly:

| Field | What to enter |
|-------|----------------|
| **Name** | `pokestash-api` (or any name you like) |
| **Region** | Choose one (e.g. Oregon or Frankfurt) |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | Leave **empty** |
| **Runtime** | **Node** |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |
| **Instance Type** | **Free** |

---

### Step 1.5 – Add environment variables

- Scroll to **“Environment”** or **“Environment Variables”**.
- Click **“Add Environment Variable”** and add these **one by one**:

1. **Key:** `NODE_ENV`  
   **Value:** `production`

2. **Key:** `MONGODB_URI`  
   **Value:** (paste your full MongoDB Atlas connection string from `backend/.env`)

3. **Key:** `JWT_SECRET`  
   **Value:** (paste the same JWT_SECRET from `backend/.env`)

4. **Key:** `FRONTEND_URL`  
   **Value:** Leave empty for now. You will come back and set this after deploying the frontend.

- If you use Razorpay, Gemini, or Google OAuth, add those keys too (same names and values as in `backend/.env`).

---

### Step 1.6 – Deploy the backend

- Click **“Create Web Service”**.
- Wait for the build and deploy to finish (a few minutes). Status should turn **“Live”** (green).

---

### Step 1.7 – Copy your backend URL

- At the top of the page you’ll see a URL like:  
  `https://pokestash-api.onrender.com`
- Copy this **full URL** and save it somewhere.  
- Your API base URL is this; the frontend will use: **this URL + `/api`**  
  Example: `https://pokestash-api.onrender.com/api`

---

## PART 2: Frontend on Vercel

### Step 2.1 – Open Vercel

- Go to: **https://vercel.com**
- Sign up or log in (use “Continue with GitHub” if you like).

---

### Step 2.2 – Create a new project

- Click **“Add New…”** (top right).
- Click **“Project”**.

---

### Step 2.3 – Import your repo

- Find the **same GitHub repo** you connected on Render (the one with `backend` and `frontend`).
- Click **“Import”** next to it.

---

### Step 2.4 – Set the root to the frontend

- Find **“Root Directory”**.
- Click **“Edit”** next to it.
- Type: **`frontend`**
- Confirm so that Vercel builds only the React app inside the `frontend` folder.

---

### Step 2.5 – Add the API URL

- Find **“Environment Variables”**.
- **Key:** `REACT_APP_API_URL`
- **Value:** Your Render backend URL + `/api`  
  Example: `https://pokestash-api.onrender.com/api`  
  (Use your real Render URL from Step 1.7.)
- Add it for **Production** (and Preview if you want).

---

### Step 2.6 – Deploy the frontend

- Click **“Deploy”**.
- Wait until the deployment finishes (usually 1–2 minutes).

---

### Step 2.7 – Copy your frontend URL

- When it’s done, you’ll see a URL like:  
  `https://pokestash-xxxx.vercel.app`
- Copy this **full URL** and save it. This is your live app.

---

## PART 3: Connect frontend to backend (CORS)

### Step 3.1 – Go back to Render

- Open **https://dashboard.render.com**
- Click your backend service (e.g. **pokestash-api**).

---

### Step 3.2 – Set FRONTEND_URL

- Click **“Environment”** in the left sidebar.
- Find **FRONTEND_URL** (you left it empty earlier).
  - If it’s there: click **Edit** and set the value.
  - If it’s not there: click **“Add Environment Variable”**.
- **Key:** `FRONTEND_URL`
- **Value:** Your full Vercel URL from Step 2.7, e.g. `https://pokestash-xxxx.vercel.app`  
  (No slash at the end.)
- Save.

---

### Step 3.3 – Redeploy

- Render will automatically redeploy. Wait until the status is **“Live”** again.

---

## PART 4: MongoDB Atlas (if backend can’t connect)

### Step 4.1 – Allow access from the internet

- Go to **https://cloud.mongodb.com** and log in.
- Open your project → **Network Access** (left menu).
- Click **“Add IP Address”**.
- Choose **“Allow Access from Anywhere”** (this adds `0.0.0.0/0`).
- Confirm.

---

### Step 4.2 – Check your connection string

- Go to **Database** → **Connect** → **Drivers**.
- Copy the connection string and make sure the **username**, **password**, and **database name** match what you put in **MONGODB_URI** on Render.

---

## You’re done

1. Open your **Vercel URL** (from Step 2.7) in the browser.
2. The app should load and show your Pokémon stickers.
3. If the backend was sleeping (free tier), the first load might take 30–60 seconds; after that it’s fast.

---

## Quick checklist

- [ ] Backend deployed on Render and status is **Live**.
- [ ] Backend env vars set: `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, and later `FRONTEND_URL`.
- [ ] Frontend deployed on Vercel with **Root Directory** = `frontend`.
- [ ] Frontend env var: `REACT_APP_API_URL` = Render URL + `/api`.
- [ ] `FRONTEND_URL` on Render = your Vercel URL (no trailing slash).
- [ ] MongoDB Atlas Network Access allows connection (e.g. 0.0.0.0/0).
