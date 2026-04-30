#!/bin/bash
set -e

echo "⏪ Starting Rollback Procedure..."

# 1. Git Revert
echo "🔄 Reverting to last stable commit..."
git revert HEAD --no-edit

# 2. Push to Main
echo "🚀 Pushing revert to trigger Vercel deployment..."
# Note: This assumes the user is on 'main' branch
git push origin main

# 3. Emergency Vercel Rollback CLI
echo "🆘 Forcing Vercel rollback (CLI fallback)..."
# This requires Vercel CLI to be logged in and linked
vercel deploy --prod --prebuilt || echo "⚠️ CLI rollback failed. Please use the Vercel Dashboard for instant rollback if needed."

echo "✅ Rollback initiated."
