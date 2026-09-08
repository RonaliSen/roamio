import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ConfirmComponent } from './confirm.component';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import { TripsService } from '../../../core/services/trips.service';
import { TripPlannerAiService } from '../../../core/services/trip-planner-ai.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DESTINATIONS } from '../../../fixtures/destinations.fixture';
import type { TripIntent } from '../../../core/models/trip-intent.model';
import type { TripDetail } from '../../../core/models/trip.model';

describe('ConfirmComponent', () => {
  let fixture: ComponentFixture<ConfirmComponent>;
  let store: TripPlannerStore;
  let nav: jasmine.Spy;
  let createSpy: jasmine.Spy;
  let addActivitySpy: jasmine.Spy;
  let showSpy: jasmine.Spy;
  let generateSpy: jasmine.Spy;
  const prague = DESTINATIONS.find((d) => d.slug === 'prague')!;
  const intent: TripIntent = {
    region: 'Europe', durationDays: 3, travelers: 2,
    travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 1,
  };

  async function setup(seedStore: boolean): Promise<void> {
    createSpy = jasmine.createSpy('create').and.resolveTo('trip-123');
    addActivitySpy = jasmine.createSpy('addActivity').and.resolveTo({});
    const fakeDetail: TripDetail = {
      trip: { id: 'trip-123', destinationSlug: 'prague', title: 'x', startDate: '2026-10-01', endDate: '2026-10-03', travelers: 2, interests: [], currency: 'EUR', createdAt: '' },
      days: [
        { id: 'day-0', tripId: 'trip-123', dayIndex: 0, date: '2026-10-01', activities: [] },
        { id: 'day-1', tripId: 'trip-123', dayIndex: 1, date: '2026-10-02', activities: [] },
        { id: 'day-2', tripId: 'trip-123', dayIndex: 2, date: '2026-10-03', activities: [] },
      ],
      budget: { accommodation: 0, transport: 0, food: 0, activities: 0, localTransport: 0, shopping: 0 },
    };
    const getSpy = jasmine.createSpy('get').and.resolveTo(fakeDetail);
    showSpy = jasmine.createSpy('show');
    generateSpy = jasmine.createSpy('generateItinerary').and.returnValue([
      { dayIndex: 0, activities: [{ title: 'A', category: 'x' }] },
      { dayIndex: 1, activities: [{ title: 'B', category: 'y' }] },
      { dayIndex: 2, activities: [] },
    ]);

    await TestBed.configureTestingModule({
      imports: [ConfirmComponent],
      providers: [
        provideRouter([]),
        { provide: TripsService, useValue: { create: createSpy, addActivity: addActivitySpy, get: getSpy } },
        { provide: TripPlannerAiService, useValue: { generateItinerary: generateSpy, analyzeIntent: () => intent } },
        { provide: ToastService, useValue: { show: showSpy } },
      ],
    }).compileComponents();

    store = TestBed.inject(TripPlannerStore);
    if (seedStore) {
      store.setIntent(intent);
      store.chooseDestination(prague);
    }
    nav = spyOn(TestBed.inject(Router), 'navigate');
    fixture = TestBed.createComponent(ConfirmComponent);
    fixture.detectChanges();
  }

  it('redirects to / when no destination is chosen', async () => {
    await setup(false);
    expect(nav).toHaveBeenCalledWith(['/']);
  });

  it('creates the trip, generates+persists the itinerary, and navigates to the dashboard', async () => {
    await setup(true);
    await fixture.componentInstance.buildTrip();
    expect(createSpy).toHaveBeenCalled();
    const createArg = createSpy.calls.mostRecent().args[0];
    expect(createArg.destinationSlug).toBe('prague');
    expect(createArg.currency).toBe('EUR');
    expect(addActivitySpy).toHaveBeenCalledTimes(2); // only the 2 non-empty generated days
    expect(nav).toHaveBeenCalledWith(['/trips', 'trip-123']);
  });

  it('shows a toast and does not navigate to the dashboard when trip creation fails', async () => {
    await setup(true);
    createSpy.and.rejectWith(new Error('boom'));
    await fixture.componentInstance.buildTrip();
    expect(showSpy).toHaveBeenCalledWith(jasmine.any(String), 'error');
    expect(nav).not.toHaveBeenCalledWith(['/trips', 'trip-123']);
  });
});
