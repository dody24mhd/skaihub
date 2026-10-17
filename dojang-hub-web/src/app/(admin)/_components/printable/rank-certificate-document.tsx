import { RankCertificate } from "../../_lib/admin-api";
import AcademyRankBeltBadge from "../academy-rank-belt-badge";
import { longDateLabel } from "./printable-format";

function Signature({ role, name }: { role: string; name: string | null }) {
  return (
    <div className="w-36 text-center sm:w-48">
      <p className="text-xs text-muted">{role}</p>
      <div className="mt-12 border-t border-primary pt-1 text-sm font-bold text-primary">{name || "-"}</div>
    </div>
  );
}

export default function RankCertificateDocument({ certificate }: { certificate: RankCertificate }) {
  const { student, event, to_rank: toRank, from_rank: fromRank } = certificate;

  return (
    <article
      aria-label={`Sertifikat UKT ${student.name}`}
      className="printable-doc border-[6px] border-primary bg-white p-2 lg:aspect-[297/210] print:aspect-auto print:h-[188mm]"
    >
      <div className="flex h-full flex-col border border-secondary px-4 py-6 text-center sm:px-10 sm:py-8">
        <header>
          <p className="break-words font-heading text-lg font-black uppercase text-primary sm:text-xl">{certificate.akademi.name}</p>
          <div className="mx-auto mt-2 h-1 w-16 bg-secondary" />
          <h1 className="mt-4 font-heading text-2xl font-black uppercase leading-none tracking-tight text-primary sm:text-4xl">
            Sertifikat Kenaikan Tingkat
          </h1>
          <p className="mt-2 break-words text-xs font-bold uppercase tracking-[0.2em] text-muted">No. {certificate.certificate_number}</p>
        </header>

        <div className="my-auto py-6">
          <p className="text-sm text-muted">Diberikan kepada</p>
          <p className="mt-1 break-words font-heading text-3xl font-black uppercase text-primary sm:text-5xl">{student.name}</p>
          <p className="text-xs font-semibold text-muted">{student.member_number}</p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted">
            telah <span className="font-black uppercase text-success">lulus</span> {event.name} pada {longDateLabel(event.event_date)}
            {certificate.score !== null ? (
              <>
                {" "}dengan nilai <span className="font-bold text-primary">{certificate.score}</span>
              </>
            ) : null}{" "}
            dan berhak menyandang tingkatan
          </p>
          <div className="mt-3 flex flex-col items-center gap-1">
            <AcademyRankBeltBadge rank={toRank} size="lg" className="justify-center" />
            {fromRank ? <p className="text-xs text-muted">sebelumnya {fromRank.label}</p> : null}
          </div>
        </div>

        <footer className="flex items-end justify-between gap-4">
          <Signature role="Penguji" name={certificate.assessor} />
          <Signature role="Ketua Akademi" name={certificate.chair_name} />
        </footer>
      </div>
    </article>
  );
}
