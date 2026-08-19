import type { PokemonDetail } from "../types/pokemon";
import { PokemonCard } from "./PokemonCard";
import { CardSkeletonGrid } from "./LoadingSkeleton";
import { Loader2 } from "lucide-react";

export function PokemonGrid({
  pokemons,
  isFavorite,
  onToggleFavorite,
  onOpen,
  hasMore,
  onLoadMore,
  isLoadingMore,
  compareMode,
  compareSelection,
  onToggleCompare,
}: {
  pokemons: PokemonDetail[];
  isFavorite: (name: string) => boolean;
  onToggleFavorite: (name: string) => void;
  onOpen: (name: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  compareMode: boolean;
  compareSelection: string[];
  onToggleCompare: (name: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {pokemons.map((p) => (
          <PokemonCard
            key={p.name}
            pokemon={p}
            isFavorite={isFavorite(p.name)}
            onToggleFavorite={onToggleFavorite}
            onOpen={onOpen}
            compareMode={compareMode}
            isCompareSelected={compareSelection.includes(p.name)}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>

      {isLoadingMore && (
        <div className="mt-4">
          <CardSkeletonGrid count={5} />
        </div>
      )}

      {hasMore && !isLoadingMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Load more Pokémon
          </button>
        </div>
      )}

      {!hasMore && pokemons.length > 0 && (
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[var(--text-muted)]">
          <Loader2 className="hidden h-3 w-3" />
          That's every Pokémon that matches — end of the scan.
        </p>
      )}
    </div>
  );
}
