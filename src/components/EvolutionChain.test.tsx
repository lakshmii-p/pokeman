import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EvolutionChainConnected } from "./EvolutionChain";
import { installPokeApiMock, makePokemonDetailPayload } from "../test/mockPokeApi";

// Regression test for a real bug: PokeAPI's pokemon-species endpoint only has
// entries under a Pokémon's *base species* name (e.g. "minior"), not its
// per-form variety name (e.g. "minior-red-meteor"). The evolution chain must
// be looked up by species name, not by whatever name is currently displayed.
describe("EvolutionChainConnected — species vs. variety names", () => {
  it("loads successfully when given the base species name for a multi-form Pokémon", async () => {
    installPokeApiMock({
      pageNames: [],
      pokemon: {
        minior: makePokemonDetailPayload(774, "minior", { speciesName: "minior" }),
      },
      species: {
        minior: { evolutionChainUrl: "https://pokeapi.co/api/v2/evolution-chain/999/" },
      },
      evolutionChains: {
        "https://pokeapi.co/api/v2/evolution-chain/999/": {
          chain: {
            species: { name: "minior" },
            evolution_details: [],
            evolves_to: [],
          },
        },
      },
    });

    render(
      <MemoryRouter>
        <EvolutionChainConnected speciesName="minior" />
      </MemoryRouter>
    );

    // A single-stage chain renders "does not evolve" rather than an error —
    // proving the /pokemon-species/minior lookup succeeded.
    expect(await screen.findByText(/does not evolve/i)).toBeInTheDocument();
    expect(screen.queryByText(/couldn't load/i)).not.toBeInTheDocument();
  });

  it("would fail with the un-fixed behavior of using the variety name directly", async () => {
    // No "minior-red-meteor" entry in `species` — only the base "minior" is
    // registered, mirroring the real PokeAPI. This demonstrates the bug that
    // existed before speciesName was threaded through.
    installPokeApiMock({
      pageNames: [],
      pokemon: {},
      species: {
        minior: { evolutionChainUrl: "https://pokeapi.co/api/v2/evolution-chain/999/" },
      },
      evolutionChains: {
        "https://pokeapi.co/api/v2/evolution-chain/999/": {
          chain: { species: { name: "minior" }, evolution_details: [], evolves_to: [] },
        },
      },
    });

    render(
      <MemoryRouter>
        <EvolutionChainConnected speciesName="minior-red-meteor" />
      </MemoryRouter>
    );

    expect(await screen.findByText(/couldn't load the evolution chain/i)).toBeInTheDocument();
  });
});
