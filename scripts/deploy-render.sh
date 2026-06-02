#!/bin/bash
set -e

echo "==> Deploy Kid Adventure Planner to Render"
echo "Make sure you have linked your Git repo to Render Web Service."
echo "This script only validates local files before pushing."

cd "$(dirname "$0")/.."

echo "==> Checking backend files"
test -f backend/Dockerfile || { echo "Missing backend/Dockerfile"; exit 1; }
test -f backend/render.yaml || { echo "Missing backend/render.yaml"; exit 1; }
test -f backend/app/main.py || { echo "Missing backend/app/main.py"; exit 1; }

echo "==> Checking frontend files"
test -f frontend/package.json || { echo "Missing frontend/package.json"; exit 1; }
test -f frontend/next.config.js || { echo "Missing frontend/next.config.js"; exit 1; }

echo "==> All files present. Push to git and Render will auto-deploy."
echo "   git add . && git commit -m 'deploy: scaffold frontend + backend config' && git push"
