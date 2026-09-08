import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { computeBudgetTotal, estimateBudget } from '../../core/engines/budget.engine';
import type { WeatherDay } from '../../core/models/weather.model';
import { ActivitiesService } from '../../core/services/activities.service';
import { DestinationsService } from '../../core/services/destinations.service';
import { TripPlannerStore } from '../../core/services/trip-planner-store.service';
import { WeatherService } from '../../core/services/weather.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TRIP_NIGHTS = 5;
const TRIP_TRAVELLERS = 2;

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ButtonComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './destination-detail.component.html',
  styleUrl: './destination-detail.component.css',
})
export class DestinationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destinationsService = inject(DestinationsService);
  private readonly weatherService = inject(WeatherService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly plannerStore = inject(TripPlannerStore);

  private readonly slug$ = this.route.paramMap.pipe(map((p) => p.get('slug') ?? ''));

  readonly slug = toSignal(this.slug$, { initialValue: '' });

  private readonly fromPlan$ = this.route.queryParamMap.pipe(map((q) => q.get('fromPlan') === '1'));

  readonly fromPlan = toSignal(this.fromPlan$, { initialValue: false });

  readonly destination = toSignal(
    this.slug$.pipe(switchMap((s) => this.destinationsService.getBySlug(s))),
    { initialValue: undefined },
  );

  readonly forecast = toSignal(
    this.slug$.pipe(switchMap((s) => this.weatherService.getForecast(s, this.todayISO(), 5))),
    { initialValue: [] as WeatherDay[] },
  );

  readonly activities = toSignal(
    this.slug$.pipe(switchMap((s) => this.activitiesService.listForDestination(s))),
    { initialValue: [] },
  );

  // Fixture services resolve synchronously, so after the first change detection
  // an empty destination for a real slug means "not found", not "still loading".
  // TODO: distinguish loading from not-found when the service is async.
  readonly notFound = computed(() => this.slug() !== '' && this.destination() === undefined);

  readonly bestMonths = computed(() => {
    const d = this.destination();
    return d ? d.bestMonths.map((m) => MONTHS[m - 1]).join(', ') : '';
  });

  readonly budgetTotal = computed(() => {
    const d = this.destination();
    if (!d) return null;
    return computeBudgetTotal(
      estimateBudget(d.dailyBudgetLow, d.dailyBudgetHigh, TRIP_NIGHTS, TRIP_TRAVELLERS),
    );
  });

  readonly itinerary = computed(() => this.activities().slice(0, 3));

  readonly recommendationReasons = computed(() => {
    if (!this.fromPlan()) return null;
    const match = this.plannerStore.matches().find((m) => m.destination.slug === this.slug());
    return match ? match.reasons : null;
  });

  buildTrip(): void {
    this.router.navigate(['/trips/new'], { queryParams: { destination: this.slug() } });
  }

  shortDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }

  private todayISO(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
