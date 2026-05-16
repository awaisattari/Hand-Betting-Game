# Hand Betting Game

A Mahjong-flavoured higher / lower betting game. The player is dealt a
three-tile hand from a deck of Number, Dragon and Wind tiles. They bet
whether the next hand will total higher or lower than the current one.
Dragon and Wind tile values drift up or down each round — push any one
of them to **0** or **10** and the game ends.

Built as a full-stack assessment piece, but structured so a reviewer can
extend it on the spot during an onsite interview.

## Tech stack

| Layer       | Tech                                                  |
| ----------- | ----------------------------------------------------- |
| Monorepo    | Nx 18                                                 |
| Frontend    | Angular 17 (standalone components, signals)           |
| UI          | PrimeNG 17 + Tailwind CSS                             |
| Backend     | NestJS 10                                             |
| Database    | MongoDB via Mongoose                                  |
| Shared libs | `libs/shared/types`, `libs/shared/game-engine` (pure) |
| Testing     | Jest                                                  |
| CI          | GitHub Actions (lint / test / build)                  |
| Deploy      | GCP Cloud Run via Dockerfiles                         |

## Repository layout

```
hand-betting-game/
├── apps/
│   ├── web/                 # Angular app
│   └── api/                 # NestJS app
├── libs/
│   └── shared/
│       ├── types/           # Tile, GameState, DTO contracts, GAME_CONFIG
│       └── game-engine/     # Pure rules + unit tests
├── docs/
│   ├── architecture.md
│   └── ai-usage.md
├── .github/workflows/ci.yml # lint, test, build
├── Dockerfile.api
├── Dockerfile.web
└── README.md
```

## Setup

```bash
# Requires Node 20+ and a local MongoDB (or a connection string)
npm install
cp .env.example .env
```

If you don't have a local Mongo, the easiest way:

```bash
docker run --rm -d --name hbg-mongo -p 27017:27017 mongo:7
```

## Running the app

```bash
# Both apps in parallel
npm start

# Or individually
npm run start:web   # http://localhost:4200
npm run start:api   # http://localhost:3333/api/health
```

## Tests

```bash
npm test                # everything
npm run test:engine     # just the pure game-engine library — fastest
```

The game-engine tests cover every spec-mandated rule:
deck creation, hand drawing, tile-value math, all bet outcomes,
Dragon/Wind drift, game-over at 0/10, reshuffle and discard merge
behaviour, and game-over after the 3rd reshuffle.

## Environment variables

| Var           | Default                                          | Notes                          |
| ------------- | ------------------------------------------------ | ------------------------------ |
| `PORT`        | `3333`                                           | NestJS HTTP port               |
| `MONGODB_URI` | `mongodb://localhost:27017/hand-betting-game`    | Mongo connection string        |

See `.env.example`.

## Game rules (as implemented)

- **Hand size:** 3 tiles per hand.
- **Number tiles:** value = face (1–9).
- **Dragon / Wind tiles:** base value 5; each tile key (e.g.
  `dragon:red`) tracks its own value across the whole game.
- **Bet outcome shifts** the dynamic value of every Dragon / Wind tile
  in the newly-revealed hand by +1 on a win, −1 on a loss, 0 on a tie.
- **Scoring:** +10 correct, −5 wrong, 0 tie.
- **Reshuffle:** when the draw pile can't fill a hand, a fresh deck is
  shuffled together with the discard pile into a new draw pile; the
  discard pile clears and the reshuffle count increments.
- **Game over** when any dynamic tile value reaches 0 or 10, or after
  the 3rd reshuffle.

## Assumptions made

The spec leaves some numbers up to the implementer; I went with:

- **3 tiles per hand** (spec says "use 3" — kept).
- **Scoring**: +10 / −5 / 0 (spec recommendation — kept).
- **Deck composition**: 4 copies each of 1–9, the three Dragons, and
  the four Winds → 64 tiles total. Not load-bearing for the rules; only
  the *category mix* matters.
- **First hand is the baseline** and is drawn during `createGame`, so the
  player always sees a hand before betting.
