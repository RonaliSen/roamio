# AI Trip Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Home's natural-language entry point with a deterministic-but-AI-shaped trip-creation flow (intent → feasibility → recommend → confirm → generated itinerary), retiring the manual wizard, landing on the existing Trip Dashboard.

**Architecture:** New pure engines (`intent-parser`, `feasibility`, `recommend`, `itinerary-generator`, `itinerary-validator`) mirror the Phase 1 engine pattern. A `TripPlannerAiService` wraps the two "AI-shaped" calls (`analyzeIntent`, `generateItinerary`) behind a real-provider-ready interface, implemented deterministically. A `TripPlannerStore` (signals) holds in-progress flow state client-side until `/plan/confirm` persists the trip via the existing `TripsService`.

**Tech Stack:** Same as Phase 1 — Angular 20 standalone, Signals + RxJS, Tailwind v4, Supabase, Jasmine/Karma, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-04-ai-trip-planner-design.md`

## Global Constraints

- Angular 20, standalone components only, `ChangeDetectionStrategy.OnPush`.
- Every component: 4 sibling files (`.ts` with `templateUrl`+`styleUrl`, `.html`, `.css`, `.spec.ts`). No inline `template:`/`styles:`, ever.
- Signals for sync state; RxJS for async only. `toSignal`/`computed` over manual `.subscribe` where practical.
- Business logic lives in `core/engines` (pure functions) or `core/services`, never in components.
- Tailwind v4 token classes only (`bg-ivory bg-surface bg-charcoal bg-white text-charcoal text-taupe text-white border-champagne border-taupe`, `font-display` `font-ui`). No hardcoded hex.
- Reuse existing primitives (`app-button`, `app-input`, `app-card`, `app-search-field`, `app-skeleton`, `app-tabs`, `app-modal`) — do not rebuild.
- Icons: `@lucide/angular` v1 attribute-selector API (`imports: [LucideX]`, `<svg lucideX>`).
- All new/guarded routes use the existing `authGuard`.
- **Commit messages carry NO `Co-Authored-By` trailer, anywhere.** Prefixes: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`.
- Single-destination trips only. No multi-city logic anywhere in this plan.
- No real AI provider, no real weather/maps/currency API calls. Fixtures stay the data source.

---

## File Structure

```
src/
  app/
    core/
      models/
        trip-intent.model.ts       # TripIntent, FeasibilityResult, DestinationMatch, GeneratedDay
      engines/
        intent-parser.engine.ts     # parseIntent
        feasibility.engine.ts       # checkFeasibility
        recommend.engine.ts         # rankDestinations
        itinerary-generator.engine.ts  # generateItinerary
        itinerary-validator.engine.ts  # validateItinerary
      services/
        trip-planner-ai.service.ts   # analyzeIntent / generateItinerary wrapper
        trip-planner-store.service.ts # signals: intent, chosenDestination, feasibility, matches
    features/
      home/home.component.ts        # MODIFIED: search routes to /plan
      plan/
        understand/understand.component.ts
        feasibility/feasibility.component.ts
        recommendations/recommendations.component.ts
        confirm/confirm.component.ts
      destinations/destination-detail.component.ts  # MODIFIED: recommendation-context block
      trips/trip-wizard.component.{ts,html,css,spec.ts}  # DELETED
    fixtures/
      destinations.fixture.ts        # MODIFIED: region field
    app.routes.ts                    # MODIFIED: /plan/* routes, /trips/new removed
supabase/
  migrations/
    0004_add_destination_region.sql  # NEW
e2e/
  critical-path.spec.ts              # MODIFIED: new flow replaces wizard steps
docs/
  architecture.md                    # MODIFIED
```

---

### Task 1: Destination region + new domain models

**Files:**
- Create: `supabase/migrations/0004_add_destination_region.sql`, `src/app/core/models/trip-intent.model.ts`
- Modify: `src/app/fixtures/destinations.fixture.ts`, `src/app/core/models/destination.model.ts`

**Interfaces:**
- Produces: `Destination.region: 'Europe' | 'Asia' | 'Africa' | 'Americas' | 'Oceania'` (new required field). `TripIntent`, `FeasibilityResult`, `DestinationMatch`, `GeneratedDay` (see spec for exact shapes).

- [ ] **Step 1:** Add `region` to `destination.model.ts`:

```ts
export type Region = 'Europe' | 'Asia' | 'Africa' | 'Americas' | 'Oceania';

export interface Destination {
  slug: string;
  name: string;
  country: string;
  region: Region;
  summary: string;
  heroImage: string;
  bestMonths: number[];
  styleTags: string[];
  dailyBudgetLow: number;
  dailyBudgetHigh: number;
}
```

