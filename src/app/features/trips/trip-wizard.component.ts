import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trip-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trip-wizard.component.html',
})
export class TripWizardComponent {}