- A **win/loss applies to *every* Dragon or Wind in the new hand** — if
  the same tileKey appears twice it shifts twice, since the spec talks
  about each tile being part of a winning/losing hand as a discrete event.
- **Ties leave dynamic values untouched** (no win, no loss).
- The frontend is **client-authoritative** for gameplay; the API only
  stores the final score. See `docs/architecture.md` for the upgrade path
  to server-authoritative play.

All of these are configurable in `libs/shared/types/src/lib/game-config.ts`.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full picture.
Short version:

- All game rules live in `libs/shared/game-engine` as pure functions.
- The Angular app wraps them in `signal()`s; the NestJS app doesn't touch
  them today but the dependency is set up so it can later (server-auth
  validation).
- Multi-tenancy is a single `x-tenant-id` header resolved by middleware,
  with a compound `(tenantId, score)` Mongo index keeping the leaderboard
  cheap.

## API endpoints

All endpoints honour the `x-tenant-id` header (defaults to `default`).

| Method | Path                       | Body / Response                              |
| ------ | -------------------------- | -------------------------------------------- |
| `POST` | `/api/games`               | `{ gameId, playerName? }` → game stub        |
| `POST` | `/api/games/:id/complete`  | `{ playerName, score, handsPlayed, reshuffleCount, reason }` → completed game |
| `GET`  | `/api/leaderboard`         | top-N `LeaderboardEntry[]` (N = `leaderboardLimit` from tenant config) |
| `GET`  | `/api/game-config`         | tenant `GameConfig`; auto-seeds defaults on first hit |
| `GET`  | `/api/health`              | `{ status, uptime }`                         |

## Game configuration

The game uses a configuration-driven rule system. Default values match
the assessment requirements exactly. Current configuration values are
stored in MongoDB by tenant. This allows the game engine to receive
rule values dynamically instead of hardcoding them inside UI components.

For this assessment, the config is seeded with the required default
values:

- Hand size: 3
- Non-number tile base value: 5
- Minimum tile value: 0
- Maximum tile value: 10
- Maximum draw pile reshuffles: 3
- Leaderboard limit: 5
- Correct bet points: 10
- Wrong bet points: -5
- Tie points: 0

This design makes the app ready for a future admin portal where
authorized users could manage game settings per tenant without changing
application code.

### How it flows

1. The Angular landing page calls `GET /api/game-config`.
2. The NestJS service either returns the existing `game_configs` row for
   the tenant, or upserts a defaults-only row and returns that.
3. The frontend hands the returned `GameConfig` straight to
   `createGame()` from the shared engine, which copies it onto the
   `GameState`.
4. Every subsequent `placeBet()` reads its rule values off
   `state.config` — no globals, no hidden defaults.

### Fallback behaviour

If the config endpoint fails for any reason (API offline, network drop,
500), the frontend falls back to `DEFAULT_GAME_CONFIG` from
`@hbg/game-engine` and shows a small non-blocking notice on the game
page:

> Using local default game rules.

The player is never blocked — gameplay continues with the spec defaults.

### Seeding

```bash
npm run seed:config                 # idempotent — seeds the "default" tenant
TENANT_ID=corp npm run seed:config  # seed another tenant
```

