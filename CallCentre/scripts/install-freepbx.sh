#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f secrets/freepbxuser_password.txt ]]; then
  echo "Missing secrets/freepbxuser_password.txt. Run ./scripts/init-secrets.sh first." >&2
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "Waiting for MariaDB to accept connections..."
db_ready=0
for _ in {1..60}; do
  if docker compose exec -T db mariadb-admin ping -h 127.0.0.1 --silent >/dev/null 2>&1; then
    db_ready=1
    break
  fi
  sleep 2
done

if [[ "$db_ready" != "1" ]]; then
  echo "MariaDB was not ready after 120 seconds. Check docker compose logs db." >&2
  exit 1
fi

if ! docker compose ps --status running --services | grep -qx freepbx; then
  echo "The freepbx container is not running. Run docker compose up -d first." >&2
  exit 1
fi

DB_PASS="$(tr -d '\r\n' < secrets/freepbxuser_password.txt)"

echo "Running FreePBX installer. This can take several minutes on first boot..."
docker compose exec -T -w /usr/local/src/freepbx freepbx \
  php install -n \
  --dbuser=freepbxuser \
  --dbpass="$DB_PASS" \
  --dbhost=db

echo "FreePBX install command finished."
echo "Open http://localhost:${FREEPBX_HTTP_PORT:-8080}/admin and complete the first admin login setup."
