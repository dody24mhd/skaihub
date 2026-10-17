import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SubscriptionPricePreview from "../subscription-price-preview";

function renderPreview(overrides: Partial<Parameters<typeof SubscriptionPricePreview>[0]> = {}) {
  const props = {
    plan: "pro" as const,
    duration: "quarterly" as const,
    startsAt: "",
    endsAt: "",
    extraStudents: "50",
    amount: "",
    onExtraStudentsChange: vi.fn(),
    onAmountChange: vi.fn(),
    ...overrides,
  };
  render(<SubscriptionPricePreview {...props} />);
  return props;
}

describe("SubscriptionPricePreview", () => {
  it("shows effective quota with the free block and paid blocks", () => {
    renderPreview();

    expect(screen.getByTestId("quota-total")).toHaveTextContent("250");
    expect(screen.getByText("150 bawaan paket + 50 bonus gratis + 50 berbayar")).toBeInTheDocument();
  });

  it("shows the automatic price breakdown", () => {
    renderPreview();

    expect(screen.getByText("Paket Pro Rp 199.000 × 3 bulan")).toBeInTheDocument();
    expect(screen.getByText("Rp 597.000")).toBeInTheDocument();
    expect(screen.getByText("1 blok berbayar × 15% per bulan")).toBeInTheDocument();
    expect(screen.getByText("Rp 89.550")).toBeInTheDocument();
    expect(screen.getByTestId("price-total")).toHaveTextContent("Rp 686.550");
  });

  it("uses the calculated price as placeholder and warns when amount differs", () => {
    renderPreview({ amount: "500000" });

    expect(screen.getByLabelText("Nominal tagihan (Rp)")).toHaveAttribute("placeholder", "686550");
    expect(screen.getByText(/berbeda dari harga otomatis/)).toBeInTheDocument();
  });

  it("forwards input changes", () => {
    const props = renderPreview();

    fireEvent.change(screen.getByLabelText("Siswa tambahan berbayar"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Nominal tagihan (Rp)"), { target: { value: "700000" } });

    expect(props.onExtraStudentsChange).toHaveBeenCalledWith("100");
    expect(props.onAmountChange).toHaveBeenCalledWith("700000");
  });

  it("marks trial as free", () => {
    renderPreview({ duration: "trial", extraStudents: "" });

    expect(screen.getByTestId("price-total")).toHaveTextContent("Rp 0");
  });
});
