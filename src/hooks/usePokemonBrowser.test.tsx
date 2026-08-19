import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { usePokemonBrowser, sortDetails } from "./usePokemonBrowser";
import { installPokeApiMock, makePokemonDetailPayload } from "../test/mockPokeApi";
import type { PokemonDetail } from "../types/pokemon";

function buildRoster(count: number) {
  const pageNames = Array.from({ length: count }, (_, i) => `mon-${i + 1}`);
  const pokemon: Record<string, ReturnType<typeof makePokemonDetailPayload>> = {};
  pageNames.forEach((name, i) => {
    pokemon[name] = makePokemonDetailPayload(i + 1, name);
  });
  return { pageNames, pokemon };
}

describe("usePokemonBrowser — default browse view uses real pagination", () => {
  it("loads the first page with a bounded limit/offset request, not the whole Pokédex", async () => {
    const { pageNames, pokemon } = buildRoster(25);
    const requested: string[] = [];
    installPokeApiMock({ pageNames, pokemon, onRequest: (url) => requested.push(url) });

    const { result } = renderHook(() => usePokemonBrowser());

    await waitFor(() => expect(result.current.results.length).toBe(20));

    const listRequests = requested.filter((u) => u.includes("/pokemon?"));
    expect(listRequests[0]).toContain("limit=20");
    expect(listRequests[0]).toContain("offset=0");
    expect(listRequests.some((u) => u.includes("limit=2000"))).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it("load more fetches the next real page (offset=20), not a re-fetch of everything", async () => {
    const { pageNames, pokemon } = buildRoster(25);
    const requested: string[] = [];
    installPokeApiMock({ pageNames, pokemon, onRequest: (url) => requested.push(url) });

    const { result } = renderHook(() => usePokemonBrowser());
    await waitFor(() => expect(result.current.results.length).toBe(20));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.results.length).toBe(25));

    const listRequests = requested.filter((u) => u.includes("/pokemon?"));
    expect(listRequests[1]).toContain("offset=20");
    expect(result.current.hasMore).toBe(false);
  });
});

describe("usePokemonBrowser — error states surface instead of hanging or vanishing", () => {
  it("exposes an error and stops loading when the listing request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response)
    );

    const { result } = renderHook(() => usePokemonBrowser());

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.results).toEqual([]);
  });

  it("retry() recovers once the underlying request succeeds", async () => {
    const { pageNames, pokemon } = buildRoster(5);
    let shouldFail = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (shouldFail) return { ok: false, status: 500, json: async () => ({}) } as Response;
      const url = String(input);
      if (url.includes("/pokemon?")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ count: pageNames.length, results: pageNames.map((n) => ({ name: n })) }),
        } as Response;
      }
      const name = url.split("/").filter(Boolean).pop()!;
      return { ok: true, status: 200, json: async () => pokemon[name] } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => usePokemonBrowser());
    await waitFor(() => expect(result.current.error).toBeTruthy());

    shouldFail = false;
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.error).toBeFalsy());
    await waitFor(() => expect(result.current.results.length).toBe(5));
  });
});

describe("sortDetails — pure sorting used by both the grid and Favorites", () => {
  const mon = (name: string, id: number, attack: number): PokemonDetail => ({
    id,
    name,
    height: 1,
    weight: 1,
    types: ["normal"],
    abilities: [],
    stats: [{ name: "attack", base: attack }],
    moves: [],
    sprite: "",
    artwork: "",
    shinyArtwork: null,
    speciesName: name,
  });

  it("sorts by attack descending", () => {
    const items = [mon("a", 1, 10), mon("b", 2, 90), mon("c", 3, 50)];
    expect(sortDetails(items, "attack").map((d) => d.name)).toEqual(["b", "c", "a"]);
  });

  it("sorts by name alphabetically", () => {
    const items = [mon("charmander", 4, 1), mon("bulbasaur", 1, 1), mon("squirtle", 7, 1)];
    expect(sortDetails(items, "name").map((d) => d.name)).toEqual([
      "bulbasaur",
      "charmander",
      "squirtle",
    ]);
  });

  it("defaults to id ascending", () => {
    const items = [mon("c", 3, 1), mon("a", 1, 1), mon("b", 2, 1)];
    expect(sortDetails(items, "id").map((d) => d.id)).toEqual([1, 2, 3]);
  });
});
