# Architecture

## High-level

```
┌───────────────────────────┐        ┌────────────────────────────┐
│  apps/web (Angular 17)    │  HTTP  │  apps/api (NestJS 10)      │
│                           ├───────▶│                            │
│  landing / game / over    │        │  /games, /leaderboard      │
│  PrimeNG + Tailwind        │  JSON  │  x-tenant-id middleware    │
└──────────┬────────────────┘        └──────────────┬─────────────┘
           │                                         │
           │   imports                               │  imports
           ▼                                         ▼
        ┌────────────────────────────────────────────────┐
        │  libs/shared/types     libs/shared/game-engine │
        │  Tile / Hand / DTOs    pure rules (no I/O)     │
        └────────────────────────────────────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ MongoDB      │
                       │ games coll.  │
                       └──────────────┘
```

The web app drives the entire game in memory using the shared engine. The
API is only consulted for two side-effects:

1. **Game start** — a row is created so we can later attach a final score.
2. **Game complete** — the same row is updated with the result that the
   leaderboard reads from.

This split keeps the gameplay loop snappy (no network calls between bets)
and makes the leaderboard a simple Mongo query.

## Why the engine lives in `libs/shared/game-engine`

A reviewer can verify every rule from the spec by reading **one folder**.
Putting game rules inside Angular components would mean unit-testing them
inside `TestBed`; putting them inside the controller would mean spinning
up Nest and Mongo to prove anything. Instead:

- The engine is **pure functions over plain data** — easy to test, easy
  to step through in a debugger.
- The frontend wraps it in Angular `signal()`s for reactivity.
- The backend currently doesn't run it (the FE owns gameplay) but *could*
  drop it into a service for server-authoritative validation later
  without rewriting any rules.

## Frontend responsibilities

- Render the current game state.
- Drive the engine via `placeBet()` whenever the player clicks a button.
- Talk to the API for game lifecycle events and the leaderboard.
- Local-only concerns: routing, transitions, error/empty states.

## Backend responsibilities

- Persist game sessions and final scores per tenant.
- Serve the top-N leaderboard.
- Validate incoming DTOs (`class-validator`).
- Resolve `x-tenant-id` once via a single middleware.

The backend deliberately does **not** model live game state — sessions
are stateless from the server's perspective, which keeps Cloud Run
revisions horizontally scalable.

## Multi-tenancy

All leaderboard data is scoped by `tenantId`, resolved from the
`x-tenant-id` HTTP header by `TenantMiddleware`. Missing tenants default
to `default`. The Mongo unique index on `(tenantId, gameId)` makes two
tenants able to use the same client-generated `gameId` without colliding.

This is intentionally a low-cost slice of multi-tenancy:

- No tenant table, no provisioning step.
- Adding a tenant is just sending a different header value.
- Easy to upgrade later (per-tenant config, per-tenant rate limits) by
  expanding the middleware into a `TenantContextService`.

## Future admin portal readiness

The game now reads its rules from a `game_configs` MongoDB collection
rather than relying on a hardcoded constant. Each tenant owns one row,
keyed by the `x-tenant-id` header, and the engine receives that row as
plain data when a game starts:

```
landing.page → GameStore.startNewGame()
            → ApiService.gameConfig()           // GET /api/game-config
            → GameConfigService.getOrCreate()    // upsert defaults if absent
            → createGame({ id, config })         // engine ingests config
            → placeBet(state, bet)               // reads state.config only
```

What this means in practice:

- **Tenant-aware** — different tenants can run different rules without
  redeploying the frontend or backend.
- **MongoDB-backed** — the source of truth lives next to the leaderboard
  data, so admin edits and game history stay in the same backup window.
- **Engine never reads globals** — rule changes never require a frontend
  release; the next `GET /game-config` picks them up.
- **No admin UI today** — by design, the assessment doesn't ship a
  settings screen or update endpoint. The plumbing is there for a future
  portal to slot in without re-architecting anything.

A future admin portal could add:

- `PUT /api/game-config` (with authentication and role-based access).
- A validation layer that re-uses `GameConfigDto` so the UI and the API
  agree on bounds.
- An audit log collection (`game_config_audit`) capturing who changed
  what, when, and to which value.
- Optimistic concurrency via Mongo `$version` so two admins can't
  silently overwrite each other.

None of those require changes to the engine, the schema names, or the
existing endpoints — only additive code.

## Future extensions (not implemented yet)

- **RabbitMQ** — move "complete game → leaderboard refresh" into a
  message bus so a write spike doesn't backpressure the player. The
  `LeaderboardService` already only reads from Mongo, so swapping the
  write path is a one-file change.
- **GKE** — Cloud Run handles the current load comfortably; if we add
  realtime features (live spectator feed, head-to-head matches) we'd
  move to GKE with WebSocket-aware autoscaling.
- **Server-authoritative play** — the shared engine can drive a NestJS
  WebSocket gateway so cheating is impossible. The engine signature
  doesn't change.
- **Per-tenant theming** — the landing page already reads the API URL
  from `environment.ts`; per-tenant skins would slot in next to it.
