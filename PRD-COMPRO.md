# SKAIHUB -- PRD Company Profile Website

> **Status:** Draft v0.1  
> **Scope:** skaihub.com -- Marketing & Company Profile Site  
> **Date:** 2026-05-15  
> **Audience:** Founder, Development Team, Designer

---

## 1. Overview

`skaihub.com` adalah **website marketing resmi platform SKAIHUB** -- bukan bagian dari sistem manajemen akademi. Tujuan utamanya adalah **mengkonversi pengunjung (pengurus akademi) menjadi klien berbayar** melalui pemaparan fitur, harga, social proof, dan call-to-action ke WhatsApp.

Website ini dibangun sebagai **multi-page Next.js site** dengan kemampuan CMS sederhana yang dikelola Super Admin (testimonial, FAQ, blog, leads inquiry).

---

## 2. Goals & Success Metrics

| Goal | Metrik |
|---|---|
| Awareness | Organic traffic dari Google (target: 500 visit/bulan di bulan ke-3) |
| Conversion | Form / WhatsApp inquiry dari halaman website |
| Trust | Testimoni akademi aktif tampil di halaman utama |
| SEO | Blog artikel ranking untuk keyword taekwondo Indonesia |

---

## 3. Sitemap

```
skaihub.com/
├── /                  -> Home (Landing Utama)
├── /fitur             -> Detail semua fitur platform
├── /harga             -> Pricing & paket berlangganan
├── /tentang           -> Tentang SKAIHUB, visi, tim
├── /blog              -> Daftar artikel SEO
└── /blog/[slug]       -> Detail artikel
```

---

## 4. Page Specification

---

### 4.1 `/` -- Home Page

Halaman utama sebagai **first impression & sales funnel** utama.

#### Section 1 -- Hero
- **Headline:** Tagline kuat & relatable
  > *"Kelola Akademi Bela Diri Kamu Lebih Profesional"*
- **Sub-headline:** 1-2 kalimat deskripsi singkat platform
- **Visual:** Mockup dashboard / landing page akademi (screenshot)
- **CTA Button:** "Daftarkan Akademi Kamu" -> buka WhatsApp
- **Supporting text:** "Sudah dipercaya X akademi di Indonesia" *(dynamic dari CMS)*

#### Section 2 -- Problem Statement
- Konten relatable tentang pain point pengurus akademi
- Format: 3-4 pain point dengan icon
- Contoh:
  - "Masih absensi manual pakai kertas?"
  - "Raport siswa masih tulis tangan?"
  - "Akademi kamu belum punya profil online?"
  - "Data siswa tersebar di grup WhatsApp?"

#### Section 3 -- Solusi / Fitur Showcase
- Overview 6 fitur utama dengan screenshot/mockup per fitur
- Format: alternating (gambar kiri-teks kanan, dst)
- Fitur yang ditampilkan:
  1. Landing Page Akademi Profesional
  2. Manajemen Siswa & Pelatih
  3. Absensi Digital (QR Code)
  4. Sistem Kenaikan Sabuk
  5. Raport Digital
  6. Jadwal & Kurikulum

#### Section 4 -- Preview Demo
- Judul: *"Begini tampilan akademi kamu nanti"*
- **YouTube embed** video demo walkthrough platform
- Atau screenshot carousel landing page contoh akademi

#### Section 5 -- Pricing Preview
- Tampilkan 3 kartu paket (Basic / Pro / Full) secara ringkas
- Tombol "Lihat Detail Harga" -> `/harga`
- CTA per kartu: "Pilih Paket Ini" -> WhatsApp

#### Section 6 -- Testimoni
- 3-6 card testimoni dari akademi aktif
- Per card: foto/logo akademi, nama akademi, kota, kutipan, nama pengurus
- **Dynamic:** dikelola Super Admin via CMS panel

