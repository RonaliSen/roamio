import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'ghost' = 'primary';
  @Input() type = 'button';
  @Input() disabled = false;
  /** When set, renders a router-linked `<a>` styled as the button instead of a `<button>`. */
  @Input() routerLink?: string | unknown[];

  get classes(): string {
    const base =
      'inline-flex items-center justify-center px-6 py-3 font-ui text-sm tracking-wide transition-shadow hover:shadow-lg disabled:opacity-50';
    const variant =
      this.variant === 'primary' ? 'bg-charcoal text-white' : 'border border-charcoal text-charcoal';
    return `${base} ${variant}`;
  }
}
