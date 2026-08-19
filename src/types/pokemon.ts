export interface NamedResource {
  name: string;
  url: string;
}

export interface PokemonStat {
  name: string;
  base: number;
}

export interface MoveSummary {
  name: string;
  type: string | null;
  power: number | null;
  accuracy: number | null;
  damageClass: string | null;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number; // decimetres
  weight: number; // hectograms
  types: string[];
  abilities: { name: string; isHidden: boolean }[];
  stats: PokemonStat[];
  moves: string[];
  sprite: string;
  artwork: string;
  shinyArtwork: string | null;
  // Base species name (e.g. "minior" for the variety "minior-red-meteor").
  // Evolution-chain lookups must use this, not `name` — PokeAPI's
  // pokemon-species endpoint only has entries under the base species.
  speciesName: string;
}

export type SortKey = "id" | "name" | "attack" | "speed" | "hp";

export const ALL_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof ALL_TYPES)[number];

// ---- Shapes of the raw PokéAPI JSON responses we consume ----
// (kept minimal — only the fields this app actually reads)

export interface RawPokemonType {
  slot: number;
  type: NamedResource;
}

export interface RawPokemonAbility {
  ability: NamedResource;
  is_hidden: boolean;
}

export interface RawPokemonStat {
  base_stat: number;
  stat: NamedResource;
}

export interface RawPokemonMove {
  move: NamedResource;
}

export interface RawPokemonSprites {
  front_default: string | null;
  front_shiny?: string | null;
  other?: {
    "official-artwork"?: { front_default: string | null; front_shiny?: string | null };
    home?: { front_default: string | null; front_shiny?: string | null };
  };
}

export interface RawPokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: RawPokemonType[];
  abilities: RawPokemonAbility[];
  stats: RawPokemonStat[];
  moves: RawPokemonMove[];
  sprites: RawPokemonSprites;
  species: NamedResource;
}

export interface RawTypeResponse {
  pokemon: { pokemon: NamedResource }[];
}

export interface RawMoveResponse {
  name: string;
  power: number | null;
  accuracy: number | null;
  type: NamedResource;
  damage_class: NamedResource;
}

export interface RawEvolutionDetail {
  min_level: number | null;
  trigger: NamedResource | null;
  item: NamedResource | null;
}

export interface RawEvolutionChainLink {
  species: NamedResource;
  evolution_details: RawEvolutionDetail[];
  evolves_to: RawEvolutionChainLink[];
}

export interface RawEvolutionChainResponse {
  chain: RawEvolutionChainLink;
}

export interface RawSpeciesResponse {
  evolution_chain: { url: string } | null;
}

export interface EvolutionDetail {
  minLevel: number | null;
  trigger: string | null;
  item: string | null;
}

export interface EvolutionStage {
  name: string;
  details: EvolutionDetail[]; // empty for the base stage
}

/** Each entry is one "generation" of the chain; branches (e.g. Eevee) share a level. */
export type EvolutionChain = EvolutionStage[][];
