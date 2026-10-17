# SKAIHUB -- Design System

> **Version:** 1.0
> **Style Direction:** Sporty & Energic
> **Date:** 2026-05-16
> **Scope:** Compro (skaihub.com) - Admin Panel - Akademi Dashboard

---

## 1. Design Philosophy

**"Sporty & Energic"** -- platform yang terasa seperti komunitas olahraga, bukan software korporat.

Tiga prinsip utama:

- **Bold over subtle** -- heading besar, uppercase, kontras tinggi. Tidak ada yang samar.
- **Geometric & angular** -- diagonal cuts, hard shadows, sharp edges. Bukan rounded-full atau glassmorphism.
- **High contrast pairing** -- navy gelap vs merah vs putih. Tidak ada warna pastel atau gradient lembut.

---

## 2. Color Palette

Semua warna didefinisikan sebagai CSS variables di `globals.css` dan diakses via Tailwind token.

### Brand Colors

| Token | CSS Variable | Hex | Penggunaan |
|---|---|---|---|
| `primary` | `--primary` | `#031636` | Background dark, heading, sidebar |
| `primary-container` | `--primary-container` | `#1a2b4c` | Hover state primary, card dark variant |
| `secondary` | `--secondary` | `#d32f2f` | CTA button, accent bar, badge, highlight |
| `secondary-dark` | `--secondary-dark` | `#b6171e` | Hover state secondary |

### Surface Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `white` | `#ffffff` | Card background, section bg utama |
| `slate-50` | `#f8fafc` | Section bg alternating (testimonial, dll) |
| `background` | `#f8f9ff` | Root background |

### Semantic Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `success` | `#10b981` | Status aktif, hadir, lulus |
| `belt-yellow` | `#facc15` | Badge sabuk kuning, star rating |
| `belt-blue` | `#2563eb` | Badge sabuk biru |
| `muted` | `#44474e` | Body text, deskripsi, caption |
| `border` | `#e2e8f0` | Border card, divider, input |

### Aturan Warna

- **Jangan** pakai gradient lembut (biru ke ungu, dll) -- tidak sesuai karakter sporty
- **Boleh** pakai `secondary/10`, `secondary/20` untuk diagonal accent block
- **Jangan** pakai lebih dari 2 warna brand dalam satu card
- Warna putih di atas `primary` selalu pakai opacity: `white/80`, `white/60`, `white/40`, `white/10`

---

## 3. Typography

### Font Stack

```css
--font-heading: Montserrat, Inter, Arial, sans-serif;  /* Semua heading */
--font-sans:    Inter, Arial, sans-serif;               /* Body text */
```

### Heading Scale

| Konteks | Size | Weight | Transform | Tracking |
|---|---|---|---|---|
| Hero H1 | `text-6xl` ? `text-8xl` | `font-black` (900) | `uppercase` | `tracking-tight` |
| Section H2 | `text-4xl` ? `text-5xl` | `font-black` (900) | `uppercase` | `tracking-tight` |
| Card H3 | `text-2xl` ? `text-3xl` | `font-black` (900) | `uppercase` | default |
| Sub-heading | `text-xl` | `font-bold` (700) | `uppercase` | default |

### Body Scale

| Konteks | Size | Weight | Color |
|---|---|---|---|
| Body utama | `text-base` (16px) | `font-normal` | `text-muted` |
| Body kecil | `text-sm` (14px) | `font-normal` | `text-muted` |
| Caption / label | `text-xs` (12px) | `font-black` | `text-secondary` |
| Stat number | `text-4xl`+ | `font-black` | `text-white` / `text-primary` |

### Section Label Pattern

Setiap section header wajib punya label kecil di atas heading utama:

```tsx
<div className="mb-3 flex items-center gap-3">
  <div className="h-1 w-10 bg-secondary" />
  <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
    NAMA SECTION
  </span>
</div>
<h2 className="font-heading text-4xl font-black uppercase leading-none tracking-tight text-primary md:text-5xl">
  Judul Section<br />Dua Baris
</h2>
```

Pola ini **wajib konsisten** di semua section compro, admin, dan Akademi.

---

## 4. Layout & Spacing

### Container

```css
.container-app {
  max-width: 1280px;
  padding-left: 1.5rem;   /* px-6 */
  padding-right: 1.5rem;
  margin: auto;
}
```

### Section Spacing

```css
.section-y {
  padding-top: 5rem;      /* py-20 */
  padding-bottom: 5rem;
  /* lg: py-24 */
}
```

### Section Header Layout

Selalu **left-aligned** dengan deskripsi di kanan (bukan centered):

