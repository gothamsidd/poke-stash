# Railway Deployment Fix - Step by Step Guide

## Problem
Railway is looking for `/app/index.js` but your backend is in the `backend` folder and uses `server.js`.

## Solution Verified ✅
Your backend structure:
- ✅ Entry point: `backend/server.js`
- ✅ Start command: `npm start` (which runs `node server.js`)
- ✅ Package.json is in `backend/` folder

## Step-by-Step Fix

### Step 1: Configure Railway Service Settings

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Log in to your account
   - Click on your project (the one showing the error)

2. **Open Your Backend Service**
   - Click on the service that's failing (likely named "production" or "backend")
   - If you have multiple services, find the one with the error

3. **Go to Settings**
   - Click on the **"Settings"** tab (usually at the top)
   - Scroll down to find **"Deploy"** or **"Service"** settings

4. **Set Root Directory**
   - Find **"Root Directory"** or **"Source"** field
   - Change it from empty (or `/`) to: **`backend`**
   - This tells Railway where your backend code is

5. **Set Start Command** (if visible)
   - Find **"Start Command"** or **"Deploy Command"** field
   - Set it to: **`npm start`**
   - Or: **`node server.js`**
   - This tells Railway how to start your server

6. **Save Settings**
   - Click **"Save"** or **"Update"** button

### Step 2: Trigger Redeploy

1. **Go to Deployments Tab**
   - Click on **"Deployments"** tab
   - You should see your latest deployment

2. **Redeploy**
   - Click the **"⋯"** (three dots) menu on the latest deployment
   - Click **"Redeploy"**
   - OR Railway might auto-redeploy after you save settings

3. **Wait for Build**
   - Watch the deployment logs
   - It should show: "Installing dependencies..." then "Starting..."

### Step 3: Verify Backend is Running

1. **Check Logs**
   - Go to **"Logs"** tab
   - You should see:
     ```
     ✅ MongoDB Connected
     🚀 Server running on port 5001
     📝 Environment: production
     ```
   - **NOT** the `Cannot find module '/app/index.js'` error

2. **Test API**
   - Your backend URL should be: `https://poke-stash-production.up.railway.app`
   - Visit: `https://poke-stash-production.up.railway.app/api/health`
   - Should return: `{"status":"OK","message":"PokeStash API is running",...}`

### Step 4: Seed the Database

Once backend is running:

1. **Open Railway Console**
   - In Railway, go to your backend service
   - Click **"Deployments"** tab
   - Find the latest successful deployment
   - Click **"View Logs"** or look for **"Console"** button

2. **Run Seed Command**
   - In the console/terminal, type:
     ```bash
     npm run seed
     ```
   - If that doesn't work, try:
     ```bash
     cd backend
     npm run seed
     ```

3. **Wait for Completion**
   - This takes 5-10 minutes
   - You'll see progress like:
     ```
     [1/900] Fetching Pokemon #1...
     ✅ Created: Bulbasaur | Power: average | Stats: 318 | ₹42
     ...
     ✅ Seeding complete!
     ✅ Successfully created: 900 products
     ```

### Step 5: Verify Everything Works

1. **Check Your Website**
   - Go to your Vercel site
   - Home page should show:
     - **900+ POKEMON** (instead of 0)
     - **50+ LEGENDARY** (instead of 0)
     - Products visible on the page

2. **Test Login**
   - Use: `customer@pokestash.com` / `customer123`
   - Should login successfully (no network error)

## Alternative: If Settings Don't Work

If Railway doesn't have those settings visible:

1. **Check if you need to create a new service**
   - Sometimes Railway needs a separate service for backend
   - Click **"New"** → **"GitHub Repo"**
   - Select your repo
   - **IMPORTANT**: When creating, set:
     - **Root Directory**: `backend`
     - **Start Command**: `npm start`

2. **Or use Railway CLI**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Link to project
   railway link
   
   # Set root directory
   railway variables set RAILWAY_SERVICE_ROOT=backend
   
   # Redeploy
   railway up
   ```

## Troubleshooting

**Still seeing the error?**
- Make sure you saved the settings
- Check that the deployment actually redeployed
- Verify the `backend` folder exists in your repo
- Check that `backend/server.js` exists

**Backend starts but can't connect to MongoDB?**
- Check Railway environment variables
- Make sure `MONGODB_URI` is set correctly
- Verify MongoDB is accessible

**Need help?**
- Check Railway logs for specific errors
- Verify all environment variables are set
- Make sure MongoDB service is running (if using Railway MongoDB)
