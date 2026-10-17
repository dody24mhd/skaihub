import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OfflinePage, { metadata } from "../page";
import ReloadButton from "../reload-button";

describe("Offline Page", () => {
  it("exports metadata with noindex robots", () => {
    expect(metadata.title).toContain("Offline");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders offline message and reload button", () => {
    render(<OfflinePage />);
    expect(screen.getByText("Anda sedang offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });

  it("triggers window.location.reload when reload button is clicked", () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadMock },
    });

    render(<ReloadButton />);
    const button = screen.getByRole("button", { name: "Coba lagi" });
    fireEvent.click(button);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