#### Section 7 -- FAQ Preview
- Tampilkan 3-4 FAQ paling sering
- Accordion expand/collapse
- Link "Lihat semua FAQ" (bisa anchor ke `/harga#faq` atau section bawah)
- **Dynamic:** dikelola Super Admin via CMS

#### Section 8 -- CTA Final
- Background bold/kontras
- Headline: *"Siap Digitalisasi Akademi Kamu?"*
- Tombol besar: "Hubungi Kami via WhatsApp" -> `https://wa.me/[nomor]`
- Supporting: nomor WA + jam operasional

#### Section 9 -- Footer
- Logo SKAIHUB
- Navigasi: Home, Fitur, Harga, Tentang, Blog
- Sosial media (Instagram, YouTube, TikTok)
- Copyright
- Tagline singkat

---

### 4.2 `/fitur` -- Halaman Fitur

Halaman dedicated untuk menampilkan **semua fitur secara detail**.

#### Layout:
- Hero kecil: judul + sub-heading
- Per fitur: section penuh dengan:
  - Screenshot/mockup (dari Super Admin upload atau hardcode)
  - Judul fitur
  - Deskripsi 2-3 paragraf
  - Bullet benefit
- Fitur yang dijelaskan (8 total):
  1. Landing Page Akademi
  2. Manajemen Siswa
  3. Manajemen Pelatih
  4. Absensi Digital & QR Code
  5. Kenaikan Sabuk & Sertifikat
  6. Raport Digital
  7. Jadwal & Kurikulum
  8. Pencatatan Prestasi
- CTA di bawah: "Tertarik? Hubungi Kami" -> WhatsApp

---

### 4.3 `/harga` -- Halaman Pricing

Halaman khusus perbandingan paket & harga.

#### Layout:
- Hero: "Pilih Paket yang Sesuai Akademi Kamu"
- Toggle: Bulanan / Tahunan *(opsional, bisa skip fase ini)*
- 3 Pricing Card:

| | Basic | Pro | Full |
|---|---|---|---|
| Harga | Rp 99rb/bln | Rp 199rb/bln | Rp 299rb/bln |
| Akses | app.skaihub.com | [slug].skaihub.com | [slug].skaihub.com |
| Kuota siswa aktif | 50 | 150 | 300 |
| Data siswa & pelatih | Ya | Ya | Ya |
| Jadwal & absensi | Ya | Ya | Ya |
| Keuangan / SPP | Ya | Ya | Ya |
| Website publik akademi | Tidak | Ya | Ya |
| Rapor & penilaian | Tidak | Ya | Ya |
| Event ujian / kenaikan tingkat | Tidak | Tidak | Ya |
| Portal siswa/orang tua | Tidak | Tidak | Ya |
| CTA | Pilih -> WA | Pilih -> WA | Pilih -> WA |

- Durasi langganan dibahas saat follow-up WhatsApp: trial, 1, 3, 6, 12 bulan, atau custom.

- **FAQ Section** (accordion, full list, dynamic dari CMS)
- CTA bottom: "Masih bingung? Chat langsung" -> WA

---

### 4.4 `/tentang` -- Halaman About

Halaman membangun **trust & brand story**.

#### Layout:
- Hero: "Tentang SKAIHUB"
- **Visi & Misi:** 1-2 paragraf
- **Cerita / Background:** Kenapa platform ini dibuat *(hardcode)*
- **Tim** *(opsional -- bisa skip jika belum mau expose)*
- **Nilai Platform:** 3-4 nilai (Mudah, Terjangkau, Aman, Lokal)
- CTA: "Bergabung bersama kami" -> WA

---

### 4.5 `/blog` -- Halaman Blog

Halaman daftar artikel untuk **SEO & organic traffic**.

#### Layout:
- Hero kecil: "Artikel & Tips Taekwondo"
- Grid artikel (3 kolom desktop, 1 kolom mobile):
  - Thumbnail
  - Kategori tag
  - Judul artikel
  - Excerpt (2-3 kalimat)
  - Tanggal publish + estimasi baca
  - Tombol "Baca Selengkapnya"
