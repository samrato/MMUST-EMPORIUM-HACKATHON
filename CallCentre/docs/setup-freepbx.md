# FreePBX Setup Guide

This guide configures the first demo version after `docker compose up -d` and `./scripts/install-freepbx.sh`.

## 1. Open FreePBX

Open one of these in your browser:

```text
http://localhost:8080/admin
http://LAPTOP_IP:8080/admin
```

On first launch, FreePBX asks you to create the administrator account. Use a password you can remember for the demo.

After logging in, click **Apply Config** whenever FreePBX shows the red apply button.

## 2. Set Network and RTP Values

Go to **Settings > Asterisk SIP Settings**.

Set:

| Field | Value |
| --- | --- |
| External Address | Your laptop Wi-Fi/LAN IP, for example `192.168.1.25` |
| Local Networks | Your Wi-Fi subnet, for example `192.168.1.0/24` |
| RTP Port Ranges Start | `10000` |
| RTP Port Ranges End | `20000` |
| Chan PJSIP Port | `5060` |

Submit and click **Apply Config**.

This step is important because SIP audio uses IP addresses inside the call messages. If FreePBX advertises the Docker container IP instead of the laptop IP, phones may register but calls can have one-way or no audio.

## 3. Create SIP Extensions

Go to **Applications > Extensions > Add Extension > Add New PJSIP Extension**.

Create these extensions:

| Extension | Display Name | Suggested Secret |
| --- | --- | --- |
| `1001` | `Admin/Agent One` | `ChangeMe1001!` |
| `1002` | `Agent Two` | `ChangeMe1002!` |
| `1003` | `Agent Three` | `ChangeMe1003!` |

For each extension:

1. Set **User Extension** to the extension number.
2. Set **Display Name**.
3. Set **Secret** to the chosen SIP password.
4. Open the **Voicemail** tab and set **Enabled** to `Yes`.
5. Set a voicemail PIN, for example `1001`, `1002`, or `1003`.
6. Open the **Advanced** tab and set these PJSIP NAT options if visible:
   - **RTP Symmetric**: `Yes`
   - **Rewrite Contact**: `Yes`
   - **Force rport**: `Yes`
7. Open the **Recording Options** tab and set internal call recording to `Force` or `Yes`.
8. Submit and click **Apply Config**.

## 4. Create Support Queue 600

Go to **Applications > Queues > Add Queue**.

Set:

| Field | Value |
| --- | --- |
| Queue Number | `600` |
| Queue Name | `Support Queue` |
| Ring Strategy | `ringall` |
| Static Agents | `1001,0`, `1002,0`, `1003,0` |
| Join Announcement | None for the first test |
| Call Recording | `Yes` or `Force` |

Submit and click **Apply Config**.

The queue status comes from agent registration and call state:

- Online: the SIP extension is registered.
- Busy: the extension is on a call.
- Offline/unavailable: the phone is not registered.

You can inspect queue status from the terminal:

```bash
docker compose exec freepbx asterisk -rx "queue show 600"
```

## 5. Create IVR

FreePBX IVRs normally need an announcement recording.

### Create the IVR Prompt

Go to **Admin > System Recordings**.

Create or upload a recording that says:

```text
Welcome to the local call center demo.
Press 1 for Support.
Press 2 for Accounts.
Press 3 for Admin.
```

Save it as `Local Demo IVR`.

### Create the IVR Menu

Go to **Applications > IVR > Add IVR**.

Set:

| Field | Value |
| --- | --- |
| IVR Name | `Local Demo IVR` |
| Announcement | `Local Demo IVR` |
| Direct Dial | Disabled for a simple first test |
| Invalid Retries | `2` |
| Timeout | `5` |

Add entries:

| Digit | Destination |
| --- | --- |
| `1` | Queues -> `600 Support Queue` |
| `2` | Extensions -> `1002 Agent Two` |
| `3` | Extensions -> `1001 Admin/Agent One` |

