import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideCompass } from '@lucide/angular';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LucideCompass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="hidden md:flex items-center justify-between border-b border-champagne bg-ivory px-6 py-4"
    >
      <a routerLink="/" class="font-display text-2xl tracking-wide text-charcoal">ROAMIO</a>
      <div class="flex items-center gap-8 font-ui text-sm text-taupe">
        <a
          routerLink="/discover"
          routerLinkActive="text-charcoal"
          class="flex items-center gap-1.5 hover:text-charcoal"
        >
          <svg lucideCompass [size]="16"></svg>
          Discover
        </a>
        <a routerLink="/trips" routerLinkActive="text-charcoal" class="hover:text-charcoal">
          My Trips
        </a>
        @if (authed) {
          <button type="button" (click)="signOut.emit()" class="hover:text-charcoal">Sign out</button>
        } @else {
          <a routerLink="/login" routerLinkActive="text-charcoal" class="hover:text-charcoal">
            Sign in
          </a>
        }
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  /** Placeholder until Task 8 wires real auth. */
  @Input() authed = false;
  @Output() signOut = new EventEmitter<void>();
}
