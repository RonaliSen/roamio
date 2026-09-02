import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';

import { computeBudgetTotal, estimateBudget, scaleBudgetToTarget } from '../../core/engines/budget.engine';
import type { BudgetBreakdown } from '../../core/models/budget.model';
import type { Destination } from '../../core/models/destination.model';
import type { CreateTripInput } from '../../core/models/trip.model';
import { DestinationsService } from '../../core/services/destinations.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { TripsService } from '../../core/services/trips.service';

const DRAFT_KEY = 'roamio:trip-draft';
const DEFAULT_CURRENCY = 'EUR';
const DAY_MS = 86_400_000;

const INTERESTS = [
  'culture',
  'food',
  'nature',
  'nightlife',
  'history',
  'relaxation',
  'adventure',
  'shopping',
];

const ZERO_BUDGET: BudgetBreakdown = {
  accommodation: 0,
  transport: 0,
  food: 0,
  activities: 0,
  localTransport: 0,
  shopping: 0,
};

const BUDGET_LINES: { key: keyof BudgetBreakdown; label: string }[] = [
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
  { key: 'transport', label: 'Transport' },
  { key: 'localTransport', label: 'Local transport' },
  { key: 'shopping', label: 'Shopping' },
];

@Component({
  selector: 'app-trip-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, ButtonComponent, CardComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trip-wizard.component.html',
  styleUrl: './trip-wizard.component.css',
})
export class TripWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destinationsService = inject(DestinationsService);
  private readonly tripsService = inject(TripsService);
  private readonly toast = inject(ToastService);

  readonly interestOptions = INTERESTS;
  readonly budgetLines = BUDGET_LINES;
  readonly totalSteps = 5;

  readonly step = signal(0);
  readonly creating = signal(false);
  readonly destinationLocked = signal(false);

  readonly form = this.fb.nonNullable.group({
    destinationSlug: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    travelers: [1, [Validators.required, Validators.min(1)]],
    budgetTarget: [0],
    interests: [[] as string[]],
    title: ['', Validators.required],
  });

  private readonly raw = signal(this.form.getRawValue());
  readonly destinations = signal<Destination[]>([]);

  readonly destination = computed(() =>
    this.destinations().find((d) => d.slug === this.raw().destinationSlug),
  );

  readonly estimate = computed<BudgetBreakdown | null>(() => {
    const d = this.destination();
    const n = this.nights();
    const travelers = Number(this.raw().travelers) || 1;
    if (!d || n <= 0) return null;
    return estimateBudget(d.dailyBudgetLow, d.dailyBudgetHigh, n, travelers);
  });

  readonly estimateTotal = computed(() => {
    const e = this.estimate();
    return e ? computeBudgetTotal(e) : 0;
  });

  readonly budgetMin = computed(() => Math.round(this.estimateTotal() * 0.5));
  readonly budgetMax = computed(() => Math.max(10, Math.round(this.estimateTotal() * 2)));

  readonly scaledBudget = computed<BudgetBreakdown>(() => {
    const e = this.estimate();
    const target = Number(this.raw().budgetTarget) || 0;
    if (!e) return { ...ZERO_BUDGET };
    return target > 0 ? scaleBudgetToTarget(e, target) : e;
  });

  readonly scaledTotal = computed(() => computeBudgetTotal(this.scaledBudget()));

  constructor() {
    this.destinationsService
      .list()
      .pipe(take(1), takeUntilDestroyed())
      .subscribe((list) => this.destinations.set(list));

    let queryDestination: string | null = null;
    this.route.queryParamMap
      .pipe(take(1), takeUntilDestroyed())
      .subscribe((p) => (queryDestination = p.get('destination')));

    if (queryDestination) {
      this.form.controls.destinationSlug.setValue(queryDestination);
      this.destinationLocked.set(true);
    } else {
      this.restoreDraft();
    }

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.raw.set(this.form.getRawValue());
      this.persistDraft();
    });
    this.raw.set(this.form.getRawValue());
  }

  /** Whole nights between the two dates; 0 if unset, unparseable, or end <= start. */
  nights(): number {
    const { startDate, endDate } = this.raw();
    if (!startDate || !endDate) return 0;
    const s = Date.parse(`${startDate}T00:00:00Z`);
    const e = Date.parse(`${endDate}T00:00:00Z`);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 0;
    return Math.round((e - s) / DAY_MS);
  }

  /** Can the user leave the current step? */
  canAdvance(): boolean {
    const v = this.raw();
    switch (this.step()) {
      case 0:
        return this.form.controls.destinationSlug.valid && !!v.destinationSlug;
      case 1:
        return !!v.startDate && !!v.endDate && this.nights() > 0;
      case 2:
        return Number(v.travelers) >= 1;
      case 3:
        return Number(v.budgetTarget) > 0;
      default:
        return true;
    }
  }

  next(): void {
    if (!this.canAdvance()) return;
    const s = this.step();

    if (s === 2 && Number(this.form.controls.budgetTarget.value) <= 0) {
      const e = this.estimate();
      if (e) this.form.controls.budgetTarget.setValue(computeBudgetTotal(e));
    }
    if (s === 3 && !this.form.controls.title.value.trim()) {
      const d = this.destination();
      if (d) this.form.controls.title.setValue(`${d.name} · ${this.form.controls.startDate.value}`);
    }

    this.step.set(s + 1);
    this.persistDraft();
  }

  back(): void {
    this.step.set(Math.max(0, this.step() - 1));
    this.persistDraft();
  }

  toggleInterest(tag: string): void {
    const current = this.form.controls.interests.value ?? [];
    this.form.controls.interests.setValue(
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  hasInterest(tag: string): boolean {
    return (this.raw().interests ?? []).includes(tag);
  }

  async submit(): Promise<void> {
    if (this.step() < this.totalSteps - 1 || this.creating() || this.form.invalid) return;
    this.creating.set(true);

    const v = this.form.getRawValue();
    const estimate = this.estimate();
    const target = Number(v.budgetTarget) || 0;
    const budget =
      estimate && target > 0 ? scaleBudgetToTarget(estimate, target) : (estimate ?? { ...ZERO_BUDGET });

    const input: CreateTripInput = {
      destinationSlug: v.destinationSlug,
      title: v.title.trim(),
      startDate: v.startDate,
      endDate: v.endDate,
      travelers: Number(v.travelers),
      interests: v.interests ?? [],
      currency: DEFAULT_CURRENCY,
      budget,
    };

    try {
      const tripId = await this.tripsService.create(input);
      this.clearDraft();
      this.toast.show('Trip created', 'info');
      this.router.navigate(['/trips', tripId]);
    } catch (err) {
      this.toast.show((err as Error)?.message ?? 'Could not create trip', 'error');
      this.creating.set(false);
    }
  }

  private persistDraft(): void {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...this.form.getRawValue(), step: this.step() }),
      );
    } catch {
      /* private window / quota — draft is a convenience, not required */
    }
  }

  private restoreDraft(): void {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return;
      const { step, ...values } = JSON.parse(stored) as Record<string, unknown>;
      this.form.patchValue(values);
      if (typeof step === 'number' && step >= 0 && step < this.totalSteps) this.step.set(step);
    } catch {
      /* corrupt draft — ignore */
    }
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }
}
