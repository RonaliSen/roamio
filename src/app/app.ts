import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './layout/navbar/navbar.component';
import { MobileNavComponent } from './layout/mobile-nav/mobile-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, MobileNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
