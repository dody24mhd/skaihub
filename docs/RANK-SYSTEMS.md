# Sistem Tingkatan (Sabuk) per Akademi

Riset: 2026-10-17 (L4-C). Dokumen ini adalah **sumber kebenaran katalog bawaan** yang ditanam oleh
`dojang-hub-api/database/seeders/RankCatalogSeeder.php`. Bila tabel di sini diubah, ubah seeder juga.

## Ringkasan temuan riset (jujur)

- **Tidak ada dokumen resmi** PBTI, FORKI, atau KKI yang berhasil diakses daring. Situs resmi
  (kukkiwon.or.kr, karate.or.id) tidak bisa dibuka dari lingkungan riset. Semua tabel di bawah
  berasal dari **sumber sekunder** (media nasional, blog perguruan, pedoman kantor Kukkiwon Inggris).
- **Taekwondo Kukkiwon**: urutan Geup 10→1 dan Dan 1–9 konsisten; **warna/strip per geup berbeda
  antar sumber Indonesia** (dua varian, lihat di bawah). Poom 1–4 untuk usia < 15 tahun konsisten.
- **Karate FORKI**: FORKI adalah **federasi payung**; perguruan anggotanya (INKAI, LEMKARI, KKI, dll.)
  memakai urutan warna sendiri. Tidak ditemukan satu standar sabuk "FORKI". Katalog FORKI di bawah
  adalah **urutan umum 10 kyu** dari media nasional — seluruhnya **PERLU KONFIRMASI PEMILIK**.
- **Karate KKI** (Kushin-Ryu M Karate-Do Indonesia, anggota FORKI): 7 kyu (putih → coklat) konsisten
  di beberapa sumber; perbedaan ada pada penamaan "strip" vs "muda/tua" untuk biru & coklat.
- Akademi tetap bisa **menambah sabuk sendiri** (strip khusus, nama perguruan) dengan `sequence`
  di sela-sela angka bawaan (katalog memakai kelipatan 10 agar ada ruang).

## Aturan urutan (`sequence`) yang dipakai aplikasi

- Kyu/Geup `n` → `sequence = (11 − n) × 10` (Geup/Kyu 10 = 10, … , 1 = 100).
- Dan/Poom `n` → `sequence = 100 + n × 10` (Dan 1 = 110, … ). **Poom n dan Dan n memakai
  `sequence` yang sama** karena setara tingkatnya (Poom dikonversi ke Dan setelah usia 15).
- UKT: sabuk tujuan harus punya `sequence` **lebih besar** (satu-satunya aturan yang memblokir).
  Bila ada tingkat (nilai `sequence` berbeda) di antara asal dan tujuan, itu "loncat tingkat":
  **tetap diterima**, API mengembalikan `warnings` (mis. "Melewati 2 tingkat dari … ke …") dan UI
  menampilkannya tanpa memblokir — syarat kelayakan adalah kebijakan tiap akademi (keputusan pemilik).

## 1. Taekwondo Kukkiwon (`taekwondo_kukkiwon`) — dipakai PBTI

Varian yang ditanam = **Varian A** (Okezone, Kelaskita, VOI, Media Indonesia — mayoritas artikel
Indonesia yang membahas Taekwondo WT/Kukkiwon). **Varian B** (putih strip kuning di Geup 9, dst.)
muncul di Detik, IDN Times, Medcom, Sparks — Detik dan IDN Times menyertakan pola ITF (Chon-Ji, Dan-Gun)
sehingga kemungkinan bercampur dengan sistem ITF.

| Kode | Tingkat | Varian A (ditanam) | Varian B | `sequence` | Status |
|---|---|---|---|---|---|
| tkd-geup-10 | Geup 10 | Putih | Putih | 10 | Konsisten |
| tkd-geup-9 | Geup 9 | Kuning | Putih strip/ujung kuning | 20 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-8 | Geup 8 | Kuning strip hijau | Kuning | 30 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-7 | Geup 7 | Hijau | Kuning strip hijau | 40 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-6 | Geup 6 | Hijau strip biru | Hijau | 50 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-5 | Geup 5 | Biru | Hijau strip biru | 60 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-4 | Geup 4 | Biru strip merah | Biru | 70 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-3 | Geup 3 | Merah | Biru strip merah | 80 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-2 | Geup 2 | Merah strip hitam 1 | Merah | 90 | PERLU KONFIRMASI PEMILIK |
| tkd-geup-1 | Geup 1 | Merah strip hitam 2 | Merah strip hitam | 100 | PERLU KONFIRMASI PEMILIK |
| tkd-poom-1 … tkd-poom-4 | Poom 1–4 (usia < 15) | Merah-hitam | — | 110–140 | Konsisten (jumlah 4) |
| tkd-dan-1 … tkd-dan-9 | Dan 1–9 | Hitam | — | 110–190 | Konsisten |

