import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { computeBudgetTotal, estimateBudget } from '../../core/engines/budget.engine';
import type { TripDetail } from '../../core/models/trip.model';
import { TripsService } from '../../core/services/trips.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { TripDashboardComponent } from './trip-dashboard.component';

// Prague: dailyBudgetLow 90, dailyBudgetHigh 180 (see destinations.fixture.ts).
// 4 days -> nights = max(1, 4-1) = 3, travelers = 2.
// midpoint 135 * 3 nights * 2 travelers = 810.
const BUDGET_TARGET = computeBudgetTotal(estimateBudget(90, 180, 3, 2)); // 810

function tripFixture(): TripDetail {
  return {
    trip: {
      id: 't1',
      destinationSlug: 'prague',
      title: 'Prague getaway',
      startDate: '2026-06-01',
      endDate: '2026-06-04',
      travelers: 2,
      interests: [],
      currency: 'EUR',
      createdAt: '2026-01-01T00:00:00Z',
    },
    days: [0, 1, 2, 3].map((i) => ({
      id: `day-${i}`,
      tripId: 't1',
      dayIndex: i,
      date: `2026-06-0${i + 1}`,
      activities: [],
    })),
    // Total 700, comfortably under the 810 destination-baseline target -> full 30 budget points.
    budget: {
      accommodation: 280,
      transport: 70,
      food: 175,
      activities: 105,
      localTransport: 35,
      shopping: 35,
    },
  };
}

describe('TripDashboardComponent', () => {
  let trips: { get: jasmine.Spy };

  beforeEach(async () => {
    trips = { get: jasmine.createSpy('get') };

    await TestBed.configureTestingModule({
      imports: [TripDashboardComponent],
      providers: [
        { provide: TripsService, useValue: trips },
        { provide: ToastService, useValue: { show: jasmine.createSpy('show') } },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 't1' })) },
        },
      ],
    }).compileComponents();
  });

  function createFixture(): ComponentFixture<TripDashboardComponent> {
    return TestBed.createComponent(TripDashboardComponent);
  }

  it('shows a readiness score of 20 (dates) + 0 (itinerary) + 30 (budget) = 50', fakeAsync(() => {
    trips.get.and.resolveTo(tripFixture());
    const fixture = createFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(BUDGET_TARGET).toBe(810);
    expect(fixture.componentInstance.readiness()).toBe(50);
  }));

  it('renders a loading skeleton before the trip promise resolves', fakeAsync(() => {
    trips.get.and.resolveTo(tripFixture());
    const fixture = createFixture();
    fixture.detectChanges(); // constructor fired loadTrip(), promise not yet resolved

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-skeleton')).toBeTruthy();
    expect(el.textContent).not.toContain('Trip not found');

    tick();
  }));

  it('shows "Trip not found" when the trip fails to load (not found / not owned)', fakeAsync(() => {
    trips.get.and.rejectWith(new Error('not found'));
    const fixture = createFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Trip not found');
    expect(fixture.componentInstance.tripDetail()).toBeNull();
  }));

  it('renders all five tabs', fakeAsync(() => {
    trips.get.and.resolveTo(tripFixture());
    const fixture = createFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[role="tab"]'),
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['Itinerary', 'Weather', 'Budget', 'Wardrobe', 'Packing']);
  }));

  it('onBudgetChange patches local state so readiness recomputes immediately', fakeAsync(() => {
    trips.get.and.resolveTo(tripFixture());
    const fixture = createFixture();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(fixture.componentInstance.readiness()).toBe(50);

    // Total 2000 is well past 1.5x the 810 target -> budget score drops to 0.
    fixture.componentInstance.onBudgetChange({
      accommodation: 800,
      transport: 300,
      food: 500,
      activities: 200,
      localTransport: 100,
      shopping: 100,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.readiness()).toBe(20);
  }));
});
