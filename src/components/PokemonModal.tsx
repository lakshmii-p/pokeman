import { useEffect, useState } from "react";
import { Ruler, Weight, Star, X, Loader2, Sparkles } from "lucide-react";
import { getPokemonDetail, PokemonApiError } from "../services/pokemonApi";
import type { PokemonDetail } from "../types/pokemon";
import { themeFor, TYPE_ICON } from "../utils/typeColors";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { StatBar } from "./StatBar";
import { MoveList } from "./MoveList";
import { EvolutionChainConnected } from "./EvolutionChain";
import { ErrorState } from "./ErrorState";

export function PokemonModal({
  name,
  onClose,
  isFavorite,
  onToggleFavorite,
}: {
  name: string;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (name: string) => void;
}) {
  const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [isShiny, setIsShiny] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(onClose);

  useEffect(() => {
    let cancelled = false;
    setPokemon(null);
    setError(null);
    setIsShiny(false);
    getPokemonDetail(name)
      .then((d) => !cancelled && setPokemon(d))
      .catch((e) =>
        !cancelled &&
        setError(e instanceof PokemonApiError ? e.message : `Couldn't load "${name}".`)
      );
    return () => {
      cancelled = true;
    };
  }, [name, retryTick]);

  const theme = pokemon ? themeFor(pokemon.types[0]) : themeFor("normal");

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pokemon ? `${pokemon.name} details` : "Pokémon details"}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="modal-panel relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--bg-elevated)] sm:rounded-3xl"
      >
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur transition hover:bg-black/35"
        >
          <X className="h-4 w-4" />
        </button>

        {error && (
          <div className="p-6">
            <ErrorState message={error} onRetry={() => setRetryTick((t) => t + 1)} />
          </div>
        )}

        {!error && !pokemon && (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        )}

        {pokemon && (
          <>
            <div
              className="flex flex-col items-center px-6 pb-6 pt-12"
              style={{ background: `linear-gradient(180deg, ${theme.bg}33, transparent)` }}
            >
              <div className="relative">
                <img
                  key={isShiny ? "shiny" : "normal"}
                  src={(isShiny && pokemon.shinyArtwork) || pokemon.artwork}
                  alt={isShiny ? `${pokemon.name} (shiny)` : pokemon.name}
                  className="h-40 w-40 animate-sprite-in object-contain drop-shadow-xl"
                />
                {pokemon.shinyArtwork && (
                  <button
                    onClick={() => setIsShiny((v) => !v)}
                    aria-pressed={isShiny}
                    aria-label={isShiny ? "Show regular sprite" : "Show shiny sprite"}
                    title={isShiny ? "Show regular sprite" : "Show shiny sprite"}
                    className="absolute -right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full border transition"
                    style={{
                      borderColor: isShiny ? theme.bg : "var(--border)",
                      backgroundColor: isShiny ? theme.bg : "var(--surface)",
                      color: isShiny ? "#12141c" : "var(--text-muted)",
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                )}
              </div>
              <span className="font-mono-dex text-xs font-semibold text-[var(--text-muted)]">
                #{String(pokemon.id).padStart(3, "0")}
                {isShiny && <span className="ml-1 text-[var(--accent)]">✦ shiny</span>}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold capitalize">
                  {pokemon.name.replace(/-/g, " ")}
                </h2>
                <button
                  onClick={() => onToggleFavorite(pokemon.name)}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={isFavorite}
                  className="text-[var(--text-muted)] transition hover:text-[var(--accent)]"
                >
                  <Star className="h-5 w-5" fill={isFavorite ? "var(--accent)" : "none"} stroke={isFavorite ? "var(--accent)" : "currentColor"} />
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                {pokemon.types.map((type) => {
                  const t = themeFor(type);
                  return (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize"
                      style={{ backgroundColor: t.bg, color: t.text }}
                    >
                      <span aria-hidden>{TYPE_ICON[type]}</span>
                      {type}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-y border-[var(--border)] px-6 py-4">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Height</p>
                  <p className="text-sm font-semibold">{(pokemon.height / 10).toFixed(1)} m</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Weight</p>
                  <p className="text-sm font-semibold">{(pokemon.weight / 10).toFixed(1)} kg</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <h3 className="mb-2 font-display text-sm font-semibold text-[var(--text-muted)]">
                Evolution
              </h3>
              <div className="mb-5">
                <EvolutionChainConnected speciesName={pokemon.speciesName} />
              </div>

              <h3 className="mb-2 font-display text-sm font-semibold text-[var(--text-muted)]">
                Abilities
              </h3>
              <div className="mb-5 flex flex-wrap gap-2">
                {pokemon.abilities.map((a) => (
                  <span
                    key={a.name}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs capitalize"
                  >
                    {a.name.replace(/-/g, " ")}
                    {a.isHidden && <span className="ml-1 text-[var(--text-muted)]">(hidden)</span>}
                  </span>
                ))}
              </div>

              <h3 className="mb-3 font-display text-sm font-semibold text-[var(--text-muted)]">
                Base statistics
              </h3>
              <div className="space-y-2.5">
                {pokemon.stats.map((s) => (
                  <StatBar key={s.name} name={s.name} value={s.base} color={theme.bg} />
                ))}
              </div>

              <h3 className="mb-2 mt-5 font-display text-sm font-semibold text-[var(--text-muted)]">
                Moves
              </h3>
              <MoveList moveNames={pokemon.moves} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
