import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getMoveSummary, PokemonApiError } from "../services/pokemonApi";
import type { MoveSummary } from "../types/pokemon";
import { themeFor } from "../utils/typeColors";

export function MoveList({ moveNames }: { moveNames: string[] }) {
  const [summaries, setSummaries] = useState<MoveSummary[] | null>(null);
  const [failedCount, setFailedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSummaries(null);
    setError(null);
    setFailedCount(0);

    if (moveNames.length === 0) {
      setSummaries([]);
      return;
    }

    Promise.allSettled(moveNames.map((n) => getMoveSummary(n))).then((results) => {
      if (cancelled) return;
      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<MoveSummary> => r.status === "fulfilled"
      );
      const failures = results.length - fulfilled.length;
      setSummaries(fulfilled.map((r) => r.value));
      setFailedCount(failures);
      if (failures === results.length) {
        const firstRejected = results.find((r) => r.status === "rejected") as
          | PromiseRejectedResult
          | undefined;
        const reason = firstRejected?.reason;
        setError(
          reason instanceof PokemonApiError ? reason.message : "Couldn't load move details."
        );
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveNames.join("|"), retryTick]);

  if (moveNames.length === 0) {
    return <span className="text-xs text-[var(--text-muted)]">No move data available.</span>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
        <span>{error}</span>
        <button
          onClick={() => setRetryTick((t) => t + 1)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  if (!summaries) {
    return (
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {moveNames.map((m) => (
          <span key={m} className="skeleton h-7 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {summaries.map((move) => {
          const theme = move.type ? themeFor(move.type) : themeFor("normal");
          return (
            <div
              key={move.name}
              className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface)] px-2.5 py-1.5 text-[11px]"
            >
              <span className="capitalize text-[var(--text)]">{move.name.replace(/-/g, " ")}</span>
              <div className="flex items-center gap-1.5">
                {move.type && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize"
                    style={{ backgroundColor: theme.bg, color: theme.text }}
                  >
                    {move.type}
                  </span>
                )}
                <span className="font-mono-dex text-[10px] text-[var(--text-muted)]">
                  {move.power ? `${move.power} pwr` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {failedCount > 0 && (
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[var(--text-muted)]">
          <span>
            {failedCount} move{failedCount > 1 ? "s" : ""} couldn't be loaded.
          </span>
          <button
            onClick={() => setRetryTick((t) => t + 1)}
            className="inline-flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