- Pagination atau infinite scroll
- Sidebar (desktop): kategori populer, artikel terbaru

#### Kategori Artikel:
- Tips Manajemen Akademi
- Kurikulum & Teknik Taekwondo
- Info Platform SKAIHUB
- Berita Taekwondo Indonesia

---

### 4.6 `/blog/[slug]` -- Detail Artikel

#### Layout:
- Thumbnail besar
- Judul, penulis, tanggal, estimasi baca
- Konten artikel (rich text / markdown)
- Share button (WA, Facebook, copy link)
- **CTA box** di tengah dan akhir artikel: "Coba SKAIHUB untuk Akademi Kamu" -> WA
- Artikel terkait (3 artikel)
- Meta tags SEO: title, description, OG image

---

## 5. CMS Requirements (Super Admin Panel)

Konten dynamic yang dikelola Super Admin dari panel `admin.skaihub.com`:

| Fitur CMS | Keterangan |
|---|---|
| **Testimonials** | CRUD testimonial (nama, akademi, kota, foto, kutipan) |
| **FAQ** | CRUD pertanyaan & jawaban (dengan sort order) -- tampil di `/hubungi` dan `/harga` |
| **Blog Posts** | CRUD artikel (judul, slug, konten rich text, thumbnail, kategori, status draft/publish/archived, SEO meta) |
| **Inquiry Leads** | View list & detail form inquiry yang masuk (read-only, untuk monitoring) |
| **Pengaturan** | Key-value global: `whatsapp_number`, `hero_stats_count`, `hero_stats_label`, `site_email` -- dikelola dari halaman Pengaturan di CMS |

---

## 6. Database Schema -- Compro Tables

Tabel-tabel ini **terpisah dari sistem akademi** -- tidak memiliki `akademi_id`.

### `testimonials`

| Column | Type | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| akademi_name | VARCHAR(150) | Nama akademi |
| person_name | VARCHAR(150) | Nama pengurus |
| city | VARCHAR(100) | Kota |
| quote | TEXT | Kutipan testimoni |
| avatar_url | VARCHAR(500) NULL | Foto/logo akademi |
| sort_order | INT | Urutan tampil |
| is_active | BOOLEAN | Default: true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `faqs`

| Column | Type | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| question | TEXT | Pertanyaan |
| answer | TEXT | Jawaban |
| sort_order | INT | Urutan tampil |
| is_active | BOOLEAN | Default: true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `blog_posts`

| Column | Type | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| title | VARCHAR(255) | |
| slug | VARCHAR(255) UNIQUE | URL-friendly |
| excerpt | TEXT NULL | Ringkasan singkat |
| content | LONGTEXT | Konten artikel (rich text / markdown) |
| thumbnail_url | VARCHAR(500) NULL | |
| category | VARCHAR(100) NULL | |
| author_name | VARCHAR(150) NULL | |
| status | ENUM | `draft`, `published` |
| meta_title | VARCHAR(255) NULL | SEO title |
| meta_description | TEXT NULL | SEO description |
| og_image_url | VARCHAR(500) NULL | Open Graph image |
| read_time_minutes | TINYINT NULL | Estimasi baca |
| published_at | TIMESTAMP NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `contact_inquiries`
Form minat yang masuk dari website.

| Column | Type | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| akademi_name | VARCHAR(150) | Nama akademi |
| person_name | VARCHAR(150) | Nama pengurus |
| phone | VARCHAR(20) | Nomor HP / WA |
| city | VARCHAR(100) NULL | Kota |
| plan_interest | ENUM NULL | `basic`, `pro`, `full`, `konsultasi` |
| message | TEXT NULL | Pesan tambahan |
| source_page | VARCHAR(100) NULL | Dari halaman mana (tracking) |
| is_followed_up | BOOLEAN | Default: false (Super Admin tandai) |
| created_at | TIMESTAMP | |

---

### `site_settings`
Konfigurasi global compro yang dikelola Super Admin.