- [ ] **Step 2:** Update `destinations.fixture.ts` — add `region` to all 6 entries: prague/lisbon/amalfi → `'Europe'`, kyoto → `'Asia'`, reykjavik → `'Europe'` (Iceland is geographically transitional but culturally/touristically marketed as European — use `'Europe'`), marrakech → `'Africa'`.

- [ ] **Step 3:** `supabase/migrations/0004_add_destination_region.sql`:

```sql
alter table destinations add column region text not null default 'Europe';

update destinations set region = 'Asia' where slug = 'kyoto';
update destinations set region = 'Africa' where slug = 'marrakech';
-- prague, lisbon, amalfi, reykjavik keep the 'Europe' default
```

- [ ] **Step 4:** Create `src/app/core/models/trip-intent.model.ts`:

```ts
import type { Destination } from './destination.model';

export interface TripIntent {
  region?: string;
  durationDays?: number;
  travelers?: number;
  month?: number; // 1-12
  budget?: { amount: number; currency: string };
  travelStyle: string[];
  preferences: string[];
  interests: string[];
  missingInformation: string[];
  confidence: number; // 0-1
}

export interface FeasibilityResult {
  status: 'green' | 'amber' | 'red';
  estimatedCostRange: { low: number; high: number };
  travelIntensity: 'relaxed' | 'balanced' | 'fast-paced';
  weatherSuitable: boolean;
  reasons: string[];
  alternatives?: { label: string; adjustedIntent: Partial<TripIntent> }[];
}

export interface DestinationMatch {
  destination: Destination;
  score: number; // 0-100
  reasons: string[];
}

export interface GeneratedActivity {
  title: string;
  category: string;
  startTime?: string;
  notes?: string;
}

export interface GeneratedDay {
  dayIndex: number;
  activities: GeneratedActivity[];
}
```

- [ ] **Step 5:** Apply migration: `npm run db:reset`. Verify: `region` column exists, kyoto='Asia', marrakech='Africa', rest='Europe'.

- [ ] **Step 6:** `npm run build` + `npm run lint` + full test suite green (no test changes yet, just confirming nothing broke from the `Destination` shape change — check every fixture/mock literal that builds a `Destination` object across the codebase now includes `region`, or TS will fail the build).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add destination region and trip-planner domain models"
```

---

### Task 2: Intent parser engine (pure, TDD)

**Files:**
- Create: `src/app/core/engines/intent-parser.engine.ts`
- Test: `src/app/core/engines/intent-parser.engine.spec.ts`

**Interfaces:**
- Produces: `parseIntent(message: string): TripIntent`

- [ ] **Step 1: Write the failing tests:**

```ts
import { parseIntent } from './intent-parser.engine';

