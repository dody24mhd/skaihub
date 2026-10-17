import type { Metadata } from "next";
import { getPublicEvents } from "../_lib/compro-data";
import { EventFilterableList } from "./_components/event-filterable-list";

export const metadata: Metadata = {
  title: "Event Bela Diri dan Agenda Akademi",
  description:
    "Daftar event bela diri, agenda akademi, workshop, dan kegiatan besar dari ekosistem SKAIHUB.",
  alternates: {
    canonical: "/event",
  },
  openGraph: {
    title: "Event Bela Diri dan Agenda Akademi | SKAIHUB",
    description:
      "Lihat agenda bela diri, kejuaraan, workshop, dan kegiatan akademi yang dikurasi SKAIHUB.",
    url: "/event",
  },
};

export default async function EventPage() {
  const events = await getPublicEvents();

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-primary py-24">
        <div className="absolute right-0 top-0 hidden h-full w-2/5 bg-secondary/10 [clip-path:polygon(30%_0%,100%_0%,100%_100%,0%_100%)] md:block" />
        <div className="container-app relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-10 bg-secondary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
              Event
            </span>
          </div>
          <h1 className="font-heading text-5xl font-black uppercase leading-none tracking-tight text-white md:text-7xl">
            Agenda Bela Diri<br />
            <span className="text-secondary">SKAIHUB</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60">
            Kumpulan kejuaraan, workshop, training camp, dan agenda penting
            untuk akademi bela diri.
          </p>
        </div>
      </section>

      <section className="section-y bg-white">
        <div className="container-app">
          <EventFilterableList initialEvents={events} />
        </div>
      </section>
    </div>
  );
}
