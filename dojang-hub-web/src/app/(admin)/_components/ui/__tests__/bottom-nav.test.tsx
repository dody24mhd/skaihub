import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BottomNav from "../bottom-nav";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/academy/students",
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("BottomNav", () => {
  it("renders 5 slots for admin_akademi and marks active route", () => {
    render(
      <BottomNav
        role="admin_akademi"
        plan="starter"
        onLogout={vi.fn()}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Navigasi Bawah" });
    expect(nav).toBeInTheDocument();

    expect(screen.getByText("Beranda")).toBeInTheDocument();
    expect(screen.getByText("Siswa")).toBeInTheDocument();
    expect(screen.getByText("Absensi")).toBeInTheDocument();
    expect(screen.getByText("SPP")).toBeInTheDocument();
    expect(screen.getByText("Lainnya")).toBeInTheDocument();

    const activeLink = screen.getByRole("link", { name: /siswa/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("renders Penilaian instead of SPP for pelatih role", () => {
    render(
      <BottomNav
        role="pelatih"
        plan="starter"
        onLogout={vi.fn()}
      />
    );

    expect(screen.queryByText("SPP")).toBeNull();
    expect(screen.getByText("Penilaian")).toBeInTheDocument();
  });

  it("opens sheet modal when Lainnya is clicked, showing remaining items and logout", () => {
    const handleLogout = vi.fn();
    render(
      <BottomNav
        role="ketua_akademi"
        plan="pro"
        onLogout={handleLogout}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    const moreButton = screen.getByRole("button", { name: /lainnya/i });
    fireEvent.click(moreButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Sisa menu (contoh: Tempat Latihan, Pelatih, Jadwal)
    expect(screen.getByText("Tempat Latihan")).toBeInTheDocument();
    expect(screen.getByText("Pelatih")).toBeInTheDocument();

    // Tombol Keluar
    const logoutBtn = screen.getByRole("button", { name: /keluar/i });
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
