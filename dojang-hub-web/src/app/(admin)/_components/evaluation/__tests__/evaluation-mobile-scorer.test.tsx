import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EvaluationMobileScorer from "../evaluation-mobile-scorer";
import { EvaluationAspect, Student, TrainingClass } from "../../../_lib/admin-api";

const mockStudents: Student[] = [
  {
    id: 1,
    akademi_id: 1,
    name: "Arya Pratama",
    email: "arya@example.com",
    phone: "081234567891",
    birth_date: "2010-05-12",
    gender: "male",
    status: "active",
    member_number: "TKD-001",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    akademi_id: 1,
    name: "Dewi Lestari",
    email: "dewi@example.com",
    phone: "081234567892",
    birth_date: "2011-08-20",
    gender: "female",
    status: "active",
    member_number: "TKD-002",
    created_at: "2026-01-02T00:00:00Z",
  },
];

const mockClass: TrainingClass = {
  id: 1,
  akademi_id: 1,
  name: "Reguler Sore",
  description: "Kelas reguler",
  max_students: 20,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockAspects: EvaluationAspect[] = [
  {
    id: 1,
    evaluation_period_id: 1,
    name: "Kicking (Tae)",
    category: "Teknik",
    sort_order: 1,
    is_active: true,
  },
  {
    id: 2,
    evaluation_period_id: 1,
    name: "Poomsae",
    category: "Teknik",
    sort_order: 2,
    is_active: true,
  },
];

describe("EvaluationMobileScorer", () => {
  it("merender pilihan siswa dan kartu aspek dengan label predikat", () => {
    const setDraftScores = vi.fn();
    const setDraftNotes = vi.fn();

    render(
      <EvaluationMobileScorer
        filteredStudents={mockStudents}
        selectedClass={mockClass}
        activeAspects={mockAspects}
        draftScores={{ "1:1": "88", "1:2": "65" }}
        setDraftScores={setDraftScores}
        draftNotes={{ 1: "Sangat baik" }}
        setDraftNotes={setDraftNotes}
      />
    );

    // Siswa pertama aktif
    expect(screen.getByText("Arya Pratama")).toBeInTheDocument();
    expect(screen.getByText("Kicking (Tae)")).toBeInTheDocument();
    expect(screen.getByText("Poomsae")).toBeInTheDocument();

    // Predikat terlihat
    expect(screen.getByText("Sangat Baik")).toBeInTheDocument();
    expect(screen.getByText("Cukup")).toBeInTheDocument();

    // Tombol ganti siswa
    const nextBtn = screen.getByRole("button", { name: /Siswa Berikutnya/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    // Sekarang siswa kedua aktif
    expect(screen.getByText("Dewi Lestari")).toBeInTheDocument();
  });
});
