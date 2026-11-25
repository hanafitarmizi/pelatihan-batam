# Aplikasi Manajemen Barang

CRUD data barang dan kategori dengan **Laravel 13** (REST API), **React + Vite**, dan **Tailwind CSS**.

```
pelatihan/
├── backend/    Laravel 13 (API)
└── frontend/   React + Vite + Tailwind CSS
```

## Alur Branch

```
feature/*  ──►  sit  ──►  uat  ──►  main
```

| Branch       | Fungsi                                                          |
|--------------|-----------------------------------------------------------------|
| `main`       | Kode produksi / rilis. Hanya menerima merge dari `uat`.          |
| `uat`        | User Acceptance Test, diuji oleh user/pemilik aplikasi. Menerima merge dari `sit`. |
| `sit`        | System Integration Test, gabungan semua fitur untuk diuji tim. Menerima merge dari `feature/*`. |
| `feature/*`  | Satu branch per fitur/perbaikan, dibuat dari `main`.             |

### Membuat fitur baru

```bash
git checkout main
git pull
git checkout -b feature/nama-fitur

# ... coding & commit ...

git push -u origin feature/nama-fitur
```

Lalu buat Pull Request: `feature/nama-fitur` → `sit`.

### Promosi antar lingkungan

1. Fitur lolos uji di **SIT**: buat Pull Request `sit` → `uat`.
2. Lolos uji di **UAT**: buat Pull Request `uat` → `main`.

### Aturan penamaan

- `feature/...` untuk fitur baru, mis. `feature/transaksi-penjualan`
- `fix/...` untuk perbaikan bug, mis. `fix/upload-gambar` (alurnya sama dengan feature)
- Gunakan huruf kecil dan tanda hubung (`-`).

## Setup

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Atur koneksi database di `.env` (`DB_DATABASE=db_barang`, `DB_USERNAME`, `DB_PASSWORD`), buat databasenya, lalu:

```bash
php artisan migrate
php artisan storage:link
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka http://localhost:5173 (request `/api` dan `/storage` diteruskan ke http://127.0.0.1:8000).
