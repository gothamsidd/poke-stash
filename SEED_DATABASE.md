# How to Seed the Database

## Quick Steps to Get Your Pokemon Data

### Option 1: Using Railway Console (Recommended)

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Log in to your account
   - Select your backend project (`poke-stash-production`)

2. **Open the Service**
   - Click on your backend service
   - Go to the **Deployments** tab
   - Find the latest deployment

3. **Open Console/Terminal**
   - Click on **View Logs** or **Open Terminal**
   - Or use Railway's **Console** feature

4. **Run the Seed Command**
   ```bash
   cd backend
   npm run seed
   ```
   
   **OR if you're already in the project root:**
   ```bash
   npm run seed
   ```

5. **Wait for Completion**
   - The script will fetch Pokemon data from PokeAPI
   - This takes 5-10 minutes (it fetches 900+ Pokemon)
   - You'll see progress messages like:
     - `✅ Created: Pikachu | Power: average | Stats: 320 | ₹45`
     - `✅ Seeding complete!`

### Option 2: Using Railway CLI

1. **Install Railway CLI** (if not installed)
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link to Your Project**
   ```bash
   railway link
   ```

4. **Run Seed Command**
   ```bash
   railway run npm run seed
   ```

### Option 3: Local Development (If Backend is Running Locally)

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Make sure .env is configured**
   - Check that `MONGODB_URI` points to your production database
   - Or use your Railway MongoDB connection string

3. **Run Seed**
   ```bash
   npm run seed
   ```

## What the Seed Script Does

- ✅ Creates a default customer account: `customer@pokestash.com` / `customer123`
- ✅ Creates a seller account (with random credentials, not exposed)
- ✅ Fetches 900+ Pokemon from PokeAPI
- ✅ Creates products with:
  - Pokemon stats (HP, Attack, Defense, etc.)
  - Power levels (weak, average, strong, very-strong, legendary)
  - Prices (₹10-₹99)
  - Stock levels
  - Images from PokeAPI

## Verify It Worked

After seeding:
1. Refresh your Vercel site
2. The home page should show:
   - **900+ POKEMON** (instead of 0)
   - **50+ LEGENDARY** (instead of 0)
   - **9 GENERATIONS**
3. Go to `/products` to see all the Pokemon stickers

## Troubleshooting

**If you get connection errors:**
- Make sure your `MONGODB_URI` in Railway environment variables is correct
- Check that MongoDB is accessible from Railway

**If seeding is slow:**
- This is normal! It fetches data from PokeAPI with rate limiting
- Expect 5-10 minutes for 900+ Pokemon

**If you see "0 Pokemon" after seeding:**
- Check the Railway logs for any errors
- Verify the products were created in your MongoDB database
- Make sure the API URL in Vercel matches your Railway backend URL
