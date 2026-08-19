import type {
  NamedResource,
  PokemonDetail,
  MoveSummary,
  RawPokemonResponse,
  RawTypeResponse,
  RawMoveResponse,
  RawSpeciesResponse,
  RawEvolutionChainResponse,
  RawEvolutionChainLink,
  EvolutionChain,
  EvolutionStage,
} from "../types/pokemon";

const BASE_URL = import.meta.env.VITE_POKEAPI_BASE_URL ?? "https://pokeapi.co/api/v2";

export class PokemonNotFoundError extends Error {
  constructor(query: string) {
    super(`Pokémon "${query}" not found.`);
    this.name = "PokemonNotFoundError";
  }
}

export class PokemonApiError extends Error {
  constructor(message = "Something went wrong while talking to the Pokédex servers.") {
    super(message);
    this.name = "PokemonApiError";
  }
}

async function safeFetch(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new PokemonApiError("Network error — check your connection and try again.");
  }
  if (!res.ok) {
    if (res.status === 404) throw new PokemonNotFoundError(url);
    throw new PokemonApiError(`Pokédex servers returned an error (${res.status}).`);
  }
  return res;
}

export function idFromUrl(url: string): number {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}

// ---- Real paginated listing — used for the default, unfiltered browse view ----
export interface PokemonPage {
  results: NamedResource[];
  count: number;
}

export async function getPokemonPage(offset: number, limit: number): Promise<PokemonPage> {
  const res = await safeFetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  const data = await res.json();
  return { results: data.results as NamedResource[], count: data.count as number };
}

// ---- Full name index — lazily fetched ONLY when needed for client-side name
// search or for sorting the entire (unfiltered) Pokédex by a stat. The default
// paginated browse view above never touches this. ----
let nameIndexCache: NamedResource[] | null = null;
let nameIndexPromise: Promise<NamedResource[]> | null = null;

export function getAllNames(): Promise<NamedResource[]> {
  if (nameIndexCache) return Promise.resolve(nameIndexCache);
  if (nameIndexPromise) return nameIndexPromise;
  nameIndexPromise = safeFetch(`${BASE_URL}/pokemon?limit=2000&offset=0`)
    .then((res) => res.json())
    .then((data) => {
      nameIndexCache = data.results as NamedResource[];
      return nameIndexCache;
    })
    .catch((err) => {
      nameIndexPromise = null;
      throw err;
    });
  return nameIndexPromise;
}

// ---- Type membership, cached per type ----
const typeMemberCache = new Map<string, Set<string>>();

export async function getTypeMembers(type: string): Promise<Set<string>> {
  const cached = typeMemberCache.get(type);
  if (cached) return cached;
  const res = await safeFetch(`${BASE_URL}/type/${type}`);
  const data: RawTypeResponse = await res.json();
  const set = new Set<string>(data.pokemon.map((p) => p.pokemon.name));
  typeMemberCache.set(type, set);
  return set;
}

// ---- Individual Pokémon detail, cached by name ----
const detailCache = new Map<string, PokemonDetail>();

function normalizeDetail(raw: RawPokemonResponse): PokemonDetail {
  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: [...raw.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    abilities: raw.abilities.map((a) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
    })),
    stats: raw.stats.map((s) => ({
      name: s.stat.name,
      base: s.base_stat,
    })),
    moves: raw.moves.slice(0, 12).map((m) => m.move.name),
    sprite:
      raw.sprites?.front_default ??
      raw.sprites?.other?.["official-artwork"]?.front_default ??
      raw.sprites?.other?.home?.front_default ??
      "",
    artwork:
      raw.sprites?.other?.["official-artwork"]?.front_default ??
      raw.sprites?.other?.home?.front_default ??
      raw.sprites?.front_default ??
      "",
    // Not every Pokémon/variety has shiny official artwork — fall back through
    // home shiny, then the small shiny sprite, and finally null (toggle hidden).
    shinyArtwork:
      raw.sprites?.other?.["official-artwork"]?.front_shiny ??
      raw.sprites?.other?.home?.front_shiny ??
      raw.sprites?.front_shiny ??
      null,
    // Fall back to raw.name for any malformed payload rather than leaving
    // this undefined — better to point evolution lookups at the pokemon's
    // own name (which will just 404 gracefully) than crash.
    speciesName: raw.species?.name ?? raw.name,
  };
}

export async function getPokemonDetail(nameOrId: string | number): Promise<PokemonDetail> {
  const key = String(nameOrId).toLowerCase().trim();
  const cached = detailCache.get(key);
  if (cached) return cached;
  const res = await safeFetch(`${BASE_URL}/pokemon/${key}`);
  const raw: RawPokemonResponse = await res.json();
  const detail = normalizeDetail(raw);
  detailCache.set(key, detail);
  detailCache.set(String(detail.id), detail);
  return detail;
}

export async function getPokemonDetails(names: string[]): Promise<PokemonDetail[]> {
  const results = await Promise.allSettled(names.map((n) => getPokemonDetail(n)));
  return results
    .filter((r): r is PromiseFulfilledResult<PokemonDetail> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ---- Move detail (type / power / accuracy / damage class), cached by name ----
const moveCache = new Map<string, MoveSummary>();

export async function getMoveSummary(name: string): Promise<MoveSummary> {
  const cached = moveCache.get(name);
  if (cached) return cached;
  const res = await safeFetch(`${BASE_URL}/move/${name}`);
  const raw: RawMoveResponse = await res.json();
  const summary: MoveSummary = {
    name: raw.name,
    power: raw.power,
    accuracy: raw.accuracy,
    type: raw.type?.name ?? null,
    damageClass: raw.damage_class?.name ?? null,
  };
  moveCache.set(name, summary);
  return summary;
}

// Note: individual moves are fetched one at a time by the caller (see MoveList)
// via Promise.allSettled, rather than through a bundled helper here, so that a
// single failed move doesn't need to be distinguished from the rest after the
// fact — the caller already knows exactly which one failed.

// ---- Evolution chain, cached by (base) species name ----
const evolutionCache = new Map<string, EvolutionChain>();

function flattenEvolutionChain(root: RawEvolutionChainLink): EvolutionChain {
  const levels: EvolutionChain = [];

  function walk(node: RawEvolutionChainLink, depth: number) {
    if (!levels[depth]) levels[depth] = [];
    const stage: EvolutionStage = {
      name: node.species.name,
      details: (node.evolution_details ?? []).map((d) => ({
        minLevel: d.min_level ?? null,
        trigger: d.trigger?.name ?? null,
        item: d.item?.name ?? null,
      })),
    };
    levels[depth].push(stage);
    for (const child of node.evolves_to ?? []) walk(child, depth + 1);
  }

  walk(root, 0);
  return levels;
}

export async function getEvolutionChain(nameOrId: string): Promise<EvolutionChain> {
  const key = String(nameOrId).toLowerCase().trim();
  const cached = evolutionCache.get(key);
  if (cached) return cached;

  const speciesRes = await safeFetch(`${BASE_URL}/pokemon-species/${key}`);
  const species: RawSpeciesResponse = await speciesRes.json();
  if (!species.evolution_chain?.url) {
    const empty: EvolutionChain = [];
    evolutionCache.set(key, empty);
    return empty;
  }

  const chainRes = await safeFetch(species.evolution_chain.url);
  const chainData: RawEvolutionChainResponse = await chainRes.json();
  const chain = flattenEvolutionChain(chainData.chain);

  // Cache under every stage's name so re-visiting any stage hits the cache.
  for (const level of chain) {
    for (const stage of level) evolutionCache.set(stage.name, chain);
  }
  return chain;
}
