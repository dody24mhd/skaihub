import type { Metadata } from "next";
import ChangePasswordForm from "../../_components/account/change-password-form";
import AdminShell from "../../_components/admin-shell";

export const metadata: Metadata = {
  title: "Ganti Password",
  robots: { index: false, follow: false },
};

export default function AdminAccountPage() {
  return (
    <AdminShell
      title="Ganti Password"
      eyebrow="Akun"
      description="Ganti password akun yang sedang Anda gunakan untuk login."
    >
      <ChangePasswordForm />
    </AdminShell>
  );
}
