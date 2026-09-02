import { TestBed } from '@angular/core/testing';

import { DiscoverComponent } from './discover.component';

// Placeholder spec — Task 13 replaces this component and its spec.
describe('DiscoverComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DiscoverComponent] }).compileComponents();
  });

  it('creates and renders its heading', () => {
    const fixture = TestBed.createComponent(DiscoverComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Discover',
    );
  });
});
