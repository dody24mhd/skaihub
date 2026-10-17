import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChangePasswordForm from "../change-password-form";
import * as adminApi from "../../../_lib/admin-api";

vi.mock("../../../_lib/admin-api", () => ({
  changeOwnPassword: vi.fn(),
}));

function fill(current: string, next: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText(/Password Saat Ini/i), { target: { value: current } });
  fireEvent.change(screen.getByLabelText(/^Password Baru/i), { target: { value: next } });
  fireEvent.change(screen.getByLabelText(/Ulangi Password Baru/i), { target: { value: confirmation } });
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("skaihub_admin_token", "fake-token");
  });

  it("submits the payload and shows success, then clears the fields", async () => {
    vi.mocked(adminApi.changeOwnPassword).mockResolvedValue({ message: "Password berhasil diubah." });
    render(<ChangePasswordForm />);

    fill("passwordlama", "passwordbaru123", "passwordbaru123");
    fireEvent.click(screen.getByRole("button", { name: /Simpan Password/i }));

    await waitFor(() => {
      expect(adminApi.changeOwnPassword).toHaveBeenCalledWith("fake-token", {
        current_password: "passwordlama",
        password: "passwordbaru123",
        password_confirmation: "passwordbaru123",
      });
    });
    expect(await screen.findByText(/Password berhasil diubah/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password Saat Ini/i)).toHaveValue("");
  });

  it("blocks submit when confirmation does not match", async () => {
    render(<ChangePasswordForm />);

    fill("passwordlama", "passwordbaru123", "berbeda123");
    fireEvent.click(screen.getByRole("button", { name: /Simpan Password/i }));

    expect(await screen.findByText(/Konfirmasi password baru tidak cocok/i)).toBeInTheDocument();
    expect(adminApi.changeOwnPassword).not.toHaveBeenCalled();
  });

  it("blocks submit when the new password is shorter than 8 characters", async () => {
    render(<ChangePasswordForm />);

    fill("passwordlama", "pendek", "pendek");
    fireEvent.click(screen.getByRole("button", { name: /Simpan Password/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Password baru minimal 8 karakter.");
    expect(adminApi.changeOwnPassword).not.toHaveBeenCalled();
  });

  it("shows the API error message when the current password is wrong", async () => {
    vi.mocked(adminApi.changeOwnPassword).mockRejectedValue(new Error("Password saat ini salah."));
    render(<ChangePasswordForm />);

    fill("salah", "passwordbaru123", "passwordbaru123");
    fireEvent.click(screen.getByRole("button", { name: /Simpan Password/i }));

    expect(await screen.findByText("Password saat ini salah.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Password Saat Ini/i)).toHaveValue("salah");
  });

  it("shows a session error when no token is stored", async () => {
    localStorage.clear();
    render(<ChangePasswordForm />);

    fill("passwordlama", "passwordbaru123", "passwordbaru123");
    fireEvent.click(screen.getByRole("button", { name: /Simpan Password/i }));

    expect(await screen.findByText(/Sesi tidak ditemukan/i)).toBeInTheDocument();
    expect(adminApi.changeOwnPassword).not.toHaveBeenCalled();
  });
});
