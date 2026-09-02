import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';

@Component({
  selector: 'app-search-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="search"
      class="w-full rounded-none border-b border-taupe bg-transparent px-1 py-3 font-ui text-lg
             outline-none placeholder:text-taupe focus:border-champagne"
      [attr.aria-label]="placeholder"
      [placeholder]="placeholder"
      (input)="term$.next($any($event.target).value)"
      (keydown.enter)="search.emit($any($event.target).value)"
    />
  `,
})
export class SearchFieldComponent implements OnDestroy {
  @Input() placeholder = '';
  // Brief mandates this exact output name; `search` collides with a DOM event name.
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() search = new EventEmitter<string>();
  term$ = new Subject<string>();
  private sub: Subscription = this.term$
    .pipe(debounceTime(300))
    .subscribe((v) => this.search.emit(v));
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
