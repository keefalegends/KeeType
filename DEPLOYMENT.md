# 🚀 VPS Deployment & GitHub Actions Guide

Panduan cara memasang KeeType di VPS menggunakan Docker & Docker Compose, serta mengaktifkan Auto-Deploy otomatis via GitHub Actions.

---

## 🛠️ Step 1: Persiapan VPS (Cuma Sekali)

Masuk ke VPS lu via SSH, lalu install Docker & Git jika belum ada:

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Pastikan Docker jalan
sudo systemctl enable --now docker
```

---

## 📥 Step 2: Clone Repository ke VPS

```bash
# Masuk ke direktori pilihan, misal /var/www/keetype
sudo mkdir -p /var/www/keetype
sudo chown -R $USER:$USER /var/www/keetype

# Clone repository
git clone https://github.com/keefalegends/KeeType.git /var/www/keetype
cd /var/www/keetype
```

---

## 🏃 Step 3: Run Aplikasi Pertama Kali

Jalankan command ini di folder `/var/www/keetype`:

```bash
docker compose up -d --build
```

Aplikasi KeeType langsung berjalan di port 80! Buka IP VPS lu di browser: `http://IP_VPS_LU` 🎉

> ℹ️ **Catatan Database**: File database SQLite tersimpan di folder VPS `/var/www/keetype/backend/database/database.sqlite`. Rebuild container Docker **tidak akan pernah menghapus data leaderboard**.

---

## 🔄 Step 4: Setup Auto-Deploy GitHub Actions

Biar setiap kali `git push origin main` langsung ter-deploy otomatis ke VPS:

1. Buka Repo GitHub lu -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
2. Tambahkan 4 Secret berikut:

| Name | Value Contoh | Deskripsi |
|------|--------------|-----------|
| `VPS_HOST` | `123.45.67.89` | IP Public VPS Lu |
| `VPS_USERNAME` | `root` (atau sudo user) | Username SSH VPS |
| `VPS_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- ...` | Private SSH Key VPS |
| `VPS_PROJECT_PATH` | `/var/www/keetype` | Path folder projek di VPS |

Selesai! Sekarang setiap kali lu commit & push ke branch `main`, GitHub Actions akan otomatis login ke VPS, nge-pull update terbaru, dan rebuild container tanpa mematikan database! ⚡
