import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { GarmentComponent } from './garment.component';
import { CatalogueModel, formatPrice } from './catalogue.models';
import { ModelDetailDialogService } from './model-detail-dialog.component';

@Component({
  selector: 'app-model-card',
  standalone: true,
  imports: [RouterLink, MatIconModule, GarmentComponent],
  templateUrl: './model-card.component.html',
  styleUrl: './model-card.component.scss'
})
export class ModelCardComponent {
  private readonly details = inject(ModelDetailDialogService);
  readonly model = input.required<CatalogueModel>();
  readonly layout = input<'grid' | 'list'>('grid');
  readonly favorite = output<CatalogueModel>();
  readonly formatPrice = formatPrice;
  photoFailed = false;

  open(): void {
    this.details.open(this.model());
  }

  atelierLink(model: CatalogueModel): string[] {
    return model.workshopSlug ? ['/ateliers', model.workshopSlug] : ['/ateliers'];
  }

  atelierQuery(model: CatalogueModel): { q?: string } {
    return model.workshopSlug ? {} : { q: model.workshopName };
  }

  stars(rating: number): string {
    return '★★★★★'.slice(0, Math.round(rating)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(rating));
  }
}
