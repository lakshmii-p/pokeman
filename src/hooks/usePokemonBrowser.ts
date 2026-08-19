import { useEffect, useMemo, useRef, useState } from "react";
import {
  PokemonApiError,
  getAllNames,
  getPokemonDetails,
  getPokemonPage,
  getTypeMembers,
} from "../services/pokemonApi";
import type { PokemonDetail, SortKey } from "../types/pokemon";
import { useDebounce } from "./useDebounce";

const PAGE_SIZE = 20;
// How many detail requests to have in flight at once when fetching an entire
// filtered/sorted candidate set. Keeps a global sort responsive without
// hammering the API with hundreds of simultaneous requests.
const SORT_FETCH_BATCH_SIZE = 40;

function statValue(d: PokemonDetail, statName: string): number {
  return d.stats.find((s) => s.name === statName)?.base ?? 0;
}

export function sortDetails(items: PokemonDetail[], sortKey: SortKey): PokemonDetail[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case "name":
        return a.name.localeCompare(b.name);
      case "attack":
        return statValue(b, "attack") - statValue(a, "attack");
      case "speed":
        return statValue(b, "speed") - statValue(a, "speed");
      case "hp":
        return statValue(b, "hp") - statValue(a, "hp");
      case "id":
      default:
        return a.id - b.id;
    }
  });
  return sorted;
}

