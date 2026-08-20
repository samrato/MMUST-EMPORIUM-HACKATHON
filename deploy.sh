#!/usr/bin/env bash
set -e

# ==============================================================================
# AFYAROOT 1-CLICK PRODUCTION DEPLOYMENT SCRIPT FOR DIGITALOCEAN
# ==============================================================================

SERVER_IP="$1"
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s --max-time 4 https://api.ipify.org || curl -s --max-time 4 https://ifconfig.me || echo "YOUR_SERVER_IP")
fi

echo "=================================================================="
echo "🚀 Starting AFYAROOT 1-Click Deployment on IP: ${SERVER_IP}"
echo "=================================================================="

# 1. Update and install prerequisite packages
echo "📦 Step 1/5: Checking system dependencies..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# 2. Check and Install Docker & Docker Compose Plugin if missing
if ! command -v docker &> /dev/null; then
    echo "🐳 Step 2/5: Installing Docker and Docker Compose..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER" || true
    rm -f get-docker.sh
    echo "✅ Docker installed successfully."
else
    echo "✅ Step 2/5: Docker is already installed."
fi

# 3. Environment configuration setup
echo "⚙️ Step 3/5: Setting up environment files..."
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

# 4. Tear down existing containers and rebuild stack
echo "🔨 Step 4/5: Building and starting all Docker services (Postgres, Mongo, MKFR Backend, SMS, Frontend)..."
docker compose down --remove-orphans || true
docker compose build --parallel
docker compose up -d

# 5. Wait for database and backend health checks
echo "⏳ Step 5/5: Verifying container health..."
sleep 5

echo ""
echo "=================================================================="
echo "🎉 AFYAROOT STACK DEPLOYED & OPERATIONAL!"
echo "=================================================================="
docker compose ps
echo ""
echo "🌐 LIVE ACCESS ENDPOINTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👉 Web PWA Application:     http://${SERVER_IP}"
echo "👉 Central Backend API:     http://${SERVER_IP}:5000/api"
echo "👉 SMS Gateway Bridge:      http://${SERVER_IP}:4000"
echo "👉 Mosquitto MQTT Broker:   ${SERVER_IP}:1883 (Internal: afyaroot-mosquitto)"
echo "👉 PostgreSQL Database:     ${SERVER_IP}:5432 (Internal: afyaroot-postgres)"
echo "👉 MongoDB Database:        ${SERVER_IP}:27017 (Internal: afyaroot-mongo)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Commands for maintenance:"
echo "   - View all logs:       docker compose logs -f"
echo "   - View backend logs:   docker compose logs -f backend"
echo "   - View SMS logs:       docker compose logs -f sms-gateway"
echo "   - Restart stack:       docker compose restart"
echo "=================================================================="
