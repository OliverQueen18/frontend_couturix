import { Component, input, output } from '@angular/core';
import { QUICK_CITIES } from './workshop.models';

@Component({
  selector: 'app-city-bar',
  standalone: true,
  templateUrl: './city-bar.component.html',
  styleUrl: './city-bar.component.scss'
})
export class CityBarComponent {
  readonly counts = input<Record<string, number>>({});
  readonly total = input(0);
  readonly selected = input<string[]>([]);
  readonly pick = output<string[]>();
  readonly quick = QUICK_CITIES;
  readonly others = ['Kati', 'Gao', 'Tombouctou'];

  count(name: string): number {
    return this.counts()[name] || 0;
  }

  othersCount(): number {
    return this.others.reduce((sum, name) => sum + this.count(name), 0);
  }

  allActive(): boolean {
    return this.selected().length === 0;
  }

  active(name: string): boolean {
    return this.selected().length === 1 && this.selected()[0] === name;
  }

  othersActive(): boolean {
    const selected = this.selected();
    return selected.length > 0 && selected.every((name) => this.others.includes(name));
  }
}
