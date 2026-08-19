import { ArrowDownUp } from "lucide-react";
import type { SortKey } from "../types/pokemon";

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "id", label: "Dex No." },
  { key: "name", label: "Name" },
  { key: "attack", label: "Attack" },
  { key: "speed", label: "Speed" },
  { key: "hp", label: "HP" },
];

export function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div className="relative flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <ArrowDownUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Sort Pokémon"
        className="cursor-pointer appearance-none bg-transparent pr-5 text-xs font-semibold text-[var(--text)] outline-none"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key} className="bg-[var(--surface)] text-[var(--text)]">
            Sort: {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
