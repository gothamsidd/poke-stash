#!/bin/bash
# Quick check for common PokeStash setup issues. Run from poke-stash folder: ./check-setup.sh

echo "=========================================="
echo "  PokeStash setup check"
echo "=========================================="
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
ISSUES=0

# 1. Backend .env
if [ ! -f "$BACKEND/.env" ]; then
  echo "❌ backend/.env is MISSING"
  echo "   Fix: cd backend && cp env.example .env"
  echo "   Then edit .env and set MONGODB_URI and JWT_SECRET."
  ISSUES=$((ISSUES+1))
else
  echo "✅ backend/.env exists"
  if ! grep -q "MONGODB_URI=.*[^=]$" "$BACKEND/.env" 2>/dev/null && ! grep -q "MONGODB_URI=mongodb" "$BACKEND/.env" 2>/dev/null; then
    echo "   ⚠️  Make sure MONGODB_URI is set to your real MongoDB connection string in backend/.env"
  fi
fi

# 2. Frontend .env (optional but recommended)
if [ ! -f "$FRONTEND/.env" ]; then
  echo "⚠️  frontend/.env is missing (optional)"
  echo "   For local dev the app uses http://localhost:5001/api by default."
  echo "   To be explicit: create frontend/.env with: REACT_APP_API_URL=http://localhost:5001/api"
else
  echo "✅ frontend/.env exists"
  if grep -q "railway" "$FRONTEND/.env" 2>/dev/null; then
    echo "   ⚠️  Your frontend .env still references Railway. For local dev use: REACT_APP_API_URL=http://localhost:5001/api"
    ISSUES=$((ISSUES+1))
  fi
fi

# 3. Backend running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health 2>/dev/null | grep -q 200; then
  echo "✅ Backend is running on port 5001"
else
  echo "❌ Backend is NOT responding at http://localhost:5001"
  echo "   Fix: cd backend && npm run dev (and keep that terminal open)"
  ISSUES=$((ISSUES+1))
fi

# 4. Node modules
if [ ! -d "$BACKEND/node_modules" ]; then
  echo "❌ Backend dependencies not installed"
  echo "   Fix: cd backend && npm install"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Backend node_modules present"
fi
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "❌ Frontend dependencies not installed"
  echo "   Fix: cd frontend && npm install"
  ISSUES=$((ISSUES+1))
else
  echo "✅ Frontend node_modules present"
fi

echo ""
if [ $ISSUES -gt 0 ]; then
  echo "Found $ISSUES problem(s). Fix the ❌ items above, then run backend (npm run dev) and frontend (npm start)."
  echo "See TROUBLESHOOTING.md for full steps."
  exit 1
else
  echo "Basic checks passed. If the app still doesn’t show data:"
  echo "  1. Use http://localhost:3000 (not the deployed site)."
  echo "  2. Seed products once: cd backend && npm run seed"
  exit 0
fi
