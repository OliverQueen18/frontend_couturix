import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AVAILABILITY,
  CATALOGUE_CATEGORIES,
  CITIES,
  COLORS,
  CatalogueFilters,
  FABRICS,
  GENDERS,
  OCCASIONS,
  PRICE_MAX,
  PRICE_MIN,
  RATINGS,
  SIZES,
  STYLES,
  formatPrice
} from './catalogue.models';

@Component({
  selector: 'app-catalogue-filters',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './catalogue-filters.component.html',
  styleUrl: './catalogue-filters.component.scss'
})
export class CatalogueFiltersComponent {
  readonly filters = input.required<CatalogueFilters>();
  readonly counts = input<Record<string, number>>({});
  readonly workshops = input<{ id: number; name: string }[]>([]);
  readonly total = input(0);
  readonly filtersChange = output<CatalogueFilters>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();

  readonly search = new FormControl('', { nonNullable: true });
  readonly categories = CATALOGUE_CATEGORIES.filter((item) => item.id !== 'tous');
  readonly fabrics = FABRICS;
  readonly genders = GENDERS;
  readonly occasions = OCCASIONS;
  readonly styles = STYLES;
  readonly sizes = SIZES;
  readonly colors = COLORS;
  readonly cities = CITIES;
  readonly ratings = RATINGS;
  readonly availability = AVAILABILITY;
  readonly priceMin = PRICE_MIN;
  readonly priceMax = PRICE_MAX;
  readonly formatPrice = formatPrice;

  constructor() {
    effect(() => {
      const query = this.filters().query ?? '';
      if (query !== this.search.value) {
        this.search.setValue(query, { emitEvent: false });
      }
    });
    this.search.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed()).subscribe((query) => {
      this.push({ query: query.trim() || undefined });
    });
  }

  has(list: string[] | undefined, value: string): boolean {
    return !!list?.includes(value);
  }

  toggle(key: ListKey, value: string): void {
    const current = new Set(this.filters()[key] ?? []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    this.push({ [key]: [...current] });
  }

  setCategories(id?: string): void {
    this.push({ categories: id ? [id] : [] });
  }

  toggleCategory(id: string): void {
    this.toggle('categories', id);
  }

  setPrice(edge: 'minPrice' | 'maxPrice', raw: string): void {
    const value = Math.min(this.priceMax, Math.max(this.priceMin, Number(raw) || 0));
    const filters = this.filters();
    const min = edge === 'minPrice' ? value : filters.minPrice ?? this.priceMin;
    const max = edge === 'maxPrice' ? value : filters.maxPrice ?? this.priceMax;
    this.push({ minPrice: Math.min(min, max), maxPrice: Math.max(min, max) });
  }

  setCity(city: string): void {
    this.push({ city: city || undefined });
  }

  setWorkshop(id: string): void {
    this.push({ workshopId: id ? Number(id) : undefined });
  }

  setRating(value: number): void {
    const current = this.filters().minRating;
    this.push({ minRating: current === value ? undefined : value });
  }

  private push(patch: Partial<CatalogueFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...patch, page: 1 });
  }
}

type ListKey = 'categories' | 'fabrics' | 'genders' | 'occasions' | 'styles' | 'sizes' | 'colors' | 'availability';
