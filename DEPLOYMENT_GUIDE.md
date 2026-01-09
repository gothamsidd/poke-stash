# Deployment Guide - PokeStash

Complete step-by-step guide to deploy your full-stack Pokemon sticker e-commerce platform.

## Deployment Strategy

- **Frontend**: Vercel (free, easy, automatic deployments)
- **Backend**: Railway or Render (free tier available)
- **Database**: MongoDB Atlas (you're already using this)
- **File Storage**: Railway/Render handles uploads, or use Cloudinary for production

---

## Part 1: Deploy Backend (Railway)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
4. Authorize Railway to access your GitHub

### Step 2: Deploy Backend

1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `poke-stash` repository
4. Select the `backend` folder (or configure root directory)
5. Railway will auto-detect Node.js

### Step 3: Configure Environment Variables

In Railway project settings, add these environment variables:

```
PORT=5001
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url.railway.app/api/auth/google/callback
```

**Important**: 
- Replace `FRONTEND_URL` with your Vercel URL (you'll get this after deploying frontend)
- Replace `GOOGLE_CALLBACK_URL` with your Railway backend URL
- Get your Railway backend URL from the "Settings" → "Domains" section

### Step 4: Configure Build Settings

1. Go to "Settings" → "Build"
2. Set Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`

### Step 5: Get Backend URL

1. After deployment, go to "Settings" → "Domains"
2. Copy your Railway URL (e.g., `https://poke-stash-backend.railway.app`)
3. Save this - you'll need it for frontend

---

## Part 2: Deploy Frontend (Vercel)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your GitHub

### Step 2: Deploy Frontend

1. In Vercel dashboard, click "Add New Project"
2. Import your `poke-stash` repository
3. Configure project:
   - **Framework Preset**: React
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Important**: Replace `your-backend-url.railway.app` with your actual Railway backend URL from Part 1.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Copy your Vercel URL (e.g., `https://poke-stash.vercel.app`)

### Step 5: Update Backend Environment Variables

1. Go back to Railway backend settings
2. Update `FRONTEND_URL` to your Vercel URL
3. Redeploy backend (Railway auto-redeploys on env var changes)

---

## Part 3: Update Google OAuth (if using)

### Step 1: Update Google Cloud Console

1. Go to https://console.cloud.google.com
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client
4. Update "Authorized JavaScript origins":
   - Add: `https://your-frontend.vercel.app`
5. Update "Authorized redirect URIs":
   - Add: `https://your-backend.railway.app/api/auth/google/callback`
6. Save changes

### Step 2: Update Environment Variables

Update both Railway and Vercel with new OAuth credentials if needed.

---

## Part 4: Update Razorpay (for Live Mode)

### Step 1: Get Live API Keys

1. Go to https://dashboard.razorpay.com
2. Complete KYC verification (if not done)
3. Submit your deployed website URL for approval
4. After approval, generate Live API keys

### Step 2: Update Environment Variables

Update both Railway and Vercel with Live Razorpay keys:
- Railway: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Vercel: `REACT_APP_RAZORPAY_KEY_ID`

---

## Part 5: File Uploads (Production)

### Option 1: Use Railway/Render Storage (Temporary)

Railway provides temporary storage, but files may be lost on redeploy.

### Option 2: Use Cloudinary (Recommended for Production)

1. Sign up at https://cloudinary.com (free tier available)
2. Get your Cloudinary credentials
3. Install: `npm install cloudinary multer-storage-cloudinary`
4. Update backend to use Cloudinary instead of local storage
5. Add Cloudinary env vars to Railway

---

## Part 6: MongoDB Atlas Configuration

### Step 1: Update Network Access

1. Go to MongoDB Atlas dashboard
2. Navigate to "Network Access"
3. Add IP Address: `0.0.0.0/0` (allow all - for Railway)
4. Or add Railway's specific IP if available

### Step 2: Verify Connection String

Make sure your `MONGODB_URI` in Railway includes:
- Your username and password
- Database name
- Connection options

Example:
```
mongodb+srv://username:password@cluster.mongodb.net/pokemon_stickers?retryWrites=true&w=majority
```

---

## Part 7: Testing Deployment

### Step 1: Test Backend

1. Visit: `https://your-backend.railway.app/api/health` (if you have health endpoint)
2. Or test: `https://your-backend.railway.app/api/products`
3. Should return JSON response

### Step 2: Test Frontend

1. Visit your Vercel URL
2. Try logging in
3. Browse products
4. Test checkout flow

### Step 3: Test Payments

1. Use test mode first
2. Test with Razorpay test cards
3. Switch to live mode after verification

---

## Troubleshooting

### Backend not connecting to MongoDB

- Check MongoDB Atlas network access (allow all IPs)
- Verify connection string in Railway env vars
- Check Railway logs for errors

### Frontend can't reach backend

- Verify `REACT_APP_API_URL` in Vercel env vars
- Check CORS settings in backend
- Ensure Railway backend URL is correct

### Payment not working

- Verify Razorpay keys in both Railway and Vercel
- Check if using test or live mode
- Review Railway logs for payment errors

### OAuth not working

- Verify callback URL in Google Console matches Railway URL
- Check `GOOGLE_CALLBACK_URL` in Railway env vars
- Ensure frontend URL is added to authorized origins

### Build fails

- Check build logs in Vercel/Railway
- Verify all dependencies in package.json
- Ensure Node.js version is compatible

---

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] MongoDB connection working
- [ ] Razorpay keys configured
- [ ] Google OAuth updated (if using)
- [ ] Test user registration/login
- [ ] Test product browsing
- [ ] Test cart functionality
- [ ] Test checkout and payment
- [ ] Test seller dashboard
- [ ] File uploads working (if applicable)

---

## Alternative: Render (Backend)

If Railway doesn't work, use Render:

1. Go to https://render.com
2. Sign up with GitHub
3. Create "New Web Service"
4. Connect your repository
5. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
6. Add environment variables (same as Railway)
7. Deploy

---

## Cost Estimate

**Free Tier:**
- Vercel: Free (unlimited for personal projects)
- Railway: $5/month free credit (usually enough for small projects)
- Render: Free tier available (with limitations)
- MongoDB Atlas: Free tier (512MB)
- Cloudinary: Free tier (25GB storage)

**Total**: ~$0-5/month for small projects

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs

Good luck with your deployment! 🚀
