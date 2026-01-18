# PokeStash

A Pokemon sticker marketplace I built to learn full-stack development. You can browse hundreds of Pokemon stickers, add them to your cart, and buy them. Sellers can list their products, manage inventory, and see their sales. Payments are handled through Razorpay, so you can pay with UPI, cards, netbanking, or wallets.

## What I Used

**Frontend:**
- React for the UI
- React Router for navigation
- Context API for state management
- Axios for API calls

**Backend:**
- Node.js with Express
- MongoDB for the database
- JWT for authentication
- Razorpay for payments
- Google Gemini API for AI-generated product descriptions

## Getting Started

You'll need Node.js (v16 or higher) and a MongoDB database. You can use MongoDB Atlas (free tier) or run it locally.

### Installation

1. Clone the repo and install dependencies:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Set up environment variables:

Create `backend/.env`:
```
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=some_random_secret_key
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key
```

3. (Optional) Seed the database with Pokemon stickers:

```bash
cd backend
npm run seed
```

This adds 900+ Pokemon stickers with all their stats and details. Takes about 5-10 minutes.

4. Run the app:

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

Open `http://localhost:3000` in your browser.

## Features

- Browse and search Pokemon stickers with filters (category, generation, rarity, etc.)
- Shopping cart with quantity management
- Full checkout flow with Razorpay (supports UPI, cards, netbanking, wallets)
- Order tracking and management
- Seller dashboard to create products, manage inventory, and view sales
- User authentication (register, login, Google OAuth)
- Dark mode toggle
- AI-generated product descriptions using Gemini

## Test Account

After seeding the database, you can use this test account:

- **Email:** `customer@pokestash.com`
- **Password:** `customer123`
- **Role:** Customer

You can also create your own accounts through the registration page.

## Project Structure

```
poke-stash/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Database seeding scripts
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   └── utils/       # Helper functions
│   └── public/
└── README.md
```

## API Endpoints

Most endpoints require authentication. Main ones:

**Auth:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Products:**
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

**Orders:**
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

**Payments:**
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

**Cart:**
- `GET /api/users/cart` - Get cart
- `POST /api/users/cart` - Add to cart
- `PUT /api/users/cart/:itemId` - Update quantity
- `DELETE /api/users/cart/:itemId` - Remove item

## Payment Setup

1. Create a Razorpay account at https://razorpay.com
2. Get your test API keys from the dashboard
3. Add them to both `backend/.env` and `frontend/.env`
4. For live mode, deploy the site and get it approved by Razorpay

Note: QR codes only work in live mode, not test mode.

## Environment Variables

Check `backend/env.example` for all required environment variables.

**Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API secret key

**Optional:**
- `GEMINI_API_KEY` - For AI-generated product descriptions
- `GOOGLE_CLIENT_ID` - For Google OAuth login
- `GOOGLE_CLIENT_SECRET` - For Google OAuth login
- `SESSION_SECRET` - Secret for session management

## Available Scripts

**Backend:**
- `npm start` - Start server
- `npm run seed` - Seed database with Pokemon
- `npm run update-prices` - Update all prices to ₹10-₹99 range
- `npm run fix-stock` - Fix products with zero stock
- `npm run fix-test-account` - Reset test account password

**Frontend:**
- `npm start` - Start dev server
- `npm run build` - Build for production

## Notes

- The app uses test mode for Razorpay by default. Switch to live mode after deployment.
- Product images are stored in `backend/uploads/products/`
- The database seeding script fetches Pokemon data from PokeAPI
- OAuth requires Google Cloud Console setup

## License

This is a personal project for learning purposes.
