import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { NewActivity, TripActivity, TripDay } from '../../core/models/trip.model';
import { TripsService } from '../../core/services/trips.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ToastService } from '../../shared/ui/toast/toast.service';

const CATEGORIES = ['sightseeing', 'food', 'transport', 'lodging', 'activity', 'other'];

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [ReactiveFormsModule, DragDropModule, ButtonComponent, InputComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './itinerary.component.html',
  styleUrl: './itinerary.component.css',
})
export class ItineraryComponent {
  private readonly tripsService = inject(TripsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  @Input() tripId!: string;
  @Input() set days(v: TripDay[]) {
    this.daysSig.set(v.map((d) => ({ ...d, activities: [...d.activities] })));
  }
  @Output() changed = new EventEmitter<void>();

  readonly categories = CATEGORIES;
  readonly daysSig = signal<TripDay[]>([]);

  readonly addOpen = signal(false);
  private readonly addDayId = signal<string | null>(null);
  private readonly editingId = signal<string | null>(null);
  readonly modalTitle = computed(() => (this.editingId() ? 'Edit activity' : 'Add activity'));

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    startTime: [''],
    category: ['sightseeing'],
    notes: [''],
  });

  /** Opens the modal in "add" mode for the given day. */
  openAdd(dayId: string): void {
    this.editingId.set(null);
    this.addDayId.set(dayId);
    this.form.reset({ title: '', startTime: '', category: 'sightseeing', notes: '' });
    this.addOpen.set(true);
  }

  /** Opens the modal pre-filled to edit an existing activity. */
  openEdit(dayId: string, act: TripActivity): void {
    this.editingId.set(act.id);
    this.addDayId.set(dayId);
    this.form.reset({
      title: act.title,
      startTime: act.startTime ?? '',
      category: act.category,
      notes: act.notes ?? '',
    });
    this.addOpen.set(true);
  }

  /** Saves the modal form: creates a new activity, or patches the one being edited. */
  async save(): Promise<void> {
    if (this.form.invalid) return;
    const dayId = this.addDayId();
    if (!dayId) return;

    const v = this.form.getRawValue();
    const input: NewActivity = {
      title: v.title.trim(),
      startTime: v.startTime || null,
      category: v.category,
      notes: v.notes || null,
    };

    const editing = this.editingId();
    try {
      if (editing) {
        await this.tripsService.updateActivity(editing, input);
        this.patchLocal(dayId, editing, input);
      } else {
        const created = await this.tripsService.addActivity(dayId, input);
        this.pushLocal(dayId, created);
      }
      this.addOpen.set(false);
      this.changed.emit();
    } catch {
      this.toast.show(editing ? 'Could not update activity' : 'Could not add activity', 'error');
    }
  }

  /** Optimistically removes an activity; re-inserts it and toasts on failure. */
  async remove(dayId: string, act: TripActivity): Promise<void> {
    const activities = this.dayActivities(dayId);
    const idx = activities.findIndex((a) => a.id === act.id);
    if (idx === -1) return;

    this.setDayActivities(dayId, activities.filter((a) => a.id !== act.id));
    try {
      await this.tripsService.deleteActivity(act.id);
      this.changed.emit();
    } catch {
      const current = this.dayActivities(dayId);
      this.setDayActivities(dayId, [...current.slice(0, idx), act, ...current.slice(idx)]);
      this.toast.show('Could not delete activity', 'error');
    }
  }

  /** Reorders a day's activities; reverts + toasts if persisting the new order fails. */
  async drop(event: CdkDragDrop<TripActivity[]>, dayId: string): Promise<void> {
    const activities = this.dayActivities(dayId);
    if (!activities.length) return;

    const reordered = [...activities];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.setDayActivities(dayId, reordered);

    try {
      await this.tripsService.reorderActivities(
        dayId,
        reordered.map((a) => a.id),
      );
      this.changed.emit();
    } catch {
      this.setDayActivities(dayId, activities);
      this.toast.show('Could not reorder', 'error');
    }
  }

  private dayActivities(dayId: string): TripActivity[] {
    return this.daysSig().find((d) => d.id === dayId)?.activities ?? [];
  }

  private setDayActivities(dayId: string, activities: TripActivity[]): void {
    this.daysSig.update((days) => days.map((d) => (d.id === dayId ? { ...d, activities } : d)));
  }

  private pushLocal(dayId: string, act: TripActivity): void {
    this.setDayActivities(dayId, [...this.dayActivities(dayId), act]);
  }

  private patchLocal(dayId: string, actId: string, patch: NewActivity): void {
    this.setDayActivities(
      dayId,
      this.dayActivities(dayId).map((a) =>
        a.id === actId
          ? {
              ...a,
              title: patch.title,
              startTime: patch.startTime ?? null,
              category: patch.category ?? a.category,
              notes: patch.notes ?? null,
            }
          : a,
      ),
    );
  }
}
