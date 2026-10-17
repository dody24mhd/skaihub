import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import StudentAchievementsSection from "../student-achievements-section";

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiStudentAchievements: vi.fn(),
  createAkademiStudentAchievement: vi.fn(),
  updateAkademiStudentAchievement: vi.fn(),
  deleteAkademiStudentAchievement: vi.fn(),
}));

const mockedApi = vi.mocked(api);

const achievement: api.StudentAchievement = {
  id: 7,
  akademi_id: 1,
  student_id: 5,
  title: "Juara 1 Kyorugi",
  event_name: "Kejurda Jabar",
  achieved_on: "2026-09-14T00:00:00.000000Z",
  result_label: "Emas",
  notes: null,
  created_at: "2026-09-15T00:00:00Z",
  updated_at: "2026-09-15T00:00:00Z",
};

describe("StudentAchievementsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getAkademiStudentAchievements.mockResolvedValue({ data: [achievement] });
  });

  afterEach(() => vi.restoreAllMocks());

  it("hanya menampilkan daftar prestasi untuk pelatih", async () => {
    render(<StudentAchievementsSection token="token-uji" studentId={5} canManage={false} />);

    expect(await screen.findByText("Juara 1 Kyorugi")).toBeInTheDocument();
    expect(screen.getByText("Emas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tambah prestasi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });

  it("menambah prestasi lewat SheetModal dan mengirim payload yang dirapikan", async () => {
    mockedApi.createAkademiStudentAchievement.mockResolvedValue({
      student_achievement: { ...achievement, id: 8, title: "Juara 2 Poomsae", result_label: null },
    });
    render(<StudentAchievementsSection token="token-uji" studentId={5} canManage />);

    fireEvent.click(await screen.findByRole("button", { name: /tambah prestasi/i }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Judul prestasi/), { target: { value: " Juara 2 Poomsae " } });
    fireEvent.change(within(dialog).getByLabelText(/Nama event/), { target: { value: "Open Bandung" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /simpan prestasi/i }));

    await waitFor(() =>
      expect(mockedApi.createAkademiStudentAchievement).toHaveBeenCalledWith("token-uji", 5, {
        title: "Juara 2 Poomsae",
        event_name: "Open Bandung",
        achieved_on: null,
        result_label: null,
        notes: null,
      }),
    );
    expect(await screen.findByText("Juara 2 Poomsae")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mengedit prestasi yang ada", async () => {
    mockedApi.updateAkademiStudentAchievement.mockResolvedValue({
      student_achievement: { ...achievement, result_label: "Perak" },
    });
    render(<StudentAchievementsSection token="token-uji" studentId={5} canManage />);

    fireEvent.click(await screen.findByRole("button", { name: /edit juara 1 kyorugi/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/Tanggal/)).toHaveValue("2026-09-14");
    fireEvent.change(within(dialog).getByLabelText(/Hasil/), { target: { value: "Perak" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /simpan prestasi/i }));

    await waitFor(() =>
      expect(mockedApi.updateAkademiStudentAchievement).toHaveBeenCalledWith(
        "token-uji",
        5,
        7,
        expect.objectContaining({ title: "Juara 1 Kyorugi", result_label: "Perak", achieved_on: "2026-09-14" }),
      ),
    );
    expect(await screen.findByText("Perak")).toBeInTheDocument();
  });

  it("menghapus prestasi setelah konfirmasi", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedApi.deleteAkademiStudentAchievement.mockResolvedValue({ message: "Prestasi siswa berhasil dihapus." });
    render(<StudentAchievementsSection token="token-uji" studentId={5} canManage />);

    fireEvent.click(await screen.findByRole("button", { name: /hapus juara 1 kyorugi/i }));

    await waitFor(() => expect(mockedApi.deleteAkademiStudentAchievement).toHaveBeenCalledWith("token-uji", 5, 7));
    expect(await screen.findByText("Belum ada prestasi tercatat.")).toBeInTheDocument();
  });
});
