import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { DiscoverComponent } from './discover.component';

describe('DiscoverComponent', () => {
  async function setup(queryParamMap = convertToParamMap({})) {
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(queryParamMap) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DiscoverComponent);
    fixture.detectChanges();
    return fixture;
  }

  function cards(fixture: { nativeElement: HTMLElement }): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a[href^="/destinations/"]'));
  }

  it('renders the Discover heading', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Discover');
  });

  it('renders a card per fixture destination with no filters', async () => {
    const fixture = await setup();
    expect(cards(fixture).length).toBe(6);
  });

  it('filters by query and links to the destination', async () => {
    const fixture = await setup();
    fixture.componentInstance.query.set('kyoto');
    fixture.detectChanges();
    const found = cards(fixture);
    expect(found.length).toBe(1);
    expect(found[0].getAttribute('href')).toBe('/destinations/kyoto');
  });

  it('filters by style', async () => {
    const fixture = await setup();
    fixture.componentInstance.style.set('nature');
    fixture.detectChanges();
    const found = cards(fixture);
    expect(found.length).toBe(1);
    expect(found[0].getAttribute('href')).toBe('/destinations/reykjavik');
  });

  it('clearFilters restores the full list', async () => {
    const fixture = await setup();
    fixture.componentInstance.style.set('nature');
    fixture.detectChanges();
    fixture.componentInstance.clearFilters();
    fixture.detectChanges();
    expect(cards(fixture).length).toBe(6);
  });

  it('seeds query from ?q=', async () => {
    const fixture = await setup(convertToParamMap({ q: 'lisbon' }));
    expect(fixture.componentInstance.query()).toBe('lisbon');
    expect(cards(fixture).length).toBe(1);
  });
});
