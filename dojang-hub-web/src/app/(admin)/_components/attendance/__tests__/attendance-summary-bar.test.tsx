import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AttendanceSummaryBar from "../attendance-summary-bar";

describe("AttendanceSummaryBar", () => {
  const defaultProps = {
    counts: {
      present: 5,
      excused: 2,
      sick: 1,
      absent: 3,
    },
    isSaving: false,
    onSaveDraft: vi.fn(),
    onComplete: vi.fn(),
  };

  it("menampilkan rekap status Hadir, Izin, Sakit, Alpa dengan benar", () => {
    render(<AttendanceSummaryBar {...defaultProps} />);

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Hadir")).toBeInTheDocument();
    expect(screen.getByText("Izin")).toBeInTheDocument();
    expect(screen.getByText("Sakit")).toBeInTheDocument();
    expect(screen.getByText("Alpa")).toBeInTheDocument();
  });

  it("memiliki tombol simpan penuh-lebar pada mobile dengan target sentuh minimal 44px", () => {
    render(<AttendanceSummaryBar {...defaultProps} />);

    const draftBtn = screen.getByRole("button", { name: /simpan draft/i });
    const completeBtn = screen.getByRole("button", { name: /selesaikan absensi/i });

    expect(draftBtn.className).toContain("min-h-11");
    expect(completeBtn.className).toContain("min-h-11");
  });

  it("memanggil onSaveDraft dan onComplete saat tombol diklik", () => {
    const onSaveDraft = vi.fn();
    const onComplete = vi.fn();
    render(<AttendanceSummaryBar {...defaultProps} onSaveDraft={onSaveDraft} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /simpan draft/i }));
    expect(onSaveDraft).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /selesaikan absensi/i }));
    expect(onComplete).toHaveBeenCalled();
  });
});
