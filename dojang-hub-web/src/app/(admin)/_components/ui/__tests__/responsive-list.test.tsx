import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResponsiveList, { ResponsiveColumn } from "../responsive-list";

type TestItem = {
  id: number;
  name: string;
  belt: string;
  phone: string;
};

const items: TestItem[] = [
  { id: 1, name: "Budi Santoso", belt: "Kuning", phone: "08123456789" },
  { id: 2, name: "Siti Rahma", belt: "Hijau", phone: "08987654321" },
];

const columns: ResponsiveColumn<TestItem>[] = [
  {
    key: "name",
    header: "Nama Siswa",
    primary: true,
    render: (row) => row.name,
  },
  {
    key: "belt",
    header: "Sabuk",
    render: (row) => row.belt,
  },
  {
    key: "phone",
    header: "No. Telepon",
    hideOnMobile: true,
    render: (row) => row.phone,
  },
];

describe("ResponsiveList", () => {
  it("renders empty state when rows is empty", () => {
    render(
      <ResponsiveList
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyState={<div>Data tidak ditemukan</div>}
      />
    );

    expect(screen.getByText("Data tidak ditemukan")).toBeInTheDocument();
  });

  it("renders default empty state when emptyState prop is not provided", () => {
    render(
      <ResponsiveList
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
      />
    );

    expect(screen.getByText("Tidak ada data.")).toBeInTheDocument();
  });

  it("renders table for desktop and cards for mobile", () => {
    render(
      <ResponsiveList
        columns={columns}
        rows={items}
        getRowKey={(r) => r.id}
      />
    );

    // Table view
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getAllByText("Nama Siswa").length).toBeGreaterThan(0);

    // Both rows present
    expect(screen.getAllByText("Budi Santoso").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Siti Rahma").length).toBeGreaterThan(0);
  });

  it("calls onRowClick when a table row or card is clicked", () => {
    const handleRowClick = vi.fn();
    render(
      <ResponsiveList
        columns={columns}
        rows={items}
        getRowKey={(r) => r.id}
        onRowClick={handleRowClick}
      />
    );

    const cards = screen.getAllByTestId("responsive-list-card");
    expect(cards.length).toBe(2);

    fireEvent.click(cards[0]);
    expect(handleRowClick).toHaveBeenCalledWith(items[0]);
  });
});
