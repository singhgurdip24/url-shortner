# Deployment Guide — Oracle Cloud Free Tier

## The Big Picture

"Deploying to prod" means three things:
1. **A server** — a computer on the internet running your app 24/7
2. **A domain** (optional but nice) — `yourapp.com` instead of a raw IP
3. **HTTPS** — encrypted connections (free with Let's Encrypt)

Your `docker-compose.prod.yml` already handles all the app complexity. You just need to get it running on a real server.

---

## Step 1 — Create an Oracle Cloud Account

1. Go to **cloud.oracle.com** → "Start for free"
2. Fill in the form — you **will** need a credit card for identity verification, but **you will not be charged** for Always Free resources
3. Choose a **Home Region** close to you (you can't change this later)
4. Complete sign-up and log in to the Console

> The signup takes ~5 minutes. If it says "account under review", wait an hour — it's normal.

---

## Step 2 — Create a VCN (Virtual Cloud Network)

Before creating the server you need a network for it to live in. Oracle doesn't create one automatically.

1. In the Console sidebar go to **Networking → Virtual Cloud Networks**
2. Click **"Start VCN Wizard"**
3. Select **"Create VCN with Internet Connectivity"** → click **"Start VCN Wizard"**
4. Set **VCN name**: `vcn-url-shortener` — leave everything else default
5. Click **"Next"** → **"Create"**
6. Wait ~30 seconds until it completes

This creates a public subnet, private subnet, and internet gateway all wired up correctly. You only do this once.

---

## Step 3 — Create Your Free Server

In the Console, click **"Create a VM instance"**. You'll see several sections — here's exactly what to set in each one.

### Basic Information
| Field | What to do |
|---|---|
| Name | `url-shortener` |
| Create in compartment | Leave as-is (your root compartment) |
| Availability domain | Leave default — if one fails with "out of capacity" try another |
| Fault domain | Leave as "Oracle chooses" |

### Image and Shape
**Image:**
1. Click **"Change image"**
2. Select **Canonical Ubuntu**
3. Pick **Ubuntu 22.04** from the OS version dropdown
4. Click **"Select image"**

**Shape:**
1. Click **"Change shape"**
2. Under Instance type select **"Ampere"** (the ARM tab — this is the free one)
3. Select **VM.Standard.A1.Flex**
4. Set **OCPUs: 4** and **Memory: 24 GB** (both within the Always Free limit)
5. Click **"Select shape"**

### Networking (Primary VNIC)
| Field | What to do |
|---|---|
| Primary VNIC name | Leave default |
| VCN | Leave whatever is pre-selected (Oracle creates a default VCN for new accounts) |
| Subnet | Leave whatever is pre-selected (should say "public subnet") |
| **Assign a public IPv4 address** | **Must be set to Yes** — this is what makes your server reachable |
| Private IPv4 address | Leave blank (auto-assigned) |
| IPv6 address | Skip |

### Add SSH Keys
1. Select **"Generate a key pair for me"**
2. Click **"Save private key"** — this downloads your `.key` file
3. Keep it safe (see Step 3 notes on where to store it)

### Boot Volume (Storage)
| Field | What to do |
|---|---|
| Boot volume size | `50` GB (default — free tier gives you 200 GB total) |
| Boot volume performance | Leave default (10 VPU) |
| In-transit encryption | Leave default |
| Encryption key | Leave default ("Oracle-managed keys") |

### Final step
Click **"Create"** at the bottom. Wait ~2 minutes for the instance status to change to **"Running"**.

Once it's running, click on the instance name → find and copy the **Public IP address** on that page. You'll need it for every step after this.

---

## Step 3 — SSH Into Your Server

On your Mac, open Terminal and run:

```bash
# Move the key to ~/.ssh and lock down permissions (SSH refuses to use world-readable keys)
mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle-url-shortener.key
chmod 400 ~/.ssh/oracle-url-shortener.key

# Connect (replace YOUR_IP with your instance's public IP)
ssh -i ~/.ssh/oracle-url-shortener.key ubuntu@YOUR_IP
```

You're now inside your server. Every command below runs **on the server**, not your Mac.

---

## Step 4 — Install Docker

```bash
# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Allow your user to run Docker without sudo
sudo usermod -aG docker ubuntu

# Apply the group change (log out and back in)
exit
```

SSH back in, then verify:

```bash
ssh -i ~/.ssh/oracle-url-shortener.key ubuntu@YOUR_IP
docker --version   # should print Docker 26.x or similar
```

---

## Step 5 — Get Your Code on the Server

Push your code to GitHub if you haven't already, then on the server:

```bash
# Install git (may already be present)
sudo apt-get install -y git

# Clone your repo (use your actual GitHub URL)
git clone https://github.com/YOUR_USERNAME/url-shortner.git
cd url-shortner
```

---

## Step 6 — Create Your Production Secrets

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill it in — use strong random passwords. You can generate them with:

```bash
openssl rand -base64 32   # run this twice — once for DB password, once for Redis
```

Your `.env.prod` should look like:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<32-char random string>
POSTGRES_DB=urlshortener

REDIS_PASSWORD=<32-char random string>

# For now use your server's public IP — change to domain later
BASE_URL=http://YOUR_IP
ALLOWED_ORIGIN=http://YOUR_IP
```

Save with `Ctrl+O`, exit with `Ctrl+X`.

---

## Step 7 — Open the Firewall

Oracle Cloud has **two** firewalls — one in the cloud console and one on the server itself (iptables). You need to open both.

**Cloud console firewall:**
1. On the instance page, click your **subnet** link → **Security List** → **Add Ingress Rules**
2. Add: Source `0.0.0.0/0`, Protocol `TCP`, Port `80`
3. Repeat for port `443` (for HTTPS later)

**Server firewall (iptables):**

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# Make the rules persist after reboot
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

---

## Step 8 — Deploy

```bash
# From inside the url-shortner directory
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

This will:
- Build your API and web images
- Pull Postgres and Redis
- Run Alembic migrations automatically
- Start everything

Check that all containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

All 4 services should show `running (healthy)`.

Open `http://YOUR_IP` in your browser — your app is live.

---

## Step 9 — (Optional but Recommended) Domain + HTTPS

**Get a free domain:**
- **afraid.org** → free subdomains like `myapp.mooo.com`
- Or buy a `.com` at Porkbun for ~$10/year

**Point it at your server:**
Add an `A` record in your domain's DNS: `@ → YOUR_IP`

**Get HTTPS (free) with Certbot:**

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# Get a certificate (replace with your actual domain)
sudo certbot --nginx -d yourdomain.com
```

Certbot auto-renews every 90 days. After this, update `.env.prod`:

```env
BASE_URL=https://yourdomain.com
ALLOWED_ORIGIN=https://yourdomain.com
```

Then redeploy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build api
```

---

## Ongoing Commands to Know

```bash
# View live logs
docker compose -f docker-compose.prod.yml logs -f

# Restart everything
docker compose -f docker-compose.prod.yml restart

# Pull latest code and redeploy
git pull && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down
```
