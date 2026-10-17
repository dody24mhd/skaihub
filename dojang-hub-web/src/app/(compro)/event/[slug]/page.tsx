import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEventBySlug } from "../../_lib/compro-data";
import { createWhatsAppUrl } from "../../_lib/whatsapp";
import { ViewTracker } from "../../_components/view-tracker";
import { sanitizeHtml } from "@/lib/sanitize-html";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const event = await getPublicEventBySlug(resolvedParams.slug);

  if (!event) {
    return {
      title: "Event Tidak Ditemukan",
    };
  }

  return {
    title: `${event.title} | Event SKAIHUB`,
    description: event.excerpt,
    openGraph: {
      title: event.title,
      description: event.excerpt,
      images: event.coverImage ? [event.coverImage] : [],
    },
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date(value));
}

function formatEventRange(start: string, end?: string | null) {
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export default async function EventDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const event = await getPublicEventBySlug(resolvedParams.slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="bg-white">
      <ViewTracker slug={resolvedParams.slug} type="event" />
      <section className="section-y bg-white pt-24 md:pt-32">
        <div className="container-app">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            {/* Kiri - Konten */}
            <div className="min-w-0">
              <div className="mb-10">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/event"
                    className="text-xs font-black uppercase tracking-[0.2em] text-muted transition hover:text-primary"
                  >
                    Event
                  </Link>
                  <span className="text-border">/</span>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
                    Detail
                  </span>
                </div>
                <h1 className="font-heading text-3xl font-black uppercase leading-tight tracking-tight text-primary md:text-4xl lg:text-5xl">
                  {event.title}
                </h1>
                {event.excerpt && (
                  <p className="mt-4 text-base leading-relaxed text-muted">
                    {event.excerpt}
                  </p>
                )}
              </div>

              {event.coverImage ? (
                <div className="group mb-8 w-full overflow-hidden border-2 border-primary bg-slate-50 shadow-[8px_8px_0px_theme(colors.secondary)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="h-auto w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              ) : null}

              <article className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:uppercase prose-headings:text-primary prose-a:text-secondary hover:prose-a:text-primary break-words">
                <div
                  className="font-sans text-base leading-relaxed text-muted"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description || "") }}
                />
              </article>
            </div>

            {/* Kanan - Info Event */}
            <div className="flex flex-col gap-6">
              <div className="border-2 border-border bg-slate-50 p-6">
                <h3 className="font-heading text-lg font-black uppercase text-primary">
                  Informasi Event
                </h3>
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Kategori
                    </p>
                    <p className="mt-1 font-semibold text-secondary">
                      {event.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Pelaksanaan
                    </p>
                    <p className="mt-1 font-semibold text-primary">
                      {formatEventRange(event.startsAt, event.endsAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Lokasi
                    </p>
                    <p className="mt-1 font-semibold text-primary">
                      {event.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      Penyelenggara
                    </p>
                    <p className="mt-1 font-semibold text-primary">
                      {event.organizer}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                  {event.registrationUrl && (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 bg-primary px-5 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      Unduh Proposal / Daftar
                    </a>
                  )}

                  <a
                    href={createWhatsAppUrl(
                      `Halo SKAIHUB, saya ingin bertanya tentang event ${event.title}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-secondary bg-white px-5 py-4 text-sm font-black uppercase tracking-widest text-secondary transition hover:bg-secondary hover:text-white"
                  >
                    Tanya Event
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
