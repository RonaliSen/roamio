import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, take } from 'rxjs';

import { computeBudgetTotal, estimateBudget } from '../../core/engines/budget.engine';
import { computeReadiness } from '../../core/engines/readiness.engine';
import type { BudgetBreakdown } from '../../core/models/budget.model';
import type { Destination } from '../../core/models/destination.model';
import type { TripDetail } from '../../core/models/trip.model';
import { DestinationsService } from '../../core/services/destinations.service';
import { TripsService } from '../../core/services/trips.service';
import { ItineraryComponent } from '../itinerary/itinerary.component';
import { WeatherPanelComponent } from '../weather/weather-panel.component';
import { BudgetPanelComponent } from '../budget/budget-panel.component';
import { PackingStubComponent } from '../packing/packing-stub.component';
import { WardrobeStubComponent } from '../wardrobe/wardrobe-stub.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { TabsComponent } from '../../shared/ui/tabs/tabs.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TABS = [
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'weather', label: 'Weather' },
  { id: 'budget', label: 'Budget' },
  { id: 'wardrobe', label: 'Wardrobe' },
  { id: 'packing', label: 'Packing' },
];

@Component({
  selector: 'app-trip-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    TabsComponent,
    SkeletonComponent,
    ItineraryComponent,
    WeatherPanelComponent,
    BudgetPanelComponent,
    WardrobeStubComponent,
    PackingStubComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trip-dashboard.component.html',
  styleUrl: './trip-dashboard.component.css',
})
export class TripDashboardComponent {
  private readonly tripsService = inject(TripsService);
  private readonly destinationsService = inject(DestinationsService);
  private readonly toast = inject(ToastService);

  readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly tabs = TABS;
  readonly activeTab = signal('itinerary');

  /** `undefined` = loading, `null` = not found / not owned, otherwise the loaded trip. */
  readonly tripDetail = signal<TripDetail | null | undefined>(undefined);
  readonly destination = signal<Destination | undefined>(undefined);

  /** Destination-baseline budget for this trip's length — the "target" a committed budget is judged against. */
  readonly budgetTarget = computed(() => {
    const trip = this.tripDetail();
    const dest = this.destination();
    if (!trip || !dest) return 0;
    const nights = Math.max(1, trip.days.length - 1);
    return computeBudgetTotal(
      estimateBudget(dest.dailyBudgetLow, dest.dailyBudgetHigh, nights, trip.trip.travelers),
    );
  });

  readonly readiness = computed(() => {
    const trip = this.tripDetail();
    if (!trip) return 0;
    return computeReadiness({
      hasDates: !!trip.trip.startDate && !!trip.trip.endDate,
      totalDays: trip.days.length,
      daysWithActivity: trip.days.filter((d) => d.activities.length > 0).length,
      budgetTotal: computeBudgetTotal(trip.budget),
      budgetTarget: this.budgetTarget(),
    });
  });

  constructor() {
    const id = this.id();
    if (id) void this.loadTrip(id);
  }

  /** Re-fetches the trip from scratch — used after an itinerary edit changes day/activity shape. */
  reload(): void {
    const id = this.id();
    if (id) void this.loadTrip(id);
  }

  /** The budget panel already persisted `b`; just fold it into local state so readiness recomputes. */
  onBudgetChange(b: BudgetBreakdown): void {
    this.tripDetail.update((t) => (t ? { ...t, budget: b } : t));
  }

  formatDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }

  private async loadTrip(id: string): Promise<void> {
    try {
      const detail = await this.tripsService.get(id);
      this.tripDetail.set(detail);
      this.destinationsService
        .getBySlug(detail.trip.destinationSlug)
        .pipe(take(1))
        .subscribe((d) => this.destination.set(d));
    } catch {
      if (this.tripDetail() === undefined) {
        this.tripDetail.set(null);
      } else {
        this.toast.show('Could not refresh trip', 'error');
      }
    }
  }
}
