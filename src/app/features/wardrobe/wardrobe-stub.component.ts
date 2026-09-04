import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideShirt } from '@lucide/angular';

@Component({
  selector: 'app-wardrobe-stub',
  standalone: true,
  imports: [LucideShirt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wardrobe-stub.component.html',
  styleUrl: './wardrobe-stub.component.css',
})
export class WardrobeStubComponent {}
