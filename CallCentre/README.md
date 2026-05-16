# Local Docker FreePBX Call Center Demo

This is a local-only call center demo for a laptop and phones on the same Wi-Fi.

First version scope:

- Run FreePBX/Asterisk in Docker.
- Register Zoiper phones as SIP extensions.
- Configure internal calling, queue `600`, IVR, voicemail, call logs, and recordings in FreePBX.
- Prepare for a later React dashboard that reads FreePBX/Asterisk call data.

The custom React dashboard is intentionally not included yet. FreePBX is the source of truth for this first version.

## Demo Topology

```text
Phone with Zoiper -- Wi-Fi LAN -- Laptop Docker host -- FreePBX/Asterisk
```

No SIM card, trunk, public number, or internet-facing SIP service is required.

## Files

- `docker-compose.yml` runs FreePBX and MariaDB.
- `.env.example` contains local ports and timezone.
- `scripts/init-secrets.sh` creates local Docker secret files.
- `scripts/install-freepbx.sh` runs the FreePBX installer inside the container.
- `scripts/laptop-ip.sh` prints likely Wi-Fi/LAN IP addresses.
- `docs/setup-freepbx.md` walks through setup, Zoiper login, testing, and firewall fixes.
- `docs/dashboard-plan.md` captures the later React dashboard direction.

## Quick Start

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Create local secrets:

   ```bash
   ./scripts/init-secrets.sh
   ```

3. Start the containers:

   ```bash
   docker compose up -d
   ```

4. Install FreePBX into the running container:

   ```bash
   ./scripts/install-freepbx.sh
   ```

5. Find your laptop IP:

   ```bash
   ./scripts/laptop-ip.sh
   ```

6. Open FreePBX:

   ```text
   http://localhost:8080/admin
   http://LAPTOP_IP:8080/admin
   ```

Then follow [docs/setup-freepbx.md](docs/setup-freepbx.md) to create extensions `1001`, `1002`, `1003`, queue `600`, and the IVR.

## Required Demo Values

Use these exact values in FreePBX:

| Item | Value |
| --- | --- |
| Extension | `1001` Admin/Agent One |
| Extension | `1002` Agent Two |
| Extension | `1003` Agent Three |
| Queue | `600` Support Queue |
| Queue agents | `1001`, `1002`, `1003` |
| IVR option 1 | Support -> Queue `600` |
| IVR option 2 | Accounts -> Extension `1002` |
| IVR option 3 | Admin -> Extension `1001` |
| Suggested IVR test number | `700` via FreePBX Misc Application |

## Ports

| Host Port | Protocol | Purpose |
| --- | --- | --- |
| `8080` | TCP | FreePBX web dashboard HTTP |
| `8443` | TCP | FreePBX web dashboard HTTPS |
| `5060` | UDP/TCP | SIP signalling |
| `10000-20000` | UDP | RTP voice audio |

## Persistent Data

Docker named volumes keep FreePBX configuration and the MariaDB databases. Local bind mounts keep logs and recordings easy to inspect:

- `data/recordings` -> Asterisk call recordings.
- `data/asterisk-logs` -> Asterisk logs.

Do not commit `data/` or `secrets/` contents.
