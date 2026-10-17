import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormField from "../form-field";

describe("FormField", () => {
  it("renders label and input connected via id", () => {
    render(<FormField id="email" label="Alamat Email" type="email" />);

    const label = screen.getByText("Alamat Email");
    const input = screen.getByLabelText("Alamat Email");

    expect(label).toHaveAttribute("for", "email");
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("type", "email");
  });

  it("renders hint and connects via aria-describedby", () => {
    render(
      <FormField
        id="phone"
        label="Nomor WhatsApp"
        hint="Gunakan format 08xxx"
      />
    );

    const input = screen.getByLabelText("Nomor WhatsApp");
    const hint = screen.getByText("Gunakan format 08xxx");

    expect(hint).toHaveAttribute("id", "phone-hint");
    expect(input).toHaveAttribute("aria-describedby", "phone-hint");
  });

  it("renders error with role alert and sets aria-invalid", () => {
    render(
      <FormField
        id="name"
        label="Nama Lengkap"
        error="Nama wajib diisi."
      />
    );

    const input = screen.getByLabelText("Nama Lengkap");
    const error = screen.getByRole("alert");

    expect(error).toHaveTextContent("Nama wajib diisi.");
    expect(error).toHaveAttribute("id", "name-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "name-error");
  });

  it("passes inputMode to input", () => {
    render(
      <FormField
        id="amount"
        label="Nominal SPP"
        inputMode="numeric"
      />
    );

    const input = screen.getByLabelText("Nominal SPP");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("forwards aria-invalid and aria-describedby to custom children", () => {
    render(
      <FormField id="class" label="Kelas" hint="Pilih kelas utama." error="Kelas wajib dipilih.">
        <select id="class" aria-describedby="extra-note">
          <option value="">Pilih</option>
        </select>
      </FormField>
    );

    const select = screen.getByLabelText("Kelas");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", "class-error extra-note");
  });

  it("links the hint to custom children when there is no error", () => {
    render(
      <FormField id="notes" label="Catatan" hint="Opsional.">
        <textarea id="notes" />
      </FormField>
    );

    const textarea = screen.getByLabelText("Catatan");
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).toHaveAttribute("aria-describedby", "notes-hint");
  });
});