Catatan Kukkiwon:
- Dan 10 bersifat kehormatan dari Kukkiwon (tanpa ujian) → **tidak** ditanam.
- Konversi Poom → Dan pada usia 15 **bukan UKT** (tidak otomatis menurut STF); dilakukan dengan
  mengubah sabuk siswa secara manual (tercatat di riwayat sabuk).

Sumber:
- Okezone — https://sports.okezone.com/read/2022/02/14/43/2547266/tingkatan-sabuk-taekwondo-dan-artinya?page=all (Varian A; Dan I–IX, Dan X kehormatan Kukkiwon)
- Media Indonesia — https://mediaindonesia.com/olahraga/519709/urutan-tingkatan-sabuk-taekwondo (Varian A menurut ringkasan mesin pencari; halaman berbayar, tidak terbaca langsung)
- Kelaskita — https://www.kelaskita.com/artikel/simak-urutan-tingkat-sabuk-taekwondo/ (Varian A menurut ringkasan; gagal dibuka langsung)
- VOI — https://voi.id/olahraga/204899/mengenal-tingkatan-sabuk-taekwondo-setiap-warna-memiliki-makna-mendalam (Varian A menurut ringkasan; 403)
- Detik — https://sport.detik.com/sport-lain/d-6906076/arti-warna-sabuk-taekwondo-berdasarkan-tingkatan-dan-urutannya (Varian B, menyebut pola ITF)
- Medcom — https://www.medcom.id/olahraga/sports-lainnya/ObzPQy0K-ketahui-ini-nama-baju-taekwondo-dan-tingkatan-sabuknya (Varian B)
- IDN Times — https://www.idntimes.com/sport/arena/yogama-wisnu-oktyandito/tingkatan-sabuk-taekwondo-dan-artinya (Varian B, pola ITF)
- Sparks Sports Academy — https://academy.sparks-edu.com/blog/geup-taekwondo/ (Varian B)
- UK Kukkiwon Office, Dan Grading guide — https://www.britishtaekwondo.org.uk/wp-content/uploads/2024/07/UK-Kukkiwon-Office-Dan-Grading-process-guide.pdf (Poom/Dan, batas usia)
- Singapore Taekwondo Federation, konversi Poom ke Dan — https://www.stf.sg/news/grading/conversion-from-poom-to-dan/
- Taekwondo Preschool (Dan, < 15 tahun tidak bisa ujian Dan) — https://taekwondopreschool.com/dan.html

## 2. Karate FORKI (`karate_forki`) — urutan umum, SELURUHNYA PERLU KONFIRMASI

| Kode | Tingkat | Warna (ditanam) | `sequence` | Status |
|---|---|---|---|---|
| forki-kyu-10 | Kyu 10 | Putih | 10 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-9 | Kyu 9 | Kuning | 20 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-8 | Kyu 8 | Kuning | 30 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-7 | Kyu 7 | Oranye | 40 | PERLU KONFIRMASI PEMILIK (tidak semua perguruan memakai oranye) |
| forki-kyu-6 | Kyu 6 | Oranye | 50 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-5 | Kyu 5 | Hijau | 60 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-4 | Kyu 4 | Hijau | 70 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-3 | Kyu 3 | Biru | 80 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-2 | Kyu 2 | Biru | 90 | PERLU KONFIRMASI PEMILIK |
| forki-kyu-1 | Kyu 1 | Coklat | 100 | PERLU KONFIRMASI PEMILIK |
| forki-dan-1 … forki-dan-10 | Dan 1–10 | Hitam | 110–200 | Konsisten (shodan s.d. judan) |

