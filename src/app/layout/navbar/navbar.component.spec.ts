import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  const isAuthed = signal(false);
  const signOut = jasmine.createSpy('signOut').and.resolveTo({ error: null });

  beforeEach(async () => {
    isAuthed.set(false);
    signOut.calls.reset();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthed, session: signal(null), signOut } },
      ],
    }).compileComponents();
  });

  it('shows "Sign in" when not authed', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Sign in');
    expect(text).not.toContain('Sign out');
  });

  it('shows "Sign out" and calls AuthService.signOut when authed', async () => {
    isAuthed.set(true);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sign out');
    expect(el.textContent).not.toContain('Sign in');

    const navSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    el.querySelector('button')?.click();
    await fixture.whenStable();
    expect(signOut).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/');
  });
});
