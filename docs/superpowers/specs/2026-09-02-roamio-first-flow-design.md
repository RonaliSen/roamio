# Roamio — First Flow Design

**Date:** 2026-09-02
**Scope:** Foundation + design system + Supabase (local) + auth + the Home → Trip Dashboard happy path with mock data.
**Source plan:** `Roamio_Angular_Complete_Product_Build_Plan.pdf` (Angular Build Plan). This spec records the decisions made when turning that plan into an implementable first milestone.

## Decisions locked

| Choice | Decision | Note |
|---|---|---|
| Framework | Angular 20 (standalone, Signals + RxJS) | Plan as written. The earlier `create-next-app` scaffold is discarded. |
| First target | Full first flow: Home → Discover → Destination (Prague) → Build My Trip → Trip Dashboard | Larger than the plan's Milestone 1 (which stops at Home). |
| Backend | Supabase local dev (Supabase CLI + Docker) | Cloud project added later by pasting keys. |
| Auth | Required. Route guards on everything past `/` and `/login`. | Email + password. |
| AI | Deferred (plan Phase 12). NL search uses deterministic keyword matching over fixtures. | No API key, no proxy route this pass. |
| Real APIs (weather, maps, currency) | Deferred (plan Phase 2). Fixtures now. | Trips/days/activities/budget DO persist to Supabase. |

## Stack

- **Angular 20** standalone components, lazy `loadComponent` routes.
- **Tailwind v4** via `@tailwindcss/postcss`. Design tokens in Tailwind config.
- **Fonts:** `@fontsource` self-hosted — Cormorant Garamond (display), Inter (UI). Offline-safe.
- **Icons:** `lucide-angular`.
- **Lint/format:** Angular ESLint + Prettier.
- **State:** Signals for synchronous UI state; RxJS for async streams, HTTP, debounce, cancellation.
- **Unit test:** `ng new` default (Jasmine/Karma).
- **E2E:** Playwright.
- Project scaffolded at repo root (`/Users/ronalisenapati/Ronali/Roamio`).

## Architecture

Folder tree per plan §4:

```
src/app/
  core/{auth,guards,interceptors,services}
  shared/{components,ui,pipes,directives}
  features/{home,discover,destinations,trips,itinerary,weather,budget,wardrobe,outfits,packing}
  layout/{navbar,mobile-nav}
  app.routes.ts
```

**Data layer:** one service class per domain in `core/services`. Methods return `Observable<T>`. Bodies return `of(fixture)` this pass; swapped to Supabase queries in a later pass — a small diff, no interface indirection (YAGNI, single implementation).

- Fixture-backed this pass: destinations, activities, weather forecasts.
- Supabase-backed this pass: profiles, trips, trip_days, activities (write), budgets.

**No HTTP interceptor yet** — `supabase-js` manages its own auth headers and there is no other REST API to intercept. Add one when a real REST API lands (plan Phase 2).

## Supabase (local)

- `supabase` devDep. `npx supabase init` then `npx supabase start` (Docker).
- Local API URL and anon key are static/well-known for the local stack; stored in `src/environments/environment.ts`.
- `@supabase/supabase-js` client wrapper in `core/auth/`.
- **Migrations** (`supabase/migrations/`): `profiles`, `destinations`, `trips`, `trip_days`, `activities`, `budgets`, `wardrobe_items`, `outfits`, `outfit_items`, `packing_items`. `users` is `auth.users`. All ten user-owned tables created now even where unused this pass, so the schema is coherent.
- **RLS:** enabled on every user-owned table. Owner-only policies keyed on `auth.uid()` for select/insert/update/delete. `destinations` is read-only reference data (no owner; public read).
- **Auth:** email + password via `supabase.auth`. `authGuard` (CanActivate) on all routes except `/` and `/login`; unauthenticated access redirects to `/login`.

## First-flow routes

| Route | Guard | Content |
|---|---|---|
| `/` Home | public | Cinematic hero, natural-language destination input, Travel Edit inspiration section, recommended destination cards, footer. Responsive navbar + mobile-nav. |
| `/login` | public | Email/password sign in + sign up. |
| `/discover` | auth | Search + filters (budget / duration / style / weather). Result cards. Loading / empty / error states. Deterministic filtering over fixtures. |
| `/destinations/:slug` | auth | Hero, at-a-glance stats, best time to visit, weather preview, budget estimate, experiences list, itinerary preview, "Build My Trip" CTA. |
| `/trips/new` | auth | Progressive wizard: destination (prefilled) → dates → travelers → budget → interests. Draft persisted to `localStorage`. On finish: insert `trips` + `trip_days` + `budgets` rows, redirect to `/trips/:id`. |
| `/trips/:id` Trip Dashboard | auth | Overview + readiness score. Sections: **Itinerary** (day timeline, activity CRUD, CDK drag/drop reorder, persisted), **Weather** (fixture forecast + decision-oriented recommendations), **Budget** (breakdown + interactive slider + deterministic recompute). **Wardrobe** and **Packing** render "coming soon" stubs. |

## Deterministic engines

Pure functions in `core/services` (or `shared`), unit-tested:

- **Budget:** `total = accommodation + transport + food + activities + localTransport + shopping`. Currency handling: single trip currency, formatted for display.
- **Readiness score:** weighted percentage over signals `{ dates set, itinerary has ≥1 activity per day, budget within target }`.
- **Weather recommendations:** cold → add layer; high rain probability → prioritize waterproof; walking-heavy itinerary → comfortable footwear. Feeds display recommendations only this pass (wardrobe/packing consumers are later).

Out of scope this pass: outfit engine, packing engine, wardrobe CRUD, image upload, AI, real weather/maps/currency APIs, deployment.

## Design system

- **Color tokens** (Tailwind config): Warm Ivory `#F7F4EE`, Surface `#EFEBE3`, Charcoal `#20201E`, Muted Taupe `#777269`, Champagne `#B5A07A`, White `#FFFFFF`.
- **Typography:** Cormorant Garamond for editorial headings, Inter for compact UI/body text.
- **Primitives** in `shared/ui`: Button, Input, SearchField, Card, Tabs, Modal (CDK overlay), Skeleton, Toast (CDK). Navbar + MobileNav in `layout/`.
- Accessibility: semantic HTML, visible focus states, keyboard-navigable dialogs/menus, `prefers-reduced-motion` support, contrast-checked tokens.

## Testing

- **Unit:** budget engine, readiness score, weather rules, discover filter.
- **Component:** wizard step validation, search/filter UI, destination card.
- **E2E:** one Playwright critical-path spec — Home → Discover → Prague → Build Trip → Itinerary → Budget → Dashboard.

## Build order (→ commits)

1. `chore: initialize Roamio Angular project` — scaffold + tooling + Tailwind + fonts + folder architecture
2. `feat: add Roamio design system` — tokens + UI primitives + navbar/mobile-nav
3. `feat: add Supabase local backend and auth` — CLI init, client, schema migrations, RLS, authGuard, login page
4. `feat: build luxury landing page`
5. `feat: add destination discovery`
6. `feat: add destination details`
7. `feat: add trip creation flow`
8. `feat: add itinerary planner`
9. `feat: add weather and budget`
10. `feat: add trip dashboard shell` — readiness score + wardrobe/packing stubs
11. `test: add unit engines and e2e critical path`
12. `docs: add architecture documentation`

## Git

`git init` at repo root. Small meaningful commits using the prefixes above (`feat`, `fix`, `chore`, `refactor`, `test`, `perf`, `docs`). `main` stays deployable.
