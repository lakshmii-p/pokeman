# Pokédex Explorer

A modern, responsive Pokédex built for the "Frontend Assignment: Public API Integration & Beautiful UI" brief. It consumes [PokéAPI](https://pokeapi.co/) and presents it through a scanner/terminal-inspired UI, complete with search, type filtering, sorting, favorites, dark mode, and a stat comparison tool.

**Live demo:** _add your deployed URL here after deploying_
**Repo:** _add your GitHub URL here_

## Features

- **Card-based Pokémon grid** — image, Dex number, name, and type chips, each card tinted by its primary type.
- **Search by name** — debounced, client-side substring search. The full name index (names only, not full Pokémon data) is fetched lazily, only once you actually start typing — the default browse view never touches it. Includes a clear "not found" state.
- **Real, incremental pagination** — the default browse view hits `/pokemon?limit=20&offset=0`, then `offset=20`, `offset=40`, etc. on each "Load More" — it never fetches the whole Pokédex up front.
- **Type filter** — filter the grid to a single type using the PokéAPI `/type/{type}` endpoint.
- **Sort** — by Dex number, name, Attack, Speed, or HP. Sorting by a stat is correct across the *entire* filtered/searched set, not just whatever's currently loaded — selecting "Attack" will surface the highest-Attack Pokémon in the whole Pokédex even if it hasn't been paginated into view yet. Since PokéAPI has no server-side stat sorting, this is done by fetching the full candidate set's details in the background (in batches, with a progress indicator) before sorting and paginating the result.
- **Pokémon detail view** — modal with large artwork (with a shiny-sprite toggle where available), height, weight, evolution chain (click any stage to jump straight to it), abilities, segmented base-stat bars, and a move list with type + power. Shareable via URL (`/pokemon/:name`).
- **Favorites** — star any Pokémon; persisted in `localStorage` and filterable via a "Favorites" toggle.
- **Dark / light mode** — toggle in the header, persisted, and respects `prefers-color-scheme` on first visit.
- **Compare mode** — select two Pokémon cards to open a side-by-side stat comparison.
- **Keyboard accessible** — cards are focusable and operable with Enter/Space, modal closes on Escape with a full focus trap (Tab cycles only within the open dialog), and pressing `/` anywhere jumps focus to search.
- **Loading, error, and empty states everywhere data is fetched** — skeleton cards while the grid loads, a "no results" state for search, an empty state for favorites, and a real error message with a Retry button for every independent API call (the browse page, the move list, the evolution chain, and the detail view each fail and recover on their own — one failing never silently blanks the others).
- **Fully responsive** — from small phones up to wide desktop layouts.

## Screenshots

| Home (grid) | Detail view | Compare |
| --- | --- | --- |
| ![Home screen showing the Pokémon grid](screenshots/home.png) | ![Detail modal with stats, abilities and evolution chain](screenshots/detail.png) | ![Side-by-side stat comparison](screenshots/compare.png) |

| Mobile | Dark mode | Search / empty state |
| --- | --- | --- |
| ![Responsive mobile layout](screenshots/mobile.png) | ![Dark theme](screenshots/dark-mode.png) | ![Search with no results](screenshots/search-empty.png) |

*(Drop your own PNGs into the `screenshots/` folder using these filenames — or any names, just update the paths above — and they'll render directly in this README on GitHub.)*

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router (for the shareable detail/compare routes)
- Tailwind CSS v4
- lucide-react (icons)
- Vitest + React Testing Library (unit/integration tests — see `npm test`)

## API Used

[PokéAPI](https://pokeapi.co/) — `https://pokeapi.co/api/v2/`

Endpoints used:
- `GET /pokemon?limit=20&offset=N` — real, incremental pagination for the default browse view
- `GET /pokemon?limit=2000&offset=0` — full name index, fetched lazily (only once search or an unfiltered stat-sort is actually used, never on initial load)
- `GET /pokemon/{name}` — Pokémon detail (stats, types, sprites, abilities, moves)
- `GET /type/{type}` — Pokémon belonging to a type, for the type filter
- `GET /move/{name}` — move type/power, for the moves list in the detail view
- `GET /pokemon-species/{name}` + `GET /evolution-chain/{id}` — evolution chain shown in the detail view

No API key is required.

## Installation

```bash
git clone <your-repo-url>
cd pokemon-explorer
npm install
```

## Running Locally

```bash
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build and preview a production build:

```bash
npm run build
npm run preview
```

To run the test suite or lint:

```bash
npm run test    # Vitest — unit/integration tests
npm run lint    # oxlint
```

## Project Structure

```
src/
├── components/       # Presentational components (card, grid, modal, filters, states…)
├── hooks/            # usePokemonBrowser (data/pagination), useFavorites, useTheme, useDebounce
├── services/         # pokemonApi.ts — all PokéAPI calls + caching
├── types/            # Shared TypeScript types
├── utils/            # Type → color/icon theme system
├── App.tsx           # Routes + page composition
└── main.tsx          # Entry point, router setup
```

## Challenges Faced

- **Real pagination vs. correct global sorting are in tension.** PokéAPI has no server-side sort or search. Paginating the default view with real `offset`/`limit` calls is straightforward, but sorting by a stat (e.g. Attack) is only *correct* if every candidate's stats are known first — otherwise "highest Attack" would just mean "highest Attack among whatever page you happened to load." The fix: the default browse view stays purely paginated (cheap, fast, exactly matches the brief), and switching to a stat-based sort triggers a one-time background fetch of the full filtered candidate set (batched, with a visible progress indicator) before sorting and displaying it. A type filter or search term bounds that candidate set to something small; sorting the entire unfiltered Pokédex by a stat is the one case that has to fetch everything, and it says so on screen while it does.
- **A partial page failure shouldn't blank the whole grid.** Early on, one failed detail request (out of a full page of 20) was hiding every successfully-loaded card behind a full-page error. Fixed so the grid always shows whatever loaded successfully, with a small non-blocking banner (and Retry) for what didn't — the same pattern is used for the move list and evolution chain, so one flaky request never wipes out data that's already there.
- **PokéAPI's list endpoint doesn't return type data**, so type-tinted cards require a detail fetch per Pokémon. Solved by caching details in memory by name/id, so repeat views (e.g. paging back) are instant.
- **Tailwind v4's `@import` ordering** with a Google Fonts `@import` initially produced a build warning; fixed by ordering the font import before the Tailwind import.

## Future Improvements

- Move type-membership and detail caching into a proper client cache (e.g. TanStack Query) with stale-time control and request de-duplication across tabs.
- Add a "random Pokémon" shortcut and a proper 404 page for unknown routes.
- Virtualize the grid for very large result sets to reduce DOM node count.
- Add unit tests (e.g. Vitest) for the type-color mapping and the browse/filter/sort hook.
