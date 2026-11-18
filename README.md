# Shortlink KU PRO

Aplikasi pemendek tautan berbasis Cloudflare Workers dan Workers KV.

## Fitur
- Halaman sederhana untuk membuat tautan pendek.
- Kode acak baru untuk setiap tautan.
- Penyimpanan permanen selama data KV tidak dihapus.
- Redirect HTTP 302.
- URL tujuan ditampilkan secara transparan sebelum tautan dibuat.
- Validasi URL HTTP/HTTPS dan penolakan sejumlah alamat lokal.

## Struktur
- `src/worker.js`: antarmuka, API pembuatan tautan, dan redirect.
- `wrangler.toml`: konfigurasi Worker dan binding KV.

## Konfigurasi Cloudflare
Repository ini menggunakan namespace KV **SHORTLINK_KU** dengan binding **SHORTLINKS**.

Namespace ID sudah dipasang pada `wrangler.toml`. Pastikan namespace tersebut tetap tersedia di akun Cloudflare yang akan melakukan deployment.

## Deploy melalui Cloudflare
1. Buka **Workers & Pages**.
2. Pilih **Create application** lalu **Continue with GitHub**.
3. Pilih repository `videykuapp/shortlink-ku-pro`.
4. Gunakan root directory repository (biarkan kosong).
5. Build command dapat dikosongkan untuk konfigurasi dashboard Git integration yang membaca `wrangler.toml`. Jika dashboard meminta deploy command, gunakan `npx wrangler deploy`.
6. Pastikan deployment memakai `wrangler.toml` dan binding KV bernama `SHORTLINKS`.
7. Deploy, lalu uji halaman utama, pembuatan tautan, dan redirect.

## Catatan keamanan dan penggunaan
- URL tujuan selalu ditampilkan di antarmuka; layanan ini tidak dirancang untuk menyamarkan tujuan tautan.
- Jangan gunakan untuk spam, phishing, malware, atau menghindari pemeriksaan keamanan platform.
- Kode acak tidak menjamin tautan diterima oleh Facebook atau platform lain.
- Sebelum dibuka untuk publik, tambahkan pembatasan laju (rate limit), mekanisme laporan dan penonaktifan tautan, pemantauan penyalahgunaan, serta kebijakan privasi.
- Validasi alamat lokal yang ada merupakan lapisan dasar, bukan pengganti moderasi dan pemantauan.
