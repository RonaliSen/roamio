import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-discover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover.component.html',
})
export class DiscoverComponent {}
