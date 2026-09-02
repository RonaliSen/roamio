import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows "Sign in" when not authed', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sign in');
    expect(text).not.toContain('Sign out');
  });

  it('shows "Sign out" and emits signOut when authed', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.componentRef.setInput('authed', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sign out');
    expect(el.textContent).not.toContain('Sign in');

    const spy = jasmine.createSpy('signOut');
    fixture.componentInstance.signOut.subscribe(spy);
    el.querySelector('button')?.click();
    expect(spy).toHaveBeenCalled();
  });
});
