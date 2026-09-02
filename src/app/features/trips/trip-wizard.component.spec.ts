import { TestBed } from '@angular/core/testing';

import { TripWizardComponent } from './trip-wizard.component';

// Placeholder spec — Task 16 replaces this component and its spec.
describe('TripWizardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TripWizardComponent] }).compileComponents();
  });

  it('creates and renders its heading', () => {
    const fixture = TestBed.createComponent(TripWizardComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Plan a trip',
    );
  });
});
