# Roamio First Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Roamio luxury travel-concierge first flow — Home → Discover → Destination → Build My Trip → Trip Dashboard — on Angular 20 with a local Supabase backend and required auth.

**Architecture:** Standalone Angular 20 app, lazy `loadComponent` routes, Signals for sync UI state and RxJS for async. One service class per domain in `core/services` returning `Observable<T>`; reference data (destinations/weather/activities) from TypeScript fixtures this pass, user data (trips/days/activities/budget) persisted to Supabase Postgres with row-level security. Deterministic pure-function engines for budget, readiness score, and weather recommendations.

**Tech Stack:** Angular 20 (standalone), Tailwind CSS v4, `@fontsource` (Cormorant Garamond + Inter), `lucide-angular`, `@angular/cdk`, `@supabase/supabase-js`, Supabase CLI (local, Docker), Jasmine/Karma (unit), Playwright (E2E), Angular ESLint + Prettier.

**Spec:** `docs/superpowers/specs/2026-09-02-roamio-first-flow-design.md`

## Global Constraints

- Angular 20, standalone components only — no NgModules.
- All feature routes lazy-loaded via `loadComponent` / `loadChildren`.
- Signals for synchronous component state; RxJS only for async (HTTP, debounce, cancellation).
- Business logic lives in `core/services` or pure functions, never in components.
- Every user-owned Supabase table has RLS enabled with owner-only policies keyed on `auth.uid()`.
- Auth required: `authGuard` on every route except `/` and `/login`.
- Color tokens (exact): Warm Ivory `#F7F4EE`, Surface `#EFEBE3`, Charcoal `#20201E`, Muted Taupe `#777269`, Champagne `#B5A07A`, White `#FFFFFF`.
- Fonts: Cormorant Garamond (display/headings), Inter (UI/body).
- Brand line: "ROAMIO — Every journey, considered."
- No AI, no real external APIs, no deployment this pass.
- Small commits using prefixes: `feat`, `fix`, `chore`, `refactor`, `test`, `perf`, `docs`. End commit messages with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Node 22, npm 10. Project scaffolded at repo root `/Users/ronalisenapati/Ronali/Roamio`.

---

## File Structure

```
src/
  app/
    core/
      auth/
        supabase.client.ts        # createClient wrapper, single instance
        auth.service.ts           # signIn/signUp/signOut/session signal
      guards/
        auth.guard.ts             # CanActivateFn, redirect to /login
      services/
        destinations.service.ts   # list/getBySlug over fixtures
        weather.service.ts        # getForecast over fixtures
        activities.service.ts     # listForDestination over fixtures
        trips.service.ts          # CRUD against Supabase
      engines/
        budget.engine.ts          # pure: computeBudgetTotal, applyBudgetSlider
        readiness.engine.ts       # pure: computeReadiness
        weather-rules.engine.ts   # pure: weatherRecommendations
      models/
        destination.model.ts
        trip.model.ts
        weather.model.ts
        budget.model.ts
    shared/
      ui/
        button/button.component.ts
        input/input.component.ts
        search-field/search-field.component.ts
        card/card.component.ts
        tabs/tabs.component.ts
        skeleton/skeleton.component.ts
        modal/modal.component.ts        # CDK overlay
        toast/toast.service.ts + toast.component.ts   # CDK
    layout/
      navbar/navbar.component.ts
      mobile-nav/mobile-nav.component.ts
    features/
      home/home.component.ts
      discover/discover.component.ts + discover.filter.ts (pure)
      destinations/destination-detail.component.ts
      trips/
        trip-wizard.component.ts
        trip-wizard.steps/*.component.ts
        trip-dashboard.component.ts
      itinerary/itinerary.component.ts
      weather/weather-panel.component.ts
      budget/budget-panel.component.ts
      wardrobe/wardrobe-stub.component.ts
      packing/packing-stub.component.ts
      auth/login.component.ts
    fixtures/
      destinations.fixture.ts
      activities.fixture.ts
      weather.fixture.ts
    app.routes.ts
    app.config.ts
    app.component.ts
  environments/
    environment.ts                # local supabase url + anon key
    environment.prod.ts
supabase/
  config.toml
  migrations/
    0001_core_schema.sql
    0002_rls_policies.sql
    0003_seed_destinations.sql
e2e/
  critical-path.spec.ts
playwright.config.ts
```

---

### Task 1: Scaffold Angular project and tooling

**Files:**
- Create: whole Angular skeleton at repo root, `tailwind.config.ts`, `.prettierrc`, `eslint.config.js`
- Modify: `package.json`, `src/styles.css`, `angular.json`
- Test: `src/app/app.component.spec.ts` (generated)

**Interfaces:**
- Consumes: nothing
- Produces: a running `ng serve`; `src/app/app.config.ts` with `provideRouter(routes)`; empty `src/app/app.routes.ts` exporting `routes: Routes = []`.

- [ ] **Step 1:** Scaffold in place:

```bash
cd /Users/ronalisenapati/Ronali/Roamio
npx -y @angular/cli@20 new roamio --directory . --style css --routing --ssr false --skip-git --package-manager npm
```

If the CLI refuses due to existing files (`docs/`, `.git`, the PDF), scaffold in a temp dir and move `src/`, `angular.json`, `tsconfig*.json`, `package.json`, `package-lock.json` into the repo root.

- [ ] **Step 2:** Add dependencies:

```bash
npm i @angular/cdk @supabase/supabase-js lucide-angular @fontsource/cormorant-garamond @fontsource/inter
npm i -D tailwindcss @tailwindcss/postcss postcss prettier angular-eslint eslint typescript-eslint supabase @playwright/test
```

- [ ] **Step 3:** Configure Tailwind v4. Create `.postcssrc.json`:

```json
{ "plugins": { "@tailwindcss/postcss": {} } }
```

Replace `src/styles.css` top with:

```css
@import "tailwindcss";
@import "@fontsource/cormorant-garamond/400.css";
@import "@fontsource/cormorant-garamond/600.css";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";

@theme {
  --color-ivory: #F7F4EE;
  --color-surface: #EFEBE3;
  --color-charcoal: #20201E;
  --color-taupe: #777269;
  --color-champagne: #B5A07A;
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-ui: "Inter", system-ui, sans-serif;
}

html, body { background: var(--color-ivory); color: var(--color-charcoal); font-family: var(--font-ui); }
h1,h2,h3 { font-family: var(--font-display); }
:focus-visible { outline: 2px solid var(--color-champagne); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
```