Varian lain yang ditemukan (tidak ditanam):
- LEMKARI (pendiri FORKI): putih kyu 10–9, kuning kyu 8,5–7,5, hijau kyu 6,5–6, biru kyu 5,5–4, coklat kyu 3,5–1 (memakai setengah kyu).
- Federasi Karate Tradisional Indonesia (bukan FORKI): kuning kyu 8–7, hijau kyu 6, biru kyu 5–4, coklat kyu 3–1.

Sumber:
- Medcom, "7 Tingkatan Sabuk Karate" — https://www.medcom.id/olahraga/sports-lainnya/RkjrVRWk-yuk-belajar-7-tingkatan-sabuk-karate-dan-penjelasannya (tabel yang ditanam; tidak menyebut FORKI)
- Bisnis.com Kabar24 — https://kabar24.bisnis.com/read/20230911/79/1693819/inilah-urutan-tingkatan-sabuk-karate (urutan serupa menurut ringkasan; 403)
- Tirto — https://tirto.id/tingkatan-sabuk-karate-beserta-arti-dan-cara-mendapatkannya-gQPx (putih, kuning, oranye, hijau, biru, coklat, hitam)
- Wikipedia, LEMKARI — https://id.wikipedia.org/wiki/Lembaga_Karate-Do_Indonesia
- Gramedia, variasi antar aliran — https://www.gramedia.com/best-seller/urutan-sabuk-karate/

## 3. Karate KKI (`karate_kki`) — Kushin-Ryu M Karate-Do Indonesia

| Kode | Tingkat | Warna (ditanam) | Variasi | `sequence` | Status |
|---|---|---|---|---|---|
| kki-kyu-7 | Kyu 7 | Putih | — | 40 | Konsisten |
| kki-kyu-6 | Kyu 6 | Kuning | — | 50 | Konsisten |
| kki-kyu-5 | Kyu 5 | Hijau | — | 60 | Konsisten |
| kki-kyu-4 | Kyu 4 | Biru strip | "biru muda" (Tanggamus); sebagian dojo kyu 3,5 | 70 | PERLU KONFIRMASI PEMILIK |
| kki-kyu-3 | Kyu 3 | Biru | "biru tua" | 80 | PERLU KONFIRMASI PEMILIK |
| kki-kyu-2 | Kyu 2 | Coklat strip | "coklat muda" | 90 | PERLU KONFIRMASI PEMILIK |
| kki-kyu-1 | Kyu 1 | Coklat | "coklat tua" | 100 | PERLU KONFIRMASI PEMILIK |
| kki-dan-1 … kki-dan-10 | Dan 1–10 | Hitam | blog menyebut Dan 1–10 | 110–200 | PERLU KONFIRMASI PEMILIK (batas atas Dan) |

Sumber:
- Kompasiana (kyu 7 putih s.d. kyu 1 coklat polos, biru/coklat strip) — https://www.kompasiana.com/desindahani/5fa69951d541df1ce9194033/seni-bela-diantara-kaum-perempuan?page=2&page_images=2
- Blog KUSHIN RYU M KARATEDO INDONESIA (kyu 7–1, Dan 1–10, catatan variasi kyu 3,5) — http://megasilfiasari27.blogspot.com/
- Detak Media, UKT KKI Tanggamus 2020 (putih→kuning→hijau→biru muda→biru tua→coklat muda→coklat tua) — https://detakmedia.com/2020/11/30/kushin-karate-indonesia-kki-kabupaten-tanggamus-ikuti-ujian-kenaikan-tingkat/
- Kompasiana, KKI anggota FORKI — https://www.kompasiana.com/idewaketutsuharjana2004/69dee44fed64156d192dd6b2/kushin-ryu-m-karate-do-indonesia-kki-sepanjang-napas

## Migrasi data lama

Baris global Taekwondo demo lama dipetakan ke kode katalog Kukkiwon **tanpa mengganti id**
(FK siswa, peserta UKT, dan riwayat sabuk tetap utuh):

| Kode lama | Kode baru |
|---|---|
| white | tkd-geup-10 |
| yellow | tkd-geup-9 |
| green | tkd-geup-7 |
| blue | tkd-geup-5 |
| red | tkd-geup-3 |
| poom | tkd-poom-1 |
| black | tkd-dan-1 |
