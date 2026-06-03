#!/bin/bash
set -e

echo "==> Build and deploy Kid Adventure Planner Frontend to Cloudflare Pages"
cd "$(dirname "$0")/../frontend"

echo "==> Installing dependencies"
npm install

echo "==> Building static export"
npm run build

echo "==> Output directory: frontend/dist"
echo ""
echo "Deploy options:"
echo "  1. Dashboard: Pages > Create a project > Upload assets"
echo "  2. Wrangler CLI: npx wrangler pages deploy dist"
echo ""
echo "Required environment variables in Cloudflare Pages:"
echo "  NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com"
echo "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
