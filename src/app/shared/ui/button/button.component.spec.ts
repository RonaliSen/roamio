import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a <button> by default', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('renders an <a> with the routerLink when routerLink is set', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('routerLink', '/discover');
    fixture.detectChanges();
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('/discover');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
