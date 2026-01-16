# Vercel Environment Variables Setup

## Fix Network Error in Production

If you're seeing "Network Error" on your deployed Vercel site, you need to configure the backend API URL.

## Steps to Fix:

1. **Go to your Vercel Dashboard**
   - Navigate to your project
   - Click on **Settings** → **Environment Variables**

2. **Add the API URL**
   - Click **Add New**
   - **Key:** `REACT_APP_API_URL`
   - **Value:** Your backend API URL
     - If backend is on Railway: `https://your-app-name.railway.app/api`
     - If backend is on Vercel: `https://your-backend.vercel.app/api`
     - If backend is on another service: `https://your-backend-domain.com/api`
   - **Environment:** Select all environments** (Production, Preview, Development)
   - Click **Save**

3. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

## How to Find Your Backend URL:

### If using Railway:
1. Go to Railway dashboard
2. Select your backend service
3. Click on the service
4. Go to **Settings** → **Networking**
5. Copy the **Public Domain** URL
6. Add `/api` at the end (e.g., `https://your-app.railway.app/api`)

### If using Vercel for backend:
1. Go to Vercel dashboard
2. Select your backend project
3. Copy the deployment URL
4. Add `/api` at the end

## Example:

If your Railway backend URL is: `https://poke-stash-backend.railway.app`

Then set `REACT_APP_API_URL` to: `https://poke-stash-backend.railway.app/api`

## Verify:

After redeploying, the network error should be resolved and you should be able to login successfully.
