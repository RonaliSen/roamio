import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RecommendationsComponent } from './recommendations.component';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import type { TripIntent } from '../../../core/models/trip-intent.model';

describe('RecommendationsComponent', () => {
  let fixture: ComponentFixture<RecommendationsComponent>;
  let store: TripPlannerStore;
  let nav: jasmine.Spy;

  async function setup(intent: TripIntent | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RecommendationsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    store = TestBed.inject(TripPlannerStore);
    if (intent) { store.setIntent(intent); }
    nav = spyOn(TestBed.inject(Router), 'navigate');
    fixture = TestBed.createComponent(RecommendationsComponent);
    fixture.detectChanges();
  }

  it('ranks and renders all destinations with a match % and reasons each', async () => {
    await setup({ region: 'Europe', month: 5, travelStyle: ['romantic'], preferences: [], interests: [], missingInformation: [], confidence: 0.9 });
    const cards = fixture.nativeElement.querySelectorAll('[data-testid="match-card"]');
    expect(cards.length).toBe(6);
    const topScore = fixture.componentInstance.matches()[0].score;
    expect(fixture.componentInstance.matches()[0].reasons.length).toBeGreaterThan(0);
    expect((cards[0] as HTMLElement).textContent).toContain(`${topScore}% match`);
  });

  it('choosing a destination stores it and navigates with planner context', async () => {
    await setup({ region: 'Europe', month: 5, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 });
    const topSlug = fixture.componentInstance.matches()[0].destination.slug;
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="choose-0"]');
    button.click();
    expect(store.chosenDestination()?.slug).toBe(topSlug);
    expect(nav).toHaveBeenCalledWith(['/destinations', topSlug], { queryParams: { fromPlan: '1' } });
  });

  it('redirects to / when no intent is in progress', async () => {
    await setup(null);
    expect(nav).toHaveBeenCalledWith(['/']);
  });

  it('renders the planner stepper', async () => {
    await setup({ region: 'Europe', month: 5, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 });
    expect(fixture.nativeElement.querySelector('app-planner-stepper')).toBeTruthy();
  });
});
