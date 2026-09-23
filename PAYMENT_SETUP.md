# Setup Payment Arvilo

Arvilo memakai Midtrans Payment Link melalui Netlify Functions. Midtrans mengembalikan URL checkout dari API Payment Link, dan detail pembayaran dapat diperiksa berdasarkan `order_id`.

## 1. Mulai dari Sandbox
- Buat/masuk ke akun merchant Midtrans.
- Gunakan Sandbox untuk menguji alur terlebih dahulu.
- Ambil Server Key dari Access Keys.

## 2. Deploy ke Netlify
Tambahkan Environment Variables:
- `MIDTRANS_SERVER_KEY` = server key dari Midtrans
- `MIDTRANS_ENV` = `sandbox`
- `SITE_URL` = URL Netlify yang dapat diakses publik

`netlify.toml` sudah memetakan:
- `/api/create-payment` → function `create-payment`
- `/api/check-payment` → function `check-payment`

## 3. Test flow
1. Buka website online.
2. Scroll ke pembayaran.
3. Klik `Bayar Rp15.000`.
4. Website memanggil `/api/create-payment`.
5. Netlify Function membuat Payment Link Midtrans.
6. Pengguna diarahkan ke checkout Midtrans.
7. Setelah checkout selesai, Midtrans mengarahkan kembali ke `/?payment=finish&order_id=...`.
8. Frontend meminta `/api/check-payment` untuk memverifikasi status.

## 4. Production
Setelah alur Sandbox bekerja:
- Selesaikan aktivasi merchant Midtrans.
- Ganti `MIDTRANS_ENV` menjadi `production`.
- Ganti `MIDTRANS_SERVER_KEY` dengan Server Key Production.
- Pastikan `SITE_URL` menggunakan domain HTTPS produksi.
- Redeploy.

## 5. Catatan
Payment Link API mendukung `FIXED_AMOUNT`; Arvilo menetapkan gross amount Rp15.000 dan item price Rp15.000 di backend. Metode pembayaran yang tampil bergantung pada metode aktif merchant.
