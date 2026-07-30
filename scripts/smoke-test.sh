#!/usr/bin/env bash
# Smoke test: verifies the deployed app responds correctly on key routes.
# Usage:
#   ./scripts/smoke-test.sh                          # tests https://bellcurve-baby.exe.xyz
#   BASE_URL=http://localhost:8000 ./scripts/smoke-test.sh
set -u
BASE_URL="${BASE_URL:-https://bellcurve-baby.exe.xyz}"
PASS=0; FAIL=0

check() { # name  url  expected_statuses(comma-sep)  [required_body_substring]
  local name="$1" url="$2" want="$3" body_grep="${4:-}"
  local code body
  code=$(curl -s -o /tmp/smoke-body -w '%{http_code}' -L --max-time 20 "$url")
  body=$(cat /tmp/smoke-body)
  local status_ok=1
  IFS=',' read -ra codes <<< "$want"
  for c in "${codes[@]}"; do [ "$code" = "$c" ] && status_ok=0; done
  local body_ok=0
  [ -n "$body_grep" ] && { grep -q "$body_grep" /tmp/smoke-body || body_ok=1; }
  if [ $status_ok -eq 0 ] && [ $body_ok -eq 0 ]; then
    echo "PASS  $name ($code)"
    PASS=$((PASS+1))
  else
    echo "FAIL  $name — got $code (want $want)${body_grep:+; body missing '$body_grep'}"
    FAIL=$((FAIL+1))
  fi
}

echo "Smoke testing $BASE_URL"
echo "---"

check "home page"            "$BASE_URL/"                                  200       "bellcurve"
check "login page"           "$BASE_URL/auth/login"                        200
check "sign-up page"         "$BASE_URL/auth/sign-up"                      200
check "forgot password page" "$BASE_URL/auth/forgot-password"              200
check "announcement page"    "$BASE_URL/announcement"                      200
# check-slug is auth-gated by middleware: signed-out users get redirected to
# /auth/login. When run with a session cookie it returns JSON instead.
check "check-slug API (auth-gated)" \
  "$BASE_URL/api/baby/check-slug?slug=smoke-test-no-such-pool-xyz"         200,400  "/auth/login"
check "stripe webhook rejects GET" \
  "$BASE_URL/api/stripe/webhook"                                           400,405
check "guesses page (auth-gated, no 500)" \
  "$BASE_URL/guesses"                                                      200,307
check "unknown pool 404s, not 500s" \
  "$BASE_URL/baby/no-such-pool-smoke-xyz"                                  404

echo "---"
echo "$PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
