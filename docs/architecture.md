# Architecture

This started as a Phase 1, mock-data-first build: some domains are already
wired to Supabase, others are still fixture-backed on purpose (see below).
Phase 2 (AI Trip Planner, documented in its own section near the end) adds a
natural-language planning flow on top, still mock-data-first in the same
spirit — no real AI provider or external API is wired in yet. Everything
here is verified against the code, not aspirational.

## Folder map

```
src/app/
  core/            singletons: auth, guards, deterministic engines, models, Supabase-backed services
    auth/            AuthService (session signal) + Supabase client singleton
    engines/         pure functions — budget math, readiness score, weather rules
    guards/          authGuard (route guard, redirects to /login)
    models/          shared TS interfaces (Trip, Destination, Budget, Weather, ...)
    services/        DestinationsService, ActivitiesService, WeatherService (fixture-backed),
                      TripsService (Supabase-backed)
  fixtures/        static mock data (destinations, activities, weather) standing in for real APIs
  layout/          app chrome — navbar, mobile-nav
  shared/ui/       design-system primitives (Button, Input, SearchField, Card, Tabs,
                   Skeleton, Modal, Toast) — used across features
  features/        one folder per routed screen/section
    auth/            login/signup
    home/            landing page
    discover/        destination search + filters
    destinations/    destination detail page
    plan/            AI trip-planner flow (understand, feasibility, recommendations, confirm)
    trips/           trip dashboard
    itinerary/       itinerary timeline (CDK drag/drop reorder)
    weather/         weather panel
    budget/          budget panel
    wardrobe/        stub (out of scope this phase)
    packing/         stub (out of scope this phase)
  app.routes.ts    route table
  app.config.ts    application providers (router, zone change detection, animations)
```

## Fixture-vs-Supabase data boundary

Per the design spec, Phase 1 is mock-data-first: features that need rich
content (destinations, weather, curated activities) ship on static fixtures
so the UI and engines can be built and tested without depending on a real
weather/maps API. Anything that is genuinely user-owned data — the reason
Supabase exists in this build — is live from day one.

| Domain | Backing | Service |
|---|---|---|
| Destinations (list/detail) | Fixture (`src/app/fixtures/destinations.fixture.ts`) | `DestinationsService` |
| Weather forecast | Fixture (`src/app/fixtures/weather.fixture.ts`) | `WeatherService` |
| Curated activities (per destination, for the detail page) | Fixture (`src/app/fixtures/activities.fixture.ts`) | `ActivitiesService` |
| Auth (sign up / sign in / session) | Supabase (`auth.users`) | `AuthService` |
| Trips, trip days, trip activities, budgets | Supabase (`trips`, `trip_days`, `activities`, `budgets`) | `TripsService` |

Wardrobe, outfits, and packing tables exist in the schema (for future use)
but have no service wired up yet — those screens are stubs.

## Deterministic engines

All product logic that turns inputs into numbers or recommendations is a
pure, unit-tested function — no side effects, no network calls. This is the
seam the AI boundary (see Phase 2, below) respects.

| Function | File | Signature | What it does |
|---|---|---|---|
| `computeBudgetTotal` | `core/engines/budget.engine.ts` | `(b: BudgetBreakdown) => number` | Sums the six budget line items |
| `estimateBudget` | `core/engines/budget.engine.ts` | `(dailyLow, dailyHigh, nights, travelers) => BudgetBreakdown` | Derives a starting budget breakdown from a destination's daily range, split 40/25/15/10/5/5 across accommodation/food/activities/transport/local transport/shopping |
| `scaleBudgetToTarget` | `core/engines/budget.engine.ts` | `(b: BudgetBreakdown, target: number) => BudgetBreakdown` | Rescales every line proportionally so the total matches a new target (used by the budget slider), absorbing rounding remainder without going negative |
| `computeReadiness` | `core/engines/readiness.engine.ts` | `(input: ReadinessInput) => number` | 0–100 trip-readiness score: 20 pts for dates set, 50 pts for itinerary coverage (days with an activity / total days), 30 pts for staying within budget (linear falloff between 1x–1.5x of target) |
| `weatherRecommendations` | `core/engines/weather-rules.engine.ts` | `(days: WeatherDay[], walkingIntensity: 'low'\|'medium'\|'high') => WeatherRec[]` | Rule-based packing suggestions: cold layer (<10°C low), waterproof shell (≥40% rain), walking shoes (high walking intensity), sun protection (≥28°C high) |
| `applyDiscoverFilters` | `features/discover/discover.filter.ts` | `(all: Destination[], f: DiscoverFilters) => Destination[]` | ANDs together a text query, max daily budget, style tag, and best-month filter over the destination list |
| `datesInRange` | `core/services/trips.service.ts` | `(start: string, end: string) => string[]` | Inclusive list of `YYYY-MM-DD` dates between two dates, parsed as UTC so DST never drops/duplicates a day |
| `rowToTrip` / `rowToTripActivity` / `rowToTripDay` / `rowToBudget` | `core/services/trips.service.ts` | `(row) => Model` | Pure snake_case-row → camelCase-model mappers, exported so they're unit-testable without hitting Supabase |

