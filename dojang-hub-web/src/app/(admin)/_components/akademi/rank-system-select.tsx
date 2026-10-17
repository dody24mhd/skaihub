"use client";

import { rankSystemsForSport } from "../../_lib/rank-systems";

type RankSystemSelectProps = {
  id: string;
  sportType: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
};

export default function RankSystemSelect({ id, sportType, value, onChange }: RankSystemSelectProps) {
  const options = rankSystemsForSport(sportType);

  return (
    <div className="block">
      <label htmlFor={id} className="label-caps mb-2 block text-muted">
        Sistem tingkatan {options.length > 0 ? <span className="text-secondary">*</span> : null}
      </label>
      {options.length > 0 ? (
        <select
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required
          className="h-11 w-full rounded-md border border-border-strong px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <p id={id} className="flex min-h-11 items-center rounded-md border border-dashed border-border px-3 text-sm text-muted">
          Belum ada katalog sabuk bawaan; akademi menambah sabuk sendiri.
        </p>
      )}
    </div>
  );
}
