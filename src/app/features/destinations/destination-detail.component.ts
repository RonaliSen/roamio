import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './destination-detail.component.html',
})
export class DestinationDetailComponent {}
