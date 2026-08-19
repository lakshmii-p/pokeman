import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation, useSearchParams, Routes, Route } from "react-router-dom";
import { GitCompareArrows } from "lucide-react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { TypeFilter } from "./components/TypeFilter";
import { SortMenu } from "./components/SortMenu";
import { PokemonGrid } from "./components/PokemonGrid";
import { PokemonModal } from "./components/PokemonModal";
import { CompareDrawer } from "./components/CompareDrawer";
import { CardSkeletonGrid } from "./components/LoadingSkeleton";
import { ErrorState, NotFoundState } from "./components/ErrorState";
import { usePokemonBrowser, sortDetails } from "./hooks/usePokemonBrowser";
import { useFavorites } from "./hooks/useFavorites";
import { useTheme } from "./hooks/useTheme";
import { getPokemonDetails } from "./services/pokemonApi";
import type { PokemonDetail, SortKey } from "./types/pokemon";
import { ALL_TYPES } from "./types/pokemon";

const SORT_KEYS: SortKey[] = ["id", "name", "attack", "speed", "hp"];

function HomeAndDetail() {
  const { theme, toggleTheme } = useTheme();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ name?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read the starting filters from the URL once, so a shared/bookmarked/refreshed
  // link (?q=char&type=fire&sort=attack&fav=1) reproduces the same view.
  const initialFromUrl = useRef({
    search: searchParams.get("q") ?? "",
    typeFilter: ALL_TYPES.includes(searchParams.get("type") as never)
      ? (searchParams.get("type") as string)
      : "all",
    sortKey: (SORT_KEYS as string[]).includes(searchParams.get("sort") ?? "")
      ? (searchParams.get("sort") as SortKey)
      : "id",
  }).current;

  const browser = usePokemonBrowser(initialFromUrl);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(searchParams.get("fav") === "1");
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep the URL query string in sync with the current filters (replace, not
  // push, so typing in the search box doesn't spam browser history) — this is
  // what makes the current view shareable and survivable across a refresh.
  useEffect(() => {
    const next = new URLSearchParams();
    if (browser.search) next.set("q", browser.search);
    if (browser.typeFilter !== "all") next.set("type", browser.typeFilter);
    if (browser.sortKey !== "id") next.set("sort", browser.sortKey);
    if (showFavoritesOnly) next.set("fav", "1");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browser.search, browser.typeFilter, browser.sortKey, showFavoritesOnly]);

  // "/" focuses search, unless the user is already typing somewhere or a
  // dialog is open (where it would fight the focus trap).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const active = document.activeElement;
      const isTyping =
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
      const dialogOpen = document.querySelector('[role="dialog"]');
      if (isTyping || dialogOpen) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ---- Favorites: fetched independently of browse/search pagination, so a
  // favorited Pokémon shows up in the Favorites view even if it isn't part of
  // whatever page/search results happen to be loaded right now. ----
  const [favoriteDetails, setFavoriteDetails] = useState<Map<string, PokemonDetail>>(new Map());
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const favoritesRequestId = useRef(0);

  useEffect(() => {
    if (!showFavoritesOnly) return;
    const missing = Array.from(favorites).filter((n) => !favoriteDetails.has(n));
    if (missing.length === 0) return;
    const myRequest = ++favoritesRequestId.current;
    setIsFavoritesLoading(true);
    setFavoritesError(null);
    getPokemonDetails(missing)
      .then((fetched) => {
        if (myRequest !== favoritesRequestId.current) return;
        setFavoriteDetails((prev) => {
          const next = new Map(prev);
          for (const d of fetched) next.set(d.name, d);
          return next;
        });
        if (fetched.length < missing.length) {
          setFavoritesError("Some favorites couldn't be loaded.");
        }
      })
      .catch(() => {
        if (myRequest !== favoritesRequestId.current) return;
        setFavoritesError("Couldn't load your favorites. Please try again.");
      })
      .finally(() => {
        if (myRequest === favoritesRequestId.current) setIsFavoritesLoading(false);
      });
  }, [showFavoritesOnly, favorites, favoriteDetails]);

  // Every currently-favorited Pokémon we've managed to load, sorted with the
  // same sort key as the main grid — not limited to whatever page is loaded.
  const favoritesList = useMemo(() => {
    const items = Array.from(favorites)
      .map((n) => favoriteDetails.get(n))
      .filter((d): d is PokemonDetail => !!d);
    return sortDetails(items, browser.sortKey);
  }, [favorites, favoriteDetails, browser.sortKey]);

  const displayedPokemons = showFavoritesOnly ? favoritesList : browser.results;
  // Card lookups (compare mode) should work against whichever list is on screen.
  const pool = showFavoritesOnly ? favoritesList : browser.results;

  const openDetail = (name: string) => navigate(`/pokemon/${name}${location.search}`);
  const closeDetail = () => navigate(`/${location.search}`);

  const toggleCompare = (name: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 2) return [prev[1], name];
      const next = [...prev, name];
      if (next.length === 2) navigate(`/compare${location.search}`);
      return next;
    });
  };

  const compareA = pool.find((p) => p.name === compareSelection[0]) ?? null;
  const compareB = pool.find((p) => p.name === compareSelection[1]) ?? null;

  const showFavoritesSkeleton =
    showFavoritesOnly && isFavoritesLoading && favoritesList.length === 0 && favorites.size > 0;
  const showInitialSkeleton = showFavoritesOnly ? showFavoritesSkeleton : browser.isInitialLoading;
  const showNotFound =
    !showFavoritesOnly &&
    !browser.isInitialLoading &&
    browser.isSearching &&
    browser.totalMatches === 0 &&
    !browser.error;
  const showEmptyFavorites =
    showFavoritesOnly && !showFavoritesSkeleton && favorites.size === 0 && !favoritesError;
  const activeError = showFavoritesOnly ? favoritesError : browser.error;

  return (
    <div className="min-h-screen">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly((v) => !v)}
        favoritesCount={favorites.size}
      />

      <main className="mx-auto max-w-7xl animate-page-in px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar ref={searchInputRef} value={browser.search} onChange={browser.setSearch} />
          <div className="flex items-center gap-2">
            <SortMenu value={browser.sortKey} onChange={browser.setSortKey} />
            <button
              onClick={() => {
                setCompareMode((v) => !v);
                setCompareSelection([]);
              }}
              aria-pressed={compareMode}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                compareMode
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <TypeFilter value={browser.typeFilter} onChange={browser.setTypeFilter} />
        </div>

        {compareMode && (
          <p className="mb-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text-muted)]">
            Compare mode: tap up to two cards to compare their stats.
          </p>
        )}

        {!showFavoritesOnly && browser.sortFetchProgress && (
          <p className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text-muted)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            Loading the full list to sort accurately… {browser.sortFetchProgress.loaded}/
            {browser.sortFetchProgress.total}
          </p>
        )}

        {activeError && displayedPokemons.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-2.5 text-xs text-[var(--text)]">
            <span>{activeError}</span>
            <button
              onClick={showFavoritesOnly ? () => setFavoriteDetails(new Map()) : browser.retry}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--accent)]/40 px-2.5 py-1 font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {activeError && displayedPokemons.length === 0 && !showInitialSkeleton && (
          <ErrorState
            message={activeError}
            onRetry={showFavoritesOnly ? () => setFavoriteDetails(new Map()) : browser.retry}
          />
        )}

        {showInitialSkeleton && <CardSkeletonGrid count={10} />}

        {!showInitialSkeleton && !(activeError && displayedPokemons.length === 0) && showNotFound && (
          <NotFoundState query={browser.search} />
        )}

        {!showInitialSkeleton && !(activeError && displayedPokemons.length === 0) && showEmptyFavorites && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
            No favorites yet. Tap the star on any Pokémon card to save it here.
          </div>
        )}

        {!showInitialSkeleton &&
          !(activeError && displayedPokemons.length === 0) &&
          !showNotFound &&
          !showEmptyFavorites && (
            <PokemonGrid
              pokemons={displayedPokemons}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onOpen={openDetail}
              hasMore={!showFavoritesOnly && browser.hasMore}
              onLoadMore={browser.loadMore}
              isLoadingMore={!showFavoritesOnly && browser.isLoadingMore}
              compareMode={compareMode}
              compareSelection={compareSelection}
              onToggleCompare={toggleCompare}
            />
          )}
      </main>

      {params.name && (
        <PokemonModal
          name={params.name}
          onClose={closeDetail}
          isFavorite={isFavorite(params.name)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {location.pathname === "/compare" && (
        <CompareDrawer
          a={compareA}
          b={compareB}
          onClose={() => navigate(`/${location.search}`)}
          onClear={() => {
            setCompareSelection([]);
            navigate(`/${location.search}`);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeAndDetail />} />
      <Route path="/pokemon/:name" element={<HomeAndDetail />} />
      <Route path="/compare" element={<HomeAndDetail />} />
    </Routes>
  );
}
