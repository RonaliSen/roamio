import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { DESTINATIONS } from '../../fixtures/destinations.fixture';
import { TripPlannerStore } from '../../core/services/trip-planner-store.service';
import { DestinationDetailComponent } from './destination-detail.component';

describe('DestinationDetailComponent', () => {
  async function setup(slug: string, queryParams: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [DestinationDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug })),
            queryParamMap: of(convertToParamMap(queryParams)),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DestinationDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  function text(fixture: { nativeElement: HTMLElement }): string {
    return fixture.nativeElement.textContent ?? '';
  }

  it('renders the resolved destination name in an h1', async () => {
    const fixture = await setup('prague');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Prague');
  });

  it('shows the budget estimate total (estimateBudget(90,180,5,2) => 1,350)', async () => {
    const fixture = await setup('prague');
    expect(text(fixture)).toContain('1,350');
  });

  it('renders an experience card per fixture activity (Prague has 6)', async () => {
    const fixture = await setup('prague');
    const cards = fixture.nativeElement.querySelectorAll('[data-testid="experience-card"]');
    expect(cards.length).toBe(6);
  });

  it('exposes a "Build my trip" button', async () => {
    const fixture = await setup('prague');
    const button = fixture.nativeElement.querySelector('app-button button');
    expect(button?.textContent?.trim().toLowerCase()).toContain('build my trip');
  });

  it('seeds the planner store with default intent + the destination, and navigates to /plan/confirm', async () => {
    const fixture = await setup('prague');
    const nav = spyOn(TestBed.inject(Router), 'navigate');
    const store = TestBed.inject(TripPlannerStore);
    fixture.componentInstance.buildTrip();
    expect(store.intent()).toEqual(
      jasmine.objectContaining({ durationDays: 4, travelers: 2 }),
    );
    expect(store.chosenDestination()?.slug).toBe('prague');
    expect(nav).toHaveBeenCalledWith(['/plan/confirm']);
  });

  it('renders a not-found state with a link back to Discover for an unknown slug', async () => {
    const fixture = await setup('atlantis');
    expect(text(fixture)).toContain('Destination not found');
    expect(fixture.nativeElement.querySelector('a[href="/discover"]')).toBeTruthy();
  });

  it('shows why-recommended reasons when arriving from the planner with a matching store entry', async () => {
    const prague = DESTINATIONS.find((d) => d.slug === 'prague')!;
    const fixture = await setup('prague', { fromPlan: '1' });
    const store = TestBed.inject(TripPlannerStore);
    store.setMatches([
      { destination: prague, score: 94, reasons: ['In your preferred region', 'Great weather in your travel month'] },
    ]);
    fixture.detectChanges();
    expect(text(fixture)).toContain('Why Roamio recommends it');
    expect(text(fixture)).toContain('In your preferred region');
  });

  it('shows nothing extra when there is no fromPlan query param', async () => {
    const prague = DESTINATIONS.find((d) => d.slug === 'prague')!;
    const fixture = await setup('prague');
    const store = TestBed.inject(TripPlannerStore);
    store.setMatches([{ destination: prague, score: 94, reasons: ['In your preferred region'] }]);
    fixture.detectChanges();
    expect(text(fixture)).not.toContain('Why Roamio recommends it');
  });
});
