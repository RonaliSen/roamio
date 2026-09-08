import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { DestinationsService } from '../../../core/services/destinations.service';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import { rankDestinations } from '../../../core/engines/recommend.engine';
import type { DestinationMatch } from '../../../core/models/trip-intent.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CardComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
})
export class RecommendationsComponent {
  private readonly router = inject(Router);
  private readonly destinationsService = inject(DestinationsService);
  readonly store = inject(TripPlannerStore);

  private readonly destinationsSig = toSignal(this.destinationsService.list(), { initialValue: [] });

  readonly matches = computed<DestinationMatch[]>(() => {
    const intent = this.store.intent();
    if (!intent) { return []; }
    return rankDestinations(intent, this.destinationsSig());
  });

  constructor() {
    if (!this.store.intent()) {
      this.router.navigate(['/']);
      return;
    }
    effect(() => this.store.setMatches(this.matches()));
  }

  choose(match: DestinationMatch): void {
    this.store.chooseDestination(match.destination);
    this.router.navigate(['/destinations', match.destination.slug], { queryParams: { fromPlan: '1' } });
  }
}
