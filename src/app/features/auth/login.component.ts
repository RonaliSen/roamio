import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-screen items-center justify-center bg-ivory px-6 py-16">
      <div class="w-full max-w-sm border border-champagne bg-white p-8">
        <h1 class="font-display text-3xl text-charcoal">Welcome to Roamio</h1>
        <p class="mt-1 font-ui text-sm text-taupe">Every journey, considered.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 flex flex-col gap-5">
          <app-input label="Email" type="email" formControlName="email" />
          <app-input label="Password" type="password" formControlName="password" />

          <app-button type="submit" variant="primary" [disabled]="loading() || form.invalid">
            {{ mode() === 'signin' ? 'Sign in' : 'Create account' }}
          </app-button>
        </form>

        <button
          type="button"
          (click)="toggleMode()"
          class="mt-6 font-ui text-sm text-taupe underline hover:text-charcoal"
        >
          {{ mode() === 'signin' ? 'New here? Create account' : 'Have an account? Sign in' }}
        </button>
      </div>
    </main>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly mode = signal<'signin' | 'signup'>('signin');
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  toggleMode(): void {
    this.mode.update((m) => (m === 'signin' ? 'signup' : 'signin'));
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    try {
      const { error } =
        this.mode() === 'signin'
          ? await this.auth.signIn(email, password)
          : await this.auth.signUp(email, password);
      if (error) {
        this.toast.show(error.message, 'error');
        return;
      }
      await this.router.navigateByUrl('/discover');
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
