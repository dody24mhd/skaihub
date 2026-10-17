import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import AcademyStudentsManager from "../../academy-students-manager";
import { resetSubscriptionStatus } from "../../ui/subscription-status";
import { makeStudent } from "./fixtures";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiClasses: vi.fn(),
  getAkademiStudents: vi.fn(),
  deleteAkademiStudent: vi.fn(),
  downloadAkademiStudentsExport: vi.fn(),
  getAkademiSubscriptionStatus: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function mockRole(role: "ketua_akademi" | "pelatih") {
  mockedApi.getAkademiMe.mockResolvedValue({ user: { role } } as Awaited<ReturnType<typeof api.getAkademiMe>>);
}

describe("AcademyStudentsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "token-uji");
    mockedApi.getAkademiClasses.mockResolvedValue({ data: [] });
    mockedApi.getAkademiStudents.mockResolvedValue({
      data: { data: [makeStudent()], current_page: 1, last_page: 1, total: 1, per_page: 25 },
    } as Awaited<ReturnType<typeof api.getAkademiStudents>>);
    resetSubscriptionStatus();
    mockedApi.getAkademiSubscriptionStatus.mockResolvedValue({
      subscription_state: "active",
    } as Awaited<ReturnType<typeof api.getAkademiSubscriptionStatus>>);
  });

  it("mode baca-saja menyembunyikan tambah siswa tetapi export tetap ada (L4-D)", async () => {
    mockedApi.getAkademiSubscriptionStatus.mockResolvedValue({
      subscription_state: "read_only",
    } as Awaited<ReturnType<typeof api.getAkademiSubscriptionStatus>>);
    mockRole("ketua_akademi");
    render(<AcademyStudentsManager />);

    expect(await screen.findByRole("button", { name: "Export" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("link", { name: /tambah siswa/i })).not.toBeInTheDocument());
  });

  it("menampilkan siswa sebagai kartu dan mengirim filter status ke API", async () => {
    mockRole("ketua_akademi");
    render(<AcademyStudentsManager />);

    expect(await screen.findAllByTestId("responsive-list-card")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /tambah siswa/i })).toHaveAttribute("href", "/academy/students/new");

    fireEvent.change(screen.getByLabelText("Filter status"), { target: { value: "alumni" } });

    await waitFor(() =>
      expect(mockedApi.getAkademiStudents).toHaveBeenLastCalledWith(
        "token-uji",
        expect.objectContaining({ status: "alumni", page: 1 }),
      ),
    );
  });

  it("menyembunyikan tombol tambah untuk pelatih", async () => {
    mockRole("pelatih");
    render(<AcademyStudentsManager />);

    await screen.findAllByTestId("responsive-list-card");
    expect(screen.queryByRole("link", { name: /tambah siswa/i })).not.toBeInTheDocument();
  });

  it("menampilkan tombol coba lagi saat daftar gagal dimuat", async () => {
    mockRole("ketua_akademi");
    mockedApi.getAkademiStudents.mockRejectedValueOnce(new Error("Server sibuk."));
    render(<AcademyStudentsManager />);

    expect(await screen.findByText("Server sibuk.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /coba lagi/i }));

    expect(await screen.findAllByTestId("responsive-list-card")).toHaveLength(1);
  });
});
