const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

const MAX_STAT = 180;

export function StatBar({
  name,
  value,
  color,
  compareValue,
}: {
  name: string;
  value: number;
  color: string;
  compareValue?: number;
}) {
  const pct = Math.min(100, (value / MAX_STAT) * 100);
  const comparePct = compareValue !== undefined ? Math.min(100, (compareValue / MAX_STAT) * 100) : null;

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-mono-dex text-[var(--text-muted)]">
        {STAT_LABELS[name] ?? name}
      </span>
      <div className="stat-track relative h-3 flex-1 overflow-hidden rounded-sm bg-[var(--bg)]">
        <div
          className="h-full rounded-sm transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        {comparePct !== null && (
          <div
            className="absolute top-0 h-full w-[2px] bg-white/90 mix-blend-difference"
            style={{ left: `${comparePct}%` }}
            aria-hidden
          />
        )}
      </div>
      <span className="w-8 shrink-0 text-right font-mono-dex text-xs font-semibold">{value}</span>
    </div>
  );
}
