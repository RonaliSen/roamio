import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DestinationsService } from './destinations.service';

describe('DestinationsService', () => {
  it('returns prague by slug', async () => {
    const svc = TestBed.inject(DestinationsService);
    const d = await firstValueFrom(svc.getBySlug('prague'));
    expect(d?.name).toBe('Prague');
  });
  it('returns undefined for unknown slug', async () => {
    const svc = TestBed.inject(DestinationsService);
    expect(await firstValueFrom(TestBed.inject(DestinationsService).getBySlug('atlantis'))).toBeUndefined();
  });
});
