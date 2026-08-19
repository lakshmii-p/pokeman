import { X } from "lucide-react";
import type { PokemonDetail } from "../types/pokemon";
import { themeFor } from "../utils/typeColors";
import { useFocusTrap } from "../hooks/useFocusTrap";

const STAT_ORDER = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};
const MAX_STAT = 180;

function CompareStatRow({
  statName,
  valueA,
  valueB,
  colorA,
  colorB,
}: {
  statName: string;
  valueA: number;
  valueB: number;
  colorA: string;
  colorB: string;
}) {
  const pctA = Math.min(100, (valueA / MAX_STAT) * 100);
  const pctB = Math.min(100, (valueB / MAX_STAT) * 100);
  const aWins = valueA > valueB;
  const bWins = valueB > valueA;

  return (
    <div className="grid grid-cols-[36px_1fr_70px_1fr_36px] items-center gap-2">
      <span className={`text-right font-mono-dex text-xs font-semibold ${aWins ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
        {valueA}
      </span>
      <div className="h-2.5 overflow-hidden rounded-sm bg-[var(--bg)]" dir="rtl">
        <div
          className="h-full rounded-sm transition-all duration-700 ease-out"
          style={{ width: `${pctA}%`, backgroundColor: colorA }}
        />
      </div>
      <span className="text-center text-[11px] font-medium text-[var(--text-muted)]">
        {STAT_LABELS[statName] ?? statName}
      </span>
      <div className="h-2.5 overflow-hidden rounded-sm bg-[var(--bg)]">
        <div
          className="h-full rounded-sm transition-all duration-700 ease-out"
          style={{ width: `${pctB}%`, backgroundColor: colorB }}
        />
      </div>
      <span className={`font-mono-dex text-xs font-semibold ${bWins ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
        {valueB}
      </span>
    </div>
  );
}

export function CompareDrawer({
  a,
  b,
  onClose,
  onClear,
}: {
  a: PokemonDetail | null;
  b: PokemonDetail | null;
  onClose: () => void;
  onClear: () => void;
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(onClose);

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compare Pokémon"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-panel relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:rounded-3xl"
      >
        <button
          onClick={onClose}
          aria-label="Close comparison"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] transition hover:text-[var(--accent)]"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-4 font-display text-lg font-bold">Compare Pokémon</h2>

        {(!a || !b) && (
          <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">
            Select two Pokémon cards to compare their stats side by side.
          </p>
        )}

        {a && b && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-4">
              {[a, b].map((p) => {
                const theme = themeFor(p.types[0]);
                return (
                  <div key={p.name} className="flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <img src={p.artwork} alt={p.name} className="h-20 w-20 object-contain" />
                    <p className="mt-1 font-display text-sm font-semibold capitalize">{p.name}</p>
                    <span
                      className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                      style={{ backgroundColor: theme.bg, color: theme.text }}
                    >
                      {p.types.join(" / ")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {STAT_ORDER.map((statName) => {
                const va = a.stats.find((s) => s.name === statName)?.base ?? 0;
                const vb = b.stats.find((s) => s.name === statName)?.base ?? 0;
                return (
                  <CompareStatRow
                    key={statName}
                    statName={statName}
                    valueA={va}
                    valueB={vb}
                    colorA={themeFor(a.types[0]).bg}
                    colorB={themeFor(b.types[0]).bg}
                  />
                );
              })}
            </div>

            <button
              onClick={onClear}
              className="mt-5 w-full rounded-full border border-[var(--border)] py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Clear selection
            </button>
          </>
        )}
      </div>
    </div>
  );
}
