#!/usr/bin/env bash
set -euo pipefail

echo "Likely laptop LAN IP addresses:"

if command -v ip >/dev/null 2>&1; then
  ip -o -4 addr show scope global | awk '{split($4, a, "/"); print "  " a[1] "  (" $2 ")"}'
elif command -v ifconfig >/dev/null 2>&1; then
  ifconfig | awk '/inet / && $2 != "127.0.0.1" {print "  " $2}'
else
  echo "  Could not find ip or ifconfig. Check your Wi-Fi network settings."
fi

cat <<'EOF'

Use the Wi-Fi/LAN address from the same network as your phone.
Example Zoiper host: 192.168.1.25:5060
EOF
