import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCompass, LucideHouse, LucideLuggage } from '@lucide/angular';

@Component({
  selector: 'app-mobile-nav',
  imports: [RouterLink, RouterLinkActive, LucideHouse, LucideCompass, LucideLuggage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-nav.component.html',
})
export class MobileNavComponent {}
