"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminBlog,
  AdminEvent,
  AdminInquiry,
  getAdminBlogs,
  getAdminEvents,
  getAdminInquiries,
} from "../_lib/admin-api";

const TOKEN_KEY = "skaihub_admin_token";

export default function AdminCmsDashboard() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    Promise.all([
      getAdminBlogs(token),
      getAdminEvents(token),
      getAdminInquiries(token),
    ])
      .then(([b, e, i]) => {
        setBlogs(b);
        setEvents(e);
        setInquiries(i);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted">Memuat data CMS...</div>;
  }

  const unreadInquiries = inquiries.filter((i) => !i.is_followed_up).length;
  const publishedBlogs = blogs.filter((b) => b.status === "published");
  const totalViews =
    publishedBlogs.reduce((acc, curr) => acc + (curr.views_count || 0), 0) +
    events.filter((e) => e.status === "published").reduce((acc, curr) => acc + (curr.views_count || 0), 0);

  const stats = [
    { label: "Pesan Baru", value: String(unreadInquiries), icon: "mark_email_unread", color: "text-secondary", bg: "bg-secondary/10", trend: "+3", trendUp: true, trendLabel: "dari kemarin" },
    { label: "Total Artikel", value: String(blogs.length), icon: "article", color: "text-primary", bg: "bg-primary/10", trend: "+12%", trendUp: true, trendLabel: "bulan ini" },
    { label: "Agenda Aktif", value: String(events.length), icon: "event", color: "text-primary", bg: "bg-primary/10", trend: "+2", trendUp: true, trendLabel: "minggu ini" },
    { label: "Total Views", value: String(totalViews), icon: "visibility", color: "text-success", bg: "bg-success/10", trend: "+45%", trendUp: true, trendLabel: "pertumbuhan" },
  ];

  const topBlogsData = [...publishedBlogs]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5)
    .map(blog => ({
      name: blog.title.length > 25 ? blog.title.substring(0, 25) + '...' : blog.title,
      views: blog.views_count || 0,
    }));

  const topEventsData = [...events]
    .filter((e) => e.status === "published")
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5)
    .map(event => ({
      name: event.title.length > 25 ? event.title.substring(0, 25) + '...' : event.title,
      views: event.views_count || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <article key={s.label} className="card-soft flex items-center gap-4 rounded-lg bg-white p-5">
            <div className={`flex size-12 items-center justify-center rounded-md ${s.bg} ${s.color}`}>
              <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className={`font-heading text-2xl font-black ${s.color === "text-primary" ? "text-primary" : s.color}`}>
                  {s.value}
                </p>
                {/* Trend Indicator */}
                <div className={`flex items-center text-[10px] font-bold ${s.trendUp ? "text-success" : "text-secondary"}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {s.trendUp ? "trending_up" : "trending_down"}
                  </span>
                  <span className="ml-0.5">{s.trend}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Artikel Chart */}
        <section className="card-soft flex flex-col rounded-lg bg-white p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-primary">Top 5 Artikel</h2>
            <Link href="/internal/berita" className="text-sm font-semibold text-secondary hover:underline">
              Kelola Berita
            </Link>
          </div>
          <div className="flex-1 space-y-5">
            {topBlogsData.length > 0 ? (
              topBlogsData.map((blog, idx) => {
                const maxViews = Math.max(...topBlogsData.map(b => b.views));
                const percentage = maxViews > 0 ? (blog.views / maxViews) * 100 : 0;
                
                return (
                  <div key={idx}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary truncate pr-4">{blog.name}</span>
                      <span className="text-xs font-black text-muted">{blog.views} <span className="font-semibold text-[10px]">views</span></span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full bg-primary transition-all duration-1000" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center rounded border-2 border-dashed border-border bg-slate-50">
                <p className="text-sm font-semibold text-muted">Belum ada data views artikel.</p>
              </div>
            )}
          </div>
        </section>

        {/* Top Event Chart */}
        <section className="card-soft flex flex-col rounded-lg bg-white p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-primary">Top 5 Event</h2>
            <Link href="/internal/event" className="text-sm font-semibold text-secondary hover:underline">
              Kelola Event
            </Link>
          </div>
          <div className="flex-1 space-y-5">
            {topEventsData.length > 0 ? (
              topEventsData.map((event, idx) => {
                const maxViews = Math.max(...topEventsData.map(e => e.views));
                const percentage = maxViews > 0 ? (event.views / maxViews) * 100 : 0;
                
                return (
                  <div key={idx}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary truncate pr-4">{event.name}</span>
                      <span className="text-xs font-black text-muted">{event.views} <span className="font-semibold text-[10px]">views</span></span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full bg-secondary transition-all duration-1000" 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center rounded border-2 border-dashed border-border bg-slate-50">
                <p className="text-sm font-semibold text-muted">Belum ada data views event.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Pesan Masuk Terbaru */}
      <section className="card-soft rounded-lg bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-primary">Pesan Terbaru</h2>
          <Link href="/internal/inquiry" className="text-sm font-semibold text-secondary hover:underline">
            Lihat Semua Pesan
          </Link>
        </div>
        <div className="divide-y divide-border">
          {inquiries.slice(0, 5).map((inq) => (
            <div key={inq.id} className="py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary">{inq.person_name}</p>
                {!inq.is_followed_up && (
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-black uppercase text-secondary">
                    New
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {inq.akademi_name || "Tanpa Nama Akademi"} &middot; {inq.phone}
              </p>
              {inq.message && (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted/80">{inq.message}</p>
              )}
            </div>
          ))}
          {inquiries.length === 0 && (
            <p className="py-3 text-sm text-muted">Belum ada pesan masuk.</p>
          )}
        </div>
      </section>
    </div>
  );
}

