# Deploy & CI/CD — Kosalla

Monorepo ini memakai **GitHub Actions**:

| Workflow | Kapan jalan | Fungsi |
|---|---|---|
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | setiap Pull Request & push (selain `main`) | Cek kualitas: install + lint backend, build frontend |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | push/merge ke `main` | Build frontend di GitHub → rsync ke cPanel → migrate + restart |

> Deploy **otomatis dilewati** selama secret `SSH_HOST` belum diisi, jadi aman walau workflow sudah aktif.

---

## 1. GitHub Secrets yang harus diisi

Buka repo → **Settings → Secrets and variables → Actions → New repository secret**, lalu isi:

| Secret | Contoh | Keterangan |
|---|---|---|
| `SSH_HOST` | `123.45.67.89` atau `server.viriyadb.com` | IP/host server cPanel |
| `SSH_PORT` | `22` atau `21098` | Port SSH cPanel (sering bukan 22 — cek di cPanel → SSH Access) |
| `SSH_USER` | `viriyadb` | Username cPanel/SSH |
| `SSH_PRIVATE_KEY` | (isi private key, lihat langkah 2) | Kunci privat untuk login tanpa password |
| `DEPLOY_PATH` | `/home/viriyadb/kosalla_app` | Folder root aplikasi di server (= Application root Passenger) |

---

## 2. Membuat SSH key untuk deploy

Di komputer lokal (PowerShell / Git Bash):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f kosalla_deploy_key
```

Menghasilkan 2 file:
- `kosalla_deploy_key`      → **private** → tempel isinya ke secret `SSH_PRIVATE_KEY`
- `kosalla_deploy_key.pub`  → **public**  → daftarkan di server

Daftarkan public key di server (cPanel → **SSH Access → Manage SSH Keys → Import**, lalu **Authorize**),
atau lewat SSH:

```bash
cat kosalla_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Uji dari lokal:
```bash
ssh -i kosalla_deploy_key -p <SSH_PORT> <SSH_USER>@<SSH_HOST>
```

---

## 3. Hal yang perlu dicek di server (sekali saja)

1. **`composer`, `php`, `pnpm` ada di PATH SSH?**
   ```bash
   which composer php pnpm
   ```
   - Kalau `pnpm` tidak ada: aktifkan via `corepack enable pnpm` (butuh Node ≥ 16),
     atau ganti perintah di `deploy.yml` menjadi path absolut (mis. `/home/viriyadb/.nvm/.../pnpm`).
   - Kalau `php`/`composer` versinya beda, sesuaikan.

2. **`.env` produksi sudah ada di `kosalla-api/.env` di server** dan TIDAK ikut di-deploy
   (sengaja di-exclude). Pastikan isinya benar (DB, APP_KEY, dll.) — file ini hidup permanen di server.

3. **cPanel "Setup Node.js App"**
   - *Application root* = nilai `DEPLOY_PATH` (mis. `/home/viriyadb/kosalla_app`)
   - *Application startup file* = `server.js`
   - Restart memakai `tmp/restart.txt` di Application root (sudah ditangani workflow).

4. **Subdomain API** `api.kosalla.viriyadb.com` → document root = `kosalla-api/public`.

---

## 4. Alur kerja sehari-hari

```
buat branch  →  push  →  CI jalan (lint + build)
              ↓
        buka Pull Request  →  CI harus hijau
              ↓
        merge ke main  →  deploy.yml otomatis deploy ke produksi
```

(Opsional) Aktifkan **branch protection** di `main`: Settings → Branches → require status checks `Backend (Laravel)` & `Frontend (Next.js)` sebelum merge.

---

## 5. Catatan keamanan

Source ini berisi `.env` dengan kredensial produksi lama (DB, SMTP, `APP_KEY`).
Karena sudah pernah tersebar, sebaiknya **rotasi** semuanya di server produksi:
- ganti password DB & user PostgreSQL,
- `php artisan key:generate` (APP_KEY baru),
- ganti password SMTP mail.
