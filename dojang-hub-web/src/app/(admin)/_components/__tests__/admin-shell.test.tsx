import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminShell from "../admin-shell";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/internal",
}));

describe("AdminShell", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    localStorage.setItem("skaihub_admin_role", "admin");
    pushMock.mockClear();
    replaceMock.mockClear();
  });

  it("renders hamburger button with aria-label Buka menu and opens drawer", () => {
    render(
      <AdminShell title="Platform Dashboard">
        <div>Admin Content</div>
      </AdminShell>
    );

    const hamburgerBtn = screen.getByRole("button", { name: "Buka menu" });
    expect(hamburgerBtn).toBeInTheDocument();

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(hamburgerBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Menu Admin")).toBeInTheDocument();
  });

  it("handles logout and clears storage", () => {
    render(
      <AdminShell title="Platform Dashboard">
        <div>Admin Content</div>
      </AdminShell>
    );

    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    expect(logoutButtons.length).toBeGreaterThan(0);

    fireEvent.click(logoutButtons[0]);

    expect(localStorage.getItem("skaihub_admin_token")).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("links Ganti Password and hides Staf Platform from platform staff", async () => {
    render(
      <AdminShell title="Platform Dashboard">
        <div>Admin Content</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /Ganti Password/i })[0]).toHaveAttribute("href", "/internal/account");
    });
    expect(screen.queryByRole("link", { name: /Staf Platform/i })).toBeNull();
  });

  it("shows Staf Platform to super admin", async () => {
    localStorage.setItem("skaihub_admin_role", "super_admin");
    render(
      <AdminShell title="Platform Dashboard">
        <div>Admin Content</div>
      </AdminShell>
    );

    expect(await screen.findByRole("link", { name: /Staf Platform/i })).toHaveAttribute("href", "/internal/users");
  });
});
