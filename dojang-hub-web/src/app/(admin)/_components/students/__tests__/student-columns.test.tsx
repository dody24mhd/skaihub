import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveList } from "../../ui";
import { buildStudentColumns } from "../student-columns";
import { makeStudent } from "./fixtures";

function renderList(canManage: boolean, onDelete = vi.fn()) {
  const rows = [makeStudent(), makeStudent({ id: 2, name: "Dewi Lestari", status: "alumni", primary_class: null })];
  render(
    <ResponsiveList
      columns={buildStudentColumns({ canManage, onDelete })}
      rows={rows}
      getRowKey={(row) => row.id}
    />,
  );
  return { rows, onDelete };
}

describe("buildStudentColumns", () => {
  it("menampilkan nama, kelas, sabuk, dan status pada kartu HP", () => {
    renderList(false);

    const cards = screen.getAllByTestId("responsive-list-card");
    const first = within(cards[0]);
    expect(first.getByText("Arya Pratama")).toBeInTheDocument();
    expect(first.getByText("Reguler Sore")).toBeInTheDocument();
    expect(first.getByText("Kuning (Geup 8)")).toBeInTheDocument();
    expect(first.getByText("Aktif")).toBeInTheDocument();

    const second = within(cards[1]);
    expect(second.getByText("Alumni")).toBeInTheDocument();
    expect(second.getByText("-")).toBeInTheDocument();
  });

  it("tidak menampilkan kolom foto dan fisik di kartu HP", () => {
    renderList(false);

    const card = within(screen.getAllByTestId("responsive-list-card")[0]);
    expect(card.queryByText("Fisik")).not.toBeInTheDocument();
    expect(card.queryByText("Foto")).not.toBeInTheDocument();
  });

  it("menyembunyikan Edit dan Hapus bila tidak berhak mengelola", () => {
    renderList(false);

    const card = within(screen.getAllByTestId("responsive-list-card")[0]);
    expect(card.getByRole("link", { name: "Detail" })).toHaveAttribute("href", "/academy/students/1");
    expect(card.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(card.queryByRole("button", { name: "Hapus" })).not.toBeInTheDocument();
  });

  it("menampilkan aksi kelola dengan target sentuh 44px dan memanggil onDelete", () => {
    const { rows, onDelete } = renderList(true);

    const card = within(screen.getAllByTestId("responsive-list-card")[0]);
    const editLink = card.getByRole("link", { name: "Edit" });
    expect(editLink).toHaveAttribute("href", "/academy/students/1/edit");
    expect(editLink.className).toContain("min-h-11");

    fireEvent.click(card.getByRole("button", { name: "Hapus" }));
    expect(onDelete).toHaveBeenCalledWith(rows[0]);
  });
});