The seed script connects directly to Mongo, upserts the defaults using
`$setOnInsert` (so re-runs don't overwrite tenant-customised values),
and exits cleanly.

## Deployment notes — GCP Cloud Run

Each app builds to its own container.

```bash
# API
gcloud builds submit --tag gcr.io/$PROJECT/hbg-api --file=Dockerfile.api .
gcloud run deploy hbg-api \
  --image gcr.io/$PROJECT/hbg-api \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI=...

# Web
gcloud builds submit --tag gcr.io/$PROJECT/hbg-web --file=Dockerfile.web .
gcloud run deploy hbg-web \
  --image gcr.io/$PROJECT/hbg-web \
  --region us-central1 \
  --allow-unauthenticated
```

Production builds of the web app point `apiUrl` at `/api` — front the
two services with a single load balancer (or use a Cloud Run "hostname
mapping" with `/api/*` routed to the API) so the FE doesn't need CORS.

For local Mongo, set `MONGODB_URI=mongodb+srv://…` to a managed Atlas
cluster or a Cloud-Run-Internal Mongo on Compute Engine.

## GitHub Actions

`.github/workflows/ci.yml` runs on every push & PR:

1. Install deps via `npm ci`
2. `nx affected -t lint`
3. `nx affected -t test`
4. `nx affected -t build`

`nx affected` keeps the pipeline fast as the repo grows — only the
projects that changed get rebuilt.

## Commands cheatsheet

```bash
npm install                # install deps
npm run start              # serve web + api in parallel
npm run start:web          # only the Angular app
npm run start:api          # only the NestJS API
npm test                   # all tests
npm run test:engine        # only the pure game-engine
npm run build              # build both apps
npm run lint               # lint everything
npm run seed:config        # seed the "default" tenant's GameConfig
```

## Public GitHub repository submission

Push this folder to a public GitHub repo and share the URL. The CI
pipeline runs automatically — green CI is the easiest sanity check
that the project is healthy.

## Video walkthrough checklist

When recording, hit these beats in order:

1. Show the landing page.
2. Show the New Game flow (type a player name, click *New Game*).
3. Explain Mahjong tile values — Numbers = face, Dragons/Winds start at 5.
4. Make a *Bet Higher* action and call out the result message.
5. Make a *Bet Lower* action.
6. Show score updating in the stats grid.
7. Show Dragon/Wind dynamic value changes in the side panel.
8. Show the draw pile and discard pile counters.
9. Show the history view as it fills in.
10. Trigger and show the game-over screen.
11. Return to landing, show the leaderboard updating.
12. Briefly explain code architecture:
    - Angular frontend
    - NestJS backend
    - Shared game engine
    - MongoDB leaderboard
    - AI usage note

## AI usage disclosure

I used AI assistance for planning, architecture review, documentation
wording, and small implementation suggestions. The actual project setup,
core implementation, debugging, UI refinement, testing, and final code
review were completed manually.

**Handwritten / manual areas:** Nx workspace setup, Angular components,
NestJS API, game rule implementation, testing, UI polish, debugging,
deployment configuration.

**AI-assisted areas:** planning roadmap, architecture suggestions, README
wording, minor code review suggestions.

Full disclosure in [`docs/ai-usage.md`](docs/ai-usage.md).

## Acceptance checklist

- [x] New Game button
- [x] Top 5 leaderboard
- [x] Mahjong tile set (Number / Dragon / Wind)
- [x] Number tile values = face
- [x] Dragon / Wind base value 5
- [x] Dynamic Dragon / Wind scaling (±1 per win/loss event)
- [x] Draw pile count visible
- [x] Discard pile count visible
- [x] Reshuffling rule with discard merge + count increment
- [x] Game-over at tile value 0
- [x] Game-over at tile value 10
- [x] Game-over after 3rd draw-pile empty event
- [x] Exit button → landing page
- [x] Bet Higher action
- [x] Bet Lower action
- [x] Current hand total displayed
- [x] Visual tile cards (Number / Dragon / Wind clearly distinct)
- [x] History view with smaller previous-hand tiles
- [x] Final score screen with reason / hands played / reshuffle count / return-to-landing
- [x] README setup instructions
- [x] AI usage disclosure
- [x] Video walkthrough checklist
- [x] GitHub Actions for lint/test/build
- [x] Cloud Run deployment notes
- [x] `DEFAULT_GAME_CONFIG` still matches assignment defaults
- [x] `GET /api/game-config` exists and returns per-tenant config
- [x] Config is stored in MongoDB (`game_configs` collection)
- [x] Config is tenant-aware via `x-tenant-id`
- [x] Missing tenant config auto-creates defaults
- [x] New game starts using backend config
- [x] Frontend falls back to shared defaults if `GET /game-config` fails
- [x] No public admin portal added (intentional — see architecture notes)
- [x] README explains future admin portal readiness
