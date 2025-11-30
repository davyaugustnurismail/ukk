# Pengenalan Proyek Sertifikasi Online Diantara - Backend

## 📋 Daftar Isi
1. [Tujuan Web](#tujuan-web)
2. [Fitur Utama](#fitur-utama)
3. [Akun Default](#akun-default)
4. [Diagram ERD](#diagram-erd)
5. [Diagram UML](#diagram-uml)
   - [Use Case Diagram](#use-case-diagram)
   - [Class Diagram](#class-diagram)
6. [Prasyarat](#prasyarat)
7. [Instalasi dari Git](#instalasi-dari-git)
8. [Konfigurasi Database](#konfigurasi-database)
9. [Migrasi dan Symlink](#migrasi-dan-symlink)
10. [Menjalankan Aplikasi](#menjalankan-aplikasi)

---

## 🎯 Tujuan Web

Aplikasi **Sertifikasi Online Diantara** adalah platform berbasis web yang dirancang untuk:

1. **Mengelola Sertifikasi Online** - Memfasilitasi pembuatan, distribusi, dan verifikasi sertifikat digital secara online
2. **Meningkatkan Aksesibilitas** - Memberikan akses mudah bagi peserta untuk mendapatkan sertifikat mereka
3. **Automasi Proses** - Mengotomatiskan alur kerja sertifikasi dari pendaftaran hingga pengiriman sertifikat
4. **Keamanan Data** - Menjaga integritas dan keamanan data peserta dan instruktur
5. **Laporan dan Analytics** - Menyediakan dashboard dan laporan untuk analisis data sertifikasi

---

## ✨ Fitur Utama

### Fitur untuk Peserta:
- ✅ Registrasi dan manajemen profil
- ✅ Melihat daftar sertifikat yang diperoleh
- ✅ Download sertifikat digital
- ✅ Validasi/Verifikasi sertifikat menggunakan QR Code
- ✅ Riwayat aktivitas kegiatan

### Fitur untuk Instruktur:
- ✅ Manajemen data peserta
- ✅ Membuat dan mengelola data kegiatan/aktivitas
- ✅ Generate sertifikat untuk peserta
- ✅ Laporan kehadiran dan prestasi
- ✅ Manajemen notifikasi

### Fitur untuk Admin:
- ✅ Manajemen pengguna (peserta, instruktur, admin)
- ✅ Manajemen roles dan permissions
- ✅ Konfigurasi SMTP untuk email
- ✅ Manajemen merchant/organisasi
- ✅ Dashboard analytics
- ✅ Manajemen notifikasi
- ✅ Export/Import data

### Fitur Teknis:
- ✅ Sistem autentikasi dengan Sanctum
- ✅ Generate QR Code untuk verifikasi sertifikat
- ✅ Generate PDF sertifikat dengan Dompdf
- ✅ Manajemen file dengan Storage
- ✅ API RESTful untuk integrasi
- ✅ Task scheduling untuk automasi
- ✅ Email notification system

---

## 🔐 Akun Default

Setelah instalasi dan menjalankan seeder, akun default berikut tersedia:

### Admin Account:
```
Email    : dev@diantara.net
Password : programmer
Role     : Admin
```

**Catatan**: Ubah password ini setelah login pertama kali untuk keamanan.

---

## 📊 Diagram ERD

### Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ password        │
│ no_hp (UNIQUE)  │
│ merchant_id (FK)│
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         ├──────────────────────┬──────────────┐
         │                      │              │
         ▼                      ▼              ▼
┌──────────────────┐   ┌──────────────┐  ┌──────────────┐
│ DATA_ACTIVITY    │   │  ADMINS      │  │ INSTRUKTURS  │
├──────────────────┤   ├──────────────┤  ├──────────────┤
│ id (PK)          │   │ id (PK)      │  │ id (PK)      │
│ name             │   │ name         │  │ name         │
│ merchant_id (FK) │   │ email        │  │ email        │
│ location         │   │ password     │  │ password     │
│ generated        │   │ role_id (FK) │  │ no_hp        │
│ created_at       │   │ merchant_id  │  │ details      │
│ updated_at       │   │ created_at   │  │ signature    │
└──────────────────┘   └──────────────┘  │ merchant_id  │
         │                                │ created_at   │
         │                                └──────────────┘
         ▼
┌──────────────────────┐
│ DATA_ACTIVITY_USER   │
├──────────────────────┤
│ id (PK)              │
│ data_activity_id (FK)│
│ user_id (FK)         │
│ type                 │
│ additional_fields    │
└──────────────────────┘
         │
         ▼
┌────────────────────────┐
│ USER_CERTIFICATES      │
├────────────────────────┤
│ id (PK)                │
│ user_id (FK)           │
│ data_activity_id (FK)  │
│ certificate_number     │
│ sertifikat_id (FK)     │
│ created_at             │
│ updated_at             │
└────────────────────────┘
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
┌──────────────────────┐  ┌───────────────────────┐
│ CERTIFICATE_TASKS    │  │ CERTIFICATE_DOWNLOADS │
├──────────────────────┤  ├───────────────────────┤
│ id (PK)              │  │ id (PK)               │
│ user_certificate_id  │  │ user_certificate_id   │
│ status               │  │ instruktur_name       │
│ created_at           │  │ sent_at               │
│ updated_at           │  │ created_at            │
└──────────────────────┘  └───────────────────────┘

┌──────────────────┐
│   SERTIFIKATS    │
├──────────────────┤
│ id (PK)          │
│ name             │
│ template_id      │
│ created_at       │
│ updated_at       │
└──────────────────┘

┌──────────────────┐
│    MERCHANTS     │
├──────────────────┤
│ id (PK)          │
│ name             │
│ created_at       │
│ updated_at       │
└──────────────────┘

┌──────────────────┐
│      ROLES       │
├──────────────────┤
│ id (PK)          │
│ name             │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## 📐 Diagram UML

### Use Case Diagram

```
                                      ┌─────────────────────────────────────────┐
                                      │   Sertifikasi Online Diantara System    │
                                      └─────────────────────────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────────────────┐
                    │                                   │                                   │
                    │                                   │                                   │
         ┌──────────▼─────────┐           ┌────────────▼──────────┐          ┌──────────▼──────────┐
         │      Peserta       │           │    Instruktur         │          │      Admin          │
         │   (Participant)    │           │   (Instructor)        │          │   (Administrator)   │
         └──────────┬─────────┘           └────────────┬──────────┘          └──────────┬──────────┘
                    │                                   │                                 │
                    │                                   │                                 │
        ┌───────────┴──────────────┐      ┌────────────┴─────────────────┐    ┌─────────┴──────────────┐
        │                          │      │                              │    │                        │
        │                          │      │                              │    │                        │
    ┌───▼────────────┐  ┌────────▼──┐   ┌───┴──────────┐  ┌────────────▼──┐ ┌──┴─────────┐ ┌───────┴───────┐
    │   Registrasi   │  │   Login    │   │  Membuat     │  │ Generate     │ │ Manajemen  │ │   Manajemen   │
    │   & Profile    │  │            │   │  Aktivitas   │  │ Sertifikat   │ │ Pengguna   │ │   Dashboard   │
    └────────────────┘  └────────────┘   └──────────────┘  └──────────────┘ └────────────┘ └───────────────┘
        │                    │                    │                │              │              │
        │                    │                    │                │              │              │
    ┌───▼────────────┐  ┌────▼─────────┐    ┌────▼──────────┐ ┌──┴─────────────┐ │              │
    │ Lihat Data     │  │   Akses       │    │  Manajemen    │ │ Kirim Email    │ │         ┌────▼──────┐
    │ Aktivitas      │  │ Sertifikat    │    │ Peserta Aktiv │ │ Pemberitahuan  │ │         │ Manajemen  │
    └────────────────┘  │               │    └───────────────┘ └────────────────┘ │         │ SMTP       │
                        └───┬───────────┘                                          │         └────────────┘
                            │                                                      │
                    ┌───────▼──────────┐                                      ┌────▼────────┐
                    │ Download         │                                      │ Manajemen   │
                    │ Sertifikat       │                                      │ Merchant    │
                    └────────┬─────────┘                                      └─────────────┘
                             │
                    ┌────────▼──────────┐
                    │ Validasi QR Code  │
                    │ Sertifikat        │
                    └───────────────────┘
```

### Class Diagram (Simplified)

```
┌─────────────────────────────────────┐
│           User Model                │
├─────────────────────────────────────┤
│ - id: Integer                       │
│ - name: String                      │
│ - email: String                     │
│ - password: String                  │
│ - no_hp: String                     │
│ - merchant_id: Integer              │
├─────────────────────────────────────┤
│ + create()                          │
│ + update()                          │
│ + delete()                          │
│ + certificates()                    │
│ + dataActivities()                  │
└─────────────────────────────────────┘
         △                △
         │                │
    implements        implements
         │                │
    ┌────┴────┐      ┌────┴─────┐
    │          │      │          │
┌───┴────────┐ │  ┌────┴──────┐ │
│   Admin    │ │  │ Instruktur│ │
├────────────┤ │  ├───────────┤ │
│ - role_id  │ │  │- details  │ │
│- merchant_id│ │  │- signature│ │
└────────────┘ │  └───────────┘ │
               │                │

┌──────────────────────────────────┐
│      DataActivity Model          │
├──────────────────────────────────┤
│ - id: Integer                    │
│ - name: String                   │
│ - location: String               │
│ - merchant_id: Integer           │
│ - generated: Boolean             │
├──────────────────────────────────┤
│ + participants()                 │
│ + certificates()                 │
│ + tasks()                        │
│ + generateCertificates()         │
└──────────────────────────────────┘

┌────────────────────────────────┐
│   UserCertificate Model        │
├────────────────────────────────┤
│ - id: Integer                  │
│ - user_id: Integer             │
│ - data_activity_id: Integer    │
│ - certificate_number: String   │
│ - sertifikat_id: Integer       │
├────────────────────────────────┤
│ + download()                   │
│ + validate()                   │
│ + task()                       │
│ + certificateDownload()        │
└────────────────────────────────┘

┌─────────────────────────────────┐
│      Merchant Model             │
├─────────────────────────────────┤
│ - id: Integer                   │
│ - name: String                  │
├─────────────────────────────────┤
│ + users()                       │
│ + admins()                      │
│ + instrukturs()                 │
│ + dataActivities()              │
└─────────────────────────────────┘
```

---

## 🔧 Prasyarat

Sebelum memulai instalasi, pastikan sistem Anda memiliki:

### Software yang Diperlukan:
1. **PHP** ≥ 8.2
   - Download: https://www.php.net/downloads
   - Verify: `php --version`

2. **Composer** (PHP Package Manager)
   - Download: https://getcomposer.org/download/
   - Verify: `composer --version`

3. **Node.js & npm** (untuk Vite/Frontend Assets)
   - Download: https://nodejs.org/
   - Verify: `node --version` dan `npm --version`

4. **Git**
   - Download: https://git-scm.com/download/win
   - Verify: `git --version`

5. **MySQL/MariaDB** ≥ 5.7
   - Download: https://www.mysql.com/downloads/
   - Verify: `mysql --version`

6. **PHP Imagick Extension**
   - Download: https://mlocati.github.io/articles/php-windows-imagick.html
   - Extension untuk manipulasi gambar dan certificate generation

### Sistem Operasi:
- ✅ Windows 10/11
- ✅ macOS 10.13+
- ✅ Linux (Ubuntu/Debian/CentOS)

### Hardware Minimum:
- RAM: 2GB
- Storage: 500MB
- Processor: Dual-core 2GHz

---

## 📥 Instalasi dari Git

### Step 1: Clone Repository

```bash
# Buka terminal/PowerShell
# Navigasi ke folder yang diinginkan
cd C:\Projects

# Clone repository
git clone https://github.com/davyaugustnurismail/ukk_git.git

# Masuk ke folder project
cd sertifikasi-online-diantara-backend
```

### Step 2: Install Dependencies

```bash
# Install PHP dependencies menggunakan Composer
composer install

# Install JavaScript dependencies menggunakan npm
npm install
```

### Step 3: Copy dan Setup Environment File

```bash
# Copy .env.example ke .env
cp .env.example .env

# Atau di Windows (PowerShell):
Copy-Item .env.example .env
```

---

## 🗄️ Konfigurasi Database

### Step 1: Buat Database di MySQL

Buka MySQL command line atau GUI tool (phpMyAdmin) dan buat database:

```sql
CREATE DATABASE sertifikasi_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Edit File .env

Buka file `.env` dan atur konfigurasi database MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sertifikasi_online
DB_USERNAME=root
DB_PASSWORD=your_password
```

Sesuaikan `DB_USERNAME` dan `DB_PASSWORD` dengan konfigurasi MySQL Anda.

### Step 3: Konfigurasi Lainnya

Di file `.env`, pastikan juga mengatur:

```env
# App Config
APP_NAME=SOD
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Sanctum (API Authentication)
SANCTUM_STATEFUL_DOMAINS=localhost

# Mail Configuration (Optional)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Sertifikasi Online Diantara"
```

### Step 4: Generate Application Key

```bash
php artisan key:generate
```

---

## 🔄 Migrasi dan Symlink

### Step 1: Jalankan Database Migrations

Migrasi akan membuat semua tabel yang diperlukan di database:

```bash
# Jalankan semua migration
php artisan migrate

# Jika ingin rollback (membatalkan)
php artisan migrate:rollback

# Jika ingin fresh (reset dan migrate ulang)
php artisan migrate:fresh
```

### Step 2: Seed Database (Opsional)

Isi database dengan data awal termasuk akun admin:

```bash
# Jalankan semua seeder
php artisan db:seed

# Atau jalankan seeder tertentu
php artisan db:seed --class=AdminSeeder

# Jika ingin fresh dengan seed
php artisan migrate:fresh --seed
```

### Step 3: Buat Symlink untuk Storage

Symlink diperlukan agar file yang disimpan di storage dapat diakses via HTTP:

```bash
# Buat symlink dari storage/app/public ke public/storage
php artisan storage:link

# Untuk Windows (jika command di atas tidak berhasil):
# Gunakan mklink dengan Command Prompt (Admin):
mklink /D "C:\path\to\project\public\storage" "C:\path\to\project\storage\app\public"
```

**Verifikasi**: Buka folder `public/storage` - seharusnya ada symlink ke `storage/app/public`

---

## 🚀 Menjalankan Aplikasi

### Terminal 1: Jalankan Backend Server

```bash
# Jalankan Laravel server pada port 8000 (default)
php artisan serve

# Output:
# INFO  Server running on [http://127.0.0.1:8000].
```

### Terminal 2: Jalankan Vite Development Server (untuk Assets Frontend)

```bash
# Jalankan dari folder frontend (sertifikasi-online-diantara)
# Navigasi ke folder frontend
cd ../sertifikasi-online-diantara

# Jalankan Vite dev server pada port 3000 (default)
npm run dev

# Output:
# VITE v7.0.0  ready in 123 ms
# ➜  Local:   http://localhost:3000/
```

Aplikasi sekarang dapat diakses di:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000

---

## 📂 Struktur Folder Penting

```
sertifikasi-online-diantara-backend/
├── app/
│   ├── Console/         # Console commands
│   ├── Enums/           # Enumeration classes
│   ├── Helpers/         # Helper functions
│   ├── Http/
│   │   ├── Controllers/ # API Controllers
│   │   └── Middleware/  # Middleware
│   ├── Mail/            # Mailable classes
│   ├── Models/          # Eloquent Models
│   ├── Providers/       # Service Providers
│   └── Traits/          # Reusable traits
├── config/              # Configuration files
├── database/
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   └── factories/       # Model factories
├── public/              # Public assets
├── resources/           # Views and assets
├── routes/              # API routes
├── storage/             # File storage
├── tests/               # Unit & Feature tests
├── .env                 # Environment variables
├── artisan              # Laravel CLI
├── composer.json        # PHP dependencies
└── package.json         # Node dependencies
```

---

## 📚 Dokumentasi Lebih Lanjut

- **Laravel Documentation**: https://laravel.com/docs
- **Laravel API Routes**: https://laravel.com/docs/routing
- **Eloquent ORM**: https://laravel.com/docs/eloquent
- **Database Migrations**: https://laravel.com/docs/migrations
- **Authentication (Sanctum)**: https://laravel.com/docs/sanctum

---

## 👥 Tim Pengembang

Proyek ini dikembangkan oleh Tim Sertifikasi Online Diantara.

---

**Terakhir diupdate**: November 2025
**Versi Laravel**: 12.0
**Versi PHP**: 8.2+
**Database**: MySQL 5.7+
