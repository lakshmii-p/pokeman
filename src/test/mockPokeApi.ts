import { vi } from "vitest";

/** Minimal, realistic detail payload for a given id/name. */
export function makePokemonDetailPayload(
  id: number,
  name: string,
  opts?: {
    types?: string[];
    attack?: number;
    speciesName?: string;
    officialArtwork?: string | null;
    frontDefault?: string | null;
    homeArtwork?: string | null;
  }
) {
  const types = opts?.types ?? ["normal"];
  const attack = opts?.attack ?? 50;
  const speciesName = opts?.speciesName ?? name;
  const officialArtwork =
    opts?.officialArtwork !== undefined ? opts.officialArtwork : `https://example.com/${name}-art.png`;
  const frontDefault =
    opts?.frontDefault !== undefined ? opts.frontDefault : `https://example.com/${name}.png`;
  const homeArtwork = opts?.homeArtwork !== undefined ? opts.homeArtwork : null;
  return {
    id,
    name,
    height: 10,
    weight: 100,
    types: types.map((t, i) => ({ slot: i + 1, type: { name: t } })),
    abilities: [{ ability: { name: "static" }, is_hidden: false }],
    stats: [
      { base_stat: 45, stat: { name: "hp" } },
      { base_stat: attack, stat: { name: "attack" } },
      { base_stat: 45, stat: { name: "speed" } },
    ],
    moves: [{ move: { name: "tackle" } }],
    sprites: {
      front_default: frontDefault,
      other: {
        "official-artwork": { front_default: officialArtwork },
        home: { front_default: homeArtwork },
      },
    },
    species: { name: speciesName, url: `https://pokeapi.co/api/v2/pokemon-species/${speciesName}/` },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/**
 * Installs a global.fetch mock that understands the handful of PokeAPI-shaped
 * URLs this app calls. `pokemon` maps name -> detail payload; requests for any
 * other pokemon 404. `pageNames` is the ordered list used to answer
 * /pokemon?limit=&offset= listing requests. `species` maps a species name to
 * its evolution-chain URL for /pokemon-species/{name}; `evolutionChains` maps
 * that same URL to the raw evolution-chain response body.
 */
export function installPokeApiMock(options: {
  pageNames: string[];
  pokemon: Record<string, ReturnType<typeof makePokemonDetailPayload>>;
  species?: Record<string, { evolutionChainUrl: string }>;
  evolutionChains?: Record<string, unknown>;
  onRequest?: (url: string) => void;
}) {
  const { pageNames, pokemon, species, evolutionChains, onRequest } = options;

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    onRequest?.(url);

    const listMatch = url.match(/\/pokemon\?limit=(\d+)&offset=(\d+)/);
    if (listMatch) {
      const limit = Number(listMatch[1]);
      const offset = Number(listMatch[2]);
      const slice = pageNames.slice(offset, offset + limit);
      return jsonResponse({
        count: pageNames.length,
        next: offset + limit < pageNames.length ? "next" : null,
        previous: offset > 0 ? "prev" : null,
        results: slice.map((name) => ({ name, url: `https://pokeapi.co/api/v2/pokemon/${name}/` })),
      });
    }

    const speciesMatch = url.match(/\/pokemon-species\/([^/?]+)/);
    if (speciesMatch) {
      const name = speciesMatch[1];
      const entry = species?.[name];
      if (!entry) return jsonResponse({}, 404);
      return jsonResponse({ evolution_chain: { url: entry.evolutionChainUrl } });
    }

    if (evolutionChains && Object.prototype.hasOwnProperty.call(evolutionChains, url)) {
      return jsonResponse(evolutionChains[url]);
    }

    const detailMatch = url.match(/\/pokemon\/([^/?]+)$/);
    if (detailMatch) {
      const name = detailMatch[1];
      const payload = pokemon[name];
      if (!payload) return jsonResponse({}, 404);
      return jsonResponse(payload);
    }

    return jsonResponse({}, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
