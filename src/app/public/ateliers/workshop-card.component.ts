import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Workshop, workshopBadge } from './workshop.models';
import { WorkshopProfileDialogService } from './workshop-profile-dialog.component';

@Component({
  selector: 'app-workshop-card',
  standalone: true,
  templateUrl: './workshop-card.component.html',
  styleUrl: './workshop-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkshopCardComponent {
  private readonly profiles = inject(WorkshopProfileDialogService);
  readonly workshop = input.required<Workshop>();
  readonly layout = input<'grid' | 'list'>('grid');
  readonly favorite = output<Workshop>();
  readonly badge = computed(() => workshopBadge(this.workshop()));
  readonly tags = computed(() => this.workshop().specialties.slice(0, 3));
  readonly extra = computed(() => Math.max(0, this.workshop().specialties.length - 3));
  photoFailed = false;

  initial(): string {
    return this.workshop().name.trim().charAt(0).toUpperCase();
  }

  score(): string {
    return this.workshop().rating.toFixed(1).replace('.', ',');
  }

  openProfile(): void {
    this.profiles.open(this.workshop());
  }

  onFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorite.emit(this.workshop());
  }
}
