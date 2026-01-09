# Razorpay Live Mode Setup Guide

## Step 1: Get Live API Keys from Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Login to your Razorpay account
3. Navigate to **Settings** → **API Keys**
4. You'll see two sections:
   - **Test Mode Keys** (currently using - starts with `rzp_test_`)
   - **Live Mode Keys** (what you need)
5. Click **"Generate Live Key"** or **"Activate Live Mode"**
6. Copy your **Live Key ID** (starts with `rzp_live_`)
7. Copy your **Live Key Secret** (long string)

⚠️ **Important**: 
- Live keys process REAL money
- Keep them secure and never commit to git
- You may need to complete KYC verification first

---

## Step 2: Update Backend Environment Variables

1. Open `backend/.env` file
2. Find these lines:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_test_secret_key
   ```
3. Replace with your LIVE keys:
   ```
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_live_secret_key_here
   ```
4. Save the file

---

## Step 3: Update Frontend Environment Variables

1. Open `frontend/.env` file
2. Find this line:
   ```
   REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   ```
3. Replace with your LIVE key:
   ```
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
   ```
4. Save the file

---

## Step 4: Restart Both Servers

### Backend Server:
```bash
cd backend
# Stop current server (Ctrl+C if running)
npm start
```

### Frontend Server:
```bash
cd frontend
# Stop current server (Ctrl+C if running)
npm start
```

---

## Step 5: Verify Live Mode is Active

1. Check backend terminal - should show:
   ```
   ✅ Razorpay keys loaded - Payment gateway ready
   ```

2. Check frontend - when you go to checkout:
   - Should NOT show "Test Mode" badge
   - QR codes will work
   - All payment methods will process real transactions

---

## Differences: Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Key Prefix | `rzp_test_` | `rzp_live_` |
| Money | Fake/Test | **REAL MONEY** |
| QR Codes | ❌ Not available | ✅ Works |
| UPI | Test UPI IDs only | Real UPI payments |
| Cards | Test cards only | Real card payments |
| Netbanking | Test mode | Real transactions |
| Wallets | Test mode | Real wallet payments |

---

## Testing in Live Mode

⚠️ **WARNING**: Live mode processes REAL money!

### Safe Testing Options:
1. Use small amounts (₹1, ₹5) for testing
2. Test with your own payment methods
3. Refund test transactions immediately
4. Use Razorpay's test mode for development

### To Switch Back to Test Mode:
Simply replace the live keys with test keys in both `.env` files and restart servers.

---

## Troubleshooting

### Issue: "Payment service is not configured"
- Check if keys are correctly added to `backend/.env`
- Restart backend server
- Verify keys start with `rzp_live_` (not `rzp_test_`)

### Issue: "Invalid API Key"
- Verify you copied the complete key (no extra spaces)
- Check if you're using Live keys (not Test keys)
- Ensure KYC is completed in Razorpay dashboard

### Issue: QR Code still not working
- QR codes ONLY work in Live Mode
- Make sure you're using `rzp_live_` keys
- Restart both servers after changing keys

---

## Security Best Practices

1. ✅ Never commit `.env` files to git
2. ✅ Keep keys secure and private
3. ✅ Use test mode for development
4. ✅ Use live mode only in production
5. ✅ Rotate keys periodically
6. ✅ Monitor transactions in Razorpay dashboard

---

## Need Help?

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Dashboard: https://dashboard.razorpay.com/
- Support: support@razorpay.com
