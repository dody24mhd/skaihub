import type { Metadata } from "next";
import SppReceiptView from "../../../../_components/spp/spp-receipt-view";

export const metadata: Metadata = {
  title: "Kwitansi SPP",
  robots: { index: false, follow: false },
};

export default async function AcademySppReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  return <SppReceiptView paymentId={Number(paymentId)} />;
}
