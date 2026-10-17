import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UpdateToast from "../update-toast";

describe("UpdateToast", () => {
  it("does not render when no update is available", () => {
    const { container } = render(<UpdateToast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast when sw-update-available event is dispatched", () => {
    render(<UpdateToast />);

    const mockPostMessage = vi.fn();
    const mockRegistration = {
      waiting: {
        postMessage: mockPostMessage,
      },
    };

    act(() => {
      window.dispatchEvent(
        new CustomEvent("sw-update-available", {
          detail: mockRegistration,
        })
      );
    });

    expect(screen.getByText("Versi baru tersedia")).toBeInTheDocument();
    const reloadButton = screen.getByRole("button", { name: "Muat ulang" });
    expect(reloadButton).toBeInTheDocument();

    fireEvent.click(reloadButton);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
