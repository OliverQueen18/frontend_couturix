import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stars',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <span class="stars" [class.interactive]="interactive" [attr.aria-label]="label">
      @for (n of notes; track n) {
        @if (interactive) {
          <button type="button" (click)="pick(n)" (mouseenter)="hover = n" (mouseleave)="hover = 0">
            <mat-icon>{{ n <= display ? 'star' : 'star_border' }}</mat-icon>
          </button>
        } @else {
          <mat-icon>{{ n <= display ? 'star' : 'star_border' }}</mat-icon>
        }
      }
      @if (showScore) {
        <span class="score">{{ scoreLabel }}</span>
      }
    </span>
  `,
  styles: [`
    .stars {
      display: inline-flex;
      align-items: center;
      gap: 0.05rem;
      color: #c9a227;
    }
    button {
      border: 0;
      background: none;
      padding: 0;
      line-height: 1;
      color: inherit;
    }
    .interactive button { cursor: pointer; }
    button:disabled { cursor: default; }
    mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .score {
      margin-left: 0.35rem;
      color: var(--cx-muted);
      font-size: 0.82rem;
      font-weight: 600;
    }
  `]
})
export class StarsComponent {
  @Input() value = 0;
  @Input() interactive = false;
  @Input() showScore = false;
  @Input() count?: number;
  @Output() readonly rated = new EventEmitter<number>();

  readonly notes = [1, 2, 3, 4, 5];
  hover = 0;

  get display(): number {
    return this.hover || Math.round(this.value);
  }

  get scoreLabel(): string {
    if (!this.value && !this.count) {
      return 'Pas encore noté';
    }
    const avg = this.value.toFixed(1).replace('.0', '');
    return this.count ? `${avg}/5 · ${this.count} avis` : `${avg}/5`;
  }

  get label(): string {
    return this.scoreLabel;
  }

  pick(note: number): void {
    if (this.interactive) {
      this.rated.emit(note);
    }
  }
}
