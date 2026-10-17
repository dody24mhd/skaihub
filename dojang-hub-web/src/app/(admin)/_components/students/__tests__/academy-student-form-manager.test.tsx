import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../../../_lib/admin-api";
import AcademyStudentFormManager from "../../academy-student-form-manager";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiClasses: vi.fn(),
  getAkademiSportRanks: vi.fn(),
  getAkademiStudentDetail: vi.fn(),
  createAkademiStudent: vi.fn(),
  updateAkademiStudent: vi.fn(),
  uploadAkademiFile: vi.fn(),
}));

const mockedApi = vi.mocked(api);

describe("AcademyStudentFormManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "token-uji");
    mockedApi.getAkademiMe.mockResolvedValue({ user: { role: "admin_akademi" } } as Awaited<ReturnType<typeof api.getAkademiMe>>);
    mockedApi.getAkademiClasses.mockResolvedValue({ data: [] });
    mockedApi.getAkademiSportRanks.mockResolvedValue({ data: [] });
    mockedApi.createAkademiStudent.mockResolvedValue({} as Awaited<ReturnType<typeof api.createAkademiStudent>>);
  });

  it("memakai keyboard telepon dan angka pada field yang sesuai", async () => {
    render(<AcademyStudentFormManager />);

    expect(await screen.findByLabelText(/Nomor siswa/)).toHaveAttribute("inputmode", "tel");
    expect(screen.getByLabelText(/Nomor wali/)).toHaveAttribute("inputmode", "tel");
    expect(screen.getByLabelText(/Tinggi badan/)).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByLabelText(/Berat badan/)).toHaveAttribute("inputmode", "decimal");
  });

  it("mengirim payload siswa baru lalu kembali ke daftar", async () => {
    render(<AcademyStudentFormManager />);

    fireEvent.change(await screen.findByLabelText(/Nama siswa/), { target: { value: "Dewi" } });
    fireEvent.change(screen.getByLabelText(/Tanggal lahir/), { target: { value: "2011-08-20" } });
    fireEvent.change(screen.getByLabelText(/Tinggi badan/), { target: { value: "140" } });
    fireEvent.change(screen.getByLabelText(/Berat badan/), { target: { value: "35.5" } });
    fireEvent.change(screen.getByLabelText(/Nama wali/), { target: { value: "Ibu Dewi" } });
    fireEvent.change(screen.getByLabelText(/Nomor wali/), { target: { value: "0812" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan siswa/i }));

    await waitFor(() =>
      expect(mockedApi.createAkademiStudent).toHaveBeenCalledWith(
        "token-uji",
        expect.objectContaining({
          name: "Dewi",
          height_cm: 140,
          weight_kg: 35.5,
          guardian_name: "Ibu Dewi",
          guardian_phone: "0812",
          student_phone: null,
        }),
      ),
    );
    expect(pushMock).toHaveBeenCalledWith("/academy/students");
  });

  it("menolak akses untuk pelatih", async () => {
    mockedApi.getAkademiMe.mockResolvedValue({ user: { role: "pelatih" } } as Awaited<ReturnType<typeof api.getAkademiMe>>);
    render(<AcademyStudentFormManager />);

    expect(await screen.findByText(/Akses ditolak/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /simpan siswa/i })).not.toBeInTheDocument();
  });

  it("menampilkan pesan kontak & wali tanpa mengirim ke server", async () => {
    render(<AcademyStudentFormManager />);

    fireEvent.change(await screen.findByLabelText(/Nama siswa/), { target: { value: "Dewi" } });
    fireEvent.change(screen.getByLabelText(/Tanggal lahir/), { target: { value: "2015-08-20" } });
    fireEvent.submit(screen.getByRole("button", { name: /simpan siswa/i }).closest("form") as HTMLFormElement);

    expect(await screen.findByText("Isi minimal satu nomor kontak: nomor siswa atau nomor wali.")).toBeInTheDocument();
    expect(screen.getByText("Nama wali wajib diisi untuk siswa di bawah 17 tahun.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama wali/)).toHaveAttribute("aria-invalid", "true");
    expect(mockedApi.createAkademiStudent).not.toHaveBeenCalled();
  });

  it("menandai wali wajib saat siswa di bawah 17 tahun dan fisik opsional", async () => {
    render(<AcademyStudentFormManager />);

    const guardianName = await screen.findByLabelText(/Nama wali/);
    expect(guardianName).not.toBeRequired();
    expect(screen.getByLabelText(/Tinggi badan/)).not.toBeRequired();
    expect(screen.getByLabelText(/Berat badan/)).not.toBeRequired();

    fireEvent.change(screen.getByLabelText(/Tanggal lahir/), { target: { value: "2015-08-20" } });

    expect(screen.getByLabelText(/Nama wali/)).toBeRequired();
    expect(screen.getByLabelText(/Nomor wali/)).toBeRequired();
    expect(screen.getByText(/Wajib untuk siswa di bawah 17 tahun/)).toBeInTheDocument();
  });
});
