import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SportRank, Student } from "../../../_lib/admin-api";
import RankTargetField from "../rank-target-field";

const ranks: SportRank[] = [
  { id: 1, code: "tkd-geup-10", label: "Geup 10 (Putih)", sequence: 10, sport_type: "taekwondo" },
  { id: 2, code: "tkd-geup-9", label: "Geup 9 (Kuning)", sequence: 20, sport_type: "taekwondo" },
  { id: 3, code: "tkd-geup-8", label: "Geup 8 (Kuning Strip Hijau)", sequence: 30, sport_type: "taekwondo" },
  { id: 4, code: "tkd-geup-7", label: "Geup 7 (Hijau)", sequence: 40, sport_type: "taekwondo" },
];

const student = { id: 9, name: "Budi", birth_date: "2014-01-01", current_rank: ranks[1] } as Pick<
  Student,
  "id" | "name" | "birth_date" | "current_rank"
>;

function renderField(toRankId: string) {
  return render(
    <RankTargetField
      id="t"
      label="Naik ke"
      ranks={ranks}
      student={student as Student}
      toRankId={toRankId}
      setToRankId={vi.fn()}
    />
  );
}

describe("RankTargetField", () => {
  it("hanya menawarkan sabuk di atas sabuk siswa", () => {
    renderField("3");

    const labels = screen.getAllByRole("option").map((option) => option.textContent);
    expect(labels).toEqual(["Pilih tingkatan", "Geup 8 (Kuning Strip Hijau)", "Geup 7 (Hijau)"]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("menampilkan peringatan loncat tingkat tanpa memblokir", () => {
    renderField("4");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Melewati 1 tingkat dari Geup 9 (Kuning) ke Geup 7 (Hijau)."
    );
    expect(screen.getByLabelText(/Naik ke/)).not.toBeDisabled();
  });
});
