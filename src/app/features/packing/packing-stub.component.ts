import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideLuggage } from '@lucide/angular';

@Component({
  selector: 'app-packing-stub',
  standalone: true,
  imports: [LucideLuggage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './packing-stub.component.html',
  styleUrl: './packing-stub.component.css',
})
export class PackingStubComponent {}
