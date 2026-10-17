import type { Metadata } from "next";
import ChangePasswordForm from "../../_components/account/change-password-form";
import AcademyShell from "../../_components/academy-shell";

export const metadata: Metadata = {
  title: "Ganti Password",
  robots: { index: false, follow: false },
};

export default function AcademyAccountPage() {
  return (
    <AcademyShell
      title="Ganti Password"
      description="Ganti password akun yang sedang Anda gunakan untuk login."
    >
      <ChangePasswordForm />
    </AcademyShell>
  );
}
