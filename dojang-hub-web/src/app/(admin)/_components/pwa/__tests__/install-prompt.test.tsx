import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InstallPrompt from "../install-prompt";
import { INSTALL_PROMPT_DISMISS_KEY } from "@/lib/pwa/install-prompt-logic";

describe("InstallPrompt Component", () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not render by default when no prompt event has fired", () => {
    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("renders install button when beforeinstallprompt fires and calls prompt on click", async () => {
    render(<InstallPrompt />);

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt");
    Object.assign(mockEvent, {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: "accepted" }),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(screen.getByText("Pasang SKAIHUB Akademi")).toBeInTheDocument();
    const installButton = screen.getByRole("button", { name: "Pasang aplikasi" });
    expect(installButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(installButton);
    });

    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it("saves timestamp in localStorage and hides prompt when close button is clicked", () => {
    render(<InstallPrompt />);

    const mockEvent = new Event("beforeinstallprompt");
    Object.assign(mockEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: "dismissed" }),
      preventDefault: vi.fn(),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    const closeButton = screen.getByRole("button", { name: "Tutup saran instalasi" });
    fireEvent.click(closeButton);

    expect(screen.queryByText("Pasang SKAIHUB Akademi")).toBeNull();
    expect(localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY)).not.toBeNull();
  });
});
