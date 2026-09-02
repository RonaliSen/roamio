import { Injectable } from '@angular/core';
import { supabase } from '../auth/supabase.client';
import type { Trip, TripActivity, TripDay, TripDetail, CreateTripInput, NewActivity } from '../models/trip.model';
import type { BudgetBreakdown } from '../models/budget.model';

const ZERO_BUDGET: BudgetBreakdown = {
  accommodation: 0,
  transport: 0,
  food: 0,
  activities: 0,
  localTransport: 0,
  shopping: 0,
};

/**
 * Inclusive list of `YYYY-MM-DD` strings from `start` to `end`.
 * Parsed as UTC so DST / local-timezone shifts never drop or duplicate a day.
 * Returns `[]` when `end < start`.
 */
export function datesInRange(start: string, end: string): string[] {
  const endMs = Date.parse(end + 'T00:00:00Z');
  const out: string[] = [];
  for (let d = new Date(start + 'T00:00:00Z'); d.getTime() <= endMs; d = new Date(d.getTime() + 86400000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/* ---- row mappers: snake_case row -> camelCase model (pure, exported for tests) ---- */

interface TripRow {
  id: string;
  destination_slug: string;
  title: string;
  start_date: string;
  end_date: string;
  travelers: number;
  interests: string[] | null;
  currency: string;
  created_at: string;
}
interface ActivityRow {
  id: string;
  trip_day_id: string;
  title: string;
  category: string;
  start_time: string | null;
  notes: string | null;
  sort_order: number;
}
interface TripDayRow {
  id: string;
  trip_id: string;
  day_index: number;
  date: string;
}
interface BudgetRow {
  accommodation: number;
  transport: number;
  food: number;
  activities: number;
  local_transport: number;
  shopping: number;
}

export function rowToTrip(r: TripRow): Trip {
  return {
    id: r.id,
    destinationSlug: r.destination_slug,
    title: r.title,
    startDate: r.start_date,
    endDate: r.end_date,
    travelers: r.travelers,
    interests: r.interests ?? [],
    currency: r.currency,
    createdAt: r.created_at,
  };
}

export function rowToTripActivity(r: ActivityRow): TripActivity {
  return {
    id: r.id,
    tripDayId: r.trip_day_id,
    title: r.title,
    category: r.category,
    startTime: r.start_time,
    notes: r.notes,
    sortOrder: r.sort_order,
  };
}

export function rowToTripDay(r: TripDayRow, activities: TripActivity[]): TripDay {
  return {
    id: r.id,
    tripId: r.trip_id,
    dayIndex: r.day_index,
    date: r.date,
    activities,
  };
}

export function rowToBudget(r: BudgetRow): BudgetBreakdown {
  return {
    accommodation: r.accommodation,
    transport: r.transport,
    food: r.food,
    activities: r.activities,
    localTransport: r.local_transport,
    shopping: r.shopping,
  };
}

@Injectable({ providedIn: 'root' })
export class TripsService {
  private unwrap<T>({ data, error }: { data: T; error: unknown }): NonNullable<T> {
    if (error) throw error;
    return data as NonNullable<T>;
  }

  private async userId(): Promise<string> {
    const id = (await supabase.auth.getUser()).data.user?.id;
    if (!id) throw new Error('Not authenticated');
    return id;
  }

  /**
   * ponytail: sequential inserts, wrap in an RPC if partial-failure matters.
   * These are 3 sequential inserts (trips, trip_days, budgets), not a transaction.
   * Acceptable for this app; a Postgres function would make it atomic.
   */
  async create(input: CreateTripInput): Promise<string> {
    const userId = await this.userId();

    const trip = this.unwrap(
      await supabase
        .from('trips')
        .insert({
          user_id: userId,
          destination_slug: input.destinationSlug,
          title: input.title,
          start_date: input.startDate,
          end_date: input.endDate,
          travelers: input.travelers,
          interests: input.interests,
          currency: input.currency,
        })
        .select('id')
        .single(),
    );
    const tripId = trip.id as string;

    const dayRows = datesInRange(input.startDate, input.endDate).map((date, i) => ({
      trip_id: tripId,
      user_id: userId,
      day_index: i,
      date,
    }));
    this.unwrap(await supabase.from('trip_days').insert(dayRows));

    const b = input.budget;
    this.unwrap(
      await supabase.from('budgets').insert({
        trip_id: tripId,
        user_id: userId,
        accommodation: b.accommodation,
        transport: b.transport,
        food: b.food,
        activities: b.activities,
        local_transport: b.localTransport,
        shopping: b.shopping,
      }),
    );

    return tripId;
  }

  async get(id: string): Promise<TripDetail> {
    const tripRow = this.unwrap(await supabase.from('trips').select('*').eq('id', id).single()) as TripRow;
    const dayRows = this.unwrap(
      await supabase.from('trip_days').select('*').eq('trip_id', id).order('day_index'),
    ) as TripDayRow[];
    const dayIds = dayRows.map((d) => d.id);
    const actRows: ActivityRow[] = dayIds.length
      ? (this.unwrap(
          await supabase.from('activities').select('*').in('trip_day_id', dayIds).order('sort_order'),
        ) as ActivityRow[])
      : [];
    const budgetRow = this.unwrap(await supabase.from('budgets').select('*').eq('trip_id', id).maybeSingle());

    return {
      trip: rowToTrip(tripRow),
      days: dayRows.map((d) =>
        rowToTripDay(
          d,
          actRows.filter((a) => a.trip_day_id === d.id).map(rowToTripActivity),
        ),
      ),
      budget: budgetRow ? rowToBudget(budgetRow) : { ...ZERO_BUDGET },
    };
  }

  async addActivity(tripDayId: string, a: NewActivity): Promise<TripActivity> {
    const userId = await this.userId();
    const { count } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('trip_day_id', tripDayId);

    const inserted = this.unwrap(
      await supabase
        .from('activities')
        .insert({
          trip_day_id: tripDayId,
          user_id: userId,
          title: a.title,
          category: a.category ?? 'sightseeing',
          start_time: a.startTime ?? null,
          notes: a.notes ?? null,
          sort_order: count ?? 0,
        })
        .select('*')
        .single(),
    );
    return rowToTripActivity(inserted);
  }

  async updateActivity(id: string, patch: Partial<TripActivity>): Promise<void> {
    const map: Record<string, string> = {
      title: 'title',
      category: 'category',
      startTime: 'start_time',
      notes: 'notes',
      sortOrder: 'sort_order',
      tripDayId: 'trip_day_id',
    };
    const row: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(map)) {
      if (k in patch) row[col] = (patch as Record<string, unknown>)[k];
    }
    this.unwrap(await supabase.from('activities').update(row).eq('id', id));
  }

  async deleteActivity(id: string): Promise<void> {
    this.unwrap(await supabase.from('activities').delete().eq('id', id));
  }

  async reorderActivities(tripDayId: string, orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, i) =>
        supabase
          .from('activities')
          .update({ sort_order: i })
          .eq('id', id)
          .eq('trip_day_id', tripDayId)
          .then(({ error }) => {
            if (error) throw error;
          }),
      ),
    );
  }

  async updateBudget(tripId: string, b: BudgetBreakdown): Promise<void> {
    this.unwrap(
      await supabase
        .from('budgets')
        .update({
          accommodation: b.accommodation,
          transport: b.transport,
          food: b.food,
          activities: b.activities,
          local_transport: b.localTransport,
          shopping: b.shopping,
        })
        .eq('trip_id', tripId),
    );
  }
}
