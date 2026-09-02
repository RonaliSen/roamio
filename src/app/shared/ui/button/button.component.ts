import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      class="inline-flex items-center justify-center px-6 py-3 font-ui text-sm tracking-wide
             transition-shadow hover:shadow-lg disabled:opacity-50"
      [class]="
        variant === 'primary' ? 'bg-charcoal text-white' : 'border border-charcoal text-charcoal'
      "
    >
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'ghost' = 'primary';
  @Input() type = 'button';
  @Input() disabled = false;
}