- [ ] **Step 4:** Set up ESLint:

```bash
npx ng add angular-eslint --skip-confirmation
```

Create `.prettierrc`:

```json
{ "singleQuote": true, "printWidth": 100, "semi": true }
```

- [ ] **Step 5:** Create empty routing surface. `src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';
export const routes: Routes = [];
```

Ensure `src/app/app.config.ts` calls `provideRouter(routes)` and add `provideAnimationsAsync()`.

- [ ] **Step 6:** Create the folder skeleton (empty `.gitkeep` where needed):

```bash
mkdir -p src/app/core/{auth,guards,services,engines,models} \
  src/app/shared/ui src/app/layout src/app/features src/app/fixtures \
  supabase e2e
```

- [ ] **Step 7:** Verify build and dev server:

```bash
npm run build
```

Expected: build succeeds, no Tailwind/PostCSS errors.

- [ ] **Step 8:** Commit:

```bash
git add -A
git commit -m "chore: initialize Roamio Angular project"
```

---

### Task 2: Design tokens sanity component + global layout shell

**Files:**
- Modify: `src/app/app.component.ts`, `src/app/app.component.html`
- Create: `src/app/layout/navbar/navbar.component.ts`, `src/app/layout/mobile-nav/mobile-nav.component.ts`

**Interfaces:**
- Consumes: `AuthService` is NOT ready yet — navbar takes an `@Input() authed = false` placeholder, replaced in Task 8.
- Produces: `<app-navbar>` and `<app-mobile-nav>` standalone components; `AppComponent` renders navbar + `<router-outlet>` + footer.

- [ ] **Step 1:** Create `NavbarComponent` (standalone, `ChangeDetectionStrategy.OnPush`): logo wordmark "ROAMIO" linking `/`, nav links Discover / My Trips, a sign-in link. Desktop only (`hidden md:flex`). Use `lucide-angular` for icons.

- [ ] **Step 2:** Create `MobileNavComponent`: fixed bottom bar, visible `md:hidden`, icon links Home / Discover / Trips.

- [ ] **Step 3:** `AppComponent` template:

```html
<app-navbar />
<main class="min-h-screen"><router-outlet /></main>
<footer class="bg-surface px-6 py-10 text-sm text-taupe">
  <p class="font-display text-lg text-charcoal">ROAMIO</p>
  <p>Every journey, considered.</p>
</footer>
<app-mobile-nav />
```

- [ ] **Step 4:** Run `npm run build`. Expected: PASS.

- [ ] **Step 5:** `npm test -- --watch=false --browsers=ChromeHeadless`. Expected: generated specs PASS.

- [ ] **Step 6:** Commit:

```bash
git add -A
git commit -m "feat: add Roamio layout shell and navigation"
```

---

### Task 3: UI primitives — Button, Card, Input, SearchField, Skeleton, Tabs

**Files:**
- Create: `src/app/shared/ui/button/button.component.ts`, `.../card/card.component.ts`, `.../input/input.component.ts`, `.../search-field/search-field.component.ts`, `.../skeleton/skeleton.component.ts`, `.../tabs/tabs.component.ts`
- Test: `src/app/shared/ui/search-field/search-field.component.spec.ts`

**Interfaces:**
- Produces:
  - `ButtonComponent` selector `app-button`, `@Input() variant: 'primary'|'ghost' = 'primary'`, `@Input() type = 'button'`, content-projected label.
  - `CardComponent` selector `app-card`, content-projected, hover elevation.
  - `InputComponent` selector `app-input`, implements `ControlValueAccessor`, `@Input() label`, `@Input() type='text'`, `@Input() error?: string`.
  - `SearchFieldComponent` selector `app-search-field`, `@Input() placeholder`, `@Output() search = EventEmitter<string>()` emitted debounced 300ms via RxJS, plus immediate emit on Enter.
  - `SkeletonComponent` selector `app-skeleton`, `@Input() lines = 1`.
  - `TabsComponent` selector `app-tabs`, `@Input() tabs: {id:string;label:string}[]`, `@Input() active: string`, `@Output() activeChange`.

- [ ] **Step 1: Write the failing test** — `search-field.component.spec.ts`:

```ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SearchFieldComponent } from './search-field.component';

describe('SearchFieldComponent', () => {
  let fixture: ComponentFixture<SearchFieldComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchFieldComponent);
    fixture.detectChanges();
  });

  it('debounces input and emits once', fakeAsync(() => {
    const emitted: string[] = [];
    fixture.componentInstance.search.subscribe((v) => emitted.push(v));
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'pra'; input.dispatchEvent(new Event('input'));
    input.value = 'prague'; input.dispatchEvent(new Event('input'));
    tick(300);
    expect(emitted).toEqual(['prague']);
  }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --watch=false --include='**/search-field.component.spec.ts'`
Expected: FAIL — cannot resolve `SearchFieldComponent`.

- [ ] **Step 3: Implement primitives.** `SearchFieldComponent`:

```ts
import { Component, EventEmitter, Input, Output, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';

@Component({
  selector: 'app-search-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input class="w-full rounded-none border-b border-taupe bg-transparent px-1 py-3 font-ui text-lg
                  outline-none placeholder:text-taupe focus:border-champagne"
           [placeholder]="placeholder"
           (input)="term$.next($any($event.target).value)"
           (keydown.enter)="search.emit($any($event.target).value)" />
  `,
})
export class SearchFieldComponent implements OnDestroy {
  @Input() placeholder = '';
  @Output() search = new EventEmitter<string>();
  term$ = new Subject<string>();
  private sub: Subscription = this.term$.pipe(debounceTime(300)).subscribe((v) => this.search.emit(v));
  ngOnDestroy() { this.sub.unsubscribe(); }
}
```

Implement the other five as small OnPush standalone components with Tailwind token classes. `ButtonComponent` primary = `bg-charcoal text-white`, ghost = `border border-charcoal`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --watch=false --include='**/search-field.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Roamio UI primitives"
```

---

### Task 4: Modal (CDK overlay) and Toast service

**Files:**
- Create: `src/app/shared/ui/modal/modal.component.ts`, `src/app/shared/ui/toast/toast.service.ts`, `src/app/shared/ui/toast/toast.component.ts`
- Modify: `src/app/app.component.html` (mount `<app-toast-outlet>`)
- Test: `src/app/shared/ui/toast/toast.service.spec.ts`

