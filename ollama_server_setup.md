# Ollama Server Installation & Configuration Guide

This guide provides a comprehensive walkthrough for installing, configuring, and securing **Ollama** on a Linux Virtual Private Server (VPS) such as DigitalOcean, AWS EC2, or Linode running **Ubuntu 22.04 / 24.04 LTS**.

---

## 📋 System Requirements & Prerequisites

Before beginning, ensure your VPS meets the specifications required to run a 7-Billion parameter model (such as `BioMistral-7B-Instruct`):

| Resource | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **CPU Architecture** | x86_64 or ARM64 | x86_64 with AVX/AVX2 support |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 15 GB Free SSD | 50 GB Free NVMe SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **GPU (Optional)** | None (runs on CPU) | NVIDIA GPU (8GB+ VRAM) |

---

## 🛠️ Step 1: Installing Ollama

Connect to your server via SSH as the `root` or `sudo` user:
```bash
ssh root@your_server_ip
```

Run the official automated installation script:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Verification
Once the installer finishes, check the status of the Ollama service to ensure it is running in the background:
```bash
systemctl status ollama
```

---

## ⚙️ Step 2: Configuring Ollama Service (systemd)

By default, Ollama is configured to run locally (`127.0.0.1:11434`). If your application is hosted on a separate server or you need to configure concurrency, you must modify the systemd service.

1. Open the systemd override file for Ollama:
   ```bash
   systemctl edit ollama.service
   ```

2. Add the following block to configure the service. Customize the environment variables as needed:
   ```ini
   [Service]
   # Allow connections from any IP address (binds to 0.0.0.0)
   Environment="OLLAMA_HOST=0.0.0.0:11434"

   # Optional: Configure the directory where models are saved (useful for external block storage)
   # Environment="OLLAMA_MODELS=/mnt/volume_models"

   # Optional: Allow multiple requests to be processed in parallel
   # Environment="OLLAMA_NUM_PARALLEL=4"
   ```

3. Save the file and exit the editor (in nano: `Ctrl + O` -> `Enter` -> `Ctrl + X`).

4. Reload systemd configurations and restart Ollama to apply changes:
   ```bash
   systemctl daemon-reload
   systemctl restart ollama
   ```

5. Confirm that Ollama is now listening on all interfaces (`0.0.0.0`):
   ```bash
   ss -tulpn | grep 11434
   ```

---

## 🔒 Step 3: Security & Firewall Configuration (UFW)

> [!WARNING]
> Ollama does not feature built-in API keys or authentication. Bypassing localhost without a firewall will expose your compute resources to the public internet.

Use the **Uncomplicated Firewall (UFW)** to block unauthorized access to port `11434`.

### Option A: App and Ollama on the SAME Server
If your application server and Ollama run on the same virtual machine, keep port `11434` closed to the outside.
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp # Keep SSH open
ufw enable
```

### Option B: App and Ollama on DIFFERENT Servers
Only allow the explicit IP address of your application server to query Ollama:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp # SSH

# Allow App Server to access Ollama API
ufw allow from <your_app_server_ip> to any port 11434 proto tcp

ufw enable
```

### Option C: Production setup with Basic Auth (Nginx Reverse Proxy)
If you require token/password authentication to query the API from anywhere, route traffic through Nginx:

1. Install Nginx and Apache utilities:
   ```bash
   sudo apt update
   sudo apt install nginx apache2-utils -y
   ```

2. Create an encrypted credentials file (replace `api_user` with your username):
   ```bash
   sudo htpasswd -c /etc/nginx/.htpasswd api_user
   ```

3. Create an Nginx site configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/ollama
   ```

4. Paste the following configuration, directing public port `80` requests to local Ollama port `11434`:
   ```nginx
   server {
       listen 80;
       server_name your_server_ip_or_domain;

       location / {
           auth_basic "Ollama API Access Restricted";
           auth_basic_user_file /etc/nginx/.htpasswd;

           proxy_pass http://127.0.0.1:11434;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl restart nginx
   ```

6. Open port 80 in your firewall:
   ```bash
   ufw allow 80/tcp
   ```

---

## 🚀 Step 4: Pulling and Managing Models

Manage your active models directly on the command line:

* **Download and Chat:**
  ```bash
  ollama run biomistral
  ```
* **List Downloaded Models:**
  ```bash
  ollama list
  ```
* **Remove a Model:**
  ```bash
  ollama rm biomistral
  ```
* **Check Running Models in RAM:**
  ```bash
  ollama ps
  ```

---

## 💻 Step 5: Consuming the API (Examples)

### Raw cURL Query (Protected with Basic Auth)
```bash
curl -X POST http://your_server_ip/api/generate \
  -u api_user:your_htpasswd_password \
  -d '{
    "model": "biomistral",
    "prompt": "Explain malaria symptoms briefly.",
    "stream": false
  }'
```

### Node.js Backend Integration
```javascript
const response = await fetch("http://your_server_ip/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // Basic Auth header containing base64 encoded user:password
    "Authorization": "Basic " + Buffer.from("api_user:your_htpasswd_password").toString("base64")
  },
  body: JSON.stringify({
    model: "biomistral",
    messages: [{ role: "user", content: "Explain symptoms of pneumonia." }],
    temperature: 0.2
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

---

## 🛠️ Troubleshooting & Logs

If Ollama fails to run or behaves unexpectedly, inspect the systemd log stream:
```bash
journalctl -u ollama --no-pager -n 100
```

### Common Issues
* **Out Of Memory (OOM):** If the model crashes mid-generation, check `/var/log/syslog` for `OOM Killer` triggers. It means the model exceeds your VPS's available RAM. Ensure you have at least 8 GB RAM and configure swap space if necessary.
* **Slow Responses:** Running 7B models on virtualized CPUs is compute-heavy. Ensure your Droplet is using "Dedicated vCPUs" or "Premium Intel/AMD" configurations rather than low-end shared nodes.
