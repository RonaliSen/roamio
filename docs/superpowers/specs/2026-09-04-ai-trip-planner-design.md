# Roamio — AI Trip Planner (Phase 2, Sub-project 1) Design

**Date:** 2026-09-04
**Scope:** Replace Home's natural-language entry point with an AI-driven trip-creation flow — intent extraction, feasibility check, destination recommendation, confirmation, itinerary generation — landing on the existing Trip Dashboard.
**Source docs:** `Roamio_Detailed_Implementation_User_Flow_AI_API.pdf` (product flow) and two mockup boards (18 screens) supplied by the user. This spec adapts both to what's actually buildable against the existing Phase 1 codebase without a real AI backend or a multi-destination data model.
**Builds on:** `docs/superpowers/specs/2026-09-02-roamio-first-flow-design.md` (Phase 1, shipped on `main`).

## Decisions locked

| Choice | Decision | Note |
|---|---|---|
| AI backend | None yet. `TripPlannerAiService` is deterministic (regex/keyword parsing, rule-based itinerary generation) behind a real-provider-shaped interface. | Swapping in a real Claude/OpenAI call later replaces only this service's internals. |
| Trip scope | Single-destination trips only, matching the existing schema/dashboard. | Multi-city travel-time/duration feasibility checks are explicitly out of scope. |
| Home integration | Home's NL input routes into the new flow instead of `/discover?q=`. The Discover grid page is untouched (manual browse stays). The manual trip wizard (`/trips/new`) is retired. | `/plan/confirm` calls the same `TripsService.create()` the wizard used, then generates + persists the itinerary. |
| Weather/cost data | Stays fixture-backed. Only intent-extraction and itinerary generation are "AI" (mocked). | Matches the original design spec's own Phase 2 ("real APIs") coming later. |
| Ambiguous region handling | Region words resolve deterministically against the fixture set's new `region` field. No interactive disambiguation dialog. | Deferred; note in architecture docs as future work. |

## Architecture — the AI boundary

One new service, `TripPlannerAiService` (`core/services/trip-planner-ai.service.ts`), with the interface a real provider would eventually fill:

```ts
analyzeIntent(message: string, known: Partial<TripIntent>): TripIntent
generateItinerary(intent: TripIntent, destination: Destination): GeneratedDay[]
```

Both are implemented deterministically this pass but return the exact structured shapes a real AI call would (per the PDF's own `/api/trip/analyze` JSON contract). Everything downstream — feasibility, recommendation scoring, budget, itinerary validation — is deterministic application logic, per the product rule: *AI handles language understanding and subjective recommendations; application logic handles hard rules and calculations.*

## Data model additions

- `Destination` (fixture + Supabase `destinations` table, for schema parity) gains `region: 'Europe' | 'Asia' | 'Africa' | 'Americas' | 'Oceania'`.
- `TripIntent { region?: string; durationDays?: number; travelers?: number; month?: number; budget?: { amount: number; currency: string }; travelStyle: string[]; preferences: string[]; interests: string[]; missingInformation: string[]; confidence: number }`.
- `FeasibilityResult { status: 'green' | 'amber' | 'red'; estimatedCostRange: { low: number; high: number }; travelIntensity: 'relaxed' | 'balanced' | 'fast-paced'; weatherSuitable: boolean; reasons: string[]; alternatives?: { label: string; adjustedIntent: Partial<TripIntent> }[] }`.
- `DestinationMatch { destination: Destination; score: number; reasons: string[] }` — `score` is 0-100, shown as "match %".
- `GeneratedDay { dayIndex: number; activities: { title: string; category: string; startTime?: string; notes?: string }[] }`.

## Routes / flow

| Route | Screen | Guard |
|---|---|---|
| `/` (existing) | NL input now `router.navigate(['/plan'], { state: { message } })` instead of `/discover?q=` | public |
| `/plan/understand` | Parsed `TripIntent`, every field editable, "Looks right →" | auth |
| `/plan/feasibility` | Checklist loading animation → Green/Amber/Red result | auth |
| `/plan/recommendations` | Ranked `DestinationMatch[]` cards, match % + reasons | auth |
| `/destinations/:slug` (existing, extended) | Optional "Why Roamio recommends it" block when arriving from the flow | auth |
| `/plan/confirm` | Trip summary, all fields editable, "Build my itinerary →" | auth |
| `/trips/:id` (existing, unchanged) | Lands here once the itinerary is generated + persisted | auth |

`/trips/new` (the Phase 1 manual wizard route + component) is deleted. A `TripPlannerStore` (`core/services/trip-planner-store.service.ts`, signals) holds the in-progress `TripIntent` / chosen destination / feasibility result for the lifetime of the flow — nothing is persisted to Supabase until `/plan/confirm` actually creates the trip, per the product rule that the trip draft is only created after confirmation.

## Deterministic engines (new)

All pure, unit-tested like the Phase 1 engines (`budget.engine.ts`, `readiness.engine.ts`, etc.):

- `intent-parser.engine.ts` — `parseIntent(message: string): TripIntent`. Regex/keyword extraction: duration phrases ("4 days", "long weekend" → 3, "a week" → 7), month names, `€\d+` / "under €\d+" → budget, a fixed style/interest keyword list, region names matched against the new `Destination.region` values.
- `feasibility.engine.ts` — `checkFeasibility(intent: TripIntent, catalog: Destination[]): FeasibilityResult`. No destination chosen yet: filters the catalog by region/style/month; no matches → RED with relaxed-constraint alternatives (drop budget cap, widen month, drop style); matches exist but cheapest typical cost (via `estimateBudget`) exceeds requested budget × 1.15 → AMBER; else GREEN.
- `recommend.engine.ts` — `rankDestinations(intent: TripIntent, catalog: Destination[]): DestinationMatch[]`. Same filtering shape as `applyDiscoverFilters` but scores (style overlap + budget fit + month fit, weighted) and ranks instead of boolean-filtering.
- `itinerary-generator.engine.ts` — `generateItinerary(intent, destination, activities: Activity[]): GeneratedDay[]`. Distributes the destination's activity fixture across `durationDays` (round-robin, no day left empty if activities exist, respects `travelStyle`/`interests` where the fixture's `category` matches).
- `itinerary-validator.engine.ts` — `validateItinerary(days: GeneratedDay[]): { valid: boolean; repaired: GeneratedDay[] }`. Checks: every day has ≥1 activity if the destination has any fixture activities at all, no duplicate activity within a day. Repairs by reshuffling before reporting invalid (mirrors the PDF's "repair only the invalid portion" rule) — this generator is simple enough that invalid output is rare, but the pass exists so a future real-AI generator has a validator already wired in front of it.

## Out of scope this pass

Multi-destination/multi-city trips, a real AI provider/backend, real weather/maps/currency APIs, interactive ambiguous-region clarification, wardrobe/outfits/packing (separate sub-projects after this one), image upload, deployment.

## Testing

TDD on every new pure engine (mirrors Phase 1's `budget.engine.spec.ts` pattern). Every new component follows the 4-file standard (`.ts`/`.html`/`.css`/`.spec.ts`, no inline templates). One Playwright E2E test updates the Phase 1 critical path: Home NL input → Understand → Feasibility (green) → Recommendations → Destination detail → Confirm → generated itinerary visible on the Trip Dashboard — replacing the retired manual-wizard steps.

## Git

Branch `feat/ai-trip-planner`, forked from `main` (Phase 1). Small commits, `feat`/`fix`/`chore`/`refactor`/`test`/`docs` prefixes, no `Co-Authored-By` trailer (standing project rule). `main` stays deployable.
