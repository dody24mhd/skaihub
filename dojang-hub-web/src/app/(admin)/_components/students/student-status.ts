import { Student } from "../../_lib/admin-api";

export const studentStatusLabels: Record<Student["status"], string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  alumni: "Alumni",
};

export const studentStatusStyles: Record<Student["status"], string> = {
  active: "bg-success/10 text-success-strong",
  inactive: "bg-yellow-100 text-yellow-700",
  alumni: "bg-surface-container text-muted",
};
