import type { Metadata } from "next";
import RankCertificateView from "../../../../../_components/printable/rank-certificate-view";

export const metadata: Metadata = {
  title: "Sertifikat UKT",
  robots: { index: false, follow: false },
};

export default async function AcademyRankCertificatePage({
  params,
}: {
  params: Promise<{ eventId: string; participantId: string }>;
}) {
  const { eventId, participantId } = await params;

  return <RankCertificateView eventId={Number(eventId)} participantId={Number(participantId)} />;
}
