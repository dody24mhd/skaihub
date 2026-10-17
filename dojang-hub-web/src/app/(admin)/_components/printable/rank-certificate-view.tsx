"use client";

import { useCallback } from "react";
import { RankCertificate, getAkademiRankCertificate } from "../../_lib/admin-api";
import PrintablePage, { usePrintableData } from "./printable-page";
import RankCertificateDocument from "./rank-certificate-document";

export default function RankCertificateView({ eventId, participantId }: { eventId: number; participantId: number }) {
  const loadCertificate = useCallback(
    async (token: string): Promise<RankCertificate> => (await getAkademiRankCertificate(token, eventId, participantId)).certificate,
    [eventId, participantId],
  );
  const { data, isLoading, error, reload } = usePrintableData(loadCertificate, "Gagal memuat sertifikat.");

  return (
    <PrintablePage
      backHref="/academy/rank-promotions"
      backLabel="Kembali ke Kenaikan Tingkat"
      orientation="landscape"
      widthClass="max-w-5xl"
      isReady={Boolean(data)}
      isLoading={isLoading}
      loadingText="Memuat sertifikat..."
      error={error}
      onRetry={() => void reload()}
    >
      {data ? <RankCertificateDocument certificate={data} /> : null}
    </PrintablePage>
  );
}