Note: on the Trip Dashboard, `budgetTarget` is the destination's baseline cost
estimate for this trip's length — not the user's own chosen budget from
trip creation. A user who deliberately books above the destination average will see
a lower budget-readiness score by design.

## AI boundary

```
user intent → AI interpretation → validated structured data → deterministic product logic → UI
```

AI is only ever allowed to *produce inputs* to the engines above (e.g. turn
"a relaxed week in Portugal" into a destination + date range + interest
tags) — it must never bypass them by generating a budget number or a
readiness score directly. The deterministic engines stay the single source
of truth for anything the product shows the user; AI output is validated
against the same models those engines already consume before it touches
them.

As of Phase 2, this boundary is implemented — deterministically, not with a
real AI provider. See "Phase 2 — AI Trip Planner" below for what that means.

## Routes

| Path | Guard | Component |
|---|---|---|
| `/` | public | `HomeComponent` |
| `/login` | public | `LoginComponent` |
| `/discover` | `authGuard` | `DiscoverComponent` |
| `/destinations/:slug` | `authGuard` | `DestinationDetailComponent` |
| `/plan/understand` | `authGuard` | `UnderstandComponent` |
| `/plan/feasibility` | `authGuard` | `FeasibilityComponent` |
| `/plan/recommendations` | `authGuard` | `RecommendationsComponent` |
| `/plan/confirm` | `authGuard` | `ConfirmComponent` |
| `/trips/:id` | `authGuard` | `TripDashboardComponent` |
| `**` | — | redirects to `/` |

`authGuard` (`core/guards/auth.guard.ts`) awaits `AuthService.whenReady`
(so it never races the initial Supabase session check) and redirects to
`/login` when there's no session.

## Component convention

Every component is four sibling files — `*.component.ts` (logic, with
`templateUrl` + `styleUrl`), `*.component.html`, `*.component.css`, and
`*.component.spec.ts`. No inline templates or inline styles anywhere in the
app, even for trivial stub components — one place to look for markup, one
for styles.

## Database schema

Migrations, applied in order (`supabase/migrations/`):

| File | Purpose |
|---|---|
| `0001_core_schema.sql` | Creates all 10 tables: `profiles`, `destinations`, `trips`, `trip_days`, `activities`, `budgets`, `wardrobe_items`, `outfits`, `outfit_items`, `packing_items`, plus indexes on the common lookup columns (`trips.user_id`, `trip_days.trip_id`, `activities.trip_day_id`) |
| `0002_rls_policies.sql` | Enables RLS on every table; owner-only `using/with check (auth.uid() = user_id)` policy per user-owned table (`profiles` is the exception — it keys on `id`, the row's own primary key, since that already *is* the user's id, so its policy checks `auth.uid() = id`; `outfit_items` checks ownership via its parent `outfits` row since it has no `user_id` column itself); `destinations` gets a public `select`-only policy; a `handle_new_user()` trigger auto-inserts a `profiles` row on signup |
| `0003_seed_destinations.sql` | Seeds the 6 launch destinations (Prague, Lisbon, Kyoto, Reykjavik, Marrakech, Amalfi) into `destinations` — used by local dev/e2e; the app itself reads destinations from the fixture, not this table, in this phase |
| `0004_add_destination_region.sql` (Phase 2) | Adds a `region` column to `destinations` (default `'Europe'`), then backfills `'Asia'` for Kyoto and `'Africa'` for Marrakech — matching the `Region` values the fixture and the feasibility/recommend engines already use |

## Phase 2 — AI Trip Planner

Phase 2 adds a natural-language trip-planning flow in front of the existing
Phase 1 screens. It does not touch Phase 1's engines, models, or the trip
dashboard — it only adds a new "understand what the user wants, then hand
off to the same deterministic engines and the same `TripsService`" pipeline,
and retires the old manual wizard.

### The AI boundary, now implemented (still mocked)

`TripPlannerAiService` (`src/app/core/services/trip-planner-ai.service.ts`)
is the single seam a real AI provider would plug into. It exposes two calls
shaped like real AI-provider calls:

- `analyzeIntent(message: string): TripIntent`
- `generateItinerary(intent: TripIntent, destination: Destination, activities: Activity[]): GeneratedDay[]`

