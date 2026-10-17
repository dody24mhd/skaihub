import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusMessage from "../status-message";

describe("StatusMessage", () => {
  it("announces success politely with role status", () => {
    render(<StatusMessage tone="success" message="Kelas berhasil disimpan." />);

    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Kelas berhasil disimpan.");
    expect(region).toHaveClass("text-success-strong");
  });

  it("announces errors assertively with role alert", () => {
    render(<StatusMessage tone="error" message="Gagal menyimpan." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal menyimpan.");
  });

  it("uses role status for info tone", () => {
    render(<StatusMessage tone="info" message="Memuat data..." />);

    expect(screen.getByRole("status")).toHaveTextContent("Memuat data...");
  });

  it("keeps the live region mounted and visually hidden when empty", () => {
    const { rerender } = render(<StatusMessage tone="error" message="" />);

    const region = screen.getByRole("alert");
    expect(region).toBeEmptyDOMElement();
    expect(region).toHaveClass("sr-only");

    rerender(<StatusMessage tone="error" message="Gagal memuat." />);

    expect(screen.getByRole("alert")).toBe(region);
    expect(region).toHaveTextContent("Gagal memuat.");
    expect(region).not.toHaveClass("sr-only");
  });

  it("renders extra children and className only while a message is shown", () => {
    const { rerender } = render(
      <StatusMessage tone="success" message={null} className="mt-4">
        <a href="/kwitansi">Lihat kwitansi</a>
      </StatusMessage>
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveClass("mt-4");

    rerender(
      <StatusMessage tone="success" message="Pembayaran dicatat." className="mt-4">
        <a href="/kwitansi">Lihat kwitansi</a>
      </StatusMessage>
    );

    expect(screen.getByRole("status")).toHaveClass("mt-4");
    expect(screen.getByRole("link", { name: "Lihat kwitansi" })).toBeInTheDocument();
  });
});
