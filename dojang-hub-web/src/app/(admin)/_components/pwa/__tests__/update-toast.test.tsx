import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UpdateToast from "../update-toast";

describe("UpdateToast", () => {
  it("keeps an empty status live region mounted when no update is available", () => {
    render(<UpdateToast />);

    const region = screen.getByRole("status");
    expect(region).toBeEmptyDOMElement();
    expect(screen.queryByText("Versi baru tersedia")).toBeNull();
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

    expect(screen.getByRole("status")).toHaveTextContent("Versi baru tersedia");
    // Di HP toast berada di atas bottom nav (bukan bottom-4 yang menutupinya)
    expect(screen.getByRole("complementary")).toHaveClass("bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]");
    const reloadButton = screen.getByRole("button", { name: "Muat ulang" });
    expect(reloadButton).toBeInTheDocument();

    fireEvent.click(reloadButton);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });
});
