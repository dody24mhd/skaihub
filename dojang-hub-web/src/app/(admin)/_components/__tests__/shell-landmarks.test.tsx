import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyShell from "../academy-shell";
import AdminShell from "../admin-shell";

let mockPathname = "/academy";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => mockPathname,
}));

const shells = [
  { name: "AcademyShell", Shell: AcademyShell, role: "pelatih" },
  { name: "AdminShell", Shell: AdminShell, role: "super_admin" },
] as const;

describe.each(shells)("$name landmarks", ({ Shell, role }) => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("skaihub_admin_role", role);
  });

  it("renders a skip link to the content main as the first focusable element", () => {
    const { container } = render(
      <Shell title="Dashboard">
        <p>Isi halaman</p>
      </Shell>
    );

    const skipLink = screen.getByRole("link", { name: "Lewati ke konten" });
    expect(skipLink).toHaveAttribute("href", "#konten");
    expect(container.querySelector("a, button")).toBe(skipLink);
  });

  it("wraps only the page content in a single main#konten", () => {
    render(
      <Shell title="Dashboard">
        <p>Isi halaman</p>
      </Shell>
    );

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "konten");
    expect(main).toHaveTextContent("Isi halaman");
    expect(main.querySelector("aside, header")).toBeNull();
  });

  it("uses the shell title as h1 when the page has no PageHeader", () => {
    render(
      <Shell title="Dashboard">
        <p>Isi halaman</p>
      </Shell>
    );

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings.length).toBeGreaterThan(0);
    headings.forEach((heading) => expect(heading).toHaveTextContent("Dashboard"));
  });

  it("demotes the shell title when the page renders its own PageHeader", () => {
    render(
      <Shell title="Kelas" hasPageHeader>
        <h1>Kelas / Unit</h1>
      </Shell>
    );

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Kelas / Unit");
  });
});

describe("active navigation links", () => {
  it("marks the active academy sidebar link with aria-current", () => {
    localStorage.setItem("skaihub_admin_role", "pelatih");
    render(
      <AcademyShell title="Dashboard">
        <p>Isi</p>
      </AcademyShell>
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Kelas" })).not.toHaveAttribute("aria-current");
  });

  it("marks the active admin drawer link with aria-current", () => {
    localStorage.setItem("skaihub_admin_role", "super_admin");
    mockPathname = "/internal/event";
    render(
      <AdminShell title="Event">
        <p>Isi</p>
      </AdminShell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu Admin" });

    expect(within(drawer).getByRole("link", { name: "Event" })).toHaveAttribute("aria-current", "page");
    expect(within(drawer).getByRole("link", { name: "Berita" })).not.toHaveAttribute("aria-current");
    mockPathname = "/academy";
  });
});

describe("AdminShell internal menu visibility", () => {
  it.each([
    ["super_admin", true],
    ["admin", false],
  ])("shows Akademi and Subscription only to super_admin (%s)", async (role, isVisible) => {
    localStorage.setItem("skaihub_admin_role", role);
    mockPathname = "/internal";
    render(
      <AdminShell title="Dashboard">
        <p>Isi</p>
      </AdminShell>
    );

    await screen.findByRole("link", { name: "Dashboard CMS" });
    for (const name of ["Akademi", "Subscription", "Staf Platform"]) {
      if (isVisible) {
        expect(await screen.findByRole("link", { name })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("link", { name })).toBeNull();
      }
    }
    mockPathname = "/academy";
  });
});
