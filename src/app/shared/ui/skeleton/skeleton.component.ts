import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3" aria-hidden="true">
      @for (line of rows; track $index) {
        <div class="h-4 w-full animate-pulse bg-surface"></div>
      }
    </div>
  `,
})
export class SkeletonComponent {
  rows: void[] = [];
  @Input() set lines(n: number) {
    this.rows = Array.from({ length: Math.max(1, n) });
  }
}
