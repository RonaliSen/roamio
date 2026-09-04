# ROAMIO

*Every journey, considered.*

A luxury travel concierge app — discovery, itinerary planning, weather-aware
packing advice, and budget tracking in one place. Built as a portfolio piece
to show a full Angular + Supabase product slice end to end: real auth, a real
schema with row-level security, deterministic budget/readiness/weather
engines, and a tested critical user path from landing page to a live trip
dashboard.

**Stack:** Angular 20 (standalone components, signals), RxJS, Tailwind CSS v4,
Supabase (Postgres + Auth + RLS), Playwright (e2e), Karma/Jasmine (unit).

## Prerequisites

- Node 22
- Docker (for local Supabase)
- npm

## Setup

```bash
npm install
npm run db:start   # starts local Supabase via Docker, prints a Studio URL
npm start          # dev server at http://localhost:4200
```

That's it — `src/environments/environment.ts` already has the local Supabase
URL and anon key (the well-known `supabase-demo` local dev key), so there's
no key-pasting step. It only ever talks to your local Supabase instance.

## Scripts

| Script | Description |
|---|---|
| `npm start` | Run the dev server (`ng serve`) at `localhost:4200` |
| `npm run build` | Production build to `dist/` |
| `npm run watch` | Dev-config build in watch mode |
| `npm test` | Unit tests (Karma/Jasmine) |
| `npm run lint` | ESLint (`ng lint`) |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run db:start` | Start local Supabase (Docker) |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset local DB and re-run migrations + seed |

## Running the tests

```bash
# unit tests, headless, full suite
npm test -- --watch=false --browsers=ChromeHeadless

# e2e (needs local Supabase running; Playwright starts the dev server itself)
npm run db:start
npm run e2e
```

## What's built / what's not yet

Built: destination discovery with filters, destination detail pages, a
5-step trip wizard, a persisted itinerary with drag-and-drop reordering,
weather-driven packing recommendations, an editable budget breakdown, a
trip dashboard with a readiness score, and email/password auth with RLS
so every user only ever sees their own trips.

Deferred (per the design spec — Phase 1 is mock-data-first): AI-assisted
planning, the wardrobe/outfit builder, packing-list generation, and real
weather/maps API integrations. Those areas currently show a stub or use
fixture data. See [`docs/architecture.md`](docs/architecture.md) for the
full picture, including which domains are fixture-backed vs Supabase-backed.
