import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TripPlannerAiService } from '../../../core/services/trip-planner-ai.service';
import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import type { TripIntent } from '../../../core/models/trip-intent.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { PlannerStepperComponent } from '../../../shared/ui/planner-stepper/planner-stepper.component';

export const REGIONS = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'];

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

@Component({
  selector: 'app-understand',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, PlannerStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './understand.component.html',
  styleUrl: './understand.component.css',
})
export class UnderstandComponent {
  private readonly router = inject(Router);
  private readonly aiService = inject(TripPlannerAiService);
  private readonly store = inject(TripPlannerStore);

  readonly regions = REGIONS;
  readonly months = MONTHS;

  readonly travelStyle = signal<string[]>([]);
  readonly preferences = signal<string[]>([]);
  readonly interests = signal<string[]>([]);

  readonly form = new FormGroup({
    region: new FormControl<string>('', { nonNullable: true }),
    month: new FormControl<number | null>(null),
    durationDays: new FormControl<number | null>(null),
    travelers: new FormControl<number | null>(null),
    budgetAmount: new FormControl<number | null>(null),
  });

  constructor() {
    // Router navigation `extras.state` is only synchronously available during
    // the navigation itself, so it must be read here, not in ngOnInit.
    const message = this.router.getCurrentNavigation()?.extras.state?.['message'] ?? '';
    const intent = this.aiService.analyzeIntent(message);

    this.form.setValue({
      region: intent.region ?? '',
      month: intent.month ?? null,
      durationDays: intent.durationDays ?? null,
      travelers: intent.travelers ?? null,
      budgetAmount: intent.budget?.amount ?? null,
    });
    this.travelStyle.set(intent.travelStyle);
    this.preferences.set(intent.preferences);
    this.interests.set(intent.interests);
  }

  addChip(list: 'travelStyle' | 'preferences' | 'interests', value: string): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    const target = this[list];
    if (target().includes(trimmed)) return;
    target.set([...target(), trimmed]);
  }

  removeChip(list: 'travelStyle' | 'preferences' | 'interests', value: string): void {
    const target = this[list];
    target.set(target().filter((v) => v !== value));
  }

  confirm(): void {
    const v = this.form.value;
    const intent: TripIntent = {
      region: v.region || undefined,
      month: v.month ?? undefined,
      durationDays: v.durationDays ?? undefined,
      travelers: v.travelers ?? undefined,
      budget: v.budgetAmount ? { amount: v.budgetAmount, currency: 'EUR' } : undefined,
      travelStyle: this.travelStyle(),
      preferences: this.preferences(),
      interests: this.interests(),
      missingInformation: [
        ...(v.durationDays ? [] : ['dates']),
        ...(v.budgetAmount ? [] : ['budget']),
        ...(v.region ? [] : ['destination']),
      ],
      confidence: 1,
    };

    this.store.setIntent(intent);
    this.router.navigate(['/plan/feasibility']);
  }
}
