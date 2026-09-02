import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trip-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-6 py-16">
      <h1 class="font-display text-3xl text-charcoal">Your trip</h1>
      <p class="font-ui text-taupe">Trip dashboard — coming soon.</p>
    </section>
  `,
})
export class TripDashboardComponent {}
