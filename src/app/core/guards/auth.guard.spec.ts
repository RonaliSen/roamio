import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';

describe('authGuard', () => {
  function run() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }
  it('redirects to /login when unauthenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthed: () => false } }, Router],
    });
    const result = run();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });
  it('allows when authenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthed: () => true } }, Router],
    });
    expect(run()).toBe(true);
  });
});
