import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { TripActivity, TripDay } from '../../core/models/trip.model';
import { TripsService } from '../../core/services/trips.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ItineraryComponent } from './itinerary.component';

describe('ItineraryComponent', () => {
  let fixture: ComponentFixture<ItineraryComponent>;
  let component: ItineraryComponent;
  let dayActivities: TripActivity[];
  let trips: {
    reorderActivities: jasmine.Spy;
    addActivity: jasmine.Spy;
    updateActivity: jasmine.Spy;
    deleteActivity: jasmine.Spy;
  };
  let toastShow: jasmine.Spy;

  beforeEach(async () => {
    dayActivities = [
      {
        id: 'a1',
        tripDayId: 'day-1',
        title: 'Castle tour',
        category: 'sightseeing',
        startTime: '09:00',
        notes: null,
        sortOrder: 0,
      },
      {
        id: 'a2',
        tripDayId: 'day-1',
        title: 'Lunch',
        category: 'food',
        startTime: '12:00',
        notes: 'reservation needed',
        sortOrder: 1,
      },
    ];

    trips = {
      reorderActivities: jasmine.createSpy('reorderActivities').and.resolveTo(),
      addActivity: jasmine.createSpy('addActivity').and.resolveTo({} as TripActivity),
      updateActivity: jasmine.createSpy('updateActivity').and.resolveTo(),
      deleteActivity: jasmine.createSpy('deleteActivity').and.resolveTo(),
    };
    toastShow = jasmine.createSpy('show');

    await TestBed.configureTestingModule({
      imports: [ItineraryComponent],
      providers: [
        { provide: TripsService, useValue: trips },
        { provide: ToastService, useValue: { show: toastShow } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItineraryComponent);
    component = fixture.componentInstance;
    component.tripId = 't1';
    const days: TripDay[] = [
      { id: 'day-1', tripId: 't1', dayIndex: 0, date: '2026-05-01', activities: dayActivities },
    ];
    component.days = days;
    fixture.detectChanges();
  });

  it('persists a reorder', () => {
    const spy = trips.reorderActivities;
    fixture.componentInstance.drop(
      { previousIndex: 0, currentIndex: 1, container: { data: dayActivities } } as any,
      'day-1',
    );
    expect(spy).toHaveBeenCalledWith('day-1', jasmine.any(Array));
  });

  it('emits changed after a successful reorder', async () => {
    let emitCount = 0;
    component.changed.subscribe(() => emitCount++);

    await component.drop(
      { previousIndex: 0, currentIndex: 1, container: { data: dayActivities } } as any,
      'day-1',
    );

    expect(emitCount).toBe(1);
  });

  it('reverts local order and shows a toast when reorder is rejected', async () => {
    trips.reorderActivities.and.rejectWith(new Error('nope'));
    const before = component.daysSig()[0].activities.map((a) => a.id);

    await component.drop(
      { previousIndex: 0, currentIndex: 1, container: { data: dayActivities } } as any,
      'day-1',
    );

    const after = component.daysSig()[0].activities.map((a) => a.id);
    expect(after).toEqual(before);
    expect(toastShow).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('adds an activity via the service and appends it locally', async () => {
    const created: TripActivity = {
      id: 'a3',
      tripDayId: 'day-1',
      title: 'Museum',
      category: 'sightseeing',
      startTime: null,
      notes: null,
      sortOrder: 2,
    };
    trips.addActivity.and.resolveTo(created);
    let emitCount = 0;
    component.changed.subscribe(() => emitCount++);

    component.openAdd('day-1');
    component.form.patchValue({ title: 'Museum' });
    await component.save();

    expect(trips.addActivity).toHaveBeenCalledWith('day-1', jasmine.objectContaining({ title: 'Museum' }));
    expect(component.daysSig()[0].activities.some((a) => a.id === 'a3')).toBeTrue();
    expect(component.addOpen()).toBeFalse();
    expect(emitCount).toBe(1);
  });

  it('keeps the modal open and toasts when add fails', async () => {
    trips.addActivity.and.rejectWith(new Error('nope'));

    component.openAdd('day-1');
    component.form.patchValue({ title: 'Museum' });
    await component.save();

    expect(component.addOpen()).toBeTrue();
    expect(toastShow).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('edits an activity in place', async () => {
    component.openEdit('day-1', dayActivities[0]);
    component.form.patchValue({ title: 'Castle tour (updated)' });
    await component.save();

    expect(trips.updateActivity).toHaveBeenCalledWith(
      'a1',
      jasmine.objectContaining({ title: 'Castle tour (updated)' }),
    );
    expect(component.daysSig()[0].activities.find((a) => a.id === 'a1')?.title).toBe(
      'Castle tour (updated)',
    );
  });

  it('deletes an activity locally and emits changed', async () => {
    let emitCount = 0;
    component.changed.subscribe(() => emitCount++);

    await component.remove('day-1', dayActivities[0]);

    expect(trips.deleteActivity).toHaveBeenCalledWith('a1');
    expect(component.daysSig()[0].activities.find((a) => a.id === 'a1')).toBeUndefined();
    expect(emitCount).toBe(1);
  });

  it('restores a deleted activity and shows a toast when delete is rejected', async () => {
    trips.deleteActivity.and.rejectWith(new Error('nope'));

    await component.remove('day-1', dayActivities[0]);

    expect(component.daysSig()[0].activities.find((a) => a.id === 'a1')).toBeTruthy();
    expect(toastShow).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('renders an "Add activity" button and a "Title" field in the modal', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('app-button, button')).map((b) => b.textContent?.trim());
    expect(buttons.some((t) => t?.includes('Add activity'))).toBeTrue();

    component.openAdd('day-1');
    fixture.detectChanges();
    expect(el.textContent).toContain('Title');
    const saveButtons = Array.from(el.querySelectorAll('button')).map((b) => b.textContent?.trim());
    expect(saveButtons.some((t) => t === 'Save')).toBeTrue();
  });
});
