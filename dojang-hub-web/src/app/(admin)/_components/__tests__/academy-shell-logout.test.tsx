import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyShell from "../academy-shell";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/academy",
}));

describe("AcademyShell Logout", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    localStorage.setItem("skaihub_admin_role", "admin_akademi");
    pushMock.mockClear();
    replaceMock.mockClear();
  });

  it("sends LOGOUT message to service worker controller on logout", () => {
    const postMessageMock = vi.fn();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        controller: {
          postMessage: postMessageMock,
        },
      },
    });

    render(
      <AcademyShell title="Dashboard">
        <div>Konten</div>
      </AcademyShell>
    );

    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    expect(logoutButtons.length).toBeGreaterThan(0);

    fireEvent.click(logoutButtons[0]);

    expect(postMessageMock).toHaveBeenCalledWith({ type: "LOGOUT" });
    expect(localStorage.getItem("skaihub_admin_token")).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
