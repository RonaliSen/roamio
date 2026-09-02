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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
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
