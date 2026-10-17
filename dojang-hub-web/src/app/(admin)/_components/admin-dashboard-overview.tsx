"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AdminAkademi,
  AkademiPlan,
  SubscriptionAlertsResponse,
  getAdminAkademi,
  getAdminBlogs,
  getAdminEvents,
  getAdminSubscriptionAlerts,
} from "../_lib/admin-api";
import { PLAN_RULES } from "@/lib/plan-pricing";
import OperatorDashboardPanel from "./operator-dashboard-panel";
import Icon from "./ui/icon";

const TOKEN_KEY = "skaihub_admin_token";

const planLabels: Record<AkademiPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  scale: "Scale",
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function statusLabel(status: AdminAkademi["status"]) {
  if (status === "active") return "Aktif";
  if (status === "suspended") return "Suspended";
  return "Nonaktif";
}

function statusClass(status: AdminAkademi["status"]) {
  if (status === "active") return "bg-success/10 text-success-strong";
  if (status === "suspended") return "bg-secondary/10 text-secondary";
  return "bg-surface-container text-muted";
}

function daysLeftClass(days: number) {
  if (days <= 7) return "text-secondary font-black";
  if (days <= 14) return "text-warning font-bold";
  return "text-muted font-semibold";
}

export default function AdminDashboardOverview() {
  const [akademi, setAkademi] = useState<AdminAkademi[]>([]);
  const [alerts, setAlerts] = useState<SubscriptionAlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      setToken(token);

      if (!token) {
        setIsLoading(false);
        return;
      }

      Promise.all([
        getAdminAkademi(token),
        getAdminEvents(token),
        getAdminBlogs(token),
        getAdminSubscriptionAlerts(token).catch(() => null),
      ])
        .then(([akademiData, , , alertsData]) => {
          if (!active) return;
          setAkademi(akademiData);
          setAlerts(alertsData);
        })
        .catch(() => {
          if (!active) return;
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    });

    return () => { active = false; };
  }, []);

  const recentAkademi = [...akademi]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const activeAkademi = akademi.filter((item) => item.status === "active");
  const proScaleAkademi = akademi.filter((item) => item.plan !== "starter");
  const totalUsers = akademi.reduce(
    (total, item) => total + Number(item.users_count || 0),
    0,
  );

  const now = new Date();
  const monthlySignups = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const count = akademi.filter((item) => {
      const createdAt = new Date(item.created_at);
      return createdAt.getMonth() === month && createdAt.getFullYear() === year;
    }).length;

    return {
      month: monthLabels[month] || new Intl.DateTimeFormat("id-ID", { month: "short" }).format(monthDate),
      count,
    };
  });

  const expiringSoonCount = alerts?.summary.expiring_soon_count ?? 0;
  const unpaidCount = alerts?.summary.unpaid_count ?? 0;

  const stats = [
    { label: "Akademi Terdaftar", value: String(akademi.length), subtext: `${activeAkademi.length} aktif`, icon: "domain", color: "text-primary", bg: "bg-primary/10", trend: `${proScaleAkademi.length} Pro/Scale`, trendUp: true },
    { label: "User Terdaftar", value: String(totalUsers), subtext: "Dari seluruh akademi", icon: "groups", color: "text-secondary", bg: "bg-secondary/10", trend: "Aktif", trendUp: true },
    {
      label: "Perlu Perhatian",
      value: String(expiringSoonCount + unpaidCount),
      subtext: `${expiringSoonCount} expired - ${unpaidCount} belum lunas`,
      icon: "warning",
      color: expiringSoonCount + unpaidCount > 0 ? "text-secondary" : "text-success-strong",
      bg: expiringSoonCount + unpaidCount > 0 ? "bg-secondary/10" : "bg-success/10",
      trend: "Alert",
      trendUp: expiringSoonCount + unpaidCount === 0,
    },
  ];

  return (
    <div className="space-y-6">
      {token ? <OperatorDashboardPanel token={token} /> : null}

      {/* SaaS Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <article key={s.label} className="card-soft flex items-center gap-4 rounded-lg bg-white p-5">
            <div className={`flex size-12 items-center justify-center rounded-md ${s.bg} ${s.color}`}>
              <Icon name={s.icon} className="text-[24px]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">{s.label}</p>
              <div className="mt-1 flex items-baseline justify-between">
                <p className={`font-heading text-2xl font-black ${s.color}`}>
                  {s.value}
                </p>
                <div className={`flex items-center text-[10px] font-bold ${s.trendUp ? "text-success-strong" : "text-secondary"}`}>
                  <Icon name={s.trendUp ? "trending_up" : "trending_down"} className="text-[12px]" />
                  <span className="ml-0.5">{s.trend}</span>
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted/80">{s.subtext}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Alert Sections — only shown when there are alerts */}
      {!isLoading && alerts && (expiringSoonCount > 0 || unpaidCount > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {expiringSoonCount > 0 && (
            <section className="rounded-lg border border-warning/30 bg-warning/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="schedule" className="text-[20px] text-warning" />
                <h2 className="font-heading text-sm font-bold text-warning">
                  Akan Expired ({expiringSoonCount})
                </h2>
                <span className="ml-auto text-[10px] font-bold text-muted">dalam 30 hari</span>
              </div>
              <div className="space-y-2">
                {alerts.expiring_soon.slice(0, 5).map((item) => (
                  <div
                    key={item.subscription_id}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-bold text-primary">{item.akademi_name}</p>
                      <p className="text-[10px] text-muted">
                        Paket {planLabels[item.plan]} - Exp {formatDate(item.ends_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${daysLeftClass(item.days_left ?? 30)}`}>
                        {item.days_left}h lagi
                      </span>
                      <Link
                        href="/internal/subscription"
                        className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/20"
                      >
                        Perpanjang
                      </Link>
                    </div>
                  </div>
                ))}
                {expiringSoonCount > 5 && (
                  <p className="text-center text-[10px] text-muted">
                    +{expiringSoonCount - 5} akademi lainnya
                  </p>
                )}
              </div>
            </section>
          )}

          {unpaidCount > 0 && (
            <section className="rounded-lg border border-secondary/30 bg-secondary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="payments" className="text-[20px] text-secondary" />
                <h2 className="font-heading text-sm font-bold text-secondary">
                  Belum Lunas ({unpaidCount})
                </h2>
                <span className="ml-auto text-[10px] font-bold text-muted">perlu konfirmasi</span>
              </div>
              <div className="space-y-2">
                {alerts.unpaid.slice(0, 5).map((item) => (
                  <div
                    key={item.subscription_id}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-bold text-primary">{item.akademi_name}</p>
                      <p className="text-[10px] text-muted">
                        Paket {planLabels[item.plan]}
                        {item.amount ? ` - ${formatCurrency(Number(item.amount))}` : ""}
                        {item.payment_method ? ` - ${item.payment_method}` : ""}
                      </p>
                    </div>
                    <Link
                      href="/internal/subscription"
                      className="rounded bg-secondary/10 px-2 py-1 text-[10px] font-bold text-secondary hover:bg-secondary/20"
                    >
                      Cek
                    </Link>
                  </div>
                ))}
                {unpaidCount > 5 && (
                  <p className="text-center text-[10px] text-muted">
                    +{unpaidCount - 5} akademi lainnya
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grafik Pertumbuhan Akademi */}
        <section className="card-soft flex flex-col rounded-lg bg-white p-5 lg:col-span-1">
          <h2 className="font-heading text-lg font-bold text-primary">Pertumbuhan Akademi</h2>
          <p className="mb-6 text-xs text-muted">Akumulasi pendaftaran 5 bulan terakhir.</p>
          <div className="flex h-48 items-end justify-between gap-2 px-2">
            {monthlySignups.map((d, idx) => {
              const maxVal = Math.max(...monthlySignups.map(m => m.count));
              const heightPercent = maxVal ? (d.count / maxVal) * 100 : 0;
              return (
                <div key={idx} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full flex justify-center">
                    <span className="absolute -top-6 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                      {d.count}
                    </span>
                    <div
                      className="w-8 rounded-t bg-primary/20 transition-all duration-500 group-hover:bg-primary"
                      style={{ height: `${Math.max(heightPercent * 1.2, 8)}px` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted">{d.month}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Daftar Registrasi Akademi Terbaru */}
        <section className="card-soft rounded-lg bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-primary">Akademi Terdaftar</h2>
            <Link href="/internal/akademi" className="text-sm font-semibold text-secondary hover:underline">
              Kelola Akademi
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="pb-3">Nama Akademi</th>
                  <th className="pb-3">Kode</th>
                  <th className="pb-3">Paket</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-sm text-muted">
                      Memuat akademi...
                    </td>
                  </tr>
                ) : recentAkademi.length ? (
                  recentAkademi.map((item) => (
                    <tr key={item.id} className="group transition hover:bg-slate-50/50">
                      <td className="py-3.5 font-bold text-primary">
                        {item.name}
                        <span className="mt-0.5 block text-[10px] font-semibold text-muted">
                          Terdaftar: {formatDate(item.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 text-muted">{item.slug}</td>
                      <td className="py-3.5 font-semibold text-primary">
                        {planLabels[item.plan]}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${statusClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-primary">
                        {formatCurrency(PLAN_RULES[item.plan].monthlyPrice)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-sm text-muted">
                      Belum ada akademi. Tambahkan akademi pertama dari menu Akademi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modules Menu */}
      <div>
        <h2 className="font-heading text-lg font-bold text-primary mb-4">Akses Cepat Modul Platform</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/internal/akademi" className="card-soft flex items-start gap-4 rounded-lg bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              <Icon name="domain" />
            </div>
            <div>
              <h3 className="font-bold text-primary">Akademi</h3>
              <p className="mt-1 text-xs leading-5 text-muted">Kelola data akademi, status aktif, paket, dan nama subdomain.</p>
            </div>
          </Link>

          <Link href="/internal/subscription" className="card-soft flex items-start gap-4 rounded-lg bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded bg-secondary/10 text-secondary">
              <Icon name="payments" />
              {unpaidCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-secondary text-[9px] font-black text-white">
                  {unpaidCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-primary">Subscription & Billing</h3>
                {expiringSoonCount > 0 && (
                  <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[9px] font-bold text-warning">
                    {expiringSoonCount} expired
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">Atur paket langganan (Starter, Pro, Scale), billing, invoice, dan tanggal kedaluwarsa.</p>
            </div>
          </Link>

          <Link href="/internal/users" className="card-soft flex items-start gap-4 rounded-lg bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded bg-success/10 text-success-strong">
              <Icon name="manage_accounts" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-primary">Admin Akademi</h3>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-muted">Segera</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">Kelola data user owner/admin dari masing-masing akademi terdaftar.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
