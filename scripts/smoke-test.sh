#!/bin/bash
set -e

API_URL="${API_URL:-http://localhost:8001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "==> Smoke Test Kid Adventure Planner"
echo "API: $API_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

echo "--> 1. Backend health check"
curl -s "$API_URL/health" | jq . || echo "Health check failed"

echo ""
echo "--> 2. List AI providers"
curl -s "$API_URL/api/v1/ai/providers" | jq '. | length' || echo "Providers check failed"

echo ""
echo "--> 3. List children (requires auth - may 401)"
curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/children" || true

echo ""
echo "==> Smoke test complete"
