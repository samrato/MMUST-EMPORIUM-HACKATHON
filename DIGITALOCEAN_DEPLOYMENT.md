# 🚀 AFYAROOT — DigitalOcean Deployment Guide

This guide walks you through deploying the complete **AFYAROOT Multi-Channel Health Stack** (Frontend PWA, MKFR Backend API, SMS Gateway, and MongoDB) onto a **DigitalOcean Droplet** using Docker Compose.

---

## 🏗️ System Architecture on DigitalOcean

```text
                                 [ DigitalOcean Droplet (Ubuntu 24.04) ]
                                ┌──────────────────────────────────────┐
Internet (Users / Patients) ───►│ Port 80 / 443 : Nginx + Web PWA     │
                                │   │                                  │
                                │   ├──► /api/* ──► Backend (Port 5000)│
                                │                                      │
GSM Network (SIM800 / SMS) ────►│ Port 4000 : SMS Gateway + MQTT Bridge│
                                │   │                                  │
                                │   └──► MongoDB (Port 27017)          │
                                └──────────────────────────────────────┘
```

---

## Step 1: Create a DigitalOcean Droplet

1. Log into your [DigitalOcean Dashboard](https://cloud.digitalocean.com/).
2. Click **Create** > **Droplets**.
3. Choose the following configuration:
   - **Region**: Closest to Kenya / your users (e.g., *Frankfurt*, *London*, or *Bangalore*).
   - **Image**: **Ubuntu 24.04 LTS (x64)**.
   - **Size**: **Basic Droplet** (Minimum **2 GB RAM / 1 CPU** recommended for building all images smoothly, ~$12/month).
   - **Authentication**: **SSH Key** (Recommended) or Password.
4. Click **Create Droplet** and copy the **Public IPv4 Address** (e.g., `159.65.xxx.xxx`).

---

## Step 2: Connect to Your Droplet

Open your local terminal and connect via SSH:

```bash
ssh root@YOUR_DROPLET_IP
```

---

## Step 3: Clone Your Repository

```bash
# 1. Update system packages and install git
apt update && apt upgrade -y
apt install -y git

# 2. Clone the repository
git clone https://github.com/samrato/MMUST-EMPORIUM-HACKATHON.git
cd MMUST-EMPORIUM-HACKATHON
```

---

## Step 4: 1-Click Automated Deployment

Run the automated deploy script:

```bash
./deploy.sh
```

*(This script automatically installs Docker & Docker Compose if missing, configures `.env`, builds all containers, and starts them in the background).*

Alternatively, you can run manually:
```bash
docker compose up -d --build
```

---

## Step 5: Verify Containers & Endpoints

Check that all 4 services are healthy:

```bash
docker compose ps
```

You should see:
| Service | Container Name | Port | Description |
| :--- | :--- | :--- | :--- |
| **frontend** | `afyaroot-frontend` | `0.0.0.0:80->80/tcp` | React Web PWA (Nginx) |
| **backend** | `afyaroot-backend` | `0.0.0.0:5000->5000/tcp` | MKFR API Server |
| **sms-gateway**| `afyaroot-sms` | `0.0.0.0:4000->4000/tcp` | SMS / SIM800 Bridge |
| **mongo** | `afyaroot-mongo` | `0.0.0.0:27017->27017/tcp` | Session & Chat Storage |

Test your deployment in your browser:
* **Web PWA**: `http://YOUR_DROPLET_IP`
* **API Health**: `http://YOUR_DROPLET_IP:5000/`
* **SMS Gateway**: `http://YOUR_DROPLET_IP:4000/`

---

## Step 6 (Optional): Add Custom Domain & Free SSL (HTTPS)

If you have a domain name (e.g., `afyaroot.org`):

1. **Point your domain's DNS A Record** to `YOUR_DROPLET_IP`.
2. **Install Certbot** on your droplet:
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```
3. Run Certbot to generate and auto-renew SSL certificates:
   ```bash
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🛠️ Handy Operations & Maintenance Commands

* **View live logs of all services**:
  ```bash
  docker compose logs -f
  ```
* **View backend logs specifically**:
  ```bash
  docker compose logs -f backend
  ```
* **Restart the entire stack**:
  ```bash
  docker compose restart
  ```
* **Update application with latest git changes**:
  ```bash
  git pull
  docker compose up -d --build
  ```
* **Stop all containers**:
  ```bash
  docker compose down
  ```