| Column | Type | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| key | VARCHAR(100) UNIQUE | ex: `whatsapp_number`, `hero_stats_count` |
| value | TEXT | |
| updated_at | TIMESTAMP | |

---

## 7. SEO Strategy

### Target Keywords

| Keyword | Intent | Target Halaman |
|---|---|---|
| "aplikasi manajemen akademi taekwondo" | Transaksional | Home, /fitur |
| "software absensi taekwondo" | Transaksional | /fitur |
| "raport digital taekwondo" | Transaksional | /fitur |
| "cara kelola akademi taekwondo" | Informasional | Blog |
| "ujian kenaikan sabuk taekwondo" | Informasional | Blog |
| "kurikulum taekwondo Indonesia" | Informasional | Blog |
| "platform saas taekwondo indonesia" | Navigasional | Home |

### Technical SEO
- Server-Side Rendering (Next.js SSR) untuk semua halaman
- Sitemap otomatis (`/sitemap.xml`) -- include semua blog posts dan events (dynamic, fetch dari API saat build/request)
- Robots.txt
- Open Graph & Twitter Card meta per halaman
- Structured data (JSON-LD) untuk blog articles
- Canonical URL per halaman
- Image optimization (Next.js `<Image>` component)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1

---

## 8. WhatsApp CTA Flow

Semua CTA mengarah ke WhatsApp dengan **pesan template otomatis** sesuai konteks:

| Sumber CTA | Pesan Template WA |
|---|---|
| Hero / Home umum | "Halo SKAIHUB, saya tertarik mendaftarkan akademi saya. Bisa info lebih lanjut?" |
| Paket Basic | "Halo SKAIHUB, saya tertarik paket Basic untuk akademi saya." |
| Paket Pro | "Halo SKAIHUB, saya tertarik paket Pro untuk akademi saya." |
| Paket Full | "Halo SKAIHUB, saya tertarik paket Full untuk akademi saya." |
| Artikel Blog | "Halo SKAIHUB, saya baca artikel [judul] dan tertarik mencoba platformnya." |

Format URL: `https://wa.me/62XXXXXXXXXX?text=[encoded message]`

---

## 9. Non-Functional Requirements

| Aspek | Target |
|---|---|
| **Performance** | LCP < 2.5 detik (mobile & desktop) |
| **SEO** | Semua halaman memiliki unique title & meta description |
| **Responsiveness** | Mobile-first, optimal di semua ukuran layar |
| **Accessibility** | Alt text semua gambar, heading hierarchy benar |
| **Analytics** | Google Analytics 4 terpasang |
| **Hosting** | Deploy di Vercel (Next.js optimal) |

---

## 10. Pages Summary

| Halaman | Type | Konten |
|---|---|---|
| `/` | Semi-dynamic | Testimonial + FAQ + stats dari CMS |
| `/fitur` | Static | Hardcode + screenshot dari assets |
| `/harga` | Semi-dynamic | FAQ dari CMS, harga hardcode |
| `/tentang` | Static | Hardcode |
| `/blog` | Dynamic | Blog posts dari CMS |
| `/blog/[slug]` | Dynamic | Blog post detail dari CMS |

---

## 11. Open Items

| Item | Status | Catatan |
|---|---|---|
| **Nomor WhatsApp resmi** | Belum ada | Perlu ditentukan sebelum launch |
| **Mockup/screenshot fitur** | Perlu dibuat | Dibuat bersamaan dengan development sistem |
| **Video demo YouTube** | Perlu dibuat | Rekam setelah MVP sistem selesai |
| **Konten artikel pertama** | Perlu ditulis | Min. 3 artikel sebelum launch |
| **Testimoni awal** | Perlu data | Input dummy dulu atau tunggu klien pertama |
| **Google Analytics ID** | Belum ada | Buat akun GA4 sebelum launch |

---

*Dokumen ini spesifik untuk website marketing SKAIHUB -- terpisah dari PRD sistem manajemen akademi.*


