# 🚀 VPS Deployment & GitHub Actions Guide

Panduan cara memasang KeeType di VPS menggunakan Docker, Caddy Reverse Proxy, & Docker Compose, serta mengaktifkan Auto-Deploy otomatis via GitHub Actions.

---

## 🛠️ Step 1: Persiapan VPS (Jalankan di VPS via SSH)

Buka terminal laptop dan masuk ke VPS:

```bash
ssh root@<YOUR_VPS_IP>
```

Install Docker & Git jika belum ada:

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Pastikan Docker jalan
sudo systemctl enable --now docker

# Buat external network web_proxy jika belum ada (digunakan Caddy Proxy)
docker network create web_proxy || true
```

---

## 🔒 Step 2: Konfigurasi Caddyfile di VPS

Di VPS (folder Caddy, misal `~/caddy/Caddyfile`), tambahkan blok berikut untuk `keetype.my.id`:

```caddy
keetype.my.id {
    # Forward ke container keetype-frontend, port 80 (internal Docker network web_proxy)
    reverse_proxy keetype-frontend:80
}

www.keetype.my.id {
    redir https://keetype.my.id{uri} permanent
}
```

> ℹ️ **Catatan**: Container `keetype-frontend` sudah menyertakan Nginx internal yang secara otomatis memproxy request `/api/` ke `keetype-backend:8000`. Jadi Caddy hanya perlu memproxy `keetype-frontend:80`.

---

## 📥 Step 3: Clone Repository & Setup Folder

```bash
# Buat folder projek
mkdir -p /var/www/keetype
cd /var/www/keetype

# Clone repository
git clone https://github.com/keefalegends/KeeType.git .
```

---

## 🏃 Step 4: Run Aplikasi Pertama Kali

Jalankan command ini di folder `/var/www/keetype`:

```bash
docker compose up -d --build
```

Aplikasi KeeType langsung terhubung ke Caddy via network `web_proxy` dan HTTPS aktif otomatis di `https://keetype.my.id` 🎉

> ℹ️ **Catatan Database**: File database SQLite tersimpan di `/var/www/keetype/backend/database/database.sqlite`. Rebuild container Docker **tidak akan pernah menghapus data leaderboard**.

---

## 🔐 Step 5: Setup Secrets di GitHub Actions

Buka Repo GitHub lu ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **New repository secret**.

Masukkan **4 Secrets** berikut:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | `<YOUR_VPS_IP>` |
| `VPS_USERNAME` | `root` |
| `VPS_PASSWORD` | `<YOUR_VPS_PASSWORD>` |
| `VPS_PROJECT_PATH` | `/var/www/keetype` |

Selesai! Sekarang setiap kali lu `git push origin main` dari laptop, GitHub Actions akan otomatis login ke VPS, nge-pull update terbaru, dan rebuild container tanpa mematikan database! ⚡
