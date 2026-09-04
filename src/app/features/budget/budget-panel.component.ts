import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';

import { computeBudgetTotal, scaleBudgetToTarget } from '../../core/engines/budget.engine';
import type { BudgetBreakdown } from '../../core/models/budget.model';
import { TripsService } from '../../core/services/trips.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

const DEBOUNCE_MS = 400;

const LINE_ITEMS: { key: keyof BudgetBreakdown; label: string }[] = [
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
  { key: 'transport', label: 'Transport' },
  { key: 'localTransport', label: 'Local transport' },
  { key: 'shopping', label: 'Shopping' },
];

@Component({
  selector: 'app-budget-panel',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budget-panel.component.html',
  styleUrl: './budget-panel.component.css',
})
export class BudgetPanelComponent {
  private readonly tripsService = inject(TripsService);
  private readonly toast = inject(ToastService);
  private readonly persist$ = new Subject<BudgetBreakdown>();

  @Input() tripId!: string;

  /**
   * Backed by a signal (not a plain field) so `sliderMax` stays reactive to a
   * `targetHint` that arrives *after* `budget` — e.g. a parent template that
   * binds `[budget]` before `[targetHint]` in source order. A plain `@Input()`
   * read once inside the `budget` setter would silently and permanently miss
   * a hint that shows up on a later change-detection pass.
   */
  private readonly targetHintSig = signal<number | undefined>(undefined);
  @Input() set targetHint(v: number | undefined) {
    this.targetHintSig.set(v);
  }
  get targetHint(): number | undefined {
    return this.targetHintSig();
  }

  @Output() budgetChange = new EventEmitter<BudgetBreakdown>();

  readonly lineItems = LINE_ITEMS;
  readonly current = signal<BudgetBreakdown>({
    accommodation: 0,
    transport: 0,
    food: 0,
    activities: 0,
    localTransport: 0,
    shopping: 0,
  });
  readonly total = computed(() => computeBudgetTotal(this.current()));

  /** Baseline total, fixed from the first budget this panel ever saw — the slider's
   *  range shouldn't jump around as the user drags it or the budget rescales. */
  private readonly baselineTotal = signal<number | undefined>(undefined);
  readonly sliderMin = computed(() => Math.round((this.baselineTotal() ?? 0) * 0.5));
  /** Reactive to both the baseline total AND `targetHint`, so a late-arriving hint still applies. */
  readonly sliderMax = computed(() =>
    Math.max(this.targetHintSig() ?? 0, Math.round((this.baselineTotal() ?? 0) * 1.5)),
  );

  /**
   * Setter (not ngOnChanges) so a test setting `component.budget = ...`
   * directly — bypassing Angular's template-binding change tracking — still
   * seeds `current` before the first `detectChanges()`, matching the
   * convention used by ItineraryComponent's `days` input.
   */
  @Input() set budget(b: BudgetBreakdown) {
    this.current.set(b);
    if (this.baselineTotal() === undefined) {
      this.baselineTotal.set(computeBudgetTotal(b));
    }
  }
  get budget(): BudgetBreakdown {
    return this.current();
  }

  constructor() {
    this.persist$
      .pipe(debounceTime(DEBOUNCE_MS), takeUntilDestroyed())
      .subscribe((b) => this.persist(b));
  }

  /** Line-item bar width as a percentage of the current total. */
  pct(key: keyof BudgetBreakdown): number {
    const total = this.total();
    return total === 0 ? 0 : (this.current()[key] / total) * 100;
  }

  /**
   * Rescales the budget to the slider's value and emits synchronously so
   * callers (and the parent binding) see the new total immediately. Only the
   * Supabase write is debounced — dragging the slider shouldn't fire a
   * network call per pixel.
   */
  onSlider(value: number): void {
    const scaled = scaleBudgetToTarget(this.current(), value);
    this.current.set(scaled);
    this.budgetChange.emit(scaled);
    this.persist$.next(scaled);
  }

  private async persist(b: BudgetBreakdown): Promise<void> {
    try {
      await this.tripsService.updateBudget(this.tripId, b);
    } catch {
      this.toast.show('Could not save budget', 'error');
    }
  }
}
