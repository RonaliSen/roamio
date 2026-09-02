import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uid = 0;

@Component({
  selector: 'app-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: InputComponent, multi: true }],
  template: `
    <label class="flex flex-col gap-1.5 font-ui text-sm text-charcoal">
      @if (label) {
        <span>{{ label }}</span>
      }
      <input
        [id]="id"
        [type]="type"
        [value]="value"
        [disabled]="disabled"
        [attr.aria-invalid]="error ? 'true' : null"
        [attr.aria-describedby]="error ? id + '-error' : null"
        class="border-b bg-transparent px-1 py-2 text-base outline-none focus:border-champagne"
        [class]="error ? 'border-champagne' : 'border-taupe'"
        (input)="onInput($any($event.target).value)"
        (blur)="onTouched()"
      />
      @if (error) {
        <span [id]="id + '-error'" class="text-sm text-taupe">{{ error }}</span>
      }
    </label>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() error?: string;

  readonly id = `app-input-${uid++}`;
  value = '';
  disabled = false;

  private onChange: (v: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  onInput(v: string): void {
    this.value = v;
    this.onChange(v);
  }

  writeValue(v: string | null): void {
    this.value = v ?? '';
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