Submit and click **Apply Config**.

### Add an Internal IVR Test Number

Because this demo has no public phone number yet, create an internal feature code for the IVR.

Go to **Applications > Misc Applications**.

Set:

| Field | Value |
| --- | --- |
| Description | `Local Demo IVR` |
| Feature Code | `700` |
| Destination | IVR -> `Local Demo IVR` |

Now any registered extension can dial `700` to test the IVR.

## 6. Enable Call Logs and Recordings

FreePBX normally includes CDR call logs. Check:

- **Reports > CDR Reports** for call logs.
- **Reports > Call Recordings** if the recordings module is available.

The Docker stack also persists recordings on your laptop:

```text
data/recordings
```

Asterisk logs are persisted here:

```text
data/asterisk-logs
```

Useful terminal checks:

```bash
docker compose exec freepbx asterisk -rx "pjsip show endpoints"
docker compose exec freepbx asterisk -rx "core show channels"
docker compose exec freepbx asterisk -rx "queue show 600"
```

## 7. Login from Zoiper

Install Zoiper on phones connected to the same Wi-Fi as your laptop.

For extension `1001`, use:

| Zoiper Field | Value |
| --- | --- |
| Username | `1001` |
| Password | The SIP secret from FreePBX, for example `ChangeMe1001!` |
| Domain / Host | Your laptop IP, for example `192.168.1.25` |
| Port | `5060` |
| Transport | UDP first, TCP if UDP is blocked |
| Outbound proxy | Leave empty |

Repeat with extension `1002` and `1003` on other phones, Zoiper desktop, or another SIP app.

If Zoiper cannot register:

- Confirm the phone and laptop are on the same Wi-Fi.
- Disable Wi-Fi client isolation on the router.
- Confirm Linux firewall allows port `5060`.
- Confirm FreePBX has **Apply Config** completed.

## 8. Test Calls

### Test 1001 Calling 1002

1. Register Zoiper as `1001` on one device.
2. Register Zoiper as `1002` on another device.
3. From `1001`, dial `1002`.
4. Answer on `1002`.
5. Check **Reports > CDR Reports**.
6. Check `data/recordings` if recording was enabled.

### Test Queue 600

1. Register at least two agents.
2. From any registered extension, dial `600`.
3. The available queue agents should ring.
4. Answer from one agent.
5. Run:

   ```bash
   docker compose exec freepbx asterisk -rx "queue show 600"
   ```

### Test IVR

1. From any registered extension, dial `700`.
2. Press `1` for Support. It should send the call to queue `600`.
3. Dial `700` again and press `2`. It should ring extension `1002`.
4. Dial `700` again and press `3`. It should ring extension `1001`.

## 9. Linux Firewall Fixes

### Ubuntu UFW

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 5060/udp
sudo ufw allow 5060/tcp
sudo ufw allow 10000:20000/udp
sudo ufw reload
sudo ufw status numbered
```

### Fedora/RHEL Firewalld

```bash
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --add-port=8443/tcp --permanent
sudo firewall-cmd --add-port=5060/udp --permanent
sudo firewall-cmd --add-port=5060/tcp --permanent
sudo firewall-cmd --add-port=10000-20000/udp --permanent
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

### Check Listening Ports

```bash
docker compose ps
ss -lunpt | grep -E '(:5060|:8080|:8443)'
```

### Common Audio Fixes

If calls connect but there is no audio:

1. Recheck **Settings > Asterisk SIP Settings**:
   - External Address is the laptop IP.
   - Local Networks includes your Wi-Fi subnet.
   - RTP range is `10000-20000`.
2. Confirm firewall allows `10000:20000/udp`.
3. In each PJSIP extension, set **RTP Symmetric**, **Rewrite Contact**, and **Force rport** to `Yes`.
4. Make sure the phone is not on mobile data or a guest Wi-Fi network.
5. Restart the stack after major network changes:

   ```bash
   docker compose restart freepbx
   ```