```tsx
<div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
  <div>
    {/* Label + Heading */}
  </div>
  <p className="max-w-sm text-base leading-relaxed text-muted md:text-right">
    {/* Deskripsi singkat */}
  </p>
</div>
```

**Pengecualian:** FAQ section boleh centered karena layout narrow (max-w-3xl).

---

## 5. Signature Visual Elements

Ini elemen khas yang membentuk karakter sporty SKAIHUB. Gunakan secara konsisten.

### 5.1 Diagonal Cut Section

Dipakai untuk transisi antar section agar tidak flat:

```tsx
/* Diagonal bawah */
className="[clip-path:polygon(0_0,100%_0,100%_80%,0_100%)]"

/* Diagonal atas dan bawah (section tengah) */
className="[clip-path:polygon(0_4%,100%_0,100%_96%,0_100%)]"
```

Gunakan di: Stats Bar, Features section, CTA final.

### 5.2 Red Accent Bar

Penanda visual sebelum label section -- garis horizontal merah tipis:

```tsx
<div className="h-1 w-10 bg-secondary" />
```

Selalu muncul berpasangan dengan section label. Tidak dipakai sendirian.

### 5.3 Hard Shadow (Offset Shadow)

Bukan `box-shadow` biasa -- shadow offset solid untuk kesan bold:

```tsx
/* Card highlighted pricing */
shadow-[8px_8px_0px_theme(colors.secondary)]

/* Card testimonial tengah */
shadow-[6px_6px_0px_theme(colors.secondary)]

/* CTA button */
shadow-[6px_6px_0px_rgba(255,255,255,0.15)]
```

### 5.4 Diagonal Block Accent

Block warna dengan clip-path untuk dekorasi sudut section:

```tsx
/* Diagonal kanan atas */
<div className="absolute right-0 top-0 h-full w-2/5 bg-secondary/10
  [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)]" />

/* Diagonal split card */
<div className="absolute right-0 top-0 h-full w-2/5 bg-primary
  [clip-path:polygon(20%_0%,100%_0%,100%_100%,0%_100%)]" />
```

### 5.5 Dot Grid Pattern

~~Texture subtle untuk section dark~~ -- **DIHAPUS dari implementasi**. Tidak dipakai di manapun karena mengganggu visual.

---

## 6. Components

### 6.1 Button

**Primary CTA (merah):**
```tsx
<Link className="bg-secondary px-10 py-5 text-sm font-black uppercase tracking-widest text-white
  transition-all hover:-translate-y-1 hover:bg-secondary-dark">
  TEKS CTA
</Link>
```

**Secondary / Outline:**
```tsx
<Link className="border-2 border-primary px-8 py-4 text-sm font-black uppercase tracking-widest
  text-primary transition hover:bg-primary hover:text-white">
  TEKS
</Link>
```

**Aturan button:**
- Selalu `uppercase` + `tracking-widest` + `font-black`
- Tidak ada `rounded` -- sharp edges
- Hover selalu ada `translate-y` atau color swap
- Tidak ada shadow blur -- pakai offset shadow jika perlu

### 6.2 Card

**Card dark (primary bg):**
```tsx
<div className="relative overflow-hidden bg-primary p-8">
  {/* Diagonal accent */}
  <div className="absolute -right-8 -top-8 h-32 w-32 rotate-12 bg-secondary/20" />
  <div className="absolute right-4 top-4 h-1 w-16 bg-secondary" />
  {/* Content */}
</div>
```

**Card light (white/border):**
```tsx
<div className="border-2 border-border bg-white p-8
  hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg transition-all">
  {/* Content */}
</div>
```

**Card highlighted (pricing/testimonial):**
```tsx
<div className="bg-primary p-8 shadow-[8px_8px_0px_theme(colors.secondary)]">
  {/* Content */}
</div>
```

**Aturan card:**
- Tidak ada `rounded-3xl` atau radius besar -- maksimal `rounded` (4px) atau sharp
- Card highlighted selalu pakai offset shadow merah
- Tidak ada glassmorphism atau backdrop-blur di card

### 6.3 Feature List Item

Untuk pricing card dan list fitur -- pakai icon Material Symbol:

```tsx
{/* Fitur tersedia */}
<span className="material-symbols-outlined flex-shrink-0 text-primary"
  style={{ fontVariationSettings: "'FILL' 1", fontSize: "18px" }}>
  check_circle
</span>

{/* Fitur tidak tersedia */}
<span className="material-symbols-outlined flex-shrink-0 text-slate-300"
  style={{ fontVariationSettings: "'FILL' 0", fontSize: "18px" }}>
  cancel
</span>
```

