#!/bin/bash
set -e

echo "==> Build and deploy Kid Adventure Planner Frontend to Cloudflare Pages"
cd "$(dirname "$0")/../frontend"

echo "==> Installing dependencies"
npm install

echo "==> Building static export"
npm run build

echo "==> Output directory: frontend/dist"
echo "Upload 'frontend/dist' to Cloudflare Pages via:"
echo "  - Dashboard: Pages > Create a project > Upload assets"
echo "  - Or Wrangler CLI: npx wrangler pages deploy dist"
