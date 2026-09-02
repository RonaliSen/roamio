import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { Destination } from '../models/destination.model';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

@Injectable({ providedIn: 'root' })
export class DestinationsService {
  list(): Observable<Destination[]> {
    return of(DESTINATIONS);
  }

  getBySlug(slug: string): Observable<Destination | undefined> {
    return of(DESTINATIONS.find((d) => d.slug === slug));
  }
}
