import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed right-4 bottom-20 z-50 flex flex-col gap-2 md:bottom-4"
      role="status"
      aria-live="polite"
    >
      @for (t of toast.toasts(); track t.id) {
        <div
          class="flex items-start gap-3 px-4 py-3 font-ui text-sm shadow-lg"
          [class]="t.kind === 'error' ? 'bg-charcoal text-white' : 'bg-white text-charcoal'"
          [attr.aria-live]="t.kind === 'error' ? 'assertive' : 'polite'"
        >
          <span class="flex-1">{{ t.message }}</span>
          <button
            type="button"
            class="text-taupe"
            aria-label="Dismiss notification"
            (click)="toast.dismiss(t.id)"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  protected readonly toast = inject(ToastService);
}
