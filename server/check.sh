#!/bin/sh
# The site's checks against a running server: CI runs them on the image, and the same script checks justech.uk after
# a deploy.  Usage: server/check.sh [base URL, default http://127.0.0.1:8080] [contact: 503 (no key, CI) | skip]
# Exits non-zero on the first failure, naming it.
B="${1:-http://127.0.0.1:8080}"; CONTACT="${2:-503}"; fail=0
check() { # name, expected, actual
  if [ "$2" = "$3" ]; then echo "ok    $1 ($3)"; else echo "FAIL  $1: expected $2, got $3"; fail=1; fi; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
check 'GET /' 200 "$(code "$B/")"
check '/ is the landing' 1 "$(curl -s "$B/" | grep -c '<title>JusTech · ')"
check 'GET /insight/' 200 "$(code "$B/insight/")"
check 'GET /privacy/' 200 "$(code "$B/privacy/")"
check 'GET /insight -> /insight/' 301 "$(code "$B/insight")"
check 'GET /healthz' ok "$(curl -s "$B/healthz")"
check 'GET a missing page' 404 "$(code "$B/no/such/page")"
check 'the 404 page' 1 "$(curl -s "$B/no/such/page" | grep -c '<title>Not found · JusTech</title>')"
check 'font cache' 'public, max-age=31536000, immutable' "$(curl -s -o /dev/null -w '%header{cache-control}' "$B/assets/system/fonts/BricolageGrotesque-Variable.woff2")"
check 'nosniff' nosniff "$(curl -s -o /dev/null -w '%header{x-content-type-options}' "$B/")"
check 'the server is not served' 404 "$(code "$B/server/server.mjs")"
# nothing but the site (30 Oct: Coolify's docker-compose.yaml answered 200); on justech.uk any of these failing means
# a leak, and a 200 for .env means the key in it is rotated
for p in docker-compose.yaml docker-compose.yml .env .env.production .git/HEAD .github/workflows/image.yml .nixpacks/ docs/ tests/ Dockerfile .dockerignore README.md server/check.sh; do
  check "not served: /$p" 404 "$(code "$B/$p")"
done
if [ "$CONTACT" != skip ]; then
  check "POST /api/contact" "$CONTACT" "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"CI","email":"ci@example.com","message":"check","topic":"Something else"}' "$B/api/contact")"
fi
check 'POST /api/contact, bad email' 422 "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"CI","email":"x","message":"check"}' "$B/api/contact")"
check 'POST /api/e' 204 "$(code -X POST -H 'Content-Type: text/plain' -d '{}' "$B/api/e")"
exit $fail
