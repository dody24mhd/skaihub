import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Icon from "../icon";

describe("Icon", () => {
  it("renders the ligature hidden from assistive technology", () => {
    const { container } = render(<Icon name="delete" />);
    const icon = container.querySelector("span");

    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("material-symbols-outlined");
    expect(icon).toHaveTextContent("delete");
  });

  it("appends optional className", () => {
    const { container } = render(<Icon name="add" className="text-[20px] text-secondary" />);

    expect(container.querySelector("span")).toHaveClass("material-symbols-outlined", "text-[20px]", "text-secondary");
  });

  it("does not leak the ligature into a button's accessible name", () => {
    render(
      <button type="button" aria-label="Hapus siswa">
        <Icon name="delete" />
      </button>
    );

    expect(screen.getByRole("button", { name: "Hapus siswa" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/ })).not.toBeInTheDocument();
  });
});
