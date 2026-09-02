import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border border-champagne bg-white p-6 transition-shadow hover:shadow-lg"
    >
      <ng-content />
    </div>
  `,
})
export class CardComponent {}
