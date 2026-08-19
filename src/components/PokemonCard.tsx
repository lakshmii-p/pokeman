import { Star } from "lucide-react";
import type { PokemonDetail } from "../types/pokemon";
import { themeFor, TYPE_ICON } from "../utils/typeColors";

export function PokemonCard({
  pokemon,
  isFavorite,
  onToggleFavorite,
  onOpen,
  compareMode,
  isCompareSelected,
  onToggleCompare,
}: {
  pokemon: PokemonDetail;
  isFavorite: boolean;
  onToggleFavorite: (name: string) => void;
  onOpen: (name: string) => void;
  compareMode: boolean;
  isCompareSelected: boolean;
  onToggleCompare: (name: string) => void;
}) {
  const primaryTheme = themeFor(pokemon.types[0]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (compareMode ? onToggleCompare(pokemon.name) : onOpen(pokemon.name))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (compareMode) {
            onToggleCompare(pokemon.name);
          } else {
            onOpen(pokemon.name);
          }
        }
      }}
      className="dex-card group relative cursor-pointer rounded-2xl border bg-[var(--surface)] p-4 text-left"
      style={{
        borderColor: isCompareSelected ? primaryTheme.bg : "var(--border)",
        boxShadow: `0 0 0 ${isCompareSelected ? 2 : 0}px ${primaryTheme.bg}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 28px -12px ${primaryTheme.glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isCompareSelected
          ? `0 0 0 2px ${primaryTheme.bg}`
          : "none";
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono-dex text-xs font-semibold text-[var(--text-muted)]">
          #{String(pokemon.id).padStart(3, "0")}
        </span>
        {compareMode ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]"
            style={{
              borderColor: isCompareSelected ? primaryTheme.bg : "var(--border)",
              backgroundColor: isCompareSelected ? primaryTheme.bg : "transparent",
            }}
          >
            {isCompareSelected ? "✓" : ""}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(pokemon.name);
            }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
            className="text-[var(--text-muted)] transition hover:text-[var(--accent)]"
          >
            <Star className="h-4 w-4" fill={isFavorite ? "var(--accent)" : "none"} stroke={isFavorite ? "var(--accent)" : "currentColor"} />
          </button>
        )}
      </div>

      <div
        className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${primaryTheme.bg}22` }}
      >
        {pokemon.artwork ? (
          <img
            src={pokemon.artwork}
            alt={pokemon.name}
            loading="lazy"
            className="h-20 w-20 object-contain drop-shadow-md"
          />
        ) : (
          <span className="text-3xl">?</span>
        )}
      </div>

      <p className="mb-2 truncate text-center font-display text-sm font-semibold capitalize">
        {pokemon.name.replace(/-/g, " ")}
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {pokemon.types.map((type) => {
          const theme = themeFor(type);
          return (
            <span
              key={type}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{ backgroundColor: theme.bg, color: theme.text }}
            >
              <span aria-hidden>{TYPE_ICON[type]}</span>
              {type}
            </span>
          );
        })}
      </div>
    </div>
  );
}
