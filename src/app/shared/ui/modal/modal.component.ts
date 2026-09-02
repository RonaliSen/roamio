import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
} from '@angular/core';

let uid = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          class="fixed inset-0 bg-charcoal/40"
          aria-label="Close dialog"
          (click)="close()"
        ></button>
        <div
          class="relative w-full max-w-lg bg-white p-8 shadow-lg"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
        >
          <div class="mb-4 flex items-start justify-between gap-4">
            <h2 [id]="titleId" class="font-display text-2xl text-charcoal">{{ title }}</h2>
            <button
              type="button"
              class="text-taupe"
              aria-label="Close dialog"
              (click)="close()"
            >
              &times;
            </button>
          </div>
          <div class="font-ui text-sm text-charcoal">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Output() openChange = new EventEmitter<boolean>();

  protected readonly titleId = `modal-title-${uid++}`;
  private previouslyFocused: HTMLElement | null = null;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  ngOnChanges(): void {
    if (this.open) {
      this.previouslyFocused = document.activeElement as HTMLElement | null;
    } else {
      this.previouslyFocused?.focus?.();
      this.previouslyFocused = null;
    }
  }

  close(): void {
    this.openChange.emit(false);
  }
}
