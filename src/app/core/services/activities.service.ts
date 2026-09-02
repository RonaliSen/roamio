import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { Activity } from '../models/trip.model';
import { ACTIVITIES } from '../../fixtures/activities.fixture';

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  listForDestination(slug: string): Observable<Activity[]> {
    return of(ACTIVITIES[slug] ?? []);
  }
}
