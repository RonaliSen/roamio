import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCompass, LucideHouse } from '@lucide/angular';

@Component({
  selector: 'app-mobile-nav',
  imports: [RouterLink, RouterLinkActive, LucideHouse, LucideCompass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-nav.component.html',
  styleUrl: './mobile-nav.component.css',
})
export class MobileNavComponent {}
