#!/usr/bin/env bash
set -euo pipefail

mkdir -p secrets data/recordings data/asterisk-logs

write_secret() {
  local path="$1"
  local label="$2"

  if [[ -f "$path" ]]; then
    echo "Keeping existing $label at $path"
    return
  fi

  umask 077
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 > "$path"
  else
    date +%s%N | sha256sum | awk '{print $1}' > "$path"
  fi
  echo "Created $label at $path"
}

write_secret "secrets/mysql_root_password.txt" "MariaDB root password"
write_secret "secrets/freepbxuser_password.txt" "FreePBX database password"

if [[ ! -f secrets/sasl_passwd.txt ]]; then
  umask 077
  printf '[smtp-server-fqdn]:587 user@example.com:app-password\n' > secrets/sasl_passwd.txt
  echo "Created placeholder postfix SASL secret at secrets/sasl_passwd.txt"
else
  echo "Keeping existing postfix SASL secret at secrets/sasl_passwd.txt"
fi

echo "Secrets and data directories are ready."
