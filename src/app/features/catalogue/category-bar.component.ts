import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CATALOGUE_CATEGORIES } from './catalogue.models';

@Component({
  selector: 'app-category-bar',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './category-bar.component.html',
  styleUrl: './category-bar.component.scss'
})
export class CategoryBarComponent {
  readonly counts = input<Record<string, number>>({});
  readonly active = input('tous');
  readonly picked = output<string>();
  readonly categories = CATALOGUE_CATEGORIES;

  count(id: string): number {
    return this.counts()[id] ?? 0;
  }
}
