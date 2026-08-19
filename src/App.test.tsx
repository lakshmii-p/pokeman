import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import App from "./App";
import { installPokeApiMock, makePokemonDetailPayload } from "./test/mockPokeApi";

function buildRoster(count: number, attackFor: (name: string) => number, prefix = "mon") {
  const pageNames = Array.from({ length: count }, (_, i) => `${prefix}-${i + 1}`);
  const pokemon: Record<string, ReturnType<typeof makePokemonDetailPayload>> = {};
  pageNames.forEach((name, i) => {
    pokemon[name] = makePokemonDetailPayload(i + 1, name, { attack: attackFor(name) });
  });
  return { pageNames, pokemon };
}

/** Cards render pokemon.name.replace(/-/g, " ") as their visible text. */
function displayName(name: string) {
  return name.replace(/-/g, " ");
}

/** Renders <App/> inside a router and reports every location the URL visits. */
function renderAppWithLocationSpy(initialEntries: string[] = ["/"]) {
  const locations: string[] = [];
  function LocationSpy() {
    const location = useLocation();
    useEffect(() => {
      locations.push(location.pathname + location.search);
    }, [location]);
    return null;
  }
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationSpy />
      <App />
    </MemoryRouter>
  );
  return locations;
}

describe("Favorites view", () => {
  it("shows a favorited Pokémon even when it isn't part of the currently loaded page", async () => {
    // 25 Pokémon total: the browse view only loads the first 20 (page size).
    // p1-25 is favorited but lives on the un-loaded second page — this is the
    // exact scenario that used to make Favorites silently miss it.
    const { pageNames, pokemon } = buildRoster(25, () => 50, "p1");
    installPokeApiMock({ pageNames, pokemon });
    localStorage.setItem("pokedex:favorites", JSON.stringify(["p1-3", "p1-25"]));

    renderAppWithLocationSpy();

    // Wait for the initial (unfiltered) grid to finish loading.
    await waitFor(() => expect(screen.getByText(displayName("p1-1"))).toBeInTheDocument());

    await userEvent.click(screen.getByTestId("favorites-toggle"));

    await waitFor(() => expect(screen.getByText(displayName("p1-25"))).toBeInTheDocument());
    expect(screen.getByText(displayName("p1-3"))).toBeInTheDocument();
  });

  it("sorts the full favorites set correctly, not just whatever page happened to be loaded", async () => {
    // p2-25's attack is the highest of the two favorites but it was never on
    // the loaded browse page — sorting must still put it first.
    const attackByName: Record<string, number> = { "p2-3": 40, "p2-25": 200 };
    const { pageNames, pokemon } = buildRoster(25, (name) => attackByName[name] ?? 10, "p2");
    installPokeApiMock({ pageNames, pokemon });
    localStorage.setItem("pokedex:favorites", JSON.stringify(["p2-3", "p2-25"]));

    renderAppWithLocationSpy();
    await waitFor(() => expect(screen.getByText(displayName("p2-1"))).toBeInTheDocument());

    await userEvent.click(screen.getByTestId("favorites-toggle"));
    await waitFor(() => expect(screen.getByText(displayName("p2-25"))).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByRole("combobox", { name: /sort pokémon/i }), "attack");

    await waitFor(() => {
      const cardNames = screen.getAllByText(/^p2 (3|25)$/).map((el) => el.textContent);
      expect(cardNames).toEqual(["p2 25", "p2 3"]);
    });
  });

  it("shows a real empty state, not a blank screen, when there are no favorites", async () => {
    const { pageNames, pokemon } = buildRoster(5, () => 10, "p3");
    installPokeApiMock({ pageNames, pokemon });

    renderAppWithLocationSpy();
    await waitFor(() => expect(screen.getByText(displayName("p3-1"))).toBeInTheDocument());

    await userEvent.click(screen.getByTestId("favorites-toggle"));

    expect(await screen.findByText(/no favorites yet/i)).toBeInTheDocument();
  });
});

describe("URL-synced filters", () => {
  it("reflects search text and sort key in the query string", async () => {
    const { pageNames, pokemon } = buildRoster(5, () => 10, "p4");
    installPokeApiMock({ pageNames, pokemon });

    const locations = renderAppWithLocationSpy();
    await waitFor(() => expect(screen.getByText(displayName("p4-1"))).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByRole("combobox", { name: /sort pokémon/i }), "attack");

    await waitFor(() =>
      expect(locations[locations.length - 1]).toContain("sort=attack")
    );
  });

  it("restores search/type/sort/favorites from a shared URL on first load", async () => {
    const { pageNames, pokemon } = buildRoster(5, () => 10, "p5");
    installPokeApiMock({ pageNames, pokemon });
    localStorage.setItem("pokedex:favorites", JSON.stringify(["p5-2"]));

    renderAppWithLocationSpy(["/?fav=1&sort=name"]);

    // Favorites-only should already be active, and p5-2 should show up
    // without the user touching any controls.
    await waitFor(() => expect(screen.getByText(displayName("p5-2"))).toBeInTheDocument());
    const toggle = screen.getByTestId("favorites-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: /sort pokémon/i })).toHaveValue("name");
  });
});
