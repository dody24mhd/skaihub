import Link from "next/link";
import { createWhatsAppUrl } from "../_lib/whatsapp";
import { planConsultMessage, type PlanCard } from "../_lib/product";

type PlanCardViewProps = {
  plan: PlanCard;
  waNumber?: string;
  showForWho?: boolean;
};

/** Kartu paket yang dipakai bersama oleh beranda dan halaman /harga. */
export default function PlanCardView({ plan, waNumber, showForWho = false }: PlanCardViewProps) {
  const isHighlighted = plan.highlighted;

  return (
    <article
      className={`relative flex flex-col p-8 transition-all duration-300 ${
        isHighlighted
          ? "bg-primary text-white shadow-[8px_8px_0px_theme(colors.secondary)] md:-translate-y-4"
          : "border-2 border-border bg-white text-slate-800 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
      }`}
    >
      {isHighlighted && (
        <>
          <div className="absolute right-0 top-0 h-24 w-24 bg-secondary/20 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
          <div className="absolute right-0 top-0 h-16 w-16 bg-secondary/30 [clip-path:polygon(100%_0%,0%_0%,100%_100%)]" />
        </>
      )}

      {plan.icon && (
        <span
          className="material-symbols-outlined pointer-events-none absolute -bottom-4 -right-4 select-none text-primary opacity-[0.04]"
          style={{ fontSize: "160px", fontVariationSettings: "'FILL' 1" }}
        >
          {plan.icon}
        </span>
      )}

      {plan.tag && (
        <div className="absolute -top-4 left-6">
          <span className="inline-flex items-center gap-1.5 bg-secondary px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
            </svg>
            {plan.tag}
          </span>
        </div>
      )}

      <div className={`${showForWho ? "mb-4" : "mb-6"} mt-2`}>
        <h3 className={`font-heading text-xl font-black uppercase ${isHighlighted ? "text-white" : "text-primary"}`}>
          {plan.name}
        </h3>
        <p className={`mt-1 text-sm ${isHighlighted ? "text-white/50" : "text-muted"}`}>{plan.desc}</p>
      </div>

      {showForWho && (
        <div className={`mb-4 border-l-2 pl-3 text-xs leading-relaxed ${
          isHighlighted ? "border-secondary text-white/50" : "border-primary/20 text-muted"
        }`}>
          {plan.forWho}
        </div>
      )}

      <div className={`mb-6 border-b pb-6 ${isHighlighted ? "border-white/10" : "border-border"}`}>
        <div className="flex items-end gap-1">
          <span className="font-heading text-4xl font-black tracking-tight">{plan.price}</span>
          <span className={`mb-1 text-sm font-medium ${isHighlighted ? "text-white/50" : "text-muted"}`}>/bulan</span>
        </div>
        <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold ${
          isHighlighted ? "bg-white/10 text-white/60" : "bg-slate-100 text-muted"
        }`}>
          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>language</span>
          {plan.access}
        </div>
      </div>

      <ul className="flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-center gap-3 text-sm">
            <span
              className={`material-symbols-outlined flex-shrink-0 ${
                feature.included ? (isHighlighted ? "text-secondary" : "text-primary") : "text-slate-300"
              }`}
              style={{ fontVariationSettings: feature.included ? "'FILL' 1" : "'FILL' 0", fontSize: "18px" }}
            >
              {feature.included ? "check_circle" : "cancel"}
            </span>
            <span className={
              feature.included
                ? isHighlighted ? "text-white/80" : "text-slate-700"
                : isHighlighted ? "text-white/25" : "text-slate-300"
            }>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={createWhatsAppUrl(planConsultMessage(plan.name), waNumber)}
        className={`mt-8 block py-3.5 text-center text-sm font-black uppercase tracking-widest transition-all ${
          isHighlighted
            ? "bg-secondary text-white hover:bg-secondary-dark"
            : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
        }`}
      >
        Konsultasi Paket
      </Link>
    </article>
  );
}
