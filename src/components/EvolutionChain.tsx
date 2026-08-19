import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import { getEvolutionChain, getPokemonDetails, PokemonApiError } from "../services/pokemonApi";
import type { EvolutionChain as EvolutionChainType, PokemonDetail, EvolutionDetail } from "../types/pokemon";
import { themeFor } from "../utils/typeColors";

function describeTrigger(details: EvolutionDetail[]): string {
  if (details.length === 0) return "";
  const labels = details.map((d) => {
    if (d.minLevel) return `Lv. ${d.minLevel}`;
    if (d.item) return d.item.replace(/-/g, " ");
    if (d.trigger === "trade") return "Trade";
    if (d.trigger === "level-up") return "Level up";
    if (d.trigger) return d.trigger.replace(/-/g, " ");
    return "";
  });
  return labels.filter(Boolean).join(" / ");
}

function EvolutionChain({
  speciesName,
  onNavigate,
}: {
  speciesName: string;
  onNavigate: (name: string) => void;
}) {
  const [chain, setChain] = useState<EvolutionChainType | null>(null);
  const [artByName, setArtByName] = useState<Map<string, PokemonDetail>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setChain(null);
    setError(null);
    getEvolutionChain(speciesName)
      .then(async (levels) => {
        if (cancelled) return;
        setChain(levels);
        const names = levels.flat().map((s) => s.name);
        const details = await getPokemonDetails(names);
        if (cancelled) return;
        setArtByName(new Map(details.map((d) => [d.name, d])));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof PokemonApiError ? err.message : "Couldn't load the evolution chain."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [speciesName, retryTick]);

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
  if (chain === null) {
    return (
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 w-16 rounded-xl" />
        ))}
      </div>
    );
  }
  if (chain.length <= 1) {
    return <p className="text-xs text-[var(--text-muted)]">This Pokémon does not evolve.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chain.map((level, levelIndex) => (
        <div key={levelIndex} className="flex items-center gap-2">
          {levelIndex > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />}
          <div className="flex flex-col gap-2">
            {level.map((stage) => {
              const detail = artByName.get(stage.name);
              const theme = detail ? themeFor(detail.types[0]) : themeFor("normal");
              const isCurrent = stage.name === speciesName;
              const trigger = describeTrigger(stage.details);
              return (
                <button
                  key={stage.name}
                  onClick={() => onNavigate(stage.name)}
                  disabled={isCurrent}
                  className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition ${
                    isCurrent
                      ? "cursor-default border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
                  }`}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${theme.bg}22` }}
                  >
                    {detail?.artwork ? (
                      <img src={detail.artwork} alt={stage.name} className="h-9 w-9 object-contain" />
                    ) : (
                      <div className="skeleton h-9 w-9 rounded" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold capitalize leading-tight">
                      {stage.name.replace(/-/g, " ")}
                    </p>
                    {trigger && (
                      <p className="text-[10px] leading-tight text-[var(--text-muted)]">{trigger}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Convenience wrapper that wires navigation via react-router directly. */
export function EvolutionChainConnected({ speciesName }: { speciesName: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <EvolutionChain
      speciesName={speciesName}
      onNavigate={(name) => navigate(`/pokemon/${name}${location.search}`)}
    />
  );
}
