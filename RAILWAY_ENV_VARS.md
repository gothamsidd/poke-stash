# Railway Environment Variables - Copy & Paste

Copy these variables one by one into Railway Settings → Variables:

```
PORT=5001
```

```
NODE_ENV=production
```

```
MONGODB_URI=your_mongodb_atlas_connection_string
```
(Replace with your actual MongoDB Atlas connection string)

```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```
(Use a long random string - you can generate one at https://randomkeygen.com/)

```
JWT_EXPIRE=7d
```

```
RAZORPAY_KEY_ID=your_razorpay_key_id
```
(Your Razorpay test or live key ID)

```
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```
(Your Razorpay test or live key secret)

```
GEMINI_API_KEY=your_gemini_api_key
```
(Optional - only if using AI features)

```
FRONTEND_URL=https://your-frontend.vercel.app
```
(You'll update this after deploying frontend - use placeholder for now: https://placeholder.vercel.app)

```
SESSION_SECRET=your_session_secret_key_change_this
```
(Use a long random string)

```
GOOGLE_CLIENT_ID=your_google_client_id
```
(Only if using Google OAuth)

```
GOOGLE_CLIENT_SECRET=your_google_client_secret
```
(Only if using Google OAuth)

```
GOOGLE_CALLBACK_URL=https://your-backend-url.railway.app/api/auth/google/callback
```
(Update this with your actual Railway URL after you get it)

---

## Quick Steps:

1. **After build completes**, click on "poke-stash" service
2. Go to **Settings** tab
3. Scroll to **"Root Directory"** → Set to: `backend`
4. Go to **Variables** tab
5. Click **"New Variable"** for each variable above
6. After adding all variables, Railway will auto-redeploy
7. Go to **Settings** → **Networking** → **Generate Domain**
8. Copy your Railway URL (e.g., `poke-stash-production.up.railway.app`)
9. Update `GOOGLE_CALLBACK_URL` and `FRONTEND_URL` with actual URLs

---

## Important Notes:

- Don't add quotes around values
- Replace placeholder values with your actual keys
- Railway will redeploy automatically after adding variables
- Check build logs if deployment fails
- Your backend URL will be something like: `https://poke-stash-production.up.railway.app`
