import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LucideUser } from '@lucide/angular';

export type PlannerStep = 'understand' | 'feasibility' | 'plan';

const STEPS: { id: PlannerStep; label: string }[] = [
  { id: 'understand', label: 'Understand' },
  { id: 'feasibility', label: 'Check' },
  { id: 'plan', label: 'Plan' },
];

const ORDER: PlannerStep[] = ['understand', 'feasibility', 'plan'];

@Component({
  selector: 'app-planner-stepper',
  standalone: true,
  imports: [LucideUser],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planner-stepper.component.html',
  styleUrl: './planner-stepper.component.css',
})
export class PlannerStepperComponent {
  @Input({ required: true }) current!: PlannerStep;

  readonly steps = STEPS;

  isDone(stepId: PlannerStep): boolean {
    return ORDER.indexOf(stepId) < ORDER.indexOf(this.current);
  }

  isCurrent(stepId: PlannerStep): boolean {
    return stepId === this.current;
  }
}
