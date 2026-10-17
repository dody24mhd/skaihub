"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicEvent } from "../../_lib/compro-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date(value));
}

function formatEventRange(start: string, end?: string | null) {
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function EventFilterableList({ initialEvents }: { initialEvents: PublicEvent[] }) {
  const [activeCategory, setActiveCategory] = useState("Semua");

  const categories = ["Semua", "Umum", "Taekwondo", "Karate"];

  const filteredEvents =
    activeCategory === "Semua"
      ? initialEvents
      : initialEvents.filter((event) => event.category === activeCategory);

  const featuredEvent = filteredEvents.find((event) => event.isFeatured);
  const otherEvents = filteredEvents.filter((event) => event.slug !== featuredEvent?.slug);

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition border-2 ${
              activeCategory === cat
                ? "bg-secondary text-white border-primary shadow-[4px_4px_0px_theme(colors.primary)]"
                : "bg-white text-muted border-border hover:border-primary hover:text-primary hover:shadow-[4px_4px_0px_theme(colors.primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {featuredEvent ? (
        <article className="relative mb-6 overflow-hidden bg-primary p-8 text-white shadow-[8px_8px_0px_theme(colors.secondary)]">
          <div className="absolute right-0 top-0 h-28 w-28 bg-secondary/25 [clip-path:polygon(100%_0,0_0,100%_100%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="bg-secondary px-3 py-1 text-xs font-black uppercase tracking-widest">
                  Pinned Event
                </span>
                <span className="border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  {featuredEvent.category}
                </span>
                <span className="bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/70">
                  {featuredEvent.location}
                </span>
              </div>
              <h2 className="font-heading text-3xl font-black uppercase leading-tight text-white md:text-5xl">
                {featuredEvent.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                {featuredEvent.excerpt}
              </p>
            </div>
            <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              {featuredEvent.coverImage ? (
                <div className="group mb-6 aspect-video w-full overflow-hidden border border-white/10 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredEvent.coverImage}
                    alt={featuredEvent.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ) : null}
              <p className="text-xs font-black uppercase tracking-widest text-white/40">
                Pelaksanaan
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                {formatEventRange(featuredEvent.startsAt, featuredEvent.endsAt)}
              </p>
              <Link
                href={`/event/${featuredEvent.slug}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-secondary px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-secondary-dark"
              >
                Lihat Detail
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      {otherEvents.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {otherEvents.map((event) => (
            <Link
              href={`/event/${event.slug}`}
              key={event.slug}
              className="group block border-2 border-border bg-white p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-[6px_6px_0px_theme(colors.primary)]"
            >
              {event.coverImage ? (
                <div className="mb-5 aspect-[4/3] w-full overflow-hidden bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center bg-primary text-white transition group-hover:bg-secondary">
                  <span className="material-symbols-outlined text-[24px]">event</span>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                    {event.category}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">
                    {event.location}
                  </span>
                </div>
              </div>
              <h2 className="font-heading text-xl font-black uppercase leading-tight text-primary">
                {event.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{event.excerpt}</p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-secondary">
                  {formatEventRange(event.startsAt, event.endsAt)}
                </p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {event.organizer}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center border-2 border-border bg-slate-50">
          <p className="text-muted">Tidak ada event untuk kategori {activeCategory}.</p>
        </div>
      )}
    </>
  );
}