describe('parseIntent', () => {
  it('extracts duration, month, budget, style and region', () => {
    const intent = parseIntent('I want a romantic 4-day trip somewhere warm in Europe in October under €900.');
    expect(intent.durationDays).toBe(4);
    expect(intent.month).toBe(10);
    expect(intent.budget).toEqual({ amount: 900, currency: 'EUR' });
    expect(intent.travelStyle).toContain('romantic');
    expect(intent.preferences).toContain('warm');
    expect(intent.region).toBe('Europe');
    expect(intent.confidence).toBeGreaterThan(0.5);
  });

  it('parses "long weekend" and "a week" as day counts', () => {
    expect(parseIntent('a long weekend somewhere beautiful').durationDays).toBe(3);
    expect(parseIntent('a week in Asia').durationDays).toBe(7);
  });

  it('returns low confidence and missingInformation for a vague request', () => {
    const intent = parseIntent('I want somewhere beautiful for a long weekend');
    expect(intent.missingInformation.length).toBeGreaterThan(0);
    expect(intent.confidence).toBeLessThan(0.6);
  });

  it('never invents a budget or region that was not mentioned', () => {
    const intent = parseIntent('somewhere nice');
    expect(intent.budget).toBeUndefined();
    expect(intent.region).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- --watch=false --include='**/intent-parser.engine.spec.ts'` — FAIL (module not found).

- [ ] **Step 3: Implement `intent-parser.engine.ts`** — pure, no Angular imports:
  - Duration: regex for `\d+[\s-]?day`, a lookup table for phrases (`weekend`→3, `long weekend`→3, `a week`/`one week`→7, `two weeks`/`fortnight`→14).
  - Month: match full month names case-insensitively against a `MONTH_NAMES` array (index+1 = month number).
  - Budget: regex `€\s?(\d+)` or `(\d+)\s?(EUR|euros?)` → `{ amount, currency: 'EUR' }`. Only set if a number is actually present — never default.
  - Region: match against the fixed list `['Europe','Asia','Africa','Americas','Oceania']` case-insensitively as whole words.
  - Style/preferences/interests: three small fixed keyword lists (style: romantic, relaxing, adventure, cultural, luxury; preferences: warm, cold, coastal, quiet, beautiful, food; interests: food, beaches, culture, nature, nightlife, shopping) — each matched word appended to the corresponding array (dedupe).
  - `confidence`: start at `0.5`, `+0.15` for each of {durationDays, month, budget, region} present, capped at `0.95`.
  - `missingInformation`: array of field names (`'dates'`, `'budget'`, `'destination'`) that are `undefined`/empty after parsing — used later by the Understand screen to highlight what to ask about.

- [ ] **Step 4: Run to verify it passes.** Expected: all 4 `it`s PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add intent parser engine"
```

---

### Task 3: Feasibility engine (pure, TDD)

**Files:**
- Create: `src/app/core/engines/feasibility.engine.ts`
- Test: `src/app/core/engines/feasibility.engine.spec.ts`

**Interfaces:**
- Consumes: `TripIntent` (Task 2), `Destination[]` (fixtures), `estimateBudget`/`computeBudgetTotal` (Phase 1 `budget.engine.ts`).
- Produces: `checkFeasibility(intent: TripIntent, catalog: Destination[]): FeasibilityResult`

- [ ] **Step 1: Write the failing tests:**

```ts
import { checkFeasibility } from './feasibility.engine';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

describe('checkFeasibility', () => {
  it('is green when the intent matches an affordable, in-season destination', () => {
    // Prague: Europe, budget 90-180/day, bestMonths include 4,5,6,9
    const r = checkFeasibility(
      { region: 'Europe', month: 5, durationDays: 4, travelers: 2, budget: { amount: 900, currency: 'EUR' }, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('green');
  });

  it('is red when no destination satisfies the constraints', () => {
    const r = checkFeasibility(
      { region: 'Oceania', travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('red');
    expect(r.alternatives?.length).toBeGreaterThan(0);
  });

  it('is amber when matches exist but the budget is tight', () => {
    const r = checkFeasibility(
      { region: 'Europe', month: 5, durationDays: 4, travelers: 2, budget: { amount: 300, currency: 'EUR' }, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('amber');
  });
});
```

- [ ] **Step 2: Run to verify it fails.** FAIL.

- [ ] **Step 3: Implement `feasibility.engine.ts`:**
  - `candidates = catalog.filter(d => (!intent.region || d.region === intent.region) && (!intent.month || d.bestMonths.includes(intent.month)))`.
  - If `candidates.length === 0` → `{ status: 'red', estimatedCostRange: {low:0,high:0}, travelIntensity:'relaxed', weatherSuitable:false, reasons:['No destinations match your region/month combination.'], alternatives: buildAlternatives(intent) }` where `buildAlternatives` returns up to 2 entries like `{ label: 'Try a different month', adjustedIntent: { month: undefined } }` and `{ label: 'Try a different region', adjustedIntent: { region: undefined } }`.
  - Else compute `cheapest = min(candidates.map(d => estimateBudget(d.dailyBudgetLow, d.dailyBudgetHigh, intent.durationDays ?? 4, intent.travelers ?? 1)).map(computeBudgetTotal))` and `costRange = { low: min(...dailyBudgetLow-based estimates), high: max(...dailyBudgetHigh-based estimates) }` across candidates.
  - If `intent.budget` present and `intent.budget.amount < cheapest`: `status: intent.budget.amount < cheapest * 0.85 ? 'red' : 'amber'`, reasons explain the gap.
  - Else `status: 'green'`.
  - `travelIntensity`: `'relaxed'` if `durationDays >= 4 || !durationDays`, `'balanced'` if `durationDays` in `[2,3]`, `'fast-paced'` if `durationDays <= 1` (single-destination, so this is a soft signal only — no multi-city calculation).
  - `weatherSuitable`: `true` unless `intent.month` set and NO candidate has it in `bestMonths` (already filtered out above, so effectively `candidates.length > 0` implies weather-suitable when month was specified).

- [ ] **Step 4: Run to verify it passes.** Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add feasibility engine"
```

---

### Task 4: Recommendation scoring engine (pure, TDD)

**Files:**
- Create: `src/app/core/engines/recommend.engine.ts`
- Test: `src/app/core/engines/recommend.engine.spec.ts`

**Interfaces:**
- Produces: `rankDestinations(intent: TripIntent, catalog: Destination[]): DestinationMatch[]` — sorted descending by `score`.

- [ ] **Step 1: Write the failing tests:**

```ts
import { rankDestinations } from './recommend.engine';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

describe('rankDestinations', () => {
  it('ranks region+month+budget matches above non-matches', () => {
    const results = rankDestinations(
      { region: 'Europe', month: 5, budget: { amount: 1000, currency: 'EUR' }, travelStyle: ['romantic'], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(results[0].destination.region).toBe('Europe');
    expect(results.every((r, i) => i === 0 || r.score <= results[i - 1].score)).toBe(true);
  });

  it('gives every candidate a reason list explaining the score', () => {
    const results = rankDestinations({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, DESTINATIONS);
    expect(results[0].reasons.length).toBeGreaterThan(0);
  });

  it('includes all catalog destinations when the intent has no constraints', () => {
    const results = rankDestinations({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, DESTINATIONS);
    expect(results.length).toBe(DESTINATIONS.length);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** FAIL.

- [ ] **Step 3: Implement `recommend.engine.ts`:**
  - Base score `50` for every candidate.
  - `+20` if `!intent.region || d.region === intent.region`.
  - `+15` if `!intent.month || d.bestMonths.includes(intent.month)`.
  - `+15 * (overlap(intent.travelStyle + intent.preferences + intent.interests, d.styleTags) / max(1, (intent.travelStyle+preferences+interests).length))`.
  - Budget fit: if `intent.budget` present, `-10` if the destination's `dailyBudgetLow` implies a total (via `estimateBudget`+`computeBudgetTotal`, default 4 nights/2 travelers if `durationDays`/`travelers` absent) exceeds `intent.budget.amount * 1.1`.
  - Clamp `0..100`, round to integer.
  - `reasons`: push a human-readable string per positive contribution (e.g. `'In your preferred region'`, `'Great weather in your travel month'`, `'Matches your romantic style'`) — at least one reason always present (fall back to `'A popular Roamio pick'` if no signals matched).
  - Sort descending by score.

- [ ] **Step 4: Run to verify it passes.** Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add destination recommendation scoring engine"
```

---

### Task 5: Itinerary generator + validator engines (pure, TDD)

**Files:**
- Create: `src/app/core/engines/itinerary-generator.engine.ts`, `src/app/core/engines/itinerary-validator.engine.ts`
- Test: `src/app/core/engines/itinerary-generator.engine.spec.ts`, `src/app/core/engines/itinerary-validator.engine.spec.ts`

**Interfaces:**
- Consumes: `TripIntent`, `Destination`, `Activity[]` (Phase 1 reference-activity fixture shape: `{title, category, durationHours, walkingIntensity}`).
- Produces: `generateItinerary(intent: TripIntent, destination: Destination, activities: Activity[]): GeneratedDay[]`, `validateItinerary(days: GeneratedDay[]): { valid: boolean; repaired: GeneratedDay[] }`.

- [ ] **Step 1: Write the failing tests:**

```ts
// itinerary-generator.engine.spec.ts
import { generateItinerary } from './itinerary-generator.engine';
import { ACTIVITIES } from '../../fixtures/activities.fixture';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

describe('generateItinerary', () => {
  const prague = DESTINATIONS.find(d => d.slug === 'prague')!;
  it('produces one entry per requested day', () => {
    const days = generateItinerary({ durationDays: 3, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 }, prague, ACTIVITIES['prague']);
    expect(days.length).toBe(3);
    expect(days.map(d => d.dayIndex)).toEqual([0, 1, 2]);
  });
  it('gives every day at least one activity when activities exist', () => {
    const days = generateItinerary({ durationDays: 4, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 }, prague, ACTIVITIES['prague']);
    expect(days.every(d => d.activities.length > 0)).toBe(true);
  });
  it('defaults to 4 days when durationDays is absent', () => {
    const days = generateItinerary({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, prague, ACTIVITIES['prague']);
    expect(days.length).toBe(4);
  });
});
```

```ts
// itinerary-validator.engine.spec.ts
import { validateItinerary } from './itinerary-validator.engine';

describe('validateItinerary', () => {
  it('is valid when every day has at least one unique activity', () => {
    const days = [{ dayIndex: 0, activities: [{ title: 'A', category: 'x' }] }, { dayIndex: 1, activities: [{ title: 'B', category: 'y' }] }];
    expect(validateItinerary(days).valid).toBe(true);
  });
  it('repairs an empty day by borrowing from the largest neighboring day', () => {
    const days = [{ dayIndex: 0, activities: [{ title: 'A', category: 'x' }, { title: 'B', category: 'y' }] }, { dayIndex: 1, activities: [] }];
    const { valid, repaired } = validateItinerary(days);
    expect(valid).toBe(false);
    expect(repaired.every(d => d.activities.length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify they fail.** FAIL (both).

- [ ] **Step 3: Implement.**
  - `generateItinerary`: `n = intent.durationDays ?? 4`. Round-robin distribute `activities` across `n` days (`activities[i % n]` grouped by `Math.floor(i / n)`... simplest: `for (i, a) of activities.entries()) days[i % n].activities.push({title:a.title, category:a.category})`). If `activities.length === 0`, every day gets `activities: []` (validator will flag, generator itself doesn't need to fabricate content). Cap at 4 activities per day max (if more available, distribute the rest to whichever day currently has fewest).
  - `validateItinerary`: `valid = days.every(d => d.activities.length > 0 || totalActivitiesAcrossAllDays === 0)`. If invalid, `repaired` = a shallow copy where any empty day borrows the last activity from the day with the most activities (simple redistribution), never fabricating new activity data.

- [ ] **Step 4: Run to verify they pass.** Expected: all 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add itinerary generator and validator engines"
```

---

### Task 6: TripPlannerAiService + TripPlannerStore

**Files:**
- Create: `src/app/core/services/trip-planner-ai.service.ts`, `src/app/core/services/trip-planner-store.service.ts`
- Test: `src/app/core/services/trip-planner-ai.service.spec.ts`, `src/app/core/services/trip-planner-store.service.spec.ts`

**Interfaces:**
- Consumes: `parseIntent` (Task 2), `generateItinerary`+`validateItinerary` (Task 5).
- Produces:
  - `TripPlannerAiService` (`providedIn:'root'`): `analyzeIntent(message: string): TripIntent` (delegates to `parseIntent`), `generateItinerary(intent: TripIntent, destination: Destination, activities: Activity[]): GeneratedDay[]` (delegates to `generateItinerary` then `validateItinerary`, returns `repaired` if invalid else the raw result).
  - `TripPlannerStore` (`providedIn:'root'`): signals `intent = signal<TripIntent | null>(null)`, `chosenDestination = signal<Destination | null>(null)`, `feasibility = signal<FeasibilityResult | null>(null)`, `matches = signal<DestinationMatch[]>([])`; methods `setIntent(i)`, `patchIntent(patch: Partial<TripIntent>)`, `setFeasibility(f)`, `setMatches(m)`, `chooseDestination(d)`, `reset()`.

- [ ] **Step 1: Write failing tests:**

```ts
// trip-planner-ai.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { TripPlannerAiService } from './trip-planner-ai.service';

describe('TripPlannerAiService', () => {
  it('analyzeIntent delegates to the intent parser', () => {
    const svc = TestBed.inject(TripPlannerAiService);
    expect(svc.analyzeIntent('4 days in Europe').durationDays).toBe(4);
  });
});
```

```ts
// trip-planner-store.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { TripPlannerStore } from './trip-planner-store.service';

describe('TripPlannerStore', () => {
  it('patches the intent without clobbering unrelated fields', () => {
    const store = TestBed.inject(TripPlannerStore);
    store.setIntent({ region: 'Europe', travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 });
    store.patchIntent({ durationDays: 5 });
    expect(store.intent()).toEqual(jasmine.objectContaining({ region: 'Europe', durationDays: 5 }));
  });
  it('reset clears every signal', () => {
    const store = TestBed.inject(TripPlannerStore);
    store.setIntent({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 });
    store.reset();
    expect(store.intent()).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail.** FAIL.

- [ ] **Step 3: Implement both services** as thin wrappers per the interfaces above.

- [ ] **Step 4: Run to verify they pass.** Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add trip planner AI service and store"
```

---

### Task 7: Home update — route NL search into the flow

**Files:**
- Modify: `src/app/features/home/home.component.ts`, `.html`, `.spec.ts`

**Interfaces:**
- Consumes: `Router`.
- Modifies: `onSearch(term: string)` — was `router.navigate(['/discover'], { queryParams: { q: term } })`, becomes `router.navigate(['/plan/understand'], { state: { message: term } })`.

- [ ] **Step 1: Update the existing `home.component.spec.ts` test** (it currently asserts the `/discover` navigation) to assert the new target: `expect(nav).toHaveBeenCalledWith(['/plan/understand'], { state: { message: 'prague in spring' } })`.

- [ ] **Step 2: Run to verify it fails** against the old implementation.

- [ ] **Step 3: Update `onSearch`** to the new navigation call. Leave the "Travel Edit" and "Recommended for you" sections untouched — those still link to `/discover` and `/destinations/:slug` directly (manual browse path, unaffected by this plan).

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: route home search into the AI trip planner flow"
```

---

### Task 8: Understand screen

**Files:**
- Create: `src/app/features/plan/understand/understand.component.{ts,html,css,spec.ts}`
- Modify: `src/app/app.routes.ts` (add `/plan/understand`)

**Interfaces:**
- Consumes: `Router` (reads `history.state.message`), `TripPlannerAiService.analyzeIntent`, `TripPlannerStore`.
- Produces: route `/plan/understand`, auth-guarded.

- [ ] **Step 1: Write failing test:**

```ts
it('parses the incoming message into an editable intent on init', () => {
  // Router stubbed with getCurrentNavigation()/history.state.message = 'romantic 4 days in Europe'
  fixture.detectChanges();
  expect(component.form.value.durationDays).toBe(4);
});
it('looks-right navigates to /plan/feasibility and stores the intent', () => {
  fixture.detectChanges();
  component.confirm();
  expect(store.intent()).toBeTruthy();
  expect(nav).toHaveBeenCalledWith(['/plan/feasibility']);
});
```

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement.** On init: read `message` from router state (via `this.router.getCurrentNavigation()?.extras.state?.['message']` at construction time, or `inject(Router).lastSuccessfulNavigation`/a stored value — Angular router navigation `extras.state` is only available synchronously during navigation, so read it in the constructor, not `ngOnInit`); if absent, fall back to an empty message (user typed nothing, still show an empty editable form). Call `aiService.analyzeIntent(message)` → seed a reactive form with the parsed fields (`region`, `durationDays`, `travelers`, `month`, `budget.amount`, `travelStyle` as chips, `preferences`/`interests` as chips). Every field editable — reuse `<app-input>` for text/number fields, a `<select>` for month/region, a simple chip-add UI for style/preferences/interests (a text input + "Add" button appending to an array, each chip removable — no new shared component needed, keep it local to this component). "Looks right →" button (`confirm()`): builds a `TripIntent` from the current form values, `store.setIntent(intent)`, navigates to `/plan/feasibility`.

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5:** Add the route to `app.routes.ts`: `{ path: 'plan/understand', canActivate: [authGuard], loadComponent: () => import('./features/plan/understand/understand.component').then(m => m.UnderstandComponent) }`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add trip-intent understanding screen"
```

---

### Task 9: Feasibility screen

**Files:**
- Create: `src/app/features/plan/feasibility/feasibility.component.{ts,html,css,spec.ts}`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `TripPlannerStore.intent`, `checkFeasibility` (Task 3), `DestinationsService.list()`.
- Produces: route `/plan/feasibility`, auth-guarded.

- [ ] **Step 1: Write failing test:** given a store-seeded intent that matches Prague (region Europe, month 5), the component computes a `green` result and shows a "Show destinations →" CTA; given an intent with no matches, shows `red` with alternative suggestions as clickable chips that patch the intent and re-run feasibility.

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement.** If `store.intent()` is `null` (direct navigation, no flow in progress), redirect to `/`. Otherwise: a brief `<app-skeleton>`-based "Checking your trip..." loading state (a fixed ~600ms `setTimeout` purely for UX pacing — this is instant deterministic computation, the delay is cosmetic, matching the mockups' checklist animation; use a signal `checking = signal(true)` flipped off in the timeout), then compute `checkFeasibility(intent, destinations)` and `store.setFeasibility(result)`. Render per `status`: green → cost range, travel intensity, weather line, "Show destinations →" button navigating `/plan/recommendations`; amber → same info plus "Adjust trip" (back to understand) and "Continue anyway" (also proceeds to recommendations) buttons; red → reasons + alternative chips (clicking one calls `store.patchIntent(alt.adjustedIntent)` and re-runs the check in place) plus "Modify my request" (back to `/plan/understand`).

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5:** Add route `{ path: 'plan/feasibility', canActivate: [authGuard], loadComponent: ... }`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add feasibility check screen"
```

---

### Task 10: Recommendations screen

**Files:**
- Create: `src/app/features/plan/recommendations/recommendations.component.{ts,html,css,spec.ts}`
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `TripPlannerStore.intent`, `rankDestinations` (Task 4), `DestinationsService.list()`.
- Produces: route `/plan/recommendations`, auth-guarded.

- [ ] **Step 1: Write failing test:** renders ranked cards with match % and at least one reason each; clicking "Choose destination" on a card calls `store.chooseDestination(d)` and navigates to `/destinations/:slug` with a query param flagging planner context (`{ queryParams: { fromPlan: '1' } }`).

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement.** If `store.intent()` is `null`, redirect to `/`. `matches = computed` or set once via `rankDestinations(store.intent(), destinations)` on init, `store.setMatches(matches)`. Cards (`<app-card>`): hero image, name, country, `{{match.score}}% match`, up to 2 `reasons` as small text, budget line. "Choose destination" per card.

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5:** Add route.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add destination recommendations screen"
```

---

### Task 11: Destination detail — recommendation context block

**Files:**
- Modify: `src/app/features/destinations/destination-detail.component.{ts,html,spec.ts}`

**Interfaces:**
- Consumes: `TripPlannerStore.matches` (to find this destination's `reasons`), `ActivatedRoute` query param `fromPlan`.
- Produces: when `fromPlan=1` and a matching `DestinationMatch` exists in the store, render a "Why Roamio recommends it" section (the match's `reasons`) above the existing content. When absent (direct/manual navigation from Discover), render nothing extra — existing behavior fully preserved.

- [ ] **Step 1: Write failing test:** with a store pre-seeded with a match for the resolved slug and `fromPlan=1` in the route, the "Why Roamio recommends it" heading and its reasons render; without `fromPlan`, it does not.

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement** the conditional block. "Build My Trip" CTA behavior is UNCHANGED by this task (still calls `buildTrip()` navigating to a trip-creation route) — Task 12 changes where that route points.

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: show recommendation context on destination detail"
```

---

### Task 12: Confirm screen — creates the trip and generates the itinerary

**Files:**
- Create: `src/app/features/plan/confirm/confirm.component.{ts,html,css,spec.ts}`
- Modify: `src/app/app.routes.ts`, `src/app/features/destinations/destination-detail.component.ts` (`buildTrip()` target)

**Interfaces:**
- Consumes: `TripPlannerStore`, `TripsService.create()`/`addActivity()`, `TripPlannerAiService.generateItinerary()`, `ActivitiesService`, `estimateBudget`.
- Produces: route `/plan/confirm`, auth-guarded. On success: navigates `/trips/:id`.

- [ ] **Step 1: Write failing test:** given a store with `intent` + `chosenDestination` set, clicking "Build my itinerary →" calls `TripsService.create(...)` with a `CreateTripInput` built from the intent/destination, then for each generated day calls `TripsService.addActivity` for each activity, then navigates to `/trips/<new id>`; on any failure, shows a toast and stays on the screen.

- [ ] **Step 2: Run to verify it fails.**

- [ ] **Step 3: Implement.**
  - If `store.chosenDestination()` is `null`, redirect to `/`.
  - Compute dates: today + a nominal offset (e.g. 30 days out) for `startDate`, `+durationDays` for `endDate` (no date picker in this flow per the mockups — dates are implied by duration; this is a deliberate simplification, note it in a code comment). Editable "Adjust dates" affordance is OUT OF SCOPE for this task — ship the computed dates as-is (YAGNI; can be added later without touching this task's persistence logic).
  - Show: destination name/image, computed dates, travelers, budget estimate (`estimateBudget` → `computeBudgetTotal`), style/interests as chips — all read-only summary (editing goes back through Understand).
  - "Build my itinerary →" (`buildTrip()`):
    1. `budget = estimateBudget(dest.dailyBudgetLow, dest.dailyBudgetHigh, intent.durationDays ?? 4, intent.travelers ?? 1)`.
    2. `tripId = await tripsService.create({ destinationSlug, title: \`${dest.name} · ${startDate}\`, startDate, endDate, travelers, interests: intent.interests, currency: 'EUR', budget })`.
    3. `days = aiService.generateItinerary(intent, dest, activitiesForDestination)` (fetch via `ActivitiesService.listForDestination(dest.slug)` first).
    4. Fetch the newly created trip's `trip_days` via `tripsService.get(tripId)` (created in step 2's `datesInRange`-based insert) to get real `trip_day` ids, then for each `GeneratedDay` call `tripsService.addActivity(matchingTripDayId, activity)` for each of its activities (match by `dayIndex` position).
    5. `store.reset()`, `router.navigate(['/trips', tripId])`.
    - Wrap in try/catch: on failure, `toast.show(...)`, stay on screen, button re-enabled.
  - Update `destination-detail.component.ts`'s `buildTrip()`: instead of `router.navigate(['/trips/new'], { queryParams: { destination: slug } })`, now does `store.setIntent({ travelStyle:[], preferences:[], interests:[], missingInformation:[], confidence:1, durationDays: 4, travelers: 2 })` (sensible defaults since the user skipped the AI flow by picking a destination directly from Discover/Home-recommended), `store.chooseDestination(destination())`, `router.navigate(['/plan/confirm'])` — this reuses the SAME confirm screen instead of a separate manual path, per the "manual wizard retired" decision.

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5:** Add route. Delete `src/app/features/trips/trip-wizard.component.{ts,html,css,spec.ts}` and its route entry in `app.routes.ts`.

- [ ] **Step 6:** `npm run build` + `npm run lint` + full suite green — confirm nothing else referenced `TripWizardComponent`/`/trips/new`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add trip confirmation screen and retire the manual wizard"
```

---

### Task 13: E2E — update critical path

**Files:**
- Modify: `e2e/critical-path.spec.ts`

**Interfaces:**
- Consumes: the full new flow, running app + local Supabase.

- [ ] **Step 1:** Replace the wizard-driving steps (`Build my trip` → date/traveler/budget/interest `Next` clicks → `Create trip`) with the new flow: after sign-up, fill the Home search with a message that deterministically resolves to Prague being GREEN and top-ranked (e.g. `"4 days in Europe in May"` — matches Prague's `bestMonths` and `region`), submit, land on Understand (assert parsed duration is visible), click through to Feasibility (assert green state), to Recommendations (assert Prague card visible, click "Choose destination"), through the (now recommendation-flagged) destination detail page's "Build my trip" button — wait, actually per Task 12's `buildTrip()` reuse, both paths converge on `/plan/confirm`; from Recommendations "Choose destination" navigates to `/destinations/prague` first (per Task 10), THEN the existing "Build my trip" button proceeds — click it, land on Confirm, click "Build my itinerary →", assert redirect to `/trips/<uuid>` and readiness text visible, same as before.
- [ ] **Step 2:** Keep the itinerary-add-activity and budget-tab assertions from the existing test unchanged (Trip Dashboard behavior is untouched by this plan).
- [ ] **Step 3:** Run `npm run e2e` at least twice consecutively until green. Fix any real selector/timing issues found (same discipline as Phase 1 Task 20 — no weakened assertions, no arbitrary sleeps).
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: update e2e critical path for the AI trip planner flow"
```

---

### Task 14: Architecture docs update

**Files:**
- Modify: `docs/architecture.md`

- [ ] **Step 1:** Add a section documenting the new flow: routes table additions, the 5 new engines with signatures, the `TripPlannerAiService`/`TripPlannerStore` pair, and an updated AI-boundary paragraph — change it from "future, not built" to "implemented deterministically behind a provider-ready interface; no real AI call is made yet."
- [ ] **Step 2:** Update the route/guard table with the new `/plan/*` routes and the removal of `/trips/new`.
- [ ] **Step 3:** Verify every fact against the real repo before writing (same discipline as Phase 1 Task 21).
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: document the AI trip planner architecture"
```

---

## Self-Review

**1. Spec coverage:** Every section of the design spec maps to a task — AI boundary (6), data model (1), routes/flow (7-12), engines (2-5), out-of-scope items correctly absent, testing (13). No gaps.

**2. Placeholder scan:** No "TBD"/"TODO" left unresolved as a requirement (the one `// TODO` mentioned in Task 9's not-found-vs-loading style note doesn't apply here; Task 12's "editable dates out of scope" is a explicit, justified deferral, not a placeholder).

**3. Type consistency:** `TripIntent`/`FeasibilityResult`/`DestinationMatch`/`GeneratedDay` (Task 1) reused verbatim through Tasks 2-12. `Destination.region` (Task 1) consumed by Tasks 3, 4. `parseIntent`/`checkFeasibility`/`rankDestinations`/`generateItinerary`/`validateItinerary` signatures match between their defining tasks and every consumer task. `TripsService.create`/`addActivity` signatures (unchanged from Phase 1) match Task 12's usage.

## Notes for the executor

- Local Supabase must be running for Task 1's migration and Task 13's E2E.
- Task 12 is the most structurally important task — it's where the new flow and the existing `TripsService` persistence layer meet. Read `trips.service.ts` and the existing (soon-deleted) `trip-wizard.component.ts` carefully before writing it, to reuse the exact same creation/activity-adding pattern.
- Keep components OnPush, 4-file, `toSignal` over manual `subscribe`, per every Phase 1 convention.
