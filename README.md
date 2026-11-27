# Edukasi App - Backend

REST API untuk aplikasi edukasi. Backend menggunakan Express, Sequelize, PostgreSQL, dan Supabase untuk autentikasi serta penyimpanan media.

## Teknologi

- Node.js
- Express 5
- Sequelize 6 dan PostgreSQL
- Supabase Auth dan Storage
- Multer untuk menerima unggahan gambar dan audio

## Persyaratan

- Node.js 24 atau lebih baru
- Database PostgreSQL yang dapat diakses dari aplikasi
- Proyek Supabase dengan Auth dan Storage yang telah dikonfigurasi

## Menjalankan Secara Lokal

1. Masuk ke folder `edu-BE`.
2. Pasang dependency:

	```bash
	npm install
	```

3. Buat file `.env` di folder ini:

	```env
	PORT=5000

	DB_DIALECT=postgres
	DB_HOST=your-database-host
	DB_PORT=5432
	DB_NAME=your-database-name
	DB_USER=your-database-user
	DB_PASSWORD=your-database-password

	SUPABASE_URL=https://your-project.supabase.co
	SUPABASE_ANON_KEY=your-supabase-anon-key
	SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
	```

	Ganti nilai contoh dengan kredensial milik Anda. Jangan commit file `.env` atau membagikan `SUPABASE_SERVICE_ROLE_KEY`; kunci tersebut hanya boleh digunakan di backend.

4. Jalankan server:

	```bash
	node server.js
	```

	Server secara default tersedia di `http://localhost:5000`. Saat mulai, server menghubungkan database, menyinkronkan model Sequelize, dan membuat kategori `Angka`, `Huruf`, serta `Warna` jika tabel kategori masih kosong.

Untuk menjalankan dengan pemantauan perubahan saat development:

```bash
npx nodemon server.js
```

Endpoint pemeriksaan server: `GET /`.

## Endpoint API

Semua endpoint API menggunakan prefix `/api`.

| Prefix | Kegunaan |
| --- | --- |
| `/api/auth` | Registrasi dan login admin, reset password, persetujuan admin, serta pengelolaan 2FA |
| `/api/contents` | Membaca konten; admin dapat membuat, mengubah, menghapus, dan mengimpor konten. Unggahan gambar/audio maksimal 10 MB per file |
| `/api/quizzes` | Kuis acak melalui `GET /play`; pengelolaan bank soal memerlukan autentikasi admin |
| `/api/categories` | Membaca kategori dan membuat kategori |
| `/api/partgame` | Konten permainan membaca melalui `/read` dan `/read/:id` |

Rute baca konten dan kategori serta rute `GET /api/quizzes/play` dapat diakses tanpa autentikasi. Rute admin yang dilindungi mengharuskan token autentikasi di header `Authorization`.

Contoh pemeriksaan:

```bash
curl http://localhost:5000/
curl http://localhost:5000/api/contents
```

## Deploy

Backend dapat dijalankan dengan Node.js atau Docker. Image Docker menjalankan `node server.js`; siapkan variabel lingkungan yang sama pada konfigurasi runtime dan pastikan port yang digunakan tersedia. Proyek juga menyertakan `vercel.json` untuk deployment ke Vercel.

## Catatan

- Script `test` belum dikonfigurasi dan saat ini hanya mengembalikan pesan bahwa test belum tersedia.
- Koneksi database menggunakan SSL dan tabel disinkronkan saat server lokal dimulai.
- Aturan CORS diatur di `server.js`; origin lokal, subdomain Vercel, dan subdomain `achmadaldino.my.id` diizinkan.