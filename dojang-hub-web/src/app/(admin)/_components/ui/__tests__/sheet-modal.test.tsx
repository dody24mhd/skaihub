import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SheetModal from "../sheet-modal";

describe("SheetModal", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("does not render when isOpen is false", () => {
    render(
      <SheetModal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders with correct accessibility attributes when open", () => {
    render(
      <SheetModal
        isOpen={true}
        onClose={vi.fn()}
        title="Test Modal"
        description="Modal description"
      >
        <div>Content inside modal</div>
      </SheetModal>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "sheet-modal-title");
    expect(dialog).toHaveAttribute("aria-describedby", "sheet-modal-desc");
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal description")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <SheetModal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    const closeBtn = screen.getByRole("button", { name: /tutup/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <SheetModal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    render(
      <SheetModal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    const backdrop = screen.getByTestId("sheet-modal-backdrop");
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll when opened and restores on unmount", () => {
    const { unmount } = render(
      <SheetModal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores focus to trigger element when closed", () => {
    const button = document.createElement("button");
    button.textContent = "Open";
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    const { rerender } = render(
      <SheetModal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    rerender(
      <SheetModal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <div>Content</div>
      </SheetModal>
    );

    expect(document.activeElement).toBe(button);
    document.body.removeChild(button);
  });
});
