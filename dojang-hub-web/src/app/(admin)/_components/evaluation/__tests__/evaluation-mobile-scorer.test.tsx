import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EvaluationMobileScorer from "../evaluation-mobile-scorer";
import { EvaluationAspect, Student, TrainingClass } from "../../../_lib/admin-api";

const mockStudents: Student[] = [
  {
    id: 1,
    akademi_id: 1,
    current_rank_id: 1,
    primary_class_id: 1,
    name: "Arya Pratama",
    birth_date: "2010-05-12",
    joined_date: "2024-01-01",
    gender: "male",
    status: "active",
    member_number: "TKD-001",
    height_cm: 150,
    weight_kg: "45",
    student_phone: null,
    guardian_name: null,
    guardian_phone: null,
    photo_url: null,
    address: null,
    shirt_size: null,
    school_name: null,
    school_grade: null,
    health_notes: null,
  },
  {
    id: 2,
    akademi_id: 1,
    current_rank_id: 2,
    primary_class_id: 1,
    name: "Dewi Lestari",
    birth_date: "2011-08-20",
    joined_date: "2024-01-02",
    gender: "female",
    status: "active",
    member_number: "TKD-002",
    height_cm: 145,
    weight_kg: "40",
    student_phone: null,
    guardian_name: null,
    guardian_phone: null,
    photo_url: null,
    address: null,
    shirt_size: null,
    school_name: null,
    school_grade: null,
    health_notes: null,
  },
];

const mockClass: TrainingClass = {
  id: 1,
  akademi_id: 1,
  training_place_id: 1,
  name: "Reguler Sore",
  spp_amount_override: null,
  target_sessions_per_month: 8,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockAspects: EvaluationAspect[] = [
  {
    id: 1,
    akademi_id: 1,
    evaluation_period_id: 1,
    name: "Kicking (Tae)",
    category: "Teknik",
    sort_order: 1,
    is_active: true,
    description: null,
  },
  {
    id: 2,
    akademi_id: 1,
    evaluation_period_id: 1,
    name: "Poomsae",
    category: "Teknik",
    sort_order: 2,
    is_active: true,
    description: null,
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
    const labels = screen.getAllByTestId("score-label").map((el) => el.textContent);
    expect(labels).toEqual(["Sangat Baik", "Cukup"]);

    // Tombol ganti siswa
    const nextBtn = screen.getByRole("button", { name: /Siswa Berikutnya/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    // Sekarang siswa kedua aktif
    expect(screen.getByText("Dewi Lestari")).toBeInTheDocument();
  });

  it("menampilkan legenda rentang predikat dan input numerik dengan label", () => {
    render(
      <EvaluationMobileScorer
        filteredStudents={mockStudents}
        selectedClass={mockClass}
        activeAspects={mockAspects}
        draftScores={{}}
        setDraftScores={vi.fn()}
        draftNotes={{}}
        setDraftNotes={vi.fn()}
      />
    );

    const legend = screen.getByRole("list", { name: /Rentang predikat nilai/i });
    expect(legend).toHaveTextContent("Kurang 1–59");
    expect(legend).toHaveTextContent("Cukup 60–69");
    expect(legend).toHaveTextContent("Baik 70–84");
    expect(legend).toHaveTextContent("Sangat Baik 85–100");

    const input = screen.getByLabelText("Nilai Kicking (Tae)");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("menyembunyikan empty state di desktop agar tidak dobel dengan tabel", () => {
    render(
      <EvaluationMobileScorer
        filteredStudents={[]}
        selectedClass={mockClass}
        activeAspects={mockAspects}
        draftScores={{}}
        setDraftScores={vi.fn()}
        draftNotes={{}}
        setDraftNotes={vi.fn()}
      />
    );

    const empty = screen.getByText("Belum ada siswa aktif dalam filter ini.");
    expect(empty.className).toContain("md:hidden");
  });
});
