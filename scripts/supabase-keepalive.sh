#!/usr/bin/env bash
# Pings Supabase with a real DB query so the free-tier project isn't paused for inactivity.
set -euo pipefail
: "${NEXT_PUBLIC_SUPABASE_URL:?}" "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?}"
curl -fsS "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/pools?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" >/dev/null
echo "$(date -Is) supabase keepalive ok"
