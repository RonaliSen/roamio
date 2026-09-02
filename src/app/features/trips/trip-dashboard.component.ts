import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trip-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trip-dashboard.component.html',
  styleUrl: './trip-dashboard.component.css',
})
export class TripDashboardComponent {}
