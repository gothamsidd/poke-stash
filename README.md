# PokeStash

A Pokemon sticker marketplace where you can buy and sell digital Pokemon stickers. Built this as a full-stack project to practice React, Node.js, and payment integrations.

## What it does

You can browse through hundreds of Pokemon stickers, add them to your cart, and purchase them. Sellers can create listings, manage their products, and track sales. The whole payment flow is handled through Razorpay, so you can pay via UPI, cards, netbanking, or wallets.

## Tech stack

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

## Getting started

### Prerequisites

You'll need Node.js installed (v16 or higher works fine). Also need a MongoDB database - you can use MongoDB Atlas (free tier) or run it locally.

### Installation

1. Clone the repo:
```bash
git clone <your-repo-url>
cd mansi
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:

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

4. Seed the database (optional):
```bash
cd backend
npm run seed
```
This adds 900+ Pokemon stickers to your database with all their stats and details.

5. Run the app:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

The app should be running on `http://localhost:3000`.

## Features

- **Product browsing**: Search, filter by category, generation, legendary status, etc.
- **Shopping cart**: Add items, update quantities, apply coupon codes
- **Checkout**: Full payment flow with Razorpay (UPI, cards, netbanking, wallets)
- **Order management**: Track orders, download purchased stickers
- **Seller dashboard**: Create products, manage inventory, view sales
- **User authentication**: Register, login, OAuth with Google
- **Dark mode**: Toggle between light and dark themes
- **AI descriptions**: Auto-generate product descriptions using Gemini

## Default accounts

After seeding, you'll have a default seller account:
- Email: `admin@pokestash.com`
- Password: `admin123`

You can create customer accounts through the registration page.

## Project structure

```
mansi/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── scripts/        # Database seeding scripts
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React contexts
│   │   └── utils/      # Helper functions
│   └── public/
└── README.md
```

## API endpoints

Most endpoints require authentication. Here are the main ones:

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

## Payment setup

1. Create a Razorpay account at https://razorpay.com
2. Get your test API keys from the dashboard
3. Add them to both `backend/.env` and `frontend/.env`
4. For live mode, you'll need to deploy the site and get it approved by Razorpay

Note: QR codes only work in live mode, not test mode.

## Environment variables

Check `backend/env.example` for all required environment variables. Make sure to set up:
- MongoDB connection string
- JWT secret
- Razorpay keys
- Gemini API key (optional, for AI features)
- Google OAuth credentials (optional, for Google login)

## Scripts

**Backend:**
- `npm start` - Start server
- `npm run seed` - Seed database with Pokemon
- `npm run update-prices` - Update all prices to ₹10-₹99 range
- `npm run fix-stock` - Fix products with zero stock

**Frontend:**
- `npm start` - Start dev server
- `npm run build` - Build for production

## Notes

- The app uses test mode for Razorpay by default. Switch to live mode after deployment.
- Product images are stored in `backend/uploads/products/`
- The database seeding script fetches Pokemon data from PokeAPI
- OAuth requires Google Cloud Console setup (see the code for details)

## License

This is a personal project for learning purposes.
