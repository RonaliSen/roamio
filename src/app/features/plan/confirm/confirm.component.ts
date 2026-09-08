import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { computeBudgetTotal, estimateBudget } from '../../../core/engines/budget.engine';
import { ActivitiesService } from '../../../core/services/activities.service';
import { TripPlannerAiService } from '../../../core/services/trip-planner-ai.service';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import { TripsService } from '../../../core/services/trips.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { PlannerStepperComponent } from '../../../shared/ui/planner-stepper/planner-stepper.component';

const DAY_MS = 86400000;
/** ponytail: nominal lead time until we build a real date picker (out of scope, see brief). */
const START_OFFSET_DAYS = 30;
const DEFAULT_DURATION_DAYS = 4;
const DEFAULT_TRAVELERS = 1;

/** `YYYY-MM-DD` `daysOut` days after today, computed in UTC so DST never shifts the date. */
function isoDaysFromToday(daysOut: number): string {
  const today = new Date();
  const startOfTodayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return new Date(startOfTodayUtc + daysOut * DAY_MS).toISOString().slice(0, 10);
}

function isoPlusDays(iso: string, days: number): string {
  return new Date(Date.parse(iso + 'T00:00:00Z') + days * DAY_MS).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [ButtonComponent, PlannerStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm.component.html',
  styleUrl: './confirm.component.css',
})
export class ConfirmComponent {
  private readonly router = inject(Router);
  private readonly tripsService = inject(TripsService);
  private readonly aiService = inject(TripPlannerAiService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly toast = inject(ToastService);
  readonly store = inject(TripPlannerStore);

  readonly creating = signal(false);

  readonly destination = this.store.chosenDestination();
  readonly intent = this.store.intent();

  // Deliberate simplification: no date picker in this flow (per mockups, dates are
  // implied by duration). Computed once from "today" at screen-load; editable dates
  // are out of scope for this task and can be layered on without touching persistence.
  readonly startDate = this.destination ? isoDaysFromToday(START_OFFSET_DAYS) : '';
  readonly endDate = this.destination
    ? isoPlusDays(this.startDate, this.intent?.durationDays ?? DEFAULT_DURATION_DAYS)
    : '';

  readonly travelers = this.intent?.travelers ?? DEFAULT_TRAVELERS;

  readonly budget = this.destination
    ? estimateBudget(
        this.destination.dailyBudgetLow,
        this.destination.dailyBudgetHigh,
        this.intent?.durationDays ?? DEFAULT_DURATION_DAYS,
        this.travelers,
      )
    : null;

  readonly budgetTotal = this.budget ? computeBudgetTotal(this.budget) : 0;

  constructor() {
    if (!this.store.chosenDestination()) {
      this.router.navigate(['/']);
    }
  }

  async buildTrip(): Promise<void> {
    this.creating.set(true);
    try {
      const dest = this.store.chosenDestination()!;
      const intent = this.store.intent()!;
      const days = intent.durationDays ?? DEFAULT_DURATION_DAYS;
      const travelers = intent.travelers ?? DEFAULT_TRAVELERS;
      const budget = estimateBudget(dest.dailyBudgetLow, dest.dailyBudgetHigh, days, travelers);

      const tripId = await this.tripsService.create({
        destinationSlug: dest.slug,
        title: `${dest.name} · ${this.startDate}`,
        startDate: this.startDate,
        endDate: this.endDate,
        travelers,
        interests: intent.interests,
        currency: 'EUR',
        budget,
      });

      const activities = await firstValueFrom(this.activitiesService.listForDestination(dest.slug));
      const generatedDays = this.aiService.generateItinerary(intent, dest, activities);
      const tripDetail = await this.tripsService.get(tripId);

      // Sequential on purpose: keeps activities inserted (and thus their sort_order)
      // in a predictable per-day order rather than racing via Promise.all.
      for (const gDay of generatedDays) {
        const realDay = tripDetail.days.find((d) => d.dayIndex === gDay.dayIndex);
        if (!realDay) continue;
        for (const act of gDay.activities) {
          await this.tripsService.addActivity(realDay.id, { title: act.title, category: act.category });
        }
      }

      this.store.reset();
      await this.router.navigate(['/trips', tripId]);
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Could not create trip', 'error');
    } finally {
      this.creating.set(false);
    }
  }
}
