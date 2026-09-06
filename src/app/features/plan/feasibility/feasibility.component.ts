import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { DestinationsService } from '../../../core/services/destinations.service';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import { checkFeasibility } from '../../../core/engines/feasibility.engine';
import type { TripIntent } from '../../../core/models/trip-intent.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-feasibility',
  standalone: true,
  imports: [ButtonComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feasibility.component.html',
  styleUrl: './feasibility.component.css',
})
export class FeasibilityComponent {
  private readonly router = inject(Router);
  private readonly destinationsService = inject(DestinationsService);
  readonly store = inject(TripPlannerStore);

  private readonly destinationsSig = toSignal(this.destinationsService.list(), { initialValue: [] });

  readonly checking = signal(true);

  constructor() {
    if (!this.store.intent()) {
      this.router.navigate(['/']);
      return;
    }
    this.run();
  }

  run(): void {
    this.checking.set(true);
    setTimeout(() => {
      const result = checkFeasibility(this.store.intent()!, this.destinationsSig());
      this.store.setFeasibility(result);
      this.checking.set(false);
    }, 600);
  }

  goToRecommendations(): void {
    this.router.navigate(['/plan/recommendations']);
  }

  applyAlternative(alt: { label: string; adjustedIntent: Partial<TripIntent> }): void {
    this.store.patchIntent(alt.adjustedIntent);
    this.run();
  }
}
