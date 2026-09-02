import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subject, Subscription, map, merge, switchMap, takeUntil, timer } from 'rxjs';

@Component({
  selector: 'app-search-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.css',
})
export class SearchFieldComponent implements OnDestroy {
  @Input() placeholder = '';
  // Brief mandates this exact output name; `search` collides with a DOM event name.
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() search = new EventEmitter<string>();
  term$ = new Subject<string>();
  private readonly flush$ = new Subject<string>();
  // Typing debounces; Enter goes through `flush$`, which both emits immediately
  // and cancels the pending debounce timer so no duplicate follows 300ms later.
  private sub: Subscription = merge(
    this.term$.pipe(
      switchMap((v) => timer(300).pipe(map(() => v), takeUntil(this.flush$))),
    ),
    this.flush$,
  ).subscribe((v) => this.search.emit(v));

  flush(value: string): void {
    this.flush$.next(value);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
