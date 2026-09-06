import { Injectable, signal } from '@angular/core';
import type { TripIntent, FeasibilityResult, DestinationMatch } from '../models/trip-intent.model';
import type { Destination } from '../models/destination.model';

@Injectable({ providedIn: 'root' })
export class TripPlannerStore {
  intent = signal<TripIntent | null>(null);
  chosenDestination = signal<Destination | null>(null);
  feasibility = signal<FeasibilityResult | null>(null);
  matches = signal<DestinationMatch[]>([]);

  setIntent(i: TripIntent): void { this.intent.set(i); }

  patchIntent(patch: Partial<TripIntent>): void {
    const current = this.intent();
    if (!current) { return; }
    this.intent.set({ ...current, ...patch });
  }

  setFeasibility(f: FeasibilityResult): void { this.feasibility.set(f); }
  setMatches(m: DestinationMatch[]): void { this.matches.set(m); }
  chooseDestination(d: Destination): void { this.chosenDestination.set(d); }

  reset(): void {
    this.intent.set(null);
    this.chosenDestination.set(null);
    this.feasibility.set(null);
    this.matches.set([]);
  }
}
