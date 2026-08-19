import { Moon, Star, Sun } from "lucide-react";

export function Header({
  theme,
  onToggleTheme,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  favoritesCount,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoritesCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]">
            <span className="h-3 w-3 rounded-full border-2 border-white/80 bg-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight tracking-tight sm:text-xl">
              Pokédex <span className="text-[var(--accent)]">Explorer</span>
            </h1>
            <p className="hidden text-xs text-[var(--text-muted)] sm:block">
              Live scan of the National Pokédex
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavoritesOnly}
            aria-pressed={showFavoritesOnly}
            data-testid="favorites-toggle"
            className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              showFavoritesOnly
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <Star className="h-3.5 w-3.5" fill={showFavoritesOnly ? "currentColor" : "none"} />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] text-white">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--text)]"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
