import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicBlogPostBySlug } from "../../_lib/compro-data";
import { createWhatsAppUrl } from "../../_lib/whatsapp";
import { BeritaImageViewer } from "../_components/berita-image-viewer";
import { ViewTracker } from "../../_components/view-tracker";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPublicBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: "Berita Tidak Ditemukan",
    };
  }

  return {
    title: `${post.title} | Berita SKAIHUB`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return "Tanggal menyusul";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default async function BeritaDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPublicBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-white">
      <ViewTracker slug={resolvedParams.slug} type="blog" />
      <section className="section-y bg-white pt-24 md:pt-32">
        <div className="container-app">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            {/* Kiri - Konten */}
            <div className="min-w-0">
              <div className="mb-10">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/berita"
                    className="text-xs font-black uppercase tracking-[0.2em] text-muted transition hover:text-primary"
                  >
                    Berita
                  </Link>
                  <span className="text-border">/</span>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
                    {post.category}
                  </span>
                </div>
                <h1 className="font-heading text-3xl font-black uppercase leading-tight tracking-tight text-primary md:text-4xl lg:text-5xl">
                  {post.title}
                </h1>
              </div>

              {post.thumbnailUrl ? (
                <BeritaImageViewer src={post.thumbnailUrl} alt={post.title} />
              ) : null}

              <article className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:uppercase prose-headings:text-primary prose-a:text-secondary hover:prose-a:text-primary break-words">
                <div
                  className="font-sans text-base leading-relaxed text-muted"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </article>
            </div>

            {/* Kanan - Info Artikel */}
            <div className="flex flex-col gap-6">
              <div className="border-2 border-border bg-slate-50 p-6">
                <h3 className="font-heading text-lg font-black uppercase text-primary">
                  Informasi Artikel
                </h3>
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Kategori
                    </p>
                    <p className="mt-1 font-semibold text-secondary">
                      {post.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Penulis
                    </p>
                    <p className="mt-1 font-semibold text-primary">
                      {post.authorName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Tanggal Terbit
                    </p>
                    <p className="mt-1 font-semibold text-primary">
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                  <a
                    href={createWhatsAppUrl(
                      `Halo, saya ingin membagikan artikel ini: ${post.title}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-secondary bg-white px-5 py-4 text-sm font-black uppercase tracking-widest text-secondary transition hover:bg-secondary hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    Bagikan Artikel
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
