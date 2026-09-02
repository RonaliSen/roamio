import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="tablist" class="flex gap-6 border-b border-champagne font-ui text-sm">
      @for (tab of tabs; track tab.id) {
        <button
          role="tab"
          type="button"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="tab.id === active"
          [tabindex]="tab.id === active ? 0 : -1"
          class="-mb-px border-b-2 px-1 py-3"
          [class]="tab.id === active ? 'border-charcoal text-charcoal' : 'border-transparent text-taupe'"
          (click)="select(tab.id)"
          (keydown)="onKeydown($event, $index)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class TabsComponent {
  @Input() tabs: Tab[] = [];
  @Input() active = '';
  @Output() activeChange = new EventEmitter<string>();

  select(id: string): void {
    if (id !== this.active) {
      this.active = id;
      this.activeChange.emit(id);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % this.tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + this.tabs.length) % this.tabs.length;
    if (next < 0) return;
    event.preventDefault();
    const tab = this.tabs[next];
    this.select(tab.id);
    const el = document.getElementById('tab-' + tab.id);
    el?.focus();
  }
}
