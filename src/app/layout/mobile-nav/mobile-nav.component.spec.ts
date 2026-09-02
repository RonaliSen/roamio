import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MobileNavComponent } from './mobile-nav.component';

describe('MobileNavComponent', () => {
  let fixture: ComponentFixture<MobileNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(MobileNavComponent);
    fixture.detectChanges();
  });

  it('renders nav links to /, /discover and /trips', () => {
    const hrefs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'),
    ).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/discover', '/trips']);
  });
});
