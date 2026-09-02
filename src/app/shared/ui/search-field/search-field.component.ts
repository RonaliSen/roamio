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
  templateUrl: './search-field.component.html',
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