**Interfaces:**
- Produces:
  - `ModalComponent` selector `app-modal`, `@Input() open: boolean`, `@Output() openChange`, `@Input() title`, projected content; ESC + backdrop close; focus trap via `cdkTrapFocus`.
  - `ToastService.show(message: string, kind?: 'info'|'error'): void`; exposes `toasts = signal<Toast[]>([])`; auto-dismiss 4s.
  - `ToastOutletComponent` selector `app-toast-outlet`.

- [ ] **Step 1: Write failing test** — `toast.service.spec.ts`:

```ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('adds then auto-dismisses a toast', fakeAsync(() => {
    const svc = TestBed.inject(ToastService);
    svc.show('saved');
    expect(svc.toasts().length).toBe(1);
    tick(4000);
    expect(svc.toasts().length).toBe(0);
  }));
});
```

- [ ] **Step 2: Run to verify fail.** Run: `npm test -- --watch=false --include='**/toast.service.spec.ts'` — FAIL.

- [ ] **Step 3: Implement.** `ToastService` uses `signal`, `setTimeout` for dismissal, `crypto.randomUUID()` ids. `ModalComponent` uses `@angular/cdk/overlay` or a simple fixed-position element with `@angular/cdk/a11y` `cdkTrapFocus` + `(document:keydown.escape)`.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add modal and toast primitives"
```

---

### Task 5: Supabase local backend — init, client, environments

**Files:**
- Create: `supabase/config.toml` (via CLI), `src/app/core/auth/supabase.client.ts`
- Modify: `src/environments/environment.ts`, `src/environments/environment.prod.ts`, `angular.json` (fileReplacements — already present from `ng new` if `--configuration` set; add environments if missing), `package.json` scripts

**Interfaces:**
- Produces: `supabase` — a configured `SupabaseClient` singleton exported from `supabase.client.ts`; `environment.supabaseUrl`, `environment.supabaseAnonKey`.

- [ ] **Step 1:** Init and start:

```bash
npx supabase init
npx supabase start
```

Copy the printed `API URL` (`http://127.0.0.1:54321`) and `anon key` from the output.

- [ ] **Step 2:** Add npm scripts to `package.json`:

```json
"db:start": "supabase start",
"db:stop": "supabase stop",
"db:reset": "supabase db reset"
```

- [ ] **Step 3:** Create `src/environments/environment.ts` (create the folder + `angular.json` `fileReplacements` if `ng new` didn't):

```ts
export const environment = {
  production: false,
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'PASTE_LOCAL_ANON_KEY_HERE',
};
```

`environment.prod.ts` mirrors with empty strings + `production: true`.

- [ ] **Step 4:** `supabase.client.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
```

- [ ] **Step 5:** Verify: `npm run build` passes and `curl http://127.0.0.1:54321/rest/v1/ -H "apikey: <anon>"` returns JSON (not connection refused).

- [ ] **Step 6:** Commit:

```bash
git add -A
git commit -m "chore: add Supabase local config and client"
```

---

### Task 6: Database schema migration

**Files:**
- Create: `supabase/migrations/0001_core_schema.sql`

**Interfaces:**
- Produces: tables `profiles, destinations, trips, trip_days, activities, budgets, wardrobe_items, outfits, outfit_items, packing_items`.

- [ ] **Step 1:** Write `0001_core_schema.sql`:

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country text not null,
  summary text not null,
  hero_image text not null,
  best_months int[] not null default '{}',
  style_tags text[] not null default '{}',
  daily_budget_low int not null,
  daily_budget_high int not null
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  destination_slug text not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  travelers int not null default 1,
  interests text[] not null default '{}',
  currency text not null default 'EUR',
  created_at timestamptz default now()
);

create table trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  day_index int not null,
  date date not null
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references trip_days on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  category text not null default 'sightseeing',
  start_time time,
  notes text,
  sort_order int not null default 0
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  accommodation int not null default 0,
  transport int not null default 0,
  food int not null default 0,
  activities int not null default 0,
  local_transport int not null default 0,
  shopping int not null default 0
);

create table wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text not null,
  image_url text,
  warmth int not null default 2,
  weight_grams int not null default 200
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  trip_id uuid references trips on delete cascade,
  name text not null
);

create table outfit_items (
  outfit_id uuid not null references outfits on delete cascade,
  wardrobe_item_id uuid not null references wardrobe_items on delete cascade,
  primary key (outfit_id, wardrobe_item_id)
);

create table packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  category text not null,
  packed boolean not null default false
);

create index on trips (user_id);
create index on trip_days (trip_id);
create index on activities (trip_day_id);
```

- [ ] **Step 2:** Apply: `npm run db:reset`. Expected: migration runs clean.

- [ ] **Step 3:** Verify: `npx supabase db diff` shows no drift; `psql` or Studio (`http://127.0.0.1:54323`) lists all ten tables.

- [ ] **Step 4:** Commit:

```bash
git add -A
git commit -m "feat: add core database schema"
```

---

### Task 7: RLS policies and destination seed

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`, `supabase/migrations/0003_seed_destinations.sql`

**Interfaces:**
- Consumes: Task 6 tables.
- Produces: RLS on all user-owned tables; ~6 seeded destinations including `prague`.

- [ ] **Step 1:** `0002_rls_policies.sql` — enable RLS and add owner policies:

```sql
alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_days enable row level security;
alter table activities enable row level security;
alter table budgets enable row level security;
alter table wardrobe_items enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;
alter table packing_items enable row level security;
alter table destinations enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- repeat this pattern for every table with a user_id column:
create policy "own trips" on trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own trip_days" on trip_days for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activities" on activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own budgets" on budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wardrobe" on wardrobe_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own outfits" on outfits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own packing" on packing_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own outfit_items" on outfit_items for all
  using (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()))
  with check (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()));

create policy "destinations are public read" on destinations for select using (true);

