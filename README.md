# Shortlink KU PRO

Aplikasi pemendek tautan sederhana berbasis Cloudflare Workers + Workers KV.

## Fitur
- Halaman satu layar untuk membuat shortlink.
- Kode acak baru untuk setiap tautan.
- Penyimpanan di Cloudflare KV.
- Redirect HTTP 302.
- Tujuan tautan ditampilkan secara transparan.
- Validasi URL HTTP/HTTPS dan penolakan sejumlah alamat lokal.

## File
- `src/worker.js`: aplikasi dan endpoint.
- `wrangler.toml`: konfigurasi deployment.

## Menyiapkan Cloudflare
1. Buat akun Cloudflare dan buka Workers & Pages.
2. Buat namespace KV bernama `SHORTLINKS`.
3. Salin ID namespace KV.
4. Ganti nilai `id` di `wrangler.toml` dengan ID tersebut.
5. Deploy Worker melalui Wrangler atau dashboard Cloudflare.
6. Uji pembuatan tautan dan redirect.

## Catatan keamanan
- Jangan gunakan layanan ini untuk menyamarkan tujuan, spam, phishing, atau menghindari pemeriksaan platform.
- Kode acak bukan jaminan tautan akan diterima Facebook atau platform lain.
- Sebelum dibuka untuk publik, tambahkan rate limit, pelaporan/penonaktifan tautan, pemantauan penyalahgunaan, dan kebijakan privasi.
- Pemeriksaan alamat lokal bukan pengganti moderasi tujuan tautan.
