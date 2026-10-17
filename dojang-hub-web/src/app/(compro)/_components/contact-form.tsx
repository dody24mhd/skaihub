"use client";

import { FormEvent, useMemo, useState } from "react";
import { submitContactInquiry } from "../_lib/api";
import { createWhatsAppUrl } from "../_lib/whatsapp";
import { formatPlanPrice } from "@/lib/plan-pricing";

const planLabels: Record<string, string> = {
  starter: `Starter, ${formatPlanPrice("starter")}/bulan`,
  pro: `Pro, ${formatPlanPrice("pro")}/bulan`,
  scale: `Scale, ${formatPlanPrice("scale")}/bulan`,
  konsultasi: "Belum tahu, ingin konsultasi dulu",
};

type ContactFormProps = {
  waNumber?: string;
};

export default function ContactForm({ waNumber }: ContactFormProps) {
  const [name, setName] = useState("");
  const [akademiName, setAkademiName] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "fallback">("idle");
  const [submittedWhatsappUrl, setSubmittedWhatsappUrl] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    akademiName: "",
    phone: "",
  });

  const whatsappUrl = useMemo(() => {
    const lines = [
      "Halo SKAIHUB, saya ingin konsultasi.",
      "",
      `Nama: ${name || "-"}`,
      `Akademi: ${akademiName || "-"}`,
      `WhatsApp: ${phone || "-"}`,
      `Paket: ${plan ? planLabels[plan] : "-"}`,
      `Pesan: ${message || "-"}`,
    ];

    return createWhatsAppUrl(lines.join("\n"), waNumber);
  }, [akademiName, message, name, phone, plan, waNumber]);

  const validateForm = () => {
    const errors = {
      name: name.trim() ? "" : "Nama pengurus wajib diisi.",
      akademiName: akademiName.trim() ? "" : "Nama akademi wajib diisi.",
      phone: phone.trim() ? "" : "Nomor WhatsApp wajib diisi.",
    };

    setFieldErrors(errors);

    return !errors.name && !errors.akademiName && !errors.phone;
  };

  const handleSubmit = async () => {
    if (status === "submitting") return;

    if (!validateForm()) {
      setStatus("idle");
      setSubmitError("");
      return;
    }

    setStatus("submitting");
    setSubmitError("");
    setSubmittedWhatsappUrl(whatsappUrl);

    try {
      await submitContactInquiry({
        person_name: name,
        akademi_name: akademiName,
        phone: phone.trim(),
        plan_interest: plan || undefined,
        message: message.trim() || undefined,
        source_page: window.location.pathname,
      });
      setStatus("success");
      setName("");
      setAkademiName("");
      setPhone("");
      setPlan("");
      setMessage("");
      setFieldErrors({ name: "", akademiName: "", phone: "" });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Pesan belum berhasil tersimpan. Coba lagi sebentar.",
      );
      setStatus("fallback");
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  const submitButtonLabel =
    status === "submitting"
      ? "Mengirim..."
      : status === "success"
        ? "Terkirim"
        : "Kirim Pertanyaan";

  const submitButtonClass =
    status === "success"
      ? "bg-success hover:bg-success"
      : "bg-secondary hover:bg-secondary-dark";

  return (
    <>
    <form className="space-y-5" onSubmit={handleFormSubmit} noValidate>
      {status === "success" ? (
        <div className="border-2 border-success bg-success/10 px-4 py-3 text-sm font-bold leading-6 text-success">
          Pertanyaan terkirim. Tim SKAIHUB akan menghubungi Anda lewat WhatsApp.
        </div>
      ) : null}
      {status === "fallback" ? (
        <div className="border-2 border-secondary bg-secondary/10 px-4 py-3 text-sm font-bold leading-6 text-secondary">
          {submitError || "Pesan belum tersimpan di sistem, tetapi WhatsApp tetap tersedia agar Anda bisa menghubungi kami."}
        </div>
      ) : null}
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-primary">
          Nama Pengurus *
        </label>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((current) => ({ ...current, name: "" }));
          }}
          placeholder="Nama lengkap Anda"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          className="w-full border-2 border-border bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary"
        />
        {fieldErrors.name ? (
          <p id="contact-name-error" className="mt-1.5 text-xs font-semibold text-secondary">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-primary">
          Nama Akademi *
        </label>
        <input
          type="text"
          value={akademiName}
          onChange={(event) => {
            setAkademiName(event.target.value);
            setFieldErrors((current) => ({ ...current, akademiName: "" }));
          }}
          placeholder="Nama akademi bela diri Anda"
          aria-invalid={Boolean(fieldErrors.akademiName)}
          aria-describedby={fieldErrors.akademiName ? "contact-akademi-error" : undefined}
          className="w-full border-2 border-border bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary"
        />
        {fieldErrors.akademiName ? (
          <p id="contact-akademi-error" className="mt-1.5 text-xs font-semibold text-secondary">
            {fieldErrors.akademiName}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-primary">
          Nomor WhatsApp *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setFieldErrors((current) => ({ ...current, phone: "" }));
          }}
          placeholder="08xxxxxxxxxx"
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? "contact-phone-error" : undefined}
          className="w-full border-2 border-border bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary"
        />
        {fieldErrors.phone ? (
          <p id="contact-phone-error" className="mt-1.5 text-xs font-semibold text-secondary">
            {fieldErrors.phone}
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-primary">
          Paket yang Diminati
        </label>
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          className="w-full border-2 border-border bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary"
        >
          <option value="">Pilih paket</option>
          <option value="starter">{planLabels.starter}</option>
          <option value="pro">{planLabels.pro}</option>
          <option value="scale">{planLabels.scale}</option>
          <option value="konsultasi">{planLabels.konsultasi}</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-primary">
          Pesan Tambahan
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ceritakan kebutuhan akademi Anda..."
          className="w-full resize-none border-2 border-border bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary"
        />
      </div>
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={status === "submitting"}
        className={`block w-full py-4 text-center text-sm font-black uppercase tracking-widest text-white transition-all disabled:cursor-wait disabled:opacity-80 ${submitButtonClass}`}
      >
        {submitButtonLabel}
      </button>
      <p className="text-center text-xs text-muted">
        {status === "success"
          ? "Pesan tersimpan. Anda bisa lanjut chat lewat WhatsApp."
          : status === "fallback"
            ? "Pesan belum terkirim. Silakan lanjut lewat WhatsApp."
            : "Setelah dikirim, pesan diterima tim SKAIHUB dan Anda bisa lanjut chat lewat WhatsApp."}
      </p>
    </form>
    {status === "success" || status === "fallback" ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 px-5 backdrop-blur-sm">
        <section className="w-full max-w-[440px] border-2 border-primary bg-white p-6 shadow-[8px_8px_0px_theme(colors.secondary)]">
          <div className={`mb-4 flex size-12 items-center justify-center ${status === "success" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
            <span className="material-symbols-outlined text-[28px]">
              {status === "success" ? "check_circle" : "error"}
            </span>
          </div>
          <h2 className="font-heading text-2xl font-black uppercase text-primary">
            {status === "success" ? "Pertanyaan Terkirim" : "Belum Tersimpan"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {status === "success"
              ? "Pesan Anda sudah diterima tim SKAIHUB. Kami akan menghubungi Anda lewat WhatsApp."
              : submitError || "Sistem belum berhasil menyimpan pesan. Anda tetap bisa menghubungi tim SKAIHUB lewat WhatsApp."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="h-11 border-2 border-border px-4 text-sm font-black uppercase tracking-widest text-primary transition hover:bg-surface-container-low"
            >
              Tutup
            </button>
            <a
              href={submittedWhatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center bg-secondary px-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-secondary-dark"
            >
              Lanjut WhatsApp
            </a>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}