-- auto-create profile on signup
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into public.profiles (id) values (new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
```

- [ ] **Step 2:** `0003_seed_destinations.sql` — insert Prague plus five more (Lisbon, Kyoto, Reykjavik, Marrakech, Amalfi):

```sql
insert into destinations (slug, name, country, summary, hero_image, best_months, style_tags, daily_budget_low, daily_budget_high) values
('prague','Prague','Czech Republic','Gothic spires, riverside jazz and slow café mornings.','/assets/destinations/prague.jpg','{4,5,6,9}','{culture,romantic,walkable}',90,180),
('lisbon','Lisbon','Portugal','Tiled hills, Atlantic light and long seafood lunches.','/assets/destinations/lisbon.jpg','{3,4,5,10}','{coastal,culture,food}',85,170),
('kyoto','Kyoto','Japan','Temple gardens, kaiseki and quiet lantern streets.','/assets/destinations/kyoto.jpg','{3,4,11}','{culture,serene,food}',120,260),
('reykjavik','Reykjavik','Iceland','Volcanic coastline, geothermal baths and aurora nights.','/assets/destinations/reykjavik.jpg','{6,7,8,9}','{nature,adventure}',150,300),
('marrakech','Marrakech','Morocco','Riads, spice markets and desert-edge light.','/assets/destinations/marrakech.jpg','{3,4,10,11}','{culture,warm,markets}',70,150),
('amalfi','Amalfi','Italy','Cliff villages, lemon groves and slow boat days.','/assets/destinations/amalfi.jpg','{5,6,9}','{coastal,romantic,food}',140,280);
```

- [ ] **Step 3:** `npm run db:reset`. Expected: clean.

- [ ] **Step 4:** Verify RLS: in Studio SQL editor run `select * from trips;` as anon → 0 rows, no error. `insert into trips ...` without a session → fails policy.

- [ ] **Step 5:** Commit:

```bash
git add -A
git commit -m "feat: add row-level security and destination seed"
```

---

### Task 8: Auth service, guard, login page

**Files:**
- Create: `src/app/core/auth/auth.service.ts`, `src/app/core/guards/auth.guard.ts`, `src/app/features/auth/login.component.ts`
- Modify: `src/app/app.routes.ts`, `src/app/layout/navbar/navbar.component.ts`
- Test: `src/app/core/guards/auth.guard.spec.ts`

**Interfaces:**
- Produces:
  - `AuthService`: `session = signal<Session | null>(null)`; `isAuthed = computed(() => !!session())`; `async signIn(email, password)`, `async signUp(email, password)`, `async signOut()`; constructor subscribes to `supabase.auth.onAuthStateChange` and calls `supabase.auth.getSession()` once.
  - `authGuard: CanActivateFn` — returns `true` if `AuthService.isAuthed()`, else `router.parseUrl('/login')`.
  - `LoginComponent` selector route `/login`.

- [ ] **Step 1: Write failing test** — `auth.guard.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';

describe('authGuard', () => {
  function run() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }
  it('redirects to /login when unauthenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthed: () => false } }, Router],
    });
    const result = run();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });
  it('allows when authenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthed: () => true } }, Router],
    });
    expect(run()).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify fail.** Run: `npm test -- --watch=false --include='**/auth.guard.spec.ts'` — FAIL.

- [ ] **Step 3: Implement** `AuthService`, `authGuard`:

```ts
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthed() ? true : router.parseUrl('/login');
};
```

`LoginComponent`: two-field reactive form, toggle sign in / create account, calls `AuthService`, shows `ToastService` error on failure, `router.navigateByUrl('/discover')` on success.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5:** Wire routes in `app.routes.ts`:

```ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'discover', canActivate: [authGuard], loadComponent: () => import('./features/discover/discover.component').then(m => m.DiscoverComponent) },
  { path: 'destinations/:slug', canActivate: [authGuard], loadComponent: () => import('./features/destinations/destination-detail.component').then(m => m.DestinationDetailComponent) },
  { path: 'trips/new', canActivate: [authGuard], loadComponent: () => import('./features/trips/trip-wizard.component').then(m => m.TripWizardComponent) },
  { path: 'trips/:id', canActivate: [authGuard], loadComponent: () => import('./features/trips/trip-dashboard.component').then(m => m.TripDashboardComponent) },
];
```

(Home/Discover/etc. components may not exist yet — create minimal stub components so the build passes; later tasks flesh them out.)

- [ ] **Step 6:** Update navbar to use `AuthService.isAuthed()` and a sign-out button.

- [ ] **Step 7:** `npm run build` + `npm test -- --watch=false`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Supabase auth, route guard and login page"
```

---

### Task 9: Models, fixtures, reference-data services

**Files:**
- Create: `src/app/core/models/{destination,trip,weather,budget}.model.ts`, `src/app/fixtures/{destinations,activities,weather}.fixture.ts`, `src/app/core/services/{destinations,activities,weather}.service.ts`
- Test: `src/app/core/services/destinations.service.spec.ts`

**Interfaces:**
- Produces:
  - `Destination` interface: `{ slug; name; country; summary; heroImage; bestMonths: number[]; styleTags: string[]; dailyBudgetLow: number; dailyBudgetHigh: number }`.
  - `WeatherDay` interface: `{ date: string; tempHighC: number; tempLowC: number; rainProbability: number; windKph: number; condition: string }`.
  - `Activity` fixture interface: `{ title; category; durationHours; walkingIntensity: 'low'|'medium'|'high' }`.
  - `DestinationsService.list(): Observable<Destination[]>`, `.getBySlug(slug): Observable<Destination | undefined>`.
  - `WeatherService.getForecast(slug: string, start: string, days: number): Observable<WeatherDay[]>`.
  - `ActivitiesService.listForDestination(slug: string): Observable<Activity[]>`.

- [ ] **Step 1: Write failing test** — `destinations.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DestinationsService } from './destinations.service';

