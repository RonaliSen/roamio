import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';

describe('authGuard', () => {
  function run() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }
  it('redirects to /login when unauthenticated', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthed: () => false, whenReady: Promise.resolve() } },
        Router,
      ],
    });
    const result = await run();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });
  it('allows when authenticated', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthed: () => true, whenReady: Promise.resolve() } },
        Router,
      ],
    });
    expect(await run()).toBe(true);
  });
});
