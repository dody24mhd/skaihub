import type { Metadata } from "next";
import AdminSubscriptionManager from "../../_components/admin-subscription-manager";

export const metadata: Metadata = {
  title: "Langganan",
  robots: { index: false, follow: false },
};

export default function AdminSubscriptionPage() {
  return <AdminSubscriptionManager />;
}
