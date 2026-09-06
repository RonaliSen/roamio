import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { FeasibilityComponent } from './feasibility.component';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import type { TripIntent } from '../../../core/models/trip-intent.model';

const baseIntent: TripIntent = {
  travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9,
};

describe('FeasibilityComponent', () => {
  let fixture: ComponentFixture<FeasibilityComponent>;
  let store: TripPlannerStore;
  let nav: jasmine.Spy;

  async function setup(intent: TripIntent | null) {
    await TestBed.configureTestingModule({
      imports: [FeasibilityComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    store = TestBed.inject(TripPlannerStore);
    if (intent) { store.setIntent(intent); }
    nav = spyOn(TestBed.inject(Router), 'navigate');
    fixture = TestBed.createComponent(FeasibilityComponent);
  }

  it('is green for a matching intent and offers Show destinations', fakeAsync(async () => {
    await setup({ ...baseIntent, region: 'Europe', month: 5 });
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(store.feasibility()?.status).toBe('green');
    const cta = fixture.nativeElement.querySelector('[data-testid="show-destinations"]');
    expect(cta).toBeTruthy();
  }));

  it('is red for a non-matching intent and offers a clickable alternative that re-runs feasibility', fakeAsync(async () => {
    await setup({ ...baseIntent, region: 'Oceania' });
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(store.feasibility()?.status).toBe('red');
    const chip: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="alternative-0"]');
    expect(chip).toBeTruthy();
    chip.click();
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(store.intent()?.region).toBeUndefined();
    expect(store.feasibility()?.status).toBe('green');
  }));

  it('redirects to / when no intent is in progress', async () => {
    await setup(null);
    fixture.detectChanges();
    expect(nav).toHaveBeenCalledWith(['/']);
  });
});
