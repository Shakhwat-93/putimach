# 🚀 PutiMach - VPS & Coolify Self-Hosted Deployment Guide

This guide details how to deploy the **PutiMach Platform** on any Ubuntu VPS (DigitalOcean, Hetzner, Linode, Contabo) using **Coolify PaaS**, **Self-Hosted Supabase**, and **Cloudflare R2** for zero-cost media storage.

---

## 📋 Infrastructure Prerequisites
- **VPS Server**: Ubuntu 24.04 LTS (Minimum 4 vCPU, 8 GB RAM recommended for high concurrency).
- **Domain Name**: Pointed to VPS IP address (`yourdomain.com`, `admin.yourdomain.com`, `media.yourdomain.com`).
- **Cloudflare Account**: Free account for R2 Object Storage & DNS CDN.

---

## 🛠️ Step 1: Install Coolify on VPS
Log in to your VPS via SSH and run:
```bash
curl -fsSL https://get.coolify.io | bash
```
Once installation finishes, open `http://YOUR_VPS_IP:8000` in your browser to complete initial admin registration.

---

## 🗄️ Step 2: Deploy Self-Hosted Supabase on Coolify
1. In Coolify dashboard, click **+ New Project** -> **+ New Resource**.
2. Select **Supabase (Service)**.
3. Set your Database Password and JWT Secret.
4. Click **Deploy**.
5. Once deployed, you will get:
   - **PostgreSQL Connection String**
   - **Supabase API URL & Anon Key**
   - **Supabase Studio Dashboard** (`http://YOUR_VPS_IP:8000` / `db.yourdomain.com`)

---

## ☁️ Step 3: Set Up Cloudflare R2 Storage
1. Go to **Cloudflare Dashboard** -> **R2 Storage**.
2. Click **Create Bucket** -> Name it `putimach-media`.
3. In Bucket Settings -> **Custom Domain** -> Connect `media.yourdomain.com`.
4. Under R2 Overview -> Click **Manage R2 API Tokens** -> **Create API Token**.
5. Copy the following keys:
   - `Account ID`
   - `Access Key ID`
   - `Secret Access Key`

---

## 🚢 Step 4: Deploy Next.js Application on Coolify
1. In Coolify, click **+ New Resource** -> **GitHub Repository**.
2. Connect `Shakhwat-93/putimach`.
3. Select Dockerfile build strategy.
4. Set Environment Variables:
   ```env
   VITE_SUPABASE_URL=https://db.yourdomain.com
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GROQ_API_KEY=your_groq_api_key_here
   CLOUDFLARE_R2_ACCOUNT_ID=your_r2_account_id
   CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   CLOUDFLARE_R2_BUCKET_NAME=putimach-media
   CLOUDFLARE_R2_PUBLIC_URL=https://media.yourdomain.com
   ```
5. Click **Deploy**. Coolify will automatically configure SSL (HTTPS) and launch the application!

---

## 🔁 Automated Git Push Deployment
Whenever you push changes to GitHub (`git push origin main`), Coolify will automatically pull, build, and deploy the update with **zero downtime**!
