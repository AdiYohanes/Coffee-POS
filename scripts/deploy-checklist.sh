#!/bin/bash
set -e

echo "🚀 Starting Pre-deployment Checklist..."

# 1. Environment Check
echo "🔍 Checking Environment Variables..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ Warning: DATABASE_URL is not set in local shell. Ensure it is set in Vercel."
fi

# 2. Linting
echo "🧹 Running Linter..."
npm run lint

# 3. Build Verification
echo "🏗️ Verifying Production Build..."
npm run build

# 4. DB Connection Verification (using health check logic if possible)
echo "📡 Verifying DB Connectivity..."
# Attempt to run the verify script if it exists
if [ -f "src/db/verify.ts" ]; then
  npx tsx src/db/verify.ts
fi

echo "✅ Pre-deployment checklist passed!"
