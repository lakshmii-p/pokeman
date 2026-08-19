import { describe, expect, it, vi } from "vitest";
import {
  getPokemonPage,
  getPokemonDetail,
  getPokemonDetails,
  PokemonApiError,
  PokemonNotFoundError,
} from "./pokemonApi";
import { installPokeApiMock, makePokemonDetailPayload } from "../test/mockPokeApi";

describe("getPokemonPage — real offset/limit pagination", () => {
  it("requests a bounded page (limit=20&offset=0), never the whole Pokédex", async () => {
    const requested: string[] = [];
    installPokeApiMock({
      pageNames: ["bulbasaur", "ivysaur", "venusaur", "charmander"],
      pokemon: {},
      onRequest: (url) => requested.push(url),
    });

    const page = await getPokemonPage(0, 2);

    expect(requested[0]).toContain("limit=2");
    expect(requested[0]).toContain("offset=0");
    expect(requested[0]).not.toMatch(/limit=2000|limit=1000|limit=100000/);
    expect(page.results.map((r) => r.name)).toEqual(["bulbasaur", "ivysaur"]);
    expect(page.count).toBe(4);
  });

  it("advances the offset for the next page instead of refetching everything", async () => {
    const requested: string[] = [];
    installPokeApiMock({
      pageNames: ["bulbasaur", "ivysaur", "venusaur", "charmander"],
      pokemon: {},
      onRequest: (url) => requested.push(url),
    });

    await getPokemonPage(0, 2);
    const page2 = await getPokemonPage(2, 2);

    expect(requested[1]).toContain("limit=2");
    expect(requested[1]).toContain("offset=2");
    expect(page2.results.map((r) => r.name)).toEqual(["venusaur", "charmander"]);
  });
});

describe("error states — individual Pokémon detail requests", () => {
  it("throws PokemonNotFoundError on a 404 rather than failing silently", async () => {
    installPokeApiMock({ pageNames: [], pokemon: {} });
    await expect(getPokemonDetail("no-such-mon-404")).rejects.toBeInstanceOf(PokemonNotFoundError);
  });

  it("throws PokemonApiError on a non-404 server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response)
    );
    await expect(getPokemonDetail("server-down-mon")).rejects.toBeInstanceOf(PokemonApiError);
  });

  it("throws a network-flavored PokemonApiError when fetch itself rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );
    await expect(getPokemonDetail("offline-mon")).rejects.toThrow(/network/i);
  });

  it("normalizes a successful detail payload", async () => {
    installPokeApiMock({
      pageNames: [],
      pokemon: {
        "electric-test-mon": makePokemonDetailPayload(9001, "electric-test-mon", {
          types: ["electric"],
          attack: 55,
        }),
      },
    });
    const detail = await getPokemonDetail("electric-test-mon");
    expect(detail.id).toBe(9001);
    expect(detail.types).toEqual(["electric"]);
    expect(detail.stats.find((s) => s.name === "attack")?.base).toBe(55);
  });

  it("falls back to the HOME render when a form has no official artwork or default sprite", async () => {
    // Mirrors real gaps in PokeAPI's data for newer battle forms (e.g. Miraidon
    // Aquatic Mode, Koraidon Gliding Build) — official-artwork and
    // front_default are both null, but a HOME sprite exists.
    installPokeApiMock({
      pageNames: [],
      pokemon: {
        "miraidon-aquatic-mode": makePokemonDetailPayload(10270, "miraidon-aquatic-mode", {
          officialArtwork: null,
          frontDefault: null,
          homeArtwork: "https://example.com/miraidon-aquatic-mode-home.png",
        }),
      },
    });
    const detail = await getPokemonDetail("miraidon-aquatic-mode");
    expect(detail.artwork).toBe("https://example.com/miraidon-aquatic-mode-home.png");
  });

  it("shows no artwork (not an error) when every sprite tier is genuinely missing", async () => {
    installPokeApiMock({
      pageNames: [],
      pokemon: {
        "totally-unillustrated-form": makePokemonDetailPayload(99999, "totally-unillustrated-form", {
          officialArtwork: null,
          frontDefault: null,
          homeArtwork: null,
        }),
      },
    });
    const detail = await getPokemonDetail("totally-unillustrated-form");
    expect(detail.artwork).toBe("");
  });

  it("getPokemonDetails skips failed entries instead of throwing for the whole batch", async () => {
    installPokeApiMock({
      pageNames: [],
      pokemon: {
        "batch-ok-mon": makePokemonDetailPayload(1, "batch-ok-mon"),
      },
    });
    const results = await getPokemonDetails(["batch-ok-mon", "batch-missing-mon"]);
    expect(results.map((r) => r.name)).toEqual(["batch-ok-mon"]);
  });
});