describe('DestinationsService', () => {
  it('returns prague by slug', async () => {
    const svc = TestBed.inject(DestinationsService);
    const d = await firstValueFrom(svc.getBySlug('prague'));
    expect(d?.name).toBe('Prague');
  });
  it('returns undefined for unknown slug', async () => {
    const svc = TestBed.inject(DestinationsService);
    expect(await firstValueFrom(TestBed.inject(DestinationsService).getBySlug('atlantis'))).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify fail.** FAIL — no `DestinationsService`.

- [ ] **Step 3: Implement.** Fixtures mirror the six seeded destinations. Services are `@Injectable({providedIn:'root'})` returning `of(...)` (optionally `.pipe(delay(400))` so loading states are visible in dev). `weather.fixture.ts` generates a deterministic 14-day forecast per slug from a seeded base (e.g. Prague ~18°C highs, 30% rain).

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add domain models, fixtures and reference services"
```

---

### Task 10: Budget engine (pure, TDD)

**Files:**
- Create: `src/app/core/engines/budget.engine.ts`
- Test: `src/app/core/engines/budget.engine.spec.ts`

**Interfaces:**
- Produces:
  - `interface BudgetBreakdown { accommodation: number; transport: number; food: number; activities: number; localTransport: number; shopping: number }`
  - `computeBudgetTotal(b: BudgetBreakdown): number`
  - `estimateBudget(dailyLow: number, dailyHigh: number, nights: number, travelers: number): BudgetBreakdown` — deterministic split (accommodation 40%, food 25%, activities 15%, transport 10%, localTransport 5%, shopping 5% of `midpoint * nights * travelers`).
  - `scaleBudgetToTarget(b: BudgetBreakdown, target: number): BudgetBreakdown` — scales every line proportionally so the total equals `target`, rounding to whole units with the remainder absorbed by `accommodation`.

- [ ] **Step 1: Write the failing test:**

```ts
import { computeBudgetTotal, estimateBudget, scaleBudgetToTarget } from './budget.engine';

describe('budget.engine', () => {
  it('sums all six lines', () => {
    expect(computeBudgetTotal({ accommodation: 400, transport: 100, food: 250, activities: 150, localTransport: 50, shopping: 50 })).toBe(1000);
  });
  it('estimates from daily range, nights and travelers', () => {
    const b = estimateBudget(90, 180, 4, 2); // midpoint 135 * 4 * 2 = 1080
    expect(computeBudgetTotal(b)).toBe(1080);
    expect(b.accommodation).toBe(432); // 40%
  });
  it('scales to an exact target with remainder on accommodation', () => {
    const b = scaleBudgetToTarget({ accommodation: 432, transport: 108, food: 270, activities: 162, localTransport: 54, shopping: 54 }, 800);
    expect(computeBudgetTotal(b)).toBe(800);
  });
});
```

- [ ] **Step 2: Run to verify it fails.** Run: `npm test -- --watch=false --include='**/budget.engine.spec.ts'` — FAIL.

- [ ] **Step 3: Implement `budget.engine.ts`** — pure functions, no Angular imports.

- [ ] **Step 4: Run to verify it passes.** Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add deterministic budget engine"
```

---

### Task 11: Readiness and weather-rules engines (pure, TDD)

**Files:**
- Create: `src/app/core/engines/readiness.engine.ts`, `src/app/core/engines/weather-rules.engine.ts`
- Test: `src/app/core/engines/readiness.engine.spec.ts`, `src/app/core/engines/weather-rules.engine.spec.ts`

**Interfaces:**
- Produces:
  - `computeReadiness(input: { hasDates: boolean; daysWithActivity: number; totalDays: number; budgetTotal: number; budgetTarget: number }): number` — 0–100 integer. Weights: dates 20, itinerary coverage 50 (`daysWithActivity/totalDays`), budget-within-target 30 (`budgetTotal <= budgetTarget` → full, else linear falloff to 0 at 1.5×).
  - `interface WeatherRec { id: string; label: string; reason: string }`
  - `weatherRecommendations(days: WeatherDay[], walkingIntensity: 'low'|'medium'|'high'): WeatherRec[]` — rules: any day `tempLowC < 10` → `layer`; any day `rainProbability >= 0.4` → `waterproof`; `walkingIntensity === 'high'` → `comfortable-footwear`; any day `tempHighC >= 28` → `sun-protection`.

- [ ] **Step 1: Write failing tests:**

```ts
// readiness.engine.spec.ts
import { computeReadiness } from './readiness.engine';
describe('computeReadiness', () => {
  it('is 100 when everything is ready', () => {
    expect(computeReadiness({ hasDates: true, daysWithActivity: 4, totalDays: 4, budgetTotal: 900, budgetTarget: 1000 })).toBe(100);
  });
  it('is 0 when nothing is ready', () => {
    expect(computeReadiness({ hasDates: false, daysWithActivity: 0, totalDays: 4, budgetTotal: 2000, budgetTarget: 1000 })).toBe(0);
  });
  it('gives partial itinerary credit', () => {
    expect(computeReadiness({ hasDates: true, daysWithActivity: 2, totalDays: 4, budgetTotal: 900, budgetTarget: 1000 })).toBe(75);
  });
});
```

```ts
// weather-rules.engine.spec.ts
import { weatherRecommendations } from './weather-rules.engine';
const cold = [{ date: '2026-01-10', tempHighC: 4, tempLowC: -2, rainProbability: 0.1, windKph: 20, condition: 'clear' }];
describe('weatherRecommendations', () => {
  it('recommends a layer in the cold', () => {
    expect(weatherRecommendations(cold, 'low').map(r => r.id)).toContain('layer');
  });
  it('recommends waterproof when rain probability is high', () => {
    const wet = [{ ...cold[0], tempLowC: 12, rainProbability: 0.6 }];
    expect(weatherRecommendations(wet, 'low').map(r => r.id)).toContain('waterproof');
  });
  it('recommends comfortable footwear for walking-heavy trips', () => {
    expect(weatherRecommendations(cold, 'high').map(r => r.id)).toContain('comfortable-footwear');
  });
});
```

- [ ] **Step 2: Run to verify they fail.** FAIL.

- [ ] **Step 3: Implement both engines** — pure, no Angular.

- [ ] **Step 4: Run to verify they pass.** Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add readiness and weather recommendation engines"
```

---

### Task 12: Home landing page

**Files:**
- Create: `src/app/features/home/home.component.ts` (replace stub)
- Modify: none
- Test: `src/app/features/home/home.component.spec.ts`

**Interfaces:**
- Consumes: `DestinationsService.list()`, `SearchFieldComponent`, `CardComponent`, `ButtonComponent`.
- Produces: route `/`. On NL search submit → `router.navigate(['/discover'], { queryParams: { q: term } })`.

- [ ] **Step 1: Write failing test:**

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });
  it('renders the brand line', () => {
    expect(fixture.nativeElement.textContent).toContain('Every journey, considered');
  });
  it('navigates to discover with the query on search', () => {
    const nav = spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.onSearch('prague in spring');
    expect(nav).toHaveBeenCalledWith(['/discover'], { queryParams: { q: 'prague in spring' } });
  });
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement.** Sections: full-bleed hero with `font-display` headline + brand line + `<app-search-field>` ("Where to next? Try 'quiet coast, 5 days, mild weather'"); "The Travel Edit" — 3 editorial inspiration cards (static copy); "Recommended for you" — `@for` over `destinations()` signal (from `toSignal(DestinationsService.list())`) rendering `<app-card>` with hero image, name, country, `routerLink="/destinations/{{slug}}"`. Skeleton while loading. Responsive: hero text scales, cards `grid sm:grid-cols-2 lg:grid-cols-3`.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5:** Manual check: `npm start`, open `/`, confirm layout at 375px and 1440px widths.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: build luxury landing page"
```

---

### Task 13: Discover page and filter (filter TDD)

**Files:**
- Create: `src/app/features/discover/discover.component.ts` (replace stub), `src/app/features/discover/discover.filter.ts`
- Test: `src/app/features/discover/discover.filter.spec.ts`

**Interfaces:**
- Produces:
  - `interface DiscoverFilters { query: string; maxDailyBudget: number | null; style: string | null; month: number | null }`
  - `applyDiscoverFilters(all: Destination[], f: DiscoverFilters): Destination[]` — `query` matches name/country/summary/styleTags case-insensitively (empty = all); `maxDailyBudget` keeps `dailyBudgetLow <= maxDailyBudget`; `style` keeps `styleTags.includes(style)`; `month` keeps `bestMonths.includes(month)`.
- Consumes: `DestinationsService.list()`, reads `?q=` from `ActivatedRoute`.

- [ ] **Step 1: Write failing test:**

```ts
import { applyDiscoverFilters } from './discover.filter';
const D = [
  { slug: 'prague', name: 'Prague', country: 'Czech Republic', summary: 'spires', heroImage: '', bestMonths: [4,5], styleTags: ['culture','walkable'], dailyBudgetLow: 90, dailyBudgetHigh: 180 },
  { slug: 'reykjavik', name: 'Reykjavik', country: 'Iceland', summary: 'aurora', heroImage: '', bestMonths: [7,8], styleTags: ['nature'], dailyBudgetLow: 150, dailyBudgetHigh: 300 },
];
describe('applyDiscoverFilters', () => {
  it('matches query against tags', () => {
    expect(applyDiscoverFilters(D, { query: 'walkable', maxDailyBudget: null, style: null, month: null }).map(d => d.slug)).toEqual(['prague']);
  });
  it('filters by max daily budget', () => {
    expect(applyDiscoverFilters(D, { query: '', maxDailyBudget: 100, style: null, month: null }).map(d => d.slug)).toEqual(['prague']);
  });
  it('filters by month', () => {
    expect(applyDiscoverFilters(D, { query: '', maxDailyBudget: null, style: null, month: 8 }).map(d => d.slug)).toEqual(['reykjavik']);
  });
  it('returns all on empty filters', () => {
    expect(applyDiscoverFilters(D, { query: '', maxDailyBudget: null, style: null, month: null }).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement** `discover.filter.ts` (pure) and `DiscoverComponent`: search field bound to `query` signal (seeded from `?q=`), filter controls (budget slider, style select, month select) as signals, `results = computed(() => applyDiscoverFilters(all(), filters()))`. Render loading skeletons, empty state ("No destinations match — loosen a filter"), error state. Cards link to `/destinations/:slug`.

- [ ] **Step 4: Run to verify pass.** Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add destination discovery"
```

---

### Task 14: Destination detail page

**Files:**
- Create: `src/app/features/destinations/destination-detail.component.ts` (replace stub)
- Test: `src/app/features/destinations/destination-detail.component.spec.ts`

**Interfaces:**
- Consumes: `DestinationsService.getBySlug()`, `WeatherService.getForecast()`, `ActivitiesService.listForDestination()`, `estimateBudget()`, `computeBudgetTotal()`.
- Produces: route `/destinations/:slug`. "Build My Trip" → `router.navigate(['/trips/new'], { queryParams: { destination: slug } })`.

- [ ] **Step 1: Write failing test:** renders destination name from resolved slug (`prague`), shows a budget estimate number, and the CTA navigates with `{ queryParams: { destination: 'prague' } }`.

```ts
it('navigates to the wizard with the destination', () => {
  const nav = spyOn(TestBed.inject(Router), 'navigate');
  fixture.componentInstance.buildTrip();
  expect(nav).toHaveBeenCalledWith(['/trips/new'], { queryParams: { destination: 'prague' } });
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement.** Slug from `ActivatedRoute` → `toSignal`. Sections: hero image + name/country; at-a-glance stats row (best months formatted, daily budget range, typical trip length "4–6 days"); weather preview (`@for` first 5 `WeatherDay` as compact chips); budget estimate (`estimateBudget(low, high, 5, 2)` → `computeBudgetTotal`); experiences (`@for` activities as `<app-card>`); itinerary preview (first 3 activities as a mock day-1 timeline); sticky "Build My Trip" `<app-button>`. Handle unknown slug → "Destination not found" + link back to `/discover`.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add destination details"
```

---

### Task 15: Trips service (Supabase CRUD)

**Files:**
- Create: `src/app/core/services/trips.service.ts`
- Test: `src/app/core/services/trips.service.spec.ts` (unit-tests the row-mapping helpers only; live Supabase calls are covered by E2E)

**Interfaces:**
- Produces:
  - `interface CreateTripInput { destinationSlug: string; title: string; startDate: string; endDate: string; travelers: number; interests: string[]; currency: string; budget: BudgetBreakdown }`
  - `TripsService.create(input: CreateTripInput): Promise<string>` — inserts `trips`, then `trip_days` (one per date in range), then `budgets`; returns new trip id. `user_id` from `supabase.auth.getUser()`.
  - `TripsService.get(id: string): Promise<TripDetail>` — trip + ordered days + activities + budget.
  - `TripsService.addActivity(tripDayId: string, a: NewActivity): Promise<Activity>`
  - `TripsService.updateActivity(id: string, patch: Partial<Activity>): Promise<void>`
  - `TripsService.deleteActivity(id: string): Promise<void>`
  - `TripsService.reorderActivities(tripDayId: string, orderedIds: string[]): Promise<void>` — writes `sort_order` = index.
  - `TripsService.updateBudget(tripId: string, b: BudgetBreakdown): Promise<void>`
  - Exported pure helper `datesInRange(start: string, end: string): string[]` (inclusive).

- [ ] **Step 1: Write failing test** for the pure helper:

```ts
import { datesInRange } from './trips.service';
describe('datesInRange', () => {
  it('is inclusive of both ends', () => {
    expect(datesInRange('2026-05-01', '2026-05-04')).toEqual(['2026-05-01','2026-05-02','2026-05-03','2026-05-04']);
  });
  it('handles a single day', () => {
    expect(datesInRange('2026-05-01', '2026-05-01')).toEqual(['2026-05-01']);
  });
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement** `TripsService` with `supabase.from(...)` calls and `datesInRange`. Map snake_case rows to camelCase models in private helpers.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add trips persistence service"
```

---

### Task 16: Trip creation wizard

**Files:**
- Create: `src/app/features/trips/trip-wizard.component.ts` (replace stub)
- Test: `src/app/features/trips/trip-wizard.component.spec.ts`

**Interfaces:**
- Consumes: `DestinationsService.getBySlug()`, `estimateBudget()`, `TripsService.create()`, `ToastService`.
- Produces: route `/trips/new`. Reads `?destination=` query param.

- [ ] **Step 1: Write failing test:** step navigation is gated by validity.

```ts
it('blocks advancing past dates when end is before start', () => {
  const c = fixture.componentInstance;
  c.form.patchValue({ startDate: '2026-05-10', endDate: '2026-05-01' });
  c.step.set(1); // dates step
  expect(c.canAdvance()).toBe(false);
});
it('computes nights from the date range', () => {
  fixture.componentInstance.form.patchValue({ startDate: '2026-05-01', endDate: '2026-05-05' });
  expect(fixture.componentInstance.nights()).toBe(4);
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement.** Single reactive form, `step = signal(0)`, steps: (0) destination — prefilled/read-only if `?destination=` present, else a select; (1) dates — two date inputs, validation end > start; (2) travelers — number stepper ≥1; (3) budget — shows `estimateBudget` result, slider to adjust total (`scaleBudgetToTarget`); (4) interests — multi-select chips from a fixed list. `canAdvance()` computed per step. Draft persisted to `localStorage` key `roamio:trip-draft` on every form change (`effect`), cleared on submit. Progress indicator (step N of 5). Final "Create trip" → `TripsService.create()` → `router.navigate(['/trips', id])` + toast "Trip created".

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5:** Manual check: complete the wizard against local Supabase (sign in first), confirm redirect and a `trips` row in Studio.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add trip creation flow"
```

---

### Task 17: Itinerary planner

**Files:**
- Create: `src/app/features/itinerary/itinerary.component.ts`
- Test: `src/app/features/itinerary/itinerary.component.spec.ts`

**Interfaces:**
- Consumes: `TripsService` (`addActivity`, `updateActivity`, `deleteActivity`, `reorderActivities`), `@angular/cdk/drag-drop`.
- Produces: `ItineraryComponent` selector `app-itinerary`, `@Input() tripId: string`, `@Input() days: TripDay[]` (with activities), `@Output() changed = EventEmitter<void>()` (fires after any mutation so the dashboard can recompute readiness).

- [ ] **Step 1: Write failing test:** reordering emits the new id order to the service.

```ts
it('persists a reorder', () => {
  const trips = TestBed.inject(TripsService) as any;
  const spy = spyOn(trips, 'reorderActivities').and.resolveTo();
  fixture.componentInstance.drop({ previousIndex: 0, currentIndex: 1, container: { data: dayActivities } } as any, 'day-1');
  expect(spy).toHaveBeenCalledWith('day-1', jasmine.any(Array));
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement.** `@for` over days; each day a `cdkDropList` of activity rows (`cdkDrag`). Row: title, time, category badge, notes, edit + delete. "Add activity" opens `<app-modal>` with a small form. All mutations call `TripsService`, then `changed.emit()`. Optimistic local update of the signal array, revert + toast on rejection.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add itinerary planner"
```

---

### Task 18: Weather + budget panels

**Files:**
- Create: `src/app/features/weather/weather-panel.component.ts`, `src/app/features/budget/budget-panel.component.ts`
- Test: `src/app/features/budget/budget-panel.component.spec.ts`

**Interfaces:**
- Produces:
  - `WeatherPanelComponent` selector `app-weather-panel`, `@Input() slug`, `@Input() startDate`, `@Input() days: number`, `@Input() walkingIntensity`. Renders forecast chips + `weatherRecommendations()` output.
  - `BudgetPanelComponent` selector `app-budget-panel`, `@Input() tripId`, `@Input() budget: BudgetBreakdown`, `@Input() targetHint?: number`, `@Output() budgetChange = EventEmitter<BudgetBreakdown>()`. Line-item bars + total + a slider that calls `scaleBudgetToTarget` and emits (debounced 400ms) to `TripsService.updateBudget`.

- [ ] **Step 1: Write failing test:** moving the slider re-scales and emits a budget whose total equals the slider value.

```ts
it('rescales the budget to the slider total', () => {
  let emitted: any;
  fixture.componentInstance.budgetChange.subscribe((b: any) => emitted = b);
  fixture.componentInstance.onSlider(800);
  expect(emitted.accommodation + emitted.transport + emitted.food + emitted.activities + emitted.localTransport + emitted.shopping).toBe(800);
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement** both panels.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add weather and budget panels"
```

---

### Task 19: Trip dashboard + wardrobe/packing stubs

**Files:**
- Create: `src/app/features/trips/trip-dashboard.component.ts` (replace stub), `src/app/features/wardrobe/wardrobe-stub.component.ts`, `src/app/features/packing/packing-stub.component.ts`
- Test: `src/app/features/trips/trip-dashboard.component.spec.ts`

**Interfaces:**
- Consumes: `TripsService.get()`, `computeReadiness()`, `computeBudgetTotal()`, `TabsComponent`, `ItineraryComponent`, `WeatherPanelComponent`, `BudgetPanelComponent`, wardrobe/packing stubs.
- Produces: route `/trips/:id`.

- [ ] **Step 1: Write failing test:** readiness score reflects loaded trip state.

```ts
it('shows a readiness score', () => {
  // TripsService.get mocked to return a trip with dates, 0 activities, budget under target
  fixture.detectChanges();
  expect(fixture.componentInstance.readiness()).toBe(50); // 20 dates + 0 itinerary + 30 budget
});
```

- [ ] **Step 2: Run to verify fail.** FAIL.

- [ ] **Step 3: Implement.** Load trip via `toSignal` on route param. Header: destination + dates + travelers + a readiness ring (`computeReadiness` from a `computed` over days/budget). `<app-tabs>` with Itinerary / Weather / Budget / Wardrobe / Packing. Panels wired to their components; `ItineraryComponent.changed` and `BudgetPanelComponent.budgetChange` refresh the local trip signal so readiness recomputes. Wardrobe/packing stubs render a centered "Coming soon — this is where your capsule wardrobe and smart packing list will live." with an illustration/icon. Loading skeleton for the whole page; error state if trip not found / not owned.

- [ ] **Step 4: Run to verify pass.** Expected: PASS.

- [ ] **Step 5:** Manual check: full flow against local Supabase.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add trip dashboard shell"
```

---

### Task 20: Playwright E2E critical path

**Files:**
- Create: `playwright.config.ts`, `e2e/critical-path.spec.ts`, `e2e/helpers.ts`
- Modify: `package.json` (`"e2e": "playwright test"`)

**Interfaces:**
- Consumes: running `ng serve` + running local Supabase.

- [ ] **Step 1:** `npx playwright install --with-deps chromium`.

- [ ] **Step 2:** `playwright.config.ts` — `webServer: { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true }`, `use: { baseURL: 'http://localhost:4200' }`.

- [ ] **Step 3:** Write `e2e/critical-path.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home to trip dashboard', async ({ page }) => {
  const email = `e2e_${Date.now()}@roamio.test`;
  await page.goto('/');
  await expect(page.getByText('Every journey, considered')).toBeVisible();

  // sign up
  await page.goto('/login');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('roamio-test-1234');
  await page.getByRole('button', { name: /create account/i }).click();

  // discover -> prague
  await page.goto('/discover');
  await page.getByRole('link', { name: /prague/i }).click();
  await expect(page).toHaveURL(/destinations\/prague/);

  // build trip
  await page.getByRole('button', { name: /build my trip/i }).click();
  await page.getByLabel('Start date').fill('2026-05-01');
  await page.getByLabel('End date').fill('2026-05-05');
  await page.getByRole('button', { name: /next/i }).click(); // travelers
  await page.getByRole('button', { name: /next/i }).click(); // budget
  await page.getByRole('button', { name: /next/i }).click(); // interests
  await page.getByRole('button', { name: /create trip/i }).click();

  await expect(page).toHaveURL(/trips\/[0-9a-f-]{36}/);
  await expect(page.getByText(/readiness/i)).toBeVisible();

  // add an activity
  await page.getByRole('button', { name: /add activity/i }).first().click();
  await page.getByLabel('Title').fill('Old Town walk');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText('Old Town walk')).toBeVisible();

  // budget tab
  await page.getByRole('tab', { name: /budget/i }).click();
  await expect(page.getByText(/total/i)).toBeVisible();
});
```

- [ ] **Step 4:** Run: `npm run e2e`. Expected: PASS (local Supabase must be running).

- [ ] **Step 5:** Commit:

```bash
git add -A
git commit -m "test: add trip planning e2e flow"
```

---

### Task 21: Architecture documentation + README

**Files:**
- Create: `README.md`, `docs/architecture.md`
- Modify: none

- [ ] **Step 1:** `README.md` — project intro, brand line, prerequisites (Node 22, Docker), setup (`npm i`, `npm run db:start`, paste anon key into `environment.ts`, `npm start`), scripts table, test commands.

- [ ] **Step 2:** `docs/architecture.md` — folder map, the fixture-vs-Supabase data boundary, the deterministic-engine list with signatures, the AI boundary (`user intent → AI interpretation → validated structured data → deterministic logic → UI`) noted as future, route/guard table.

- [ ] **Step 3:** Commit:

```bash
git add -A
git commit -m "docs: add architecture documentation"
```

---

## Self-Review

**1. Spec coverage:**

| Spec item | Task |
|---|---|
| Angular 20 scaffold, Tailwind, fonts, ESLint, folder arch | 1 |
| Design tokens + typography | 1, 2 |
| UI primitives (Button/Input/Search/Card/Tabs/Skeleton/Modal/Toast) | 3, 4 |
| Navbar + mobile-nav | 2 |
| Supabase local + client + environments | 5 |
| Schema (10 tables) | 6 |
| RLS owner-only + destinations public read + profile trigger | 7 |
| Auth email/password + authGuard + login | 8 |
| Models + fixtures + reference services | 9 |
| Budget engine | 10 |
| Readiness + weather-rules engines | 11 |
| Home (hero, NL input, Travel Edit, recommended cards, footer, responsive) | 2 (footer), 12 |
| Discover (search, filters, cards, loading/empty/error) | 13 |
| Destination detail (hero, stats, best time, weather, budget, experiences, itinerary preview, CTA) | 14 |
| Trip wizard (5 steps, draft persistence, insert trip+days+budget) | 15, 16 |
| Itinerary (timeline, CRUD, CDK drag/drop reorder, persisted) | 15, 17 |
| Weather panel (forecast + recommendations) | 18 |
| Budget panel (breakdown + slider + recompute + persist) | 18 |
| Trip dashboard (overview, readiness, tabs, wardrobe/packing stubs) | 19 |
| Unit tests (budget, readiness, weather rules, discover filter) | 10, 11, 13 |
| Component tests (wizard validation, search/filter, card) | 13, 16; card assertion folded into 12/14 |
| E2E critical path | 20 |
| Architecture docs | 21 |

No gaps. Out-of-scope items (outfit engine, packing engine, wardrobe CRUD, image upload, AI, real APIs, deployment) intentionally absent per spec.

**2. Placeholder scan:** No "TBD"/"TODO"/"add error handling" — error/empty/loading states are named per component. Engine and service signatures are concrete.

**3. Type consistency:** `BudgetBreakdown` (Task 10) reused verbatim in 15/16/18/19. `WeatherDay` (Task 9) reused in 11/14/18. `Destination` (Task 9) reused in 12/13/14. `computeReadiness` input shape (Task 11) matches the dashboard's `computed` inputs (Task 19). `reorderActivities(tripDayId, orderedIds)` consistent between Task 15 definition and Task 17 call.

---

## Notes for the executor

- Local Supabase must be running (`npm run db:start`) for Tasks 8+ manual checks and Task 20.
- Paste the real local anon key into `src/environments/environment.ts` (Task 5 Step 3) — it is printed by `npx supabase start` and is stable across restarts for a given project.
- Destination hero images: drop placeholder images in `src/assets/destinations/` or use a solid-color CSS fallback; not blocking.
- Keep components OnPush and prefer `toSignal` over manual `subscribe`.
