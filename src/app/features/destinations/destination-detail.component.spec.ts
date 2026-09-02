import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { DestinationDetailComponent } from './destination-detail.component';

describe('DestinationDetailComponent', () => {
  async function setup(slug: string) {
    await TestBed.configureTestingModule({
      imports: [DestinationDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug })) } },
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

  it('navigates to the wizard with the destination', async () => {
    const fixture = await setup('prague');
    const nav = spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.buildTrip();
    expect(nav).toHaveBeenCalledWith(['/trips/new'], { queryParams: { destination: 'prague' } });
  });

  it('renders a not-found state with a link back to Discover for an unknown slug', async () => {
    const fixture = await setup('atlantis');
    expect(text(fixture)).toContain('Destination not found');
    expect(fixture.nativeElement.querySelector('a[href="/discover"]')).toBeTruthy();
  });
});
