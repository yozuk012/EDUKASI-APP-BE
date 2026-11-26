// 1. Load environment variables PALING AWAL
require("dotenv").config();

// ==========================================
// 🛡️ MAGIC PATCH: Backward Compatibility untuk File Lama
// ==========================================
// Memaksa Node.js untuk mengisi variabel yang salah ketik (typo) 
// di file-file lama dengan nilai yang benar, secara global.
if (!process.env.SUPABASE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
}
if (!process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
}
// Cadangan: jika ada file yang tidak sengaja memakai prefix VITE_ di backend
if (!process.env.VITE_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}
// ==========================================

// 2. Paksa Node.js menggunakan IPv4 (penting untuk Windows & Vercel)
require("dns").setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const path = require("path");

// Tambahkan impor Category dari models
const { sequelize, Category } = require("./src/models");

// Import routes
const contentRoutes = require("./src/routes/contentRoutes");
const quizRoutes = require("./src/routes/quizRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const partgameRoutes = require("./src/routes/partgameRoutes");
const authRoutes = require("./src/routes/authRoutes"); // ✅ TAMBAHAN BARU - AUTH ROUTES

const app = express();
const PORT = process.env.PORT || 5000; // Default ke 5000 agar sesuai .env

// --- UPDATE UTAMA: CORS PINTAR (DITAMBAHKAN CUSTOM DOMAIN) ---
const ALLOWED_ORIGINS = [
  'http://localhost:5173',                           // Development lokal FE
  'http://localhost:3000',                           // Alternatif port dev
  'https://edukasi-app-fe-git-main-aldino13.vercel.app', // Preview Vercel FE
  'https://app-edu.demo.achmaldalino.my.id',         // ✅ Custom domain production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Izinkan request tanpa origin (Postman, curl, mobile app)
      if (!origin) {
        return callback(null, true);
      }
      
      // Cek apakah origin ada di whitelist
      if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS diblokir untuk origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // Cache preflight request selama 24 jam
  }),
);
// ---------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pastikan folder uploads ada (opsional, untuk menghindari error jika folder belum dibuat)
const uploadDir = path.join(__dirname, "src/uploads");
// app.use("/uploads", express.static(uploadDir)); // Uncomment jika kamu masih pakai local storage

// Rute API
app.use("/api/auth", authRoutes); // ✅ TAMBAHAN BARU - AUTH ROUTES (diletakkan di atas)
app.use("/api/contents", contentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/partgame", partgameRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: `Backend Edukasi Aktif (${(process.env.DB_DIALECT || "unknown").toUpperCase()} Environment) 🚀`,
  });
});

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Terjadi kesalahan pada server",
  });
});

// --- SEEDER KATEGORI ---
const seedDefaultCategories = async () => {
  try {
    const count = await Category.count();

    if (count === 0) {
      console.log("⏳ Tabel categories kosong. Menambahkan data default...");
      await Category.bulkCreate([
        { name: "Angka" },
        { name: "Huruf" },
        { name: "Warna" },
      ]);
      console.log(
        "✅ Data default categories (Angka, Huruf, Warna) berhasil ditambahkan!",
      );
    } else {
      console.log(
        `ℹ️ Tabel categories sudah berisi ${count} data. Skip inisialisasi default.`,
      );
    }
  } catch (error) {
    console.error(
      "❌ Gagal mengecek/menambahkan data default categories:",
      error.message,
    );
  }
};

// --- FUNGSI START SERVER (UNTUK LOKAL) ---
const startServer = async () => {
  try {
    const dbType = (process.env.DB_DIALECT || "unknown").toUpperCase();
    console.log(`⏳ Langkah 1: Mencoba koneksi ke ${dbType}...`);

    await sequelize.authenticate();
    console.log(`✅ Database ${dbType} terhubung.`);

    console.log("⏳ Melakukan sinkronisasi tabel database...");
    await sequelize.sync({ alter: true });
    console.log("✅ Semua tabel berhasil dibuat/diperbarui!");

    await seedDefaultCategories();

    console.log("⏳ Langkah 2: Menyalakan port server...");
    app.listen(PORT, "0.0.0.0", () => {
      console.log("-----------------------------------------------");
      console.log(
        `🚀 SERVER BERHASIL JALAN DI PORT ${PORT}! (Mendengarkan di 0.0.0.0)`,
      );
      console.log(`📡 Dialek DB: ${process.env.DB_DIALECT}`);
      console.log("🔐 Auth endpoint: /api/auth/login");
      console.log("-----------------------------------------------");
    });
  } catch (error) {
    console.error("❌ Gagal memulai server:", error.message);
    if (error.original) {
      console.error(
        "Detail DB:",
        error.original.sqlMessage || error.original.detail || error.original,
      );
    }
    process.exit(1);
  }
};

// --- LOGIKA PEMISAH LOKAL & VERCEL ---
const isVercel = process.env.VERCEL === "1";

if (!isVercel) {
  // Jika di laptop sendiri, jalankan server dan sync database otomatis
  startServer();
}

// Ekspor app Express untuk dibaca oleh serverless Vercel
module.exports = app;