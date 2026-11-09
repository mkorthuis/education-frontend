#!/usr/bin/env bash
# Checks that the live site and API answer, and with real content: the home and a district page,
# and the API's district list and a statewide figure from the database. Each check gets three tries,
# 20 seconds apart, so one slow moment doesn't count as down. Exits 1 if any check fails.
# Run by .github/workflows/uptime.yml every 10 minutes; also works by hand.
set -u

SITE=${SITE:-https://www.nhfacts.com}
API=${API:-https://api.nhfacts.com/api/v1}
failed=0

# check NAME URL TEXT: the response must be HTTP 200 and contain TEXT
check() {
  local code=""
  for attempt in 1 2 3; do
    local body
    body=$(curl -sS --max-time 20 -A nhfacts-uptime-check -w '\n%{http_code}' "$2" 2>/dev/null) || body=$'\nnone'
    code=${body##*$'\n'}
    if [ "$code" = 200 ] && grep -qF -- "$3" <<<"$body"; then
      echo "ok    $1"
      return
    fi
    [ "$attempt" -lt 3 ] && sleep 20
  done
  echo "::error::$1 is down: $2 answered HTTP $code, or without the text: $3"
  failed=1
}

check "Home page" "$SITE/" "Education Facts"
check "District page" "$SITE/district/111" "Education Facts"
check "API: districts" "$API/location/district?is_public=true" '"name":"Concord"'
check "API: statewide cost per pupil" "$API/finance/per-pupil/state" '"year"'

exit $failed
