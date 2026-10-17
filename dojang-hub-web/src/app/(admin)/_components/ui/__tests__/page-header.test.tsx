import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageHeader from "../page-header";

describe("PageHeader", () => {
  it("renders title, eyebrow, and description", () => {
    render(
      <PageHeader
        title="Daftar Siswa"
        eyebrow="Operasional Akademi"
        description="Kelola seluruh siswa aktif dan alumni."
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Daftar Siswa");
    expect(screen.getByText("Operasional Akademi")).toBeInTheDocument();
    expect(screen.getByText("Kelola seluruh siswa aktif dan alumni.")).toBeInTheDocument();
  });

  it("renders action button", () => {
    render(
      <PageHeader
        title="Daftar Siswa"
        action={<button type="button">Tambah Siswa</button>}
      />
    );

    expect(screen.getByRole("button", { name: "Tambah Siswa" })).toBeInTheDocument();
  });
});
