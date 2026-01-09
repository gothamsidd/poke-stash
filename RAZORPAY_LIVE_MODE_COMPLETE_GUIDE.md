# 🚀 Razorpay Live Mode Setup - Complete Guide

Since your website is deployed, you can now get Razorpay Live Mode approval!

---

## 📋 STEP 1: Get Razorpay Live Mode Approval

### 1.1 Go to Razorpay Dashboard
1. Visit: https://dashboard.razorpay.com/
2. Login with your Razorpay account

### 1.2 Submit Website for Approval
1. Go to **Settings** → **Account & Settings** → **Website Details**
2. Add your deployed website URL:
   - **Vercel URL**: `https://your-vercel-url.vercel.app`
   - **Railway Backend**: `https://poke-stash-production.up.railway.app`
3. Complete KYC (if not done):
   - Go to **Settings** → **Account & Settings** → **KYC Details**
   - Upload required documents
   - Wait for approval (usually 24-48 hours)

### 1.3 Activate Live Mode
1. Once KYC is approved, go to **Settings** → **API Keys**
2. Click **"Activate Live Mode"** or **"Generate Live Keys"**
3. You'll see:
   - ✅ **Live Key ID** (starts with `rzp_live_`)
   - ✅ **Live Key Secret** (long string)

⚠️ **IMPORTANT**: 
- Live keys process **REAL MONEY**
- Keep them secure - never share publicly
- Copy both keys immediately (you can't see the secret again)

---

## 📋 STEP 2: Update Railway Backend (Production)

### 2.1 Add Live Keys to Railway
1. Go to Railway dashboard: https://railway.app/
2. Click on your **poke-stash** service
3. Go to **Settings** → **Variables**
4. Find and update these variables:

   ```
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_live_secret_key_here
   ```

5. Click **Save** - Railway will auto-redeploy (wait 1-2 minutes)

---

## 📋 STEP 3: Update Vercel Frontend (Production)

### 3.1 Add Live Key to Vercel
1. Go to Vercel dashboard: https://vercel.com/
2. Click on your **poke-stash** project
3. Go to **Settings** → **Environment Variables**
4. Find and update this variable:

   ```
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
   ```

5. Click **Save**
6. Go to **Deployments** tab
7. Click **"Redeploy"** on the latest deployment
8. Wait for deployment to complete (2-3 minutes)

---

## 📋 STEP 4: Verify Live Mode is Active

### 4.1 Check Backend
1. Visit: `https://poke-stash-production.up.railway.app/api/health`
2. Should show: `{"status": "OK", ...}`
3. Check Railway logs - should show:
   ```
   ✅ Razorpay keys loaded - Payment gateway ready
   ```

### 4.2 Check Frontend
1. Visit your Vercel URL
2. Go to checkout page
3. **Should NOT show "Test Mode" badge** in top right
4. All payment methods should be available:
   - ✅ UPI (with QR code)
   - ✅ Cards
   - ✅ Netbanking
   - ✅ Wallets

---

## 📋 STEP 5: Test Live Mode (Carefully!)

⚠️ **WARNING**: Live mode processes **REAL MONEY**!

### Safe Testing:
1. Use **small amounts** (₹1, ₹5) for initial tests
2. Test with **your own payment methods**
3. **Refund** test transactions immediately if needed
4. Monitor transactions in Razorpay dashboard

### Test Payment Flow:
1. Add a product to cart
2. Go to checkout
3. Fill shipping address
4. Click "Proceed to Payment"
5. Use your real UPI/Card/Netbanking
6. Complete payment
7. Verify order shows as "Delivered" in "My Orders"

---

## 🔄 Differences: Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| **Key Prefix** | `rzp_test_` | `rzp_live_` |
| **Money** | Fake/Test | **REAL MONEY** ⚠️ |
| **QR Codes** | ❌ Not available | ✅ Works |
| **UPI** | Test UPI IDs only | Real UPI payments |
| **Cards** | Test cards only | Real card payments |
| **Netbanking** | Test mode | Real transactions |
| **Wallets** | Test mode | Real wallet payments |
| **Approval** | Instant | Requires KYC + Website approval |

---

## 🔧 Troubleshooting

### Issue: "Payment service is not configured"
- ✅ Check if keys are correctly added to Railway variables
- ✅ Verify keys start with `rzp_live_` (not `rzp_test_`)
- ✅ Wait for Railway redeploy to complete
- ✅ Check Railway logs for errors

### Issue: "Invalid API Key"
- ✅ Verify you copied the complete key (no extra spaces)
- ✅ Check if you're using Live keys (not Test keys)
- ✅ Ensure KYC is completed in Razorpay dashboard
- ✅ Make sure website is approved in Razorpay

### Issue: QR Code still not working
- ✅ QR codes ONLY work in Live Mode
- ✅ Make sure you're using `rzp_live_` keys
- ✅ Wait for both Railway and Vercel to redeploy
- ✅ Clear browser cache and try again

### Issue: Still showing "Test Mode" badge
- ✅ Check Vercel environment variable: `REACT_APP_RAZORPAY_KEY_ID`
- ✅ Make sure it starts with `rzp_live_`
- ✅ Redeploy Vercel after updating variable
- ✅ Clear browser cache

---

## 🔐 Security Best Practices

1. ✅ **Never commit** `.env` files to git
2. ✅ **Keep keys secure** and private
3. ✅ **Use test mode** for development
4. ✅ **Use live mode** only in production
5. ✅ **Rotate keys** periodically
6. ✅ **Monitor transactions** in Razorpay dashboard
7. ✅ **Set up webhooks** for payment notifications (optional)

---

## 📞 Need Help?

- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Dashboard**: https://dashboard.razorpay.com/
- **Razorpay Support**: support@razorpay.com
- **Railway Support**: https://railway.app/help
- **Vercel Support**: https://vercel.com/support

---

## ✅ Checklist

Before going live, make sure:

- [ ] KYC is completed and approved
- [ ] Website URL is added to Razorpay dashboard
- [ ] Live keys are generated
- [ ] Railway backend has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (live keys)
- [ ] Vercel frontend has `REACT_APP_RAZORPAY_KEY_ID` (live key)
- [ ] Both Railway and Vercel are redeployed
- [ ] Test mode badge is gone from frontend
- [ ] Tested with small amount (₹1-₹5)
- [ ] Payment flow works end-to-end
- [ ] Orders show as "Delivered" after payment

---

**🎉 Once all steps are complete, your website will accept real payments!**
