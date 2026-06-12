#!/usr/bin/env bash
# Verificación de uptime para cron / UptimeRobot / Better Stack.
# Uso: ./scripts/uptime-check.sh [BASE_URL]
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
READY_URL="${BASE_URL}/api/v1/health/ready"
LIVE_URL="${BASE_URL}/api/v1/health/live"

check() {
  local url="$1"
  local label="$2"
  local code
  code=$(curl -fsS -o /dev/null -w '%{http_code}' "$url" || echo "000")
  if [[ "$code" != "200" ]]; then
    echo "FAIL $label ($url) status=$code"
    return 1
  fi
  echo "OK $label ($url)"
}

check "$LIVE_URL" "liveness"
check "$READY_URL" "readiness"
echo "Uptime check passed for $BASE_URL"
