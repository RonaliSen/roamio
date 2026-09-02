import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-discover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-6 py-16">
      <h1 class="font-display text-3xl text-charcoal">Discover</h1>
      <p class="font-ui text-taupe">Discover — coming soon.</p>
    </section>
  `,
})
export class DiscoverComponent {}
