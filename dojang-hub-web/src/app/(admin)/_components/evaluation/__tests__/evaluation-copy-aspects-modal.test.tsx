import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EvaluationPeriod } from "../../../_lib/admin-api";
import EvaluationCopyAspectsModal, { copySourceCandidates, defaultCopySource } from "../evaluation-copy-aspects-modal";

function makePeriod(overrides: Partial<EvaluationPeriod>): EvaluationPeriod {
  return {
    id: 1,
    akademi_id: 1,
    name: "Periode",
    starts_at: "2026-01-01",
    ends_at: "2026-06-30",
    status: "closed",
    notes: null,
    aspects_count: 3,
    ...overrides,
  };
}

const semester1 = makePeriod({ id: 1, name: "Semester 1 2026", starts_at: "2026-01-01", aspects_count: 4 });
const kosong = makePeriod({ id: 2, name: "Periode Kosong", starts_at: "2026-03-01", aspects_count: 0 });
const target = makePeriod({ id: 3, name: "Semester 2 2026", starts_at: "2026-07-01", status: "draft", aspects_count: 0 });
const future = makePeriod({ id: 4, name: "Semester 1 2027", starts_at: "2027-01-01", aspects_count: 2 });
const periods = [future, target, kosong, semester1];

describe("copySourceCandidates", () => {
  it("hanya periode lain yang punya variabel, terbaru dulu", () => {
    expect(copySourceCandidates(periods, target).map((period) => period.id)).toEqual([4, 1]);
  });

  it("default memilih periode sebelumnya, bukan periode masa depan", () => {
    expect(defaultCopySource(periods, target)?.id).toBe(1);
  });

  it("jatuh ke kandidat pertama bila tidak ada periode sebelumnya", () => {
    expect(defaultCopySource([future, semester1], makePeriod({ id: 9, starts_at: "2025-01-01" }))?.id).toBe(4);
  });
});

describe("EvaluationCopyAspectsModal", () => {
  it("mengirim periode sumber yang dipilih lalu menutup modal saat sukses", async () => {
    const onCopy = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <EvaluationCopyAspectsModal isOpen onClose={onClose} periods={periods} targetPeriod={target} isSaving={false} onCopy={onCopy} />,
    );

    const select = screen.getByLabelText(/Periode sumber/i) as HTMLSelectElement;
    expect(select.value).toBe("1");
    expect(screen.getByText(/4 variabel/)).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /Salin Variabel/i }));

    await waitFor(() => expect(onCopy).toHaveBeenCalledWith(future));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("tidak menutup modal saat penyalinan gagal", async () => {
    const onCopy = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();

    render(
      <EvaluationCopyAspectsModal isOpen onClose={onClose} periods={periods} targetPeriod={target} isSaving={false} onCopy={onCopy} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Salin Variabel/i }));

    await waitFor(() => expect(onCopy).toHaveBeenCalledWith(semester1));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("menampilkan pesan bila tidak ada periode sumber", () => {
    render(
      <EvaluationCopyAspectsModal isOpen onClose={vi.fn()} periods={[target, kosong]} targetPeriod={target} isSaving={false} onCopy={vi.fn()} />,
    );

    expect(screen.getByText(/Belum ada periode lain yang punya variabel/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Salin Variabel/i })).not.toBeInTheDocument();
  });
});
