# ☕ Aplikasi Kasir Kopi (Point of Sale) Cloud Google Sheets & Drive

Aplikasi kasir (POS) modern, cepat, dan ringan yang dirancang khusus untuk kedai kopi dan UMKM. 
**100% GRATIS SELAMANYA** menggunakan ekosistem **Google Drive / Google Sheets** dan dapat di-hosting gratis di **GitHub Pages**.

---

## 🌟 Fitur Utama

1. **Layar Kasir (POS) Touch-Friendly**:
   - Tampilan responsif optimal untuk HP/Tablet kasir maupun layar PC.
   - Filter kategori cepat: *Es Kopi Susu, Kopi Panas, Non-Coffee, Snack & Pastry, Topping*.
   - Pencarian instan menu kopi.
   - Catatan khusus varian kopi (*Less Sugar, Less Ice, Extra Shot, dll.*).
   - Opsi *Dine In* (Meja) atau *Take Away* (Bawa Pulang).

2. **Pembayaran Tunai & QRIS**:
   - **Tunai**: Tombol nominal cepat (*Uang Pas, Rp 20.000, Rp 50.000, Rp 100.000*) dan kalkulator kembalian otomatis.
   - **QRIS**: Menampilkan gambar QRIS toko Anda, teks nominal yang harus di-scan pembeli, dan konfirmasi lunas.

3. **Cetak Struk Thermal**:
   - Format standar kertas thermal **58mm** dan **80mm** (cocok untuk printer Bluetooth & USB).
   - Dialog cetak langsung via browser (`window.print()`).
   - Fitur **Kirim Struk ke WhatsApp** dalam format teks rapi.
   - Cetak ulang struk lama dari riwayat transaksi.

4. **Kelola Menu & Foto Google Drive**:
   - Tambah menu baru dengan harga jual, harga modal (HPP), dan deskripsi.
   - Gunakan foto dari Google Drive (cukup salin link sharing Google Drive, aplikasi otomatis mengubahnya ke direct link) atau upload file lokal.
   - Atur stok ketersediaan menu (Tersedia / Habis).

5. **Laporan & Dashboard Owner**:
   - Pantau total omset, jumlah transaksi, dan total cup kopi terjual secara realtime.
   - Breakdown metode pembayaran (Tunai vs QRIS).
   - Setiap transaksi otomatis tercatat per baris di **Google Sheets**, sehingga Owner bisa membuka dan mengunduh Excel dari mana saja!

---

## 🚀 Cara Menjalankan di Komputer / Laptop

```bash
# 1. Masuk ke folder proyek
cd "Aplikasi kasir Kopi"

# 2. Jalankan aplikasi (development mode)
npm run dev
```

Buka browser di alamat:
- **Di Laptop Anda**: `http://localhost:5173`
- **Di HP Kasir (Wi-Fi yang sama)**: Buka alamat IP laptop Anda, misalnya: `http://192.168.1.XX:5173`

---

## 📊 Cara Menyambungkan ke Google Sheets (Hanya 1 Menit)

1. Buka [Google Drive](https://drive.google.com/) Anda.
2. Buat Google Spreadsheet baru (Beri nama: **"Database Kasir Kopi"**).
3. Di menu atas Google Sheets, klik **Ekstensi** > **Apps Script**.
4. Hapus semua kode default di editor, lalu **Copy & Paste** seluruh isi file `google_apps_script.js` yang ada di folder proyek ini.
5. Klik ikon **Simpan** (Disket).
6. Klik tombol biru **Terapkan (Deploy)** di kanan atas > Pilih **Penerapan Baru (New Deployment)**.
7. Pada menu gerigi di samping kiri, pilih jenis **Aplikasi Web (Web App)**:
   - Deskripsi: `POS Kopi API`
   - Jalankan sebagai (*Execute as*): **Saya (email Anda)**
   - Siapa yang memiliki akses (*Who has access*): **Siapa saja (Anyone)** *(Penting agar transaksi dari kasir bisa masuk)*
8. Klik **Terapkan (Deploy)** dan izinkan akses akun Google Anda.
9. Salin **URL Aplikasi Web** yang muncul (berakhiran `/exec`).
10. Buka aplikasi kasir > Masuk ke tab **Pengaturan** > Paste URL tersebut ke kolom **URL Google Apps Script**, lalu klik **Tes Koneksi** dan **Simpan**!

---

## 🖼️ Cara Memakai Foto dari Google Drive

1. Upload foto menu kopi Anda ke Google Drive.
2. Klik kanan pada foto di Google Drive > **Bagikan (Share)** > Ubah akses menjadi **"Siapa saja yang memiliki link" (Anyone with the link)**.
3. Salin link tersebut (contoh: `https://drive.google.com/file/d/1A2B3C.../view?usp=sharing`).
4. Di aplikasi kasir, masuk ke **Kelola Menu** > **Tambah/Edit Menu** > Tempel link tersebut.
5. Aplikasi secara cerdas otomatis mengonversinya menjadi URL gambar langsung!

---

## 🌐 Cara Deploy Gratis ke GitHub Pages

Agar aplikasi kasir Anda bisa diakses online dari mana saja oleh kasir dan owner:

```bash
# 1. Inisialisasi Git (jika belum)
git init
git add .
git commit -m "Initial Coffee POS App"

# 2. Hubungkan ke repositori GitHub Anda
git remote add origin https://github.com/USERNAME/kasir-kopi.git
git branch -M main
git push -u origin main

# 3. Build & Deploy
npm run build
```

Di pengaturan repositori GitHub Anda (**Settings > Pages**), pilih sumber branch **main** / folder `/dist` atau gunakan GitHub Actions untuk otomatis deploy ke GitHub Pages gratis selamanya!
