import { Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  AVAILABILITY,
  CITIES,
  PRICE_MAX,
  PRICE_MIN,
  RATINGS,
  SPECIALTIES,
  STATUSES,
  WORKSHOP_TYPES,
  WorkshopFilters,
  formatPrice
} from './workshop.models';

@Component({
  selector: 'app-workshop-filters',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './workshop-filters.component.html',
  styleUrl: './workshop-filters.component.scss'
})
export class WorkshopFiltersComponent {
  readonly filters = input.required<WorkshopFilters>();
  readonly total = input(0);
  readonly counts = input<Record<string, number>>({});
  readonly changed = output<WorkshopFilters>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();
  readonly pool = input(0);

  readonly cities = CITIES;
  readonly specialties = SPECIALTIES;
  readonly ratings = RATINGS;
  readonly availability = AVAILABILITY;
  readonly types = WORKSHOP_TYPES;
  readonly statuses = STATUSES;
  readonly priceMin = PRICE_MIN;
  readonly priceMax = PRICE_MAX;
  readonly formatPrice = formatPrice;
  readonly query = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      const value = this.filters().query ?? '';
      if (value !== this.query.value) {
        this.query.setValue(value, { emitEvent: false });
      }
    });
    this.query.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed()).subscribe((value) => {
      this.patch({ query: value.trim() });
    });
  }

  count(city: string): number {
    return this.counts()[city] || 0;
  }

  checked(values: string[] | undefined, value: string): boolean {
    return !!values?.includes(value);
  }

  toggle(key: 'cities' | 'specialties' | 'availability' | 'workshopTypes' | 'statuses', value: string): void {
    const current = new Set(this.filters()[key] ?? []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    this.patch({ [key]: [...current] });
  }

  clearCities(): void {
    this.patch({ cities: [] });
  }

  applyLabel(): string {
    const total = this.total();
    if (!total) return 'Appliquer les filtres';
    return total > 1 ? `Voir les ${total} ateliers` : 'Voir 1 atelier';
  }

  setRating(value: number): void {
    this.patch({ minRating: this.filters().minRating === value ? 0 : value });
  }

  onPrice(bound: 'min' | 'max', event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const safe = Number.isFinite(raw) ? Math.min(this.priceMax, Math.max(this.priceMin, raw)) : 0;
    const min = this.filters().minPrice ?? this.priceMin;
    const max = this.filters().maxPrice ?? this.priceMax;
    if (bound === 'min') {
      this.patch({ minPrice: Math.min(safe, max), maxPrice: max });
    } else {
      this.patch({ minPrice: min, maxPrice: Math.max(safe, min) });
    }
  }

  private patch(partial: Partial<WorkshopFilters>): void {
    this.changed.emit(cleanFilters({ ...this.filters(), ...partial, page: 1 }));
  }
}

function cleanFilters(source: WorkshopFilters): WorkshopFilters {
  const next: WorkshopFilters = {
    sort: source.sort ?? 'rating',
    page: source.page ?? 1,
    pageSize: source.pageSize ?? 8,
    minPrice: source.minPrice ?? PRICE_MIN,
    maxPrice: source.maxPrice ?? PRICE_MAX
  };
  if (source.query) next.query = source.query;
  if (source.cities?.length) next.cities = source.cities;
  if (source.specialties?.length) next.specialties = source.specialties;
  if (source.minRating) next.minRating = source.minRating;
  if (source.availability?.length) next.availability = source.availability;
  if (source.workshopTypes?.length) next.workshopTypes = source.workshopTypes;
  if (source.statuses?.length) next.statuses = source.statuses;
  return next;
}
