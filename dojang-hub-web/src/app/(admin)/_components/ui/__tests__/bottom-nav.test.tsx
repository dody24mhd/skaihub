import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BottomNav from "../bottom-nav";

const pushMock = vi.fn();
let mockPathname = "/academy/students";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
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

  it("marks the active item inside the Lainnya sheet with aria-current", () => {
    mockPathname = "/academy/places";
    render(<BottomNav role="ketua_akademi" plan="pro" onLogout={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /lainnya/i }));

    expect(screen.getByRole("link", { name: "Tempat Latihan" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pelatih" })).not.toHaveAttribute("aria-current");
    mockPathname = "/academy/students";
  });
});
