import type { Metadata } from "next";
import { getPublicBlogPosts } from "../_lib/compro-data";
import { BeritaFilterableList } from "./_components/berita-filterable-list";

export const metadata: Metadata = {
  title: "Berita dan Artikel Bela Diri",
  description:
    "Berita, artikel, pengumuman, dan update seputar bela diri dan digitalisasi akademi dari SKAIHUB.",
  alternates: {
    canonical: "/berita",
  },
  openGraph: {
    title: "Berita dan Artikel Bela Diri | SKAIHUB",
    description:
      "Baca update bela diri, artikel manajemen akademi, dan kabar terbaru dari SKAIHUB.",
    url: "/berita",
  },
};

export default async function BeritaPage() {
  const posts = await getPublicBlogPosts();

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="absolute right-0 top-0 hidden h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] md:block" />
        <div className="container-app relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
              Berita
            </span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Kabar dan Artikel<br />
            <span className="text-secondary">Bela Diri</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60">
            Update, insight, dan artikel praktis untuk membantu akademi tampil
            lebih rapi dan profesional.
          </p>
        </div>
      </section>

      <section className="section-y bg-white">
        <div className="container-app">
          <BeritaFilterableList initialPosts={posts} />
        </div>
      </section>
    </div>
  );
}
