import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  kind: 'info' | 'error';
}

const AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, kind: 'info' | 'error' = 'info'): void {
    const id = crypto.randomUUID();
    this.toasts.update((list) => [...list, { id, message, kind }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
