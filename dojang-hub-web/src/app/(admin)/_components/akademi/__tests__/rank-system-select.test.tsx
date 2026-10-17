import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RankSystemSelect from "../rank-system-select";

describe("RankSystemSelect", () => {
  it("menampilkan pilihan FORKI dan KKI untuk karate", () => {
    const onChange = vi.fn();
    render(<RankSystemSelect id="rs" sportType="karate" value="karate_forki" onChange={onChange} />);

    const select = screen.getByLabelText(/Sistem tingkatan/i);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Karate FORKI",
      "Karate KKI",
    ]);

    fireEvent.change(select, { target: { value: "karate_kki" } });
    expect(onChange).toHaveBeenCalledWith("karate_kki");
  });

  it("menjelaskan bila cabang olahraga belum punya katalog", () => {
    render(<RankSystemSelect id="rs" sportType="judo" value={null} onChange={vi.fn()} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(/Belum ada katalog sabuk bawaan/i)).toBeInTheDocument();
  });
});
