# PokeStash – Troubleshooting (Backend / No Pokémon / Data Not Loading)

Follow these steps in order. Stop at the first step that fails and fix it.

---

## Step 1: Backend has a `.env` file

1. Open the **backend** folder: `poke-stash/backend/`
2. Check if a file named **`.env`** exists (no name before the dot).
3. If it **does not exist**:
   - Copy `env.example` and rename the copy to `.env`
   - On Mac/Linux in terminal:  
     `cp env.example .env`  
     (run this from inside the `backend` folder)
4. Open `.env` and set at least:
   - **`MONGODB_URI`** – your MongoDB connection string (see Step 2).
   - **`JWT_SECRET`** – any long random string (e.g. `mySecretKey123`).
   - **`PORT=5001`** and **`FRONTEND_URL=http://localhost:3000`** (already in `env.example`).

---

## Step 2: MongoDB is reachable

- If you use **MongoDB Atlas**:
  - In Atlas: Project → your cluster → **Connect** → **Connect your application**.
  - Copy the connection string and put it in `MONGODB_URI` in `backend/.env`.
  - In Atlas: **Network Access** → add **0.0.0.0/0** (or your IP) so your machine can connect.
- If you use **local MongoDB**:
  - Start MongoDB on your machine.
  - In `backend/.env` use:  
    `MONGODB_URI=mongodb://localhost:27017/ecommerce`

**Test:** Start the backend (Step 4). If you see **`❌ MongoDB Connection Error`**, the issue is MongoDB (wrong URI, network, or MongoDB not running).

---

## Step 3: Frontend uses the local backend (no Railway)

- If you run the app **locally**, open: **`http://localhost:3000`** in the browser (not the Vercel/deployed URL).
- In **`frontend/.env`** (create it if missing) set:
  ```bash
  REACT_APP_API_URL=http://localhost:5001/api
  ```
- If you had **Railway** here before, remove it or replace it with the line above. Restart the frontend after changing `.env`.

---

## Step 4: Start backend and check logs

From the project root:

```bash
cd poke-stash/backend
npm install
npm run dev
```

**You should see:**
- `✅ MongoDB Connected`
- `🚀 Server running on port 5001`

**If you see:**
- `❌ MongoDB Connection Error` → fix `MONGODB_URI` and network (Step 2).
- `Error: listen EADDRINUSE: address already in use` → something is already using port 5001. Close that app or change `PORT` in `backend/.env`.

Leave this terminal open.

---

## Step 5: Start frontend

In a **second** terminal:

```bash
cd poke-stash/frontend
npm install
npm start
```

Browser should open to **http://localhost:3000**. Use that URL.

---

## Step 6: Empty product list (no Pokémon)

If the app loads but **Products** or **Home** show no Pokémon:

- The database has no products. Seed them once:
  ```bash
  cd poke-stash/backend
  npm run seed
  ```
- Wait until it finishes (can take several minutes), then refresh **http://localhost:3000**.

---

## Step 7: Check in the browser

- Open **http://localhost:3000** (not the deployed site).
- Open DevTools (F12 or right‑click → Inspect) → **Console**.
- If you see errors like:
  - `Failed to fetch` / `net::ERR_CONNECTION_REFUSED` → backend not running or wrong URL (Steps 4 and 3).
  - `404` on `/api/...` → backend not running or `REACT_APP_API_URL` wrong (Step 3).
  - CORS errors → you’re not on `http://localhost:3000` or `FRONTEND_URL` in `backend/.env` is wrong.

---

## Quick checklist

| Check | What to do |
|-------|------------|
| Backend `.env` exists | Copy `backend/env.example` to `backend/.env` and set `MONGODB_URI`, `JWT_SECRET` |
| MongoDB works | Atlas: correct URI + Network Access. Local: MongoDB running + correct URI |
| Frontend `.env` | `REACT_APP_API_URL=http://localhost:5001/api` and restart frontend |
| You use local app | Open **http://localhost:3000** only |
| Backend running | Terminal 1: `cd backend && npm run dev` → see “MongoDB Connected” and “Server running” |
| Products empty | Run once: `cd backend && npm run seed` |

If something still doesn’t work, note:
- The **exact** message in the backend terminal (e.g. MongoDB error, port in use).
- The **exact** error in the browser Console (F12 → Console).
- Whether you’re on **http://localhost:3000** or the deployed URL.

Then you can share those for the next fix.
