import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AttendanceStudentCard from "../attendance-student-card";

describe("AttendanceStudentCard", () => {
  const defaultProps = {
    attendanceId: 101,
    studentName: "Arya Pratama",
    rankName: "Kuning (Geup 8)",
    status: "present" as const,
    isExtra: false,
    onStatusChange: vi.fn(),
  };

  it("menampilkan nama siswa dan rank badge", () => {
    render(<AttendanceStudentCard {...defaultProps} />);

    expect(screen.getByText("Arya Pratama")).toBeInTheDocument();
    expect(screen.getByText("Kuning (Geup 8)")).toBeInTheDocument();
  });

  it("menampilkan empat tombol status (Hadir, Izin, Sakit, Alpa) dengan tinggi sentuh minimal 44px", () => {
    render(<AttendanceStudentCard {...defaultProps} />);

    const presentBtn = screen.getByRole("button", { name: /hadir/i });
    const excusedBtn = screen.getByRole("button", { name: /izin/i });
    const sickBtn = screen.getByRole("button", { name: /sakit/i });
    const absentBtn = screen.getByRole("button", { name: /alpa/i });

    expect(presentBtn).toBeInTheDocument();
    expect(excusedBtn).toBeInTheDocument();
    expect(sickBtn).toBeInTheDocument();
    expect(absentBtn).toBeInTheDocument();

    // Verifikasi class touch target min-h-11 (>= 44px)
    expect(presentBtn.className).toContain("min-h-11");
    expect(excusedBtn.className).toContain("min-h-11");
    expect(sickBtn.className).toContain("min-h-11");
    expect(absentBtn.className).toContain("min-h-11");
  });

  it("memanggil onStatusChange dengan status 'sick' saat tombol Sakit diklik", () => {
    const onStatusChange = vi.fn();
    render(<AttendanceStudentCard {...defaultProps} onStatusChange={onStatusChange} />);

    const sickBtn = screen.getByRole("button", { name: /sakit/i });
    fireEvent.click(sickBtn);

    expect(onStatusChange).toHaveBeenCalledWith(101, "sick");
  });

  it("menonaktifkan tombol status jika merupakan peserta tambahan", () => {
    render(<AttendanceStudentCard {...defaultProps} isExtra={true} />);

    const presentBtn = screen.getByRole("button", { name: /hadir/i });
    expect(presentBtn).toBeDisabled();
    expect(screen.getByText("Tambahan")).toBeInTheDocument();
  });
});
