import { TestBed } from '@angular/core/testing';

import { TripDashboardComponent } from './trip-dashboard.component';

// Placeholder spec — Task 19 replaces this component and its spec.
describe('TripDashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TripDashboardComponent] }).compileComponents();
  });

  it('creates and renders its heading', () => {
    const fixture = TestBed.createComponent(TripDashboardComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Your trip',
    );
  });
});
