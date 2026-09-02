import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.component.html',
})
export class SkeletonComponent {
  rows: void[] = [];
  @Input() set lines(n: number) {
    this.rows = Array.from({ length: Math.max(1, n) });
  }
}
