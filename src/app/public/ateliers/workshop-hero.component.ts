import { Component, effect, input, output, signal } from '@angular/core';
import { CITIES } from './workshop.models';

@Component({
  selector: 'app-workshop-hero',
  standalone: true,
  templateUrl: './workshop-hero.component.html',
  styleUrl: './workshop-hero.component.scss'
})
export class WorkshopHeroComponent {
  readonly queryValue = input('');
  readonly cityValue = input('');
  readonly search = output<{ query: string; city: string }>();
  readonly cities = CITIES;
  readonly query = signal('');
  readonly city = signal('');

  constructor() {
    effect(() => {
      this.query.set(this.queryValue());
      this.city.set(this.cityValue());
    });
  }

  submit(): void {
    this.search.emit({ query: this.query().trim(), city: this.city() });
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onCity(event: Event): void {
    this.city.set((event.target as HTMLSelectElement).value);
  }
}
