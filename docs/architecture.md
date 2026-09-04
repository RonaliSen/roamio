# Architecture

This is a Phase 1, mock-data-first build: some domains are already wired to
Supabase, others are still fixture-backed on purpose (see below). Everything
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
    trips/           trip wizard + trip dashboard
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
seam the future AI boundary (below) has to respect.

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

## AI boundary (future, not built)

No AI is wired into this build. When it is added, the intended shape is:

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

## Routes

| Path | Guard | Component |
|---|---|---|
| `/` | public | `HomeComponent` |
| `/login` | public | `LoginComponent` |
| `/discover` | `authGuard` | `DiscoverComponent` |
| `/destinations/:slug` | `authGuard` | `DestinationDetailComponent` |
| `/trips/new` | `authGuard` | `TripWizardComponent` |
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

Three migrations, applied in order (`supabase/migrations/`):

| File | Purpose |
|---|---|
| `0001_core_schema.sql` | Creates all 10 tables: `profiles`, `destinations`, `trips`, `trip_days`, `activities`, `budgets`, `wardrobe_items`, `outfits`, `outfit_items`, `packing_items`, plus indexes on the common lookup columns (`trips.user_id`, `trip_days.trip_id`, `activities.trip_day_id`) |
| `0002_rls_policies.sql` | Enables RLS on every table; owner-only `using/with check (auth.uid() = user_id)` policy per user-owned table (`outfit_items` checks ownership via its parent `outfits` row since it has no `user_id` column itself); `destinations` gets a public `select`-only policy; a `handle_new_user()` trigger auto-inserts a `profiles` row on signup |
| `0003_seed_destinations.sql` | Seeds the 6 launch destinations (Prague, Lisbon, Kyoto, Reykjavik, Marrakech, Amalfi) into `destinations` — used by local dev/e2e; the app itself reads destinations from the fixture, not this table, in this phase |