Both are implemented deterministically today — `analyzeIntent` delegates to
regex/keyword parsing (`intent-parser.engine.ts`), and `generateItinerary`
delegates to a round-robin activity distributor plus a validator/repair pass
(`itinerary-generator.engine.ts` + `itinerary-validator.engine.ts`). No real
AI provider is wired into this codebase, and there is no external API key
anywhere in it — the interface is provider-ready, but a real Claude/OpenAI
call would slot in behind `TripPlannerAiService` without any caller changing.

### New deterministic engines (`src/app/core/engines/`)

| Function | File | Signature | What it does |
|---|---|---|---|
| `parseIntent` | `intent-parser.engine.ts` | `(message: string) => TripIntent` | Keyword/regex-parses a free-text trip request into region, duration, travelers, month, budget, style/preference/interest tags, a confidence score, and a list of missing fields |
| `checkFeasibility` | `feasibility.engine.ts` | `(intent: TripIntent, catalog: Destination[]) => FeasibilityResult` | Filters the catalog by region/month, estimates a cost range via the existing budget engine, and returns green/amber (tight budget)/red (no matching destinations, with suggested alternatives) |
| `rankDestinations` | `recommend.engine.ts` | `(intent: TripIntent, catalog: Destination[]) => DestinationMatch[]` | Scores every catalog destination (region match, month match, style-tag overlap) into a 0–100 ranked list with human-readable reasons |
| `generateItinerary` | `itinerary-generator.engine.ts` | `(intent: TripIntent, destination: Destination, activities: Activity[]) => GeneratedDay[]` | Round-robins the destination's reference activities across `intent.durationDays` (default 4) days |
| `validateItinerary` | `itinerary-validator.engine.ts` | `(days: GeneratedDay[]) => { valid: boolean; repaired: GeneratedDay[] }` | Confirms every day has ≥1 activity (or the trip is legitimately sparse); otherwise repairs by moving activities off the fullest day |

### New models (`src/app/core/models/trip-intent.model.ts`)

- `TripIntent` — parsed trip request: optional region/durationDays/travelers/month/budget, plus `travelStyle`/`preferences`/`interests`/`missingInformation` arrays and a `confidence` (0–1)
- `FeasibilityResult` — `status: 'green'|'amber'|'red'`, `estimatedCostRange`, `travelIntensity`, `weatherSuitable`, `reasons`, optional `alternatives`
- `DestinationMatch` — `{ destination: Destination; score: number; reasons: string[] }`
- `GeneratedDay` / `GeneratedActivity` — `{ dayIndex, activities: { title, category, startTime?, notes? }[] }`

### `TripPlannerStore`

`src/app/core/services/trip-planner-store.service.ts` holds the in-progress
flow state as signals — `intent`, `chosenDestination`, `feasibility`,
`matches` — for the lifetime of the `/plan/*` flow. Nothing here is
persisted to Supabase; the store is reset once the Confirm screen actually
creates the trip through `TripsService`.

### The new flow

Home NL search → `/plan/understand` (editable parsed intent) →
`/plan/feasibility` (Green/Amber/Red) → `/plan/recommendations` (ranked,
scored destinations) → destination detail (reused from Phase 1, now shown
with recommendation context) → `/plan/confirm` → Trip Dashboard (Phase 1,
unchanged).

The manual wizard (`/trips/new`) is retired — deleted in this phase.
Destination detail's "Build my trip" button no longer opens a separate
manual form; it seeds the planner store with default trip parameters and
routes through the same `/plan/confirm` screen as the NL flow.

### `Destination.region`

A `region: Region` field (`'Europe'|'Asia'|'Africa'|'Americas'|'Oceania'`)
was added to the `Destination` model, used by `checkFeasibility` and
`rankDestinations` to filter/score candidates. The Supabase `destinations`
table got a matching column via `0004_add_destination_region.sql` (see
Database schema, above).

### Known bug fixed this phase: native `search` event collision

`SearchFieldComponent`'s `@Output() search` shares its name with the native
`input[type=search]` DOM `search` event. Angular attaches a native listener
for that name alongside the component's own Output subscription — so
without a guard, a browser-native `search` event (fired on Enter-commit or
via the native clear/× button) leaks a raw `Event` into whatever the
parent's `(search)` handler expects (a `string`). Fixed by calling
`$event.stopPropagation()` on the native `search` event directly on the
`<input>` in `search-field.component.html`. Worth remembering for any
future shared component whose `@Output()` name collides with a native DOM
event name.

### Still single-destination

Phase 2 did not add multi-destination/multi-city trips. `checkFeasibility`
has no multi-city travel-time logic — that's an explicit, documented
out-of-scope in its own design spec, not an oversight.

### What's still deferred

A real AI provider, real weather/maps/currency APIs, multi-destination
trips, wardrobe/outfits/packing (separate future sub-projects), interactive
ambiguous-region clarification, image upload, and deployment are all still
out of scope after Phase 2.
