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

  it('shows a success toast and no error toast after account creation', async () => {
    fixture.componentInstance.toggleMode();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret1' });
    await fixture.componentInstance.submit();
    expect(show).toHaveBeenCalledWith('Account created — welcome to Roamio!', 'info');
    expect(show).not.toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('shows no success toast on plain sign-in', async () => {
    fixture.componentInstance.form.setValue({ email: 'a@b.com', password: 'secret1' });
    await fixture.componentInstance.submit();
    expect(show).not.toHaveBeenCalled();
  });

  it('shows an inline error once the email field is touched and invalid', () => {
    const control = fixture.componentInstance.form.controls.email;
    expect(fixture.componentInstance.emailError).toBeUndefined();
    control.markAsTouched();
    expect(fixture.componentInstance.emailError).toBe('Email is required');
    control.setValue('not-an-email');
    expect(fixture.componentInstance.emailError).toBe('Enter a valid email address');
  });

  it('shows an inline error once the password field is touched and invalid', () => {
    const control = fixture.componentInstance.form.controls.password;
    control.markAsTouched();
    expect(fixture.componentInstance.passwordError).toBe('Password is required');
    control.setValue('abc');
    expect(fixture.componentInstance.passwordError).toBe('Password must be at least 6 characters');
    control.setValue('abcdef');
    expect(fixture.componentInstance.passwordError).toBeUndefined();
  });

  it('marks all fields touched when submit is attempted while invalid', async () => {
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.controls.email.touched).toBe(true);
    expect(fixture.componentInstance.form.controls.password.touched).toBe(true);
    expect(signIn).not.toHaveBeenCalled();
  });
});
