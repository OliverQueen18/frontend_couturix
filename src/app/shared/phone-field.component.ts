import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES, formatPhone, parsePhone } from './phone-countries';

@Component({
  selector: 'app-phone-field',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneFieldComponent), multi: true }],
  template: `
    <div class="phone-row">
      <mat-form-field appearance="outline" class="dial">
        <mat-select [ngModel]="dial" (ngModelChange)="onDial($event)" [disabled]="disabled" aria-label="Pays">
          <mat-select-trigger>{{ selectedFlag }}</mat-select-trigger>
          @for (country of countries; track country.iso) {
            <mat-option [value]="country.dial">{{ country.flag }} {{ country.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="number">
        <mat-label>{{ label }}</mat-label>
        <mat-icon matPrefix>call</mat-icon>
        <input matInput [ngModel]="local" (ngModelChange)="onLocal($event)" [disabled]="disabled"
               inputmode="tel" autocomplete="tel-national">
      </mat-form-field>
    </div>
  `,
  styles: [`
    .phone-row { display: grid; grid-template-columns: 88px 1fr; gap: 0.6rem; }
    @media (max-width: 640px) { .phone-row { grid-template-columns: 1fr; } }
  `]
})
export class PhoneFieldComponent implements ControlValueAccessor {
  readonly countries = PHONE_COUNTRIES;
  @Input() label = 'Téléphone';
  dial = DEFAULT_PHONE_DIAL;
  local = '';

  get selectedFlag(): string {
    return this.countries.find((country) => country.dial === this.dial)?.flag ?? '';
  }
  disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const parsed = parsePhone(value);
    this.dial = parsed.dial;
    this.local = parsed.local;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDial(dial: string): void {
    this.dial = dial;
    this.emit();
  }

  onLocal(local: string): void {
    this.local = local;
    this.emit();
  }

  private emit(): void {
    this.onTouched();
    this.onChange(formatPhone(this.dial, this.local));
  }
}