export function usePokemonBrowser(initial?: {
  search?: string;
  typeFilter?: string;
  sortKey?: SortKey;
}) {
  const [search, setSearch] = useState(initial?.search ?? "");
  const [typeFilter, setTypeFilter] = useState<string>(initial?.typeFilter ?? "all");
  const [sortKey, setSortKey] = useState<SortKey>(initial?.sortKey ?? "id");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [retryTick, setRetryTick] = useState(0);

  const debouncedSearch = useDebounce(search, 300);
  const searchTerm = debouncedSearch.trim().toLowerCase();
  const isSearching = searchTerm.length > 0;
  const isGlobalSort = sortKey !== "id";
  // Any mode other than the plain "browse everything, in Dex order" default
  // needs a client-side candidate list instead of raw API pagination.
  const isFilteredOrSorted = isSearching || typeFilter !== "all" || isGlobalSort;
  // The full name index is only needed for text search (PokéAPI has no search
  // endpoint) or for sorting the *entire, unfiltered* Pokédex by a stat. A
  // type filter alone never needs it — /type/{type} already returns its full
  // membership list.
  const needsNameIndex = isSearching || (isGlobalSort && typeFilter === "all");

  // ---- Real, incremental pagination for the default (unfiltered, Dex-order) browse view ----
  const [browsePages, setBrowsePages] = useState<string[]>([]);
  const [browseOffset, setBrowseOffset] = useState(0);
  const [browseTotalCount, setBrowseTotalCount] = useState<number | null>(null);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [isBrowseLoading, setIsBrowseLoading] = useState(false);

  const fetchBrowsePage = (offset: number) => {
    setIsBrowseLoading(true);
    setBrowseError(null);
    getPokemonPage(offset, PAGE_SIZE)
      .then(({ results, count }) => {
        setBrowsePages((prev) => {
          const names = results.map((r) => r.name);
          const existing = new Set(prev);
          return [...prev, ...names.filter((n) => !existing.has(n))];
        });
        setBrowseTotalCount(count);
        setBrowseOffset(offset + PAGE_SIZE);
      })
      .catch((err) => {
        setBrowseError(
          err instanceof PokemonApiError ? err.message : "Couldn't load the Pokémon list."
        );
      })
      .finally(() => setIsBrowseLoading(false));
  };

  // Kick off (or restart) real pagination whenever we return to the plain browse mode.
  useEffect(() => {
    if (isFilteredOrSorted) return;
    setBrowsePages([]);
    setBrowseOffset(0);
    setBrowseTotalCount(null);
    fetchBrowsePage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilteredOrSorted, retryTick]);

  // ---- Lazily-loaded full name index (search / unfiltered global sort only) ----
  const [nameIndex, setNameIndex] = useState<string[] | null>(null);
  const [nameIndexError, setNameIndexError] = useState<string | null>(null);
  const [isNameIndexLoading, setIsNameIndexLoading] = useState(false);

  useEffect(() => {
    if (!needsNameIndex || nameIndex) return;
    let cancelled = false;
    setIsNameIndexLoading(true);
    setNameIndexError(null);
    getAllNames()
      .then((list) => {
        if (cancelled) return;
        setNameIndex(list.map((p) => p.name));
      })
      .catch((err) => {
        if (cancelled) return;
        setNameIndexError(
          err instanceof PokemonApiError ? err.message : "Couldn't load the Pokédex name index."
        );
      })
      .finally(() => {
        if (!cancelled) setIsNameIndexLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsNameIndex, retryTick]);

  // ---- Type membership (bounded candidate list for a type filter) ----
  const [typeMembers, setTypeMembers] = useState<Set<string> | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [isTypeLoading, setIsTypeLoading] = useState(false);

  useEffect(() => {
    if (typeFilter === "all") {
      setTypeMembers(null);
      setTypeError(null);
      return;
    }
    let cancelled = false;
    setIsTypeLoading(true);
    setTypeError(null);
    getTypeMembers(typeFilter)
      .then((set) => {
        if (!cancelled) setTypeMembers(set);
      })
      .catch((err) => {
        if (cancelled) return;
        setTypeError(
          err instanceof PokemonApiError ? err.message : `Couldn't load the "${typeFilter}" type list.`
        );
        setTypeMembers(null);
      })
      .finally(() => {
        if (!cancelled) setIsTypeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typeFilter, retryTick]);

  // Reset pagination whenever the filters/sort change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, typeFilter, sortKey]);

  // The full candidate name list for filtered/searched/sorted modes (not yet paginated).
  const candidateNames = useMemo(() => {
    if (!isFilteredOrSorted) return null; // plain browse mode uses browsePages instead
    let base: string[] | null = null;

    if (isSearching) {
      base = nameIndex ? nameIndex.filter((n) => n.includes(searchTerm)) : null;
      if (base && typeFilter !== "all") {
        base = typeMembers ? base.filter((n) => typeMembers.has(n)) : null;
      }
    } else if (typeFilter !== "all") {
      base = typeMembers ? Array.from(typeMembers) : null;
    } else {
      // Global sort with no other filters — needs the full universe.
      base = nameIndex;
    }
    return base;
  }, [isFilteredOrSorted, isSearching, searchTerm, typeFilter, typeMembers, nameIndex]);

  const [details, setDetails] = useState<Map<string, PokemonDetail>>(new Map());
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestId = useRef(0);

  // Plain browse mode: fetch details only for the page(s) we've actually loaded.
  useEffect(() => {
    if (isFilteredOrSorted) return;
    const missing = browsePages.filter((n) => !details.has(n));
    if (missing.length === 0) return;
    const myRequest = ++detailRequestId.current;
    getPokemonDetails(missing)
      .then((fetched) => {
        if (myRequest !== detailRequestId.current) return;
        setDetails((prev) => {
          const next = new Map(prev);
          for (const d of fetched) next.set(d.name, d);
          return next;
        });
        if (fetched.length < missing.length) {
          setDetailError("Some Pokémon on this page couldn't be loaded. Try again.");
        } else {
          setDetailError(null);
        }
      })
      .catch(() => {
        if (myRequest !== detailRequestId.current) return;
        setDetailError("Couldn't load Pokémon details. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilteredOrSorted, browsePages.join("|")]);

  // ---- Global sort: once we have a candidate list AND a stat-based sort is
  // active, fetch details for the ENTIRE candidate set (not just the visible
  // slice) so the ordering is correct across all matches, not just page 1. ----
  const [sortFetchProgress, setSortFetchProgress] = useState<{ loaded: number; total: number } | null>(
    null
  );
  const [sortFetchError, setSortFetchError] = useState<string | null>(null);
  const sortFetchRequestId = useRef(0);

  useEffect(() => {
    if (!isFilteredOrSorted || !isGlobalSort || !candidateNames) return;
    const missing = candidateNames.filter((n) => !details.has(n));
    if (missing.length === 0) {
      setSortFetchProgress(null);
      return;
    }

    const myRequest = ++sortFetchRequestId.current;
    let cancelled = false;
    setSortFetchError(null);

    (async () => {
      let loaded = 0;
      setSortFetchProgress({ loaded, total: missing.length });
      for (let i = 0; i < missing.length; i += SORT_FETCH_BATCH_SIZE) {
        if (cancelled || myRequest !== sortFetchRequestId.current) return;
        const batch = missing.slice(i, i + SORT_FETCH_BATCH_SIZE);
        try {
          const fetched = await getPokemonDetails(batch);
          if (cancelled || myRequest !== sortFetchRequestId.current) return;
          setDetails((prev) => {
            const next = new Map(prev);
            for (const d of fetched) next.set(d.name, d);
            return next;
          });
          loaded += batch.length;
          setSortFetchProgress({ loaded, total: missing.length });
        } catch {
          if (cancelled || myRequest !== sortFetchRequestId.current) return;
          setSortFetchError("Couldn't load the full list needed to sort accurately.");
          setSortFetchProgress(null);
          return;
        }
      }
      if (!cancelled && myRequest === sortFetchRequestId.current) setSortFetchProgress(null);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilteredOrSorted, isGlobalSort, candidateNames?.join("|"), retryTick]);

  // Filtered/searched mode with plain id sort: only fetch the visible slice, as before.
  const visibleFilteredNames = useMemo(() => {
    if (!isFilteredOrSorted || isGlobalSort || !candidateNames) return [];
    return candidateNames.slice(0, visibleCount);
  }, [isFilteredOrSorted, isGlobalSort, candidateNames, visibleCount]);

  useEffect(() => {
    if (!isFilteredOrSorted || isGlobalSort) return;
    const missing = visibleFilteredNames.filter((n) => !details.has(n));
    if (missing.length === 0) return;
    const myRequest = ++detailRequestId.current;
    getPokemonDetails(missing)
      .then((fetched) => {
        if (myRequest !== detailRequestId.current) return;
        setDetails((prev) => {
          const next = new Map(prev);
          for (const d of fetched) next.set(d.name, d);
          return next;
        });
        setDetailError(fetched.length < missing.length ? "Some Pokémon couldn't be loaded." : null);
      })
      .catch(() => {
        if (myRequest !== detailRequestId.current) return;
        setDetailError("Couldn't load Pokémon details. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilteredOrSorted, isGlobalSort, visibleFilteredNames.join("|")]);

  // ---- Assemble the final, correctly-ordered, paginated result set ----
  const results = useMemo(() => {
    if (!isFilteredOrSorted) {
      // Plain browse: natural Dex-ascending order straight from the API pages.
      const items = browsePages.map((n) => details.get(n)).filter((d): d is PokemonDetail => !!d);
      return items;
    }
    if (!candidateNames) return [];

    if (isGlobalSort) {
      // Sort the ENTIRE candidate set first, then reveal it page by page.
      const allLoaded = candidateNames
        .map((n) => details.get(n))
        .filter((d): d is PokemonDetail => !!d);
      const sorted = sortDetails(allLoaded, sortKey);
      return sorted.slice(0, visibleCount);
    }

    // Filtered/searched, plain id order: sort just the visible slice (cheap, correct
    // since id order is stable regardless of how much of the set is loaded).
    const items = visibleFilteredNames.map((n) => details.get(n)).filter((d): d is PokemonDetail => !!d);
    return sortDetails(items, sortKey);
  }, [isFilteredOrSorted, isGlobalSort, browsePages, candidateNames, visibleFilteredNames, details, sortKey, visibleCount]);

  const totalMatches = isFilteredOrSorted ? candidateNames?.length ?? 0 : browseTotalCount ?? 0;

  const hasMore = isFilteredOrSorted
    ? candidateNames
      ? visibleCount < candidateNames.length
      : false
    : browseTotalCount !== null
      ? browseOffset < browseTotalCount
      : true;

  const loadMore = () => {
    if (isFilteredOrSorted) {
      setVisibleCount((v) => v + PAGE_SIZE);
    } else {
      fetchBrowsePage(browseOffset);
    }
  };

  const retry = () => setRetryTick((t) => t + 1);

  const isWaitingOnNameIndex = needsNameIndex && !nameIndex && isNameIndexLoading;
  const isWaitingOnTypeMembers = typeFilter !== "all" && !typeMembers && isTypeLoading;

  const isInitialLoading =
    (!isFilteredOrSorted && browsePages.length === 0 && isBrowseLoading) ||
    (isFilteredOrSorted && (isWaitingOnNameIndex || isWaitingOnTypeMembers) && results.length === 0);

  const isLoadingMore =
    (!isFilteredOrSorted && isBrowseLoading && browsePages.length > 0) ||
    (isFilteredOrSorted && !isGlobalSort && results.length < visibleFilteredNames.length) ||
    sortFetchProgress !== null;

  const error = browseError || nameIndexError || typeError || sortFetchError || detailError;

  return {
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    sortKey,
    setSortKey,
    results,
    hasMore,
    loadMore,
    retry,
    isInitialLoading,
    isLoadingMore,
    sortFetchProgress,
    error,
    totalMatches,
    isSearching,
  };
}
