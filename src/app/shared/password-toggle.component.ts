import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-password-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button mat-icon-button type="button"
            (click)="toggle($event)"
            [attr.aria-label]="shown() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            [attr.aria-pressed]="shown()">
      <mat-icon>{{ shown() ? 'visibility_off' : 'visibility' }}</mat-icon>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
  `]
})
export class PasswordToggleComponent {
  readonly shown = signal(false);
  readonly inputType = computed(() => (this.shown() ? 'text' : 'password'));

  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.shown.update((value) => !value);
  }
}
