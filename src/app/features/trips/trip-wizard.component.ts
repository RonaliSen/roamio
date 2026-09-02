import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trip-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-6 py-16">
      <h1 class="font-display text-3xl text-charcoal">Plan a trip</h1>
      <p class="font-ui text-taupe">Trip wizard — coming soon.</p>
    </section>
  `,
})
export class TripWizardComponent {}
