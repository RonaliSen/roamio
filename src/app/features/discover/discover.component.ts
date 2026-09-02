import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DestinationsService } from '../../core/services/destinations.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { SearchFieldComponent } from '../../shared/ui/search-field/search-field.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { applyDiscoverFilters, DiscoverFilters } from './discover.filter';

const STYLES = [
  'culture',
  'romantic',
  'walkable',
  'coastal',
  'food',
  'serene',
  'nature',
  'adventure',
  'warm',
  'markets',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((name, i) => ({ value: i + 1, name }));

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink, SearchFieldComponent, CardComponent, ButtonComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
})
export class DiscoverComponent {
  private readonly destinationsService = inject(DestinationsService);
  private readonly route = inject(ActivatedRoute);

  readonly styles = STYLES;
  readonly months = MONTHS;
  readonly budgetMin = 50;
  readonly budgetMax = 400;

  private readonly queryParams = toSignal(this.route.queryParamMap);
  readonly query = signal(this.queryParams()?.get('q') ?? '');
  readonly maxDailyBudget = signal<number | null>(null);
  readonly style = signal<string | null>(null);
  readonly month = signal<number | null>(null);

  private readonly filters = computed<DiscoverFilters>(() => ({
    query: this.query(),
    maxDailyBudget: this.maxDailyBudget(),
    style: this.style(),
    month: this.month(),
  }));

  readonly all = toSignal(this.destinationsService.list(), { initialValue: undefined });

  readonly results = computed(() => {
    const a = this.all();
    return a ? applyDiscoverFilters(a, this.filters()) : [];
  });

  readonly skeletons = Array.from({ length: 6 });

  // error state: added when service hits a real API

  onBudgetInput(value: string): void {
    this.maxDailyBudget.set(Number(value));
  }

  clearFilters(): void {
    this.query.set('');
    this.maxDailyBudget.set(null);
    this.style.set(null);
    this.month.set(null);
  }
}
