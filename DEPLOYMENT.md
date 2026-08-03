# 🚀 VPS Deployment & GitHub Actions Guide

Panduan cara memasang KeeType di VPS (`202.10.47.200`) menggunakan Docker & Docker Compose, serta mengaktifkan Auto-Deploy otomatis via GitHub Actions.

---

## 🛠️ Step 1: Persiapan VPS (Jalankan di VPS via SSH)

Buka terminal laptop dan masuk ke VPS:

```bash
ssh root@202.10.47.200
```

Install Docker & Git jika belum ada:

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Pastikan Docker jalan
sudo systemctl enable --now docker
```

---

## 📥 Step 2: Clone Repository & Setup Folder

```bash
# Buat folder projek
mkdir -p /var/www/keetype
cd /var/www/keetype

# Clone repository
git clone https://github.com/keefalegends/KeeType.git .
```

---

## 🏃 Step 3: Run Aplikasi Pertama Kali

Jalankan command ini di folder `/var/www/keetype`:

```bash
docker compose up -d --build
```

Aplikasi KeeType langsung jalan di `http://202.10.47.200` 🎉

> ℹ️ **Catatan Database**: File database SQLite tersimpan di `/var/www/keetype/backend/database/database.sqlite`. Rebuild container Docker **tidak akan pernah menghapus data leaderboard**.

---

## 🔐 Step 4: Setup Secrets di GitHub Actions

Buka Repo GitHub lu ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **New repository secret**.

Masukkan **4 Secrets** berikut persis seperti di bawah ini:

| Secret Name | Value |
|-------------|-------|
| `VPS_HOST` | `202.10.47.200` |
| `VPS_USERNAME` | `root` |
| `VPS_PASSWORD` | `q$6G%CF9eZbR66` |
| `VPS_PROJECT_PATH` | `/var/www/keetype` |

Selesai! Sekarang setiap kali lu `git push origin main` dari laptop, GitHub Actions akan otomatis login ke VPS, nge-pull update terbaru, dan rebuild container tanpa mematikan database! ⚡
