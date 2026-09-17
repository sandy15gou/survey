# 📊 Survey App (Next.js Fullstack + PostgreSQL)

Aplikasi kuesioner & survey modern berbasis Next.js 14 (App Router) dengan integrasi PostgreSQL (server database terpisah) dan Dashboard Admin ber-Passkey.

---

## 🚀 Fitur Utama
1. **Halaman Publik / Responden (`/`)**:
   - Desain modern, clean, dan responsif (nyaman di HP maupun Desktop).
   - Mendukung tipe pertanyaan: Skala Bintang (Rating 1-5), Pilihan Ganda, dan Isian Teks.
   - Identitas responden opsional (bisa anonim).
   - Progress bar dinamis saat menjawab pertanyaan.
2. **Dashboard Admin Terproteksi (`/admin`)**:
   - Dilindungi **Passkey / PIN Rahasia** (default: `admin123#`).
   - Proteksi API Server-side (tidak bisa di-bypass tanpa passkey).
   - Statistik real-time: Total responden, rata-rata skor kepuasan, grafik persentase pilihan.
   - Tabel rekapitulasi data responden & filter pencarian.
   - **Tombol Export to CSV/Excel** sekali klik.
   - Tombol toggle untuk Buka / Tutup penerimaan respon survey.
3. **Database PostgreSQL**:
   - Siap dihubungkan ke server database PostgreSQL sebelah.

---

## 🛠️ Cara Menjalankan di Komputer Lokal

### 1. Install Dependencies
```bash
npm install
```

### 2. Atur File .env
Buka file `.env`, sesuaikan alamat database PostgreSQL server sebelah:
```env
DATABASE_URL="postgresql://username:password@IP_SERVER_DATABASE:5432/nama_db?schema=public"
ADMIN_PASSKEY="admin123#"
```

### 3. Generate Prisma & Push Schema ke PostgreSQL
```bash
npx prisma generate
npx prisma db push
```

### 4. Isi Data Survey Contoh (Seed Data)
```bash
npm run seed
```

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka di browser:
- Halaman Pengisian Survey: **http://localhost:3000**
- Halaman Admin (Passkey): **http://localhost:3000/admin** (Passkey default: `admin123#`)

---

## 🐳 Deploy ke VPS dengan Docker
```bash
docker compose up -d --build
```
