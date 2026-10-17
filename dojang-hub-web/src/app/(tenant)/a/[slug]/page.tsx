import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutImageSlider, GalleryPhotoPager, HeroImageSlider } from "./academy-public-sliders";
import { buildWhatsAppUrl, getPublicAkademi } from "../../_lib/tenant-data";

type Props = {
  params: Promise<{ slug: string }>;
};

const whatsappIconPath =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

function SectionLabel({
  children,
  accentColor,
  align = "left",
}: {
  children: React.ReactNode;
  accentColor: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`mb-4 flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
      <div className="h-1 w-10" style={{ backgroundColor: accentColor }} />
      <span
        className="text-xs font-black uppercase tracking-[0.2em]"
        style={{ color: accentColor }}
      >
        {children}
      </span>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const akademi = await getPublicAkademi(slug);

  if (!akademi) {
    return { title: "Akademi Tidak Ditemukan" };
  }

  return {
    title: akademi.name,
    description: akademi.about ?? `Akademi ${akademi.sportType} - ${akademi.name}`,
    openGraph: {
      title: akademi.name,
      description: akademi.about ?? `Akademi ${akademi.sportType} - ${akademi.name}`,
      images: akademi.logoUrl ? [{ url: akademi.logoUrl }] : [],
    },
  };
}

export default async function AkademiPublicPage({ params }: Props) {
  const { slug } = await params;
  const akademi = await getPublicAkademi(slug);

  if (!akademi) {
    notFound();
  }

  const sportLabel = akademi.sportType === "taekwondo" ? "Taekwondo" : "Karate";
  const waUrl = akademi.whatsapp
    ? buildWhatsAppUrl(akademi.whatsapp, `Halo, saya ingin informasi tentang akademi ${akademi.name}.`)
    : null;
  const ctaLabel = akademi.ctaLabel || "Hubungi via WhatsApp";
  const heroImages = akademi.heroImages.slice(0, 3);
  const selectedAboutImages = akademi.gallery.filter((item) => item.showOnAbout);
  const aboutImages = (selectedAboutImages.length > 0 ? selectedAboutImages : akademi.gallery).slice(0, 4);
  const hasAboutDetails = Boolean(akademi.vision || akademi.mission);
  const headingStyle: CSSProperties = {
    color: akademi.primaryColor,
    fontFamily: akademi.headingFont,
  };
  const buttonStyle: CSSProperties = {
    backgroundColor: akademi.buttonColor,
    borderRadius: akademi.buttonRadius,
  };

  const navItems = [
    { label: "Tentang", href: "#tentang", show: Boolean(akademi.about || hasAboutDetails) },
    { label: "Lokasi", href: "#lokasi", show: akademi.places.length > 0 },
    { label: "Pengurus", href: "#pengurus", show: akademi.officials.length > 0 },
    { label: "Pelatih", href: "#pelatih", show: akademi.coaches.length > 0 },
    { label: "Prestasi", href: "#prestasi", show: akademi.achievements.length > 0 },
    { label: "Galeri", href: "#galeri", show: akademi.gallery.length > 0 },
    { label: "Kontak", href: "#kontak", show: Boolean(waUrl) },
  ].filter((item) => item.show);

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: akademi.backgroundColor,
        color: akademi.textColor,
        fontFamily: akademi.bodyFont,
      }}
    >
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-[1280px] flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <a href="#beranda" className="flex min-w-0 items-center gap-3">
            {akademi.logoUrl ? (
              <img
                src={akademi.logoUrl}
                alt={akademi.name}
                className="size-11 shrink-0 rounded-lg border object-cover"
                style={{ borderColor: `${akademi.buttonColor}55` }}
              />
            ) : (
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-lg font-black text-white"
                style={{ backgroundColor: akademi.primaryColor }}
              >
                {akademi.name.charAt(0)}
              </span>
            )}
            <span className="min-w-0">
              <span
                className="block truncate text-base font-black uppercase"
                style={{ color: akademi.primaryColor, fontFamily: akademi.headingFont }}
              >
                {akademi.name}
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em]" style={{ color: akademi.buttonColor }}>
                {sportLabel}
              </span>
            </span>
          </a>

          <nav className="flex gap-5 overflow-x-auto text-sm font-bold uppercase text-slate-500 lg:items-center">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="shrink-0 transition hover:opacity-70">
                {item.label}
              </a>
            ))}
          </nav>

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase text-white transition hover:-translate-y-0.5"
              style={buttonStyle}
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d={whatsappIconPath} />
              </svg>
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </header>

      <section id="beranda" className="relative min-h-[680px] overflow-hidden text-white" style={{ backgroundColor: akademi.primaryColor }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(${akademi.buttonColor} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <HeroImageSlider images={heroImages} primaryColor={akademi.primaryColor} />
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            background: `linear-gradient(to right, ${akademi.primaryColor} 42%, ${akademi.primaryColor}ee 51%, ${akademi.primaryColor}88 62%, transparent 78%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            clipPath: "polygon(57% 0%, 59.2% 0%, 49.2% 100%, 47% 100%)",
            backgroundColor: akademi.buttonColor,
          }}
        />

        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-[1280px] items-center px-6 py-20">
          <div className="max-w-2xl">
            <SectionLabel accentColor={akademi.buttonColor}>Akademi {sportLabel}</SectionLabel>
            <h1
              className="max-w-2xl text-5xl font-black uppercase leading-[0.92] text-white md:text-7xl"
              style={{ fontFamily: akademi.headingFont }}
            >
              {akademi.name}
            </h1>
            <p className="mt-7 max-w-xl whitespace-pre-line text-base leading-8 text-white/70 md:text-lg">
              {akademi.about || `Tempat latihan ${sportLabel} untuk membangun disiplin, teknik, dan mental juara.`}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-black uppercase text-white transition hover:-translate-y-0.5"
                  style={buttonStyle}
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={whatsappIconPath} />
                  </svg>
                  {ctaLabel}
                </a>
              ) : null}
              {akademi.gallery.length > 0 ? (
                <a
                  href="#galeri"
                  className="inline-flex items-center justify-center border border-white/20 px-7 py-4 text-sm font-black uppercase text-white transition hover:bg-white/10"
                  style={{ borderRadius: akademi.buttonRadius }}
                >
                  Lihat Galeri
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-10 text-white" style={{ backgroundColor: akademi.primaryColor }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-8 px-6">
          {[
            { value: akademi.places.length || "-", label: "Tempat Latihan" },
            { value: akademi.coaches.length || "-", label: "Pelatih Publik" },
            { value: akademi.achievements.length || "-", label: "Prestasi" },
          ].map((item) => (
            <div key={item.label} className="min-w-36">
              <p className="text-4xl font-black" style={{ fontFamily: akademi.headingFont }}>
                {item.value}
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/40">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {(akademi.about || hasAboutDetails) && (
        <section id="tentang" className="py-20 lg:py-24">
          <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <SectionLabel accentColor={akademi.buttonColor}>Tentang Kami</SectionLabel>
              <h2 className="text-4xl font-black uppercase leading-none md:text-5xl" style={headingStyle}>
                Mengenal Akademi Kami
              </h2>
              {akademi.about ? (
                <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-8 opacity-75">{akademi.about}</p>
              ) : null}

              {hasAboutDetails ? (
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {akademi.vision ? (
                    <article className="border bg-white p-5 shadow-[0_2px_4px_rgba(15,23,42,0.05)]" style={{ borderRadius: 8 }}>
                      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: akademi.buttonColor }}>
                        Visi
                      </p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 opacity-75">{akademi.vision}</p>
                    </article>
                  ) : null}
                  {akademi.mission ? (
                    <article className="border bg-white p-5 shadow-[0_2px_4px_rgba(15,23,42,0.05)]" style={{ borderRadius: 8 }}>
                      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: akademi.buttonColor }}>
                        Misi
                      </p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 opacity-75">{akademi.mission}</p>
                    </article>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <div className="absolute -right-4 -top-4 h-full w-full" style={{ backgroundColor: akademi.buttonColor }} />
              <div className="relative overflow-hidden bg-white p-3 shadow-[12px_12px_0_rgba(15,23,42,0.12)]">
                <AboutImageSlider
                  images={aboutImages}
                  primaryColor={akademi.primaryColor}
                  buttonColor={akademi.buttonColor}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {akademi.places.length > 0 && (
        <section id="lokasi" className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel accentColor={akademi.buttonColor}>Lokasi</SectionLabel>
                <h2 className="text-4xl font-black uppercase leading-none md:text-5xl" style={headingStyle}>
                  Tempat Latihan
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-500">
                Pilih tempat latihan yang paling dekat dan nyaman untuk jadwal Anda.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {akademi.places.map((place, index) => (
                <article
                  key={`${place.name}-${index}`}
                  className="group relative overflow-hidden border bg-white p-6 shadow-[0_2px_4px_rgba(15,23,42,0.05)] transition hover:-translate-y-1"
                  style={{ borderRadius: 8, borderColor: `${akademi.primaryColor}22` }}
                >
                  <div className="absolute right-0 top-0 h-24 w-24" style={{ backgroundColor: `${akademi.buttonColor}18`, clipPath: "polygon(35% 0, 100% 0, 100% 100%)" }} />
                  <div
                    className="mb-5 flex size-12 items-center justify-center text-white"
                    style={{ backgroundColor: akademi.primaryColor, borderRadius: 8 }}
                  >
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <h3 className="text-xl font-black uppercase" style={headingStyle}>
                    {place.name}
                  </h3>
                  {place.address ? <p className="mt-3 text-sm leading-6 text-slate-500">{place.address}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {akademi.coaches.length > 0 && (
        <section id="pelatih" className="py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <SectionLabel accentColor={akademi.buttonColor}>Tim Pelatih</SectionLabel>
            <h2 className="mb-12 text-4xl font-black uppercase leading-none md:text-5xl" style={headingStyle}>
              Pelatih Kami
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {akademi.coaches.map((coach, index) => (
                <article key={`${coach.name}-${index}`} className="overflow-hidden bg-white shadow-[0_2px_4px_rgba(15,23,42,0.05)]" style={{ borderRadius: 8 }}>
                  <div className="relative h-72 overflow-hidden" style={{ backgroundColor: `${akademi.primaryColor}10` }}>
                    {coach.photoUrl ? (
                      <img src={coach.photoUrl} alt={coach.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="material-symbols-outlined text-7xl text-slate-300">person</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 h-2 w-full" style={{ backgroundColor: akademi.buttonColor }} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-black uppercase" style={headingStyle}>
                      {coach.name}
                    </h3>
                    {coach.rankLabel ? <p className="mt-1 text-sm font-bold" style={{ color: akademi.buttonColor }}>{coach.rankLabel}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {akademi.officials.length > 0 && (
        <section id="pengurus" className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <SectionLabel accentColor={akademi.buttonColor}>Struktur</SectionLabel>
                <h2 className="text-4xl font-black uppercase leading-none md:text-5xl" style={headingStyle}>
                  Pengurus Akademi
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-500">
                Tim pengurus yang mendukung operasional dan kegiatan akademi.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {akademi.officials.map((official, index) => (
                <article key={`${official.name}-${index}`} className="overflow-hidden border bg-white shadow-[0_2px_4px_rgba(15,23,42,0.05)]" style={{ borderRadius: 8, borderColor: `${akademi.primaryColor}18` }}>
                  <div className="relative h-56 overflow-hidden" style={{ backgroundColor: `${akademi.primaryColor}10` }}>
                    {official.photoUrl ? (
                      <img src={official.photoUrl} alt={official.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="material-symbols-outlined text-7xl text-slate-300">badge</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 h-2 w-full" style={{ backgroundColor: akademi.buttonColor }} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-black uppercase" style={headingStyle}>
                      {official.name}
                    </h3>
                    <p className="mt-1 text-sm font-bold" style={{ color: akademi.buttonColor }}>
                      {official.position}
                    </p>
                    {official.description ? (
                      <p className="mt-3 text-sm leading-6 text-slate-500">{official.description}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {akademi.achievements.length > 0 && (
        <section id="prestasi" className="py-20 text-white lg:py-24" style={{ backgroundColor: akademi.primaryColor }}>
          <div className="mx-auto max-w-[1280px] px-6">
            <SectionLabel accentColor={akademi.buttonColor}>Pencapaian</SectionLabel>
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 className="text-4xl font-black uppercase leading-none text-white md:text-5xl" style={{ fontFamily: akademi.headingFont }}>
                Prestasi Akademi
              </h2>
              <p className="max-w-md text-sm leading-7 text-white/60">
                Riwayat pencapaian yang menjadi bukti proses latihan berjalan konsisten.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {akademi.achievements.map((item, index) => (
                <article key={`${item.title}-${index}`} className="flex gap-5 border border-white/10 bg-white/5 p-6" style={{ borderRadius: 8 }}>
                  <div className="flex size-11 shrink-0 items-center justify-center text-white" style={{ backgroundColor: akademi.buttonColor, borderRadius: 8 }}>
                    <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase text-white">{item.title}</h3>
                    {item.description ? <p className="mt-2 text-sm leading-6 text-white/65">{item.description}</p> : null}
                    {item.achievedOn ? <p className="mt-3 text-xs font-bold uppercase text-white/35">{formatDate(item.achievedOn)}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {akademi.gallery.length > 0 && (
        <section id="galeri" className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <SectionLabel accentColor={akademi.buttonColor}>Dokumentasi</SectionLabel>
            <h2 className="mb-12 text-4xl font-black uppercase leading-none md:text-5xl" style={headingStyle}>
              Galeri Foto
            </h2>
            <GalleryPhotoPager
              images={akademi.gallery}
              primaryColor={akademi.primaryColor}
              buttonColor={akademi.buttonColor}
            />
          </div>
        </section>
      )}

      {waUrl ? (
        <section id="kontak" className="py-20 lg:py-24" style={{ backgroundColor: akademi.backgroundColor }}>
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="relative overflow-hidden p-10 text-center text-white md:p-14" style={{ backgroundColor: akademi.primaryColor, borderRadius: 8 }}>
              <div className="absolute right-0 top-0 h-32 w-40" style={{ backgroundColor: akademi.buttonColor, clipPath: "polygon(30% 0, 100% 0, 100% 100%)" }} />
              <div className="relative">
                <SectionLabel accentColor={akademi.buttonColor} align="center">Bergabung</SectionLabel>
                <h2 className="text-4xl font-black uppercase leading-none text-white md:text-5xl" style={{ fontFamily: akademi.headingFont }}>
                  Tertarik Bergabung?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65">
                  Hubungi akademi melalui WhatsApp untuk informasi kelas, jadwal latihan, dan pendaftaran trial.
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-black uppercase text-white transition hover:-translate-y-0.5"
                  style={buttonStyle}
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={whatsappIconPath} />
                  </svg>
                  {ctaLabel}
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-black/10 bg-white py-8 text-center">
        <p className="text-xs text-slate-400">
          Dikelola dengan{" "}
          <Link href="/" className="font-semibold hover:underline" style={{ color: akademi.buttonColor }}>
            SKAIHUB
          </Link>{" "}
          - Platform Manajemen Akademi Bela Diri
        </p>
      </footer>
    </main>
  );
}
