import { forwardRef } from "react";
import { Search, X } from "lucide-react";

export const SearchBar = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (v: string) => void;
}>(function SearchBar({ value, onChange }, ref) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search Pokémon by name…"
        aria-label="Search Pokémon by name"
        className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-9 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
      />
      {value ? (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono-dex text-[10px] text-[var(--text-muted)] sm:block"
        >
          /
        </kbd>
      )}
    </div>
  );
});