Untuk list biasa (bukan pricing) -- tetap pakai garis merah:
```tsx
<div className="h-1 w-4 flex-shrink-0 bg-secondary" />
```

### 6.4 Icon Watermark

Icon Material Symbol besar sebagai dekorasi background card -- subtle, tidak mengganggu konten:

```tsx
<span
  className="material-symbols-outlined pointer-events-none absolute -bottom-4 -right-4 select-none text-primary opacity-[0.04]"
  style={{ fontSize: "160px", fontVariationSettings: "'FILL' 1" }}
>
  nama_icon
</span>
```

Aturan:
- Opacity maksimal `0.05` di background putih
- Posisi sudut kanan bawah, sedikit overflow
- Pilih icon yang relevan dengan konteks card

### 6.5 FAQ Accordion

```tsx
<details className="group border-2 border-border bg-white open:border-primary">
  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
    <span className="flex items-center gap-4">
      <span className="font-heading text-xs font-black text-secondary">01</span>
      <span className="font-heading text-base font-bold uppercase text-primary">Pertanyaan</span>
    </span>
    <span className="flex h-6 w-6 items-center justify-center border-2 border-primary
      text-primary transition-transform group-open:rotate-45">+</span>
  </summary>
  <p className="border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed text-muted">
    Jawaban
  </p>
</details>
```

---

## 7. Section Rhythm (Compro Homepage)

Urutan section dan background alternating yang sudah ditetapkan:

| # | Section | Background | Diagonal |
|---|---|---|---|
| 1 | Hero | `bg-primary` (dark) | -- |
| 2 | Stats Bar | `bg-primary` | ? bottom cut |
| 3 | Benefits / Bento | `bg-white` | -- |
| 4 | Features / Tabs | `bg-primary` | ? top & bottom cut |
| 5 | Pricing | `bg-white` | -- |
| 6 | Testimonials | `bg-slate-50` | diagonal accent corner |
| 7 | FAQ | `bg-white` | -- |
| 8 | CTA Final | `bg-primary` | diagonal block kanan |

Pola: **dark ? light ? dark ? light** -- kontras tinggi antar section.

---

## 8. Admin Panel & Akademi Dashboard

Warna dan komponen **sama persis** dengan compro. Yang berbeda hanya layout dan konteks.

### Admin Panel

- Layout: Sidebar `bg-primary` (240px) + Content area `bg-slate-50`
- Sidebar active item: `bg-secondary` atau left border `border-l-4 border-secondary`
- Tidak ada diagonal cuts -- layout flat dan functional
- Card: `bg-white border border-border` -- tidak ada offset shadow
- Table: striped `bg-slate-50` setiap baris genap
- Semua heading tetap `font-black uppercase` tapi ukuran lebih kecil (H3 level)

### Akademi Dashboard

- Warna default sama dengan brand (navy + merah)
- Akademi bisa override `--color-primary` via `akademi_profiles.theme_color`
- Override hanya berlaku untuk `primary` -- `secondary` (merah) tetap
- Layout mobile-first: card besar, mudah di-tap
- Bottom navigation di mobile (bukan sidebar)

```css
/* Akademi theme override -- inject di root layout Akademi */
[data-akademi-theme] {
  --primary: var(--akademi-primary, #031636);
  --primary-container: var(--akademi-primary-dark, #1a2b4c);
}
```

---

## 9. What NOT to Do

| ? Jangan | ? Gantinya |
|---|---|
| `rounded-3xl` atau `rounded-full` di card | Sharp atau `rounded` (4px) |
| Gradient lembut (biru?ungu) | Solid color atau diagonal block |
| `backdrop-blur` / glassmorphism | Solid bg dengan opacity |
| Centered section header | Left-aligned dengan deskripsi di kanan |
| Shadow blur biasa | Offset shadow `[8px_8px_0px_...]` |
| Warna pastel atau muted accent | Merah solid atau navy solid |
| Heading sentence case | `UPPERCASE` untuk heading besar |
| Bullet `-` biasa | Garis merah `h-1 w-4 bg-secondary` |

---

## 10. Referensi File

| File | Isi |
|---|---|
| `src/app/globals.css` | CSS variables + Tailwind theme tokens |
| `src/app/(compro)/page.tsx` | Implementasi referensi semua pattern |
| `src/app/(compro)/_components/hero-slider.tsx` | Hero pattern |
| `src/app/(compro)/_components/feature-tabs.tsx` | Tab + mockup pattern |
| `src/app/(compro)/prototype/page.tsx` | Style exploration |

---

*Dokumen ini adalah referensi desain hidup -- update setiap kali ada pattern baru yang disepakati.*

