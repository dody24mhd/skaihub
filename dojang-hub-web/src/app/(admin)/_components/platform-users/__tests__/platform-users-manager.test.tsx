import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlatformUsersManager from "../platform-users-manager";
import * as adminApi from "../../../_lib/admin-api";
import type { AdminUser, PlatformUser } from "../../../_lib/admin-api";

vi.mock("../../../_lib/admin-api", () => ({
  getAdminMe: vi.fn(),
  getPlatformUsers: vi.fn(),
  createPlatformUser: vi.fn(),
  updatePlatformUser: vi.fn(),
  deactivatePlatformUser: vi.fn(),
}));

const me: AdminUser = {
  id: 1,
  name: "Super Admin",
  email: "super@skaihub.test",
  role: "super_admin",
  avatar_url: null,
  is_active: true,
  akademi_id: null,
  akademi: null,
};

const users: PlatformUser[] = [
  {
    id: 1,
    name: "Super Admin",
    email: "super@skaihub.test",
    role: "super_admin",
    is_active: true,
    akademi_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Staf Konten",
    email: "konten@skaihub.test",
    role: "admin",
    is_active: true,
    akademi_id: null,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

describe("PlatformUsersManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAdminMe).mockResolvedValue({ user: me });
    vi.mocked(adminApi.getPlatformUsers).mockResolvedValue({ data: users });
  });

  it("lists platform users and only offers actions for staff accounts", async () => {
    render(<PlatformUsersManager />);

    const list = await screen.findByRole("table", { name: /Daftar staf platform/i });
    expect(within(list).getByText("Staf Konten")).toBeInTheDocument();
    expect(within(list).getByText("Akun saya")).toBeInTheDocument();
    expect(within(list).getAllByRole("button", { name: /Edit/i })).toHaveLength(1);
    expect(within(list).getAllByRole("button", { name: /Nonaktifkan/i })).toHaveLength(1);
  });

  it("shows an error with retry when loading fails", async () => {
    vi.mocked(adminApi.getPlatformUsers).mockRejectedValueOnce(new Error("Gagal memuat."));
    render(<PlatformUsersManager />);

    expect(await screen.findByText("Gagal memuat.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Coba lagi/i }));

    await waitFor(() => expect(adminApi.getPlatformUsers).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText("Staf Konten")).not.toHaveLength(0);
  });

  it("creates a staff account from the sheet modal", async () => {
    vi.mocked(adminApi.createPlatformUser).mockResolvedValue({ platform_user: users[1] });
    render(<PlatformUsersManager />);
    await screen.findAllByText("Staf Konten");

    fireEvent.click(screen.getByRole("button", { name: /Tambah Staf/i }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Nama Lengkap/i), { target: { value: "Staf Baru" } });
    fireEvent.change(within(dialog).getByLabelText(/Email Login/i), { target: { value: "baru@skaihub.test" } });
    fireEvent.change(within(dialog).getByLabelText(/^Password/i), { target: { value: "password123" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Simpan/i }));

    await waitFor(() => {
      expect(adminApi.createPlatformUser).toHaveBeenCalledWith("fake-token", {
        name: "Staf Baru",
        email: "baru@skaihub.test",
        password: "password123",
        is_active: true,
      });
    });
    expect(await screen.findByText("Staf platform ditambahkan.")).toBeInTheDocument();
  });

  it("updates a staff account without sending an empty password", async () => {
    vi.mocked(adminApi.updatePlatformUser).mockResolvedValue({ platform_user: users[1] });
    render(<PlatformUsersManager />);
    const list = await screen.findByRole("table", { name: /Daftar staf platform/i });

    fireEvent.click(within(list).getByRole("button", { name: /Edit/i }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Nama Lengkap/i), { target: { value: "Staf Diubah" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Simpan/i }));

    await waitFor(() => {
      expect(adminApi.updatePlatformUser).toHaveBeenCalledWith("fake-token", 2, {
        name: "Staf Diubah",
        email: "konten@skaihub.test",
        is_active: true,
      });
    });
  });

  it("deactivates a staff account after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(adminApi.deactivatePlatformUser).mockResolvedValue({ message: "ok" });
    render(<PlatformUsersManager />);
    const list = await screen.findByRole("table", { name: /Daftar staf platform/i });

    fireEvent.click(within(list).getByRole("button", { name: /Nonaktifkan/i }));

    await waitFor(() => expect(adminApi.deactivatePlatformUser).toHaveBeenCalledWith("fake-token", 2));
    expect(await screen.findByText("Staf platform dinonaktifkan.")).toBeInTheDocument();
  });
});
