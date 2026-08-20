#!/usr/bin/env bash
set -e

DOMAIN="afyaroot.cinecreatives.org"
EMAIL="admin@cinecreatives.org"

echo "=================================================================="
echo "🔒 AFYAROOT SSL Configuration with Let's Encrypt for: ${DOMAIN}"
echo "=================================================================="

# 1. Install Certbot
echo "📦 Step 1: Installing Certbot..."
sudo apt-get update -y
sudo apt-get install -y certbot

# 2. Check DNS Resolution
echo "🌐 Step 2: Checking DNS resolution for ${DOMAIN}..."
RESOLVED_IP=$(dig +short A "${DOMAIN}" @8.8.8.8 | head -n 1 || true)
echo "Current DNS A Record points to: ${RESOLVED_IP:-NOT FOUND}"

# 3. Stop frontend temporarily to free port 80 for standalone verification
echo "🛑 Step 3: Acquiring Let's Encrypt SSL Certificate..."
docker compose stop frontend || true

# 4. Request certificate
certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" || {
    echo "⚠️ Certbot could not verify domain yet. Make sure your DNS A record points to this server IP (137.184.147.21)."
    echo "Starting frontend back on HTTP mode..."
    docker compose up -d frontend
    exit 1
}

echo "✅ SSL Certificate acquired successfully!"

# 5. Write HTTPS Nginx Configuration
cat << 'EOF' > afyaroot-health-assist/nginx.conf
# HTTP Server (Redirect to HTTPS)
server {
    listen 80;
    server_name afyaroot.cinecreatives.org 137.184.147.21 localhost;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server (Production SSL)
server {
    listen 443 ssl http2;
    server_name afyaroot.cinecreatives.org;
    root /usr/share/nginx/html;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/afyaroot.cinecreatives.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/afyaroot.cinecreatives.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # Frontend SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy to MKFR Backend API
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }

    # Static Asset Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# 6. Rebuild and start frontend with SSL
echo "🔨 Step 6: Starting Nginx with HTTPS enabled..."
docker compose up -d --build frontend

# 7. Setup automated certificate renewal cron
CRON_JOB="0 3 * * * certbot renew --quiet --post-hook 'cd /root/MMUST-EMPORIUM-HACKATHON && docker compose restart frontend'"
(crontab -l 2>/dev/null | grep -F "certbot renew") || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "=================================================================="
echo "🎉 HTTPS SSL IS NOW ACTIVE AT: https://${DOMAIN}"
echo "=================================================================="
