import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let signIn: jasmine.Spy;
  let signUp: jasmine.Spy;
  let show: jasmine.Spy;

  beforeEach(async () => {
    signIn = jasmine.createSpy('signIn').and.resolveTo({ error: null });
    signUp = jasmine.createSpy('signUp').and.resolveTo({ error: null });
    show = jasmine.createSpy('show');

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { signIn, signUp } },
        { provide: ToastService, useValue: { show } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
  });

  const submitButton = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('app-button button');

  it('form is invalid when empty', () => {
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('submit button reads "Sign in", then "Create account" after toggling', () => {
    expect(submitButton()?.textContent?.trim()).toBe('Sign in');
    fixture.componentInstance.toggleMode();
    fixture.detectChanges();
    expect(submitButton()?.textContent?.trim()).toBe('Create account');
  });

  it('submitting in signin mode calls AuthService.signIn', async () => {
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret1' });
    await fixture.componentInstance.submit();
    expect(signIn).toHaveBeenCalledWith('a@b.com', 'secret1');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('submitting in signup mode calls AuthService.signUp', async () => {
    fixture.componentInstance.toggleMode();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret1' });
    await fixture.componentInstance.submit();
    expect(signUp).toHaveBeenCalledWith('a@b.com', 'secret1');
  });

  it('shows an error toast when sign-in returns an error', async () => {
    signIn.and.resolveTo({ error: { message: 'Invalid credentials' } });
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret1' });
    await fixture.componentInstance.submit();
    expect(show).toHaveBeenCalledWith('Invalid credentials', 'error');
  });
});
