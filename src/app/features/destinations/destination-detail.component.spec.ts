import { TestBed } from '@angular/core/testing';

import { DestinationDetailComponent } from './destination-detail.component';

// Placeholder spec — Task 14 replaces this component and its spec.
describe('DestinationDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestinationDetailComponent],
    }).compileComponents();
  });

  it('creates and renders its heading', () => {
    const fixture = TestBed.createComponent(DestinationDetailComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Destination',
    );
  });
});
