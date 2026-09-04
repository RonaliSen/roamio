import { A11yModule } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

let uid = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Output() openChange = new EventEmitter<boolean>();

  protected readonly titleId = `modal-title-${uid++}`;
  private previouslyFocused: HTMLElement | null = null;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['open']) return;
    if (this.open) {
      this.previouslyFocused = document.activeElement as HTMLElement | null;
    } else {
      this.previouslyFocused?.focus?.();
      this.previouslyFocused = null;
    }
  }

  close(): void {
    this.openChange.emit(false);
  }
}
