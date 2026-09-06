import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { DestinationsService } from '../../core/services/destinations.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { SearchFieldComponent } from '../../shared/ui/search-field/search-field.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, SearchFieldComponent, CardComponent, SkeletonComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly destinationsService = inject(DestinationsService);

  readonly destinations = toSignal(this.destinationsService.list(), { initialValue: undefined });

  readonly travelEdit = [
    {
      kicker: 'City break',
      title: '48 hours in Lisbon',
      blurb: 'A tight loop of miradouros, tram 28 and one long seafood lunch by the water.',
    },
    {
      kicker: 'Slow travel',
      title: 'Slow travel in Kyoto',
      blurb: 'Ten days, three neighbourhoods, and mornings kept deliberately empty.',
    },
    {
      kicker: 'Timing',
      title: 'The Northern Lights window',
      blurb: 'When to be in Iceland, how long to stay, and what the sky actually owes you.',
    },
  ];

  readonly skeletons = [0, 1, 2];

  onSearch(term: string): void {
    this.router.navigate(['/plan/understand'], { state: { message: term } });
  }
}
