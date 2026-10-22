import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ParamMap, ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { AuthService } from '../core/auth.service';
import { PublicNavComponent } from './public-nav.component';
import { CityBarComponent } from './ateliers/city-bar.component';
import { WorkshopCardComponent } from './ateliers/workshop-card.component';
import { WorkshopFiltersComponent } from './ateliers/workshop-filters.component';
import { WorkshopHeroComponent } from './ateliers/workshop-hero.component';
import { WorkshopService } from './ateliers/workshop.service';
import {
  PRICE_MAX,
  PRICE_MIN,
  STATUSES,
  Workshop,
  WorkshopFilters,
  WorkshopSort,
  formatPrice
} from './ateliers/workshop.models';

interface FilterChip {
  key: string;
  value?: string;
  label: string;
}

const SORTS: { id: WorkshopSort; label: string }[] = [
  { id: 'rating', label: 'Mieux notés' },
  { id: 'popular', label: 'Plus populaires' },
  { id: 'recent', label: 'Plus récents' },
  { id: 'name-asc', label: 'Nom A-Z' },
  { id: 'name-desc', label: 'Nom Z-A' }
];

@Component({
  selector: 'app-ateliers-public',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    PublicNavComponent,
    WorkshopHeroComponent,
    CityBarComponent,
    WorkshopFiltersComponent,
    WorkshopCardComponent
  ],
  templateUrl: './ateliers/ateliers-page.component.html',
  styleUrl: './ateliers/ateliers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AteliersPublicComponent implements OnDestroy {
  private readonly directory = inject(WorkshopService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly filters = signal<WorkshopFilters>({ sort: 'rating', page: 1, pageSize: 8, minPrice: PRICE_MIN, maxPrice: PRICE_MAX });
  readonly layout = signal<'grid' | 'list'>('grid');
  readonly drawer = signal(false);
  readonly loading = signal(true);
  readonly warning = signal('');
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly sorts = SORTS;
  readonly year = new Date().getFullYear();
  email = '';
  note = '';
  readonly rows = signal<Workshop[] | null>(null);

  readonly result = computed(() => {
    const rows = this.rows();
    return rows ? this.directory.query(rows, this.filters()) : null;
  });
  readonly pool = computed(() => Object.values(this.result()?.cityCounts ?? {}).reduce((sum, value) => sum + value, 0));
  readonly chips = computed(() => this.buildChips(this.filters()));
  readonly heroCity = computed(() => {
    const cities = this.filters().cities ?? [];
    return cities.length === 1 ? (cities[0] ?? '') : '';
  });

  constructor() {
    this.title.setTitle('Ateliers de couture | CouturiX');
    this.meta.updateTag({
      name: 'description',
      content: 'Trouvez un atelier de couture près de chez vous. Comparez les notes, les spécialités et contactez les maisons CouturiX.'
    });
    this.route.queryParamMap.subscribe((params) => {
      const next = readParams(params);
      if (JSON.stringify(next) !== JSON.stringify(this.filters())) {
        this.filters.set(next);
      }
    });
    this.directory.shelf$.subscribe((shelf) => {
      this.rows.set(shelf.rows);
      this.warning.set(shelf.warning);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.title.setTitle('CouturiX');
  }

  onHero(event: { query: string; city: string }): void {
    this.commit({
      ...this.filters(),
      page: 1,
      query: event.query,
      cities: event.city ? [event.city] : []
    });
    this.scrollResults();
  }

  onCities(cities: string[]): void {
    this.commit({ ...this.filters(), cities, page: 1 });
  }

  commit(next: WorkshopFilters): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: writeParams(next) });
  }

  reset(): void {
    this.drawer.set(false);
    void this.router.navigate(['/ateliers']);
  }

  closeDrawer(): void {
    this.drawer.set(false);
    this.scrollResults();
  }

  onSort(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value as WorkshopSort;
    this.commit({ ...this.filters(), sort, page: 1 });
  }

  onPageSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    this.commit({ ...this.filters(), pageSize, page: 1 });
  }

  go(page: number): void {
    const pages = this.result()?.pages ?? 1;
    if (page < 1 || page > pages || page === this.result()?.page) return;
    this.commit({ ...this.filters(), page });
    this.scrollResults();
  }

  pageList(): Array<number | string> {
    const current = this.result()?.page ?? 1;
    const total = this.result()?.pages ?? 1;
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const items: Array<number | string> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) items.push('…');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < total - 1) items.push('…');
    items.push(total);
    return items;
  }

  onFavorite(workshop: Workshop): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.directory.toggleFavorite(workshop.slug);
  }

  removeChip(chip: FilterChip): void {
    const next: WorkshopFilters = { ...this.filters(), page: 1 };
    if (chip.key === 'query') delete next.query;
    if (chip.key === 'city') next.cities = (next.cities ?? []).filter((city) => city !== chip.value);
    if (chip.key === 'spec') next.specialties = (next.specialties ?? []).filter((item) => item !== chip.value);
    if (chip.key === 'dispo') next.availability = (next.availability ?? []).filter((item) => item !== chip.value);
    if (chip.key === 'type') next.workshopTypes = (next.workshopTypes ?? []).filter((item) => item !== chip.value);
    if (chip.key === 'status') next.statuses = (next.statuses ?? []).filter((item) => item !== chip.value);
    if (chip.key === 'rating') delete next.minRating;
    if (chip.key === 'price') {
      next.minPrice = PRICE_MIN;
      next.maxPrice = PRICE_MAX;
    }
    this.commit(next);
  }

  foundLabel(): string {
    const total = this.result()?.total ?? 0;
    const formatted = new Intl.NumberFormat('fr-FR').format(total);
    return total > 1 ? `${formatted} ateliers trouvés` : `${formatted} atelier trouvé`;
  }

  retry(): void {
    this.loading.set(true);
    this.directory.reload();
  }

  subscribe(): void {
    this.note = this.email.includes('@') ? 'Merci, votre adresse est notée.' : 'Indiquez une adresse email valide.';
  }

  private scrollResults(): void {
    queueMicrotask(() => document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private buildChips(filters: WorkshopFilters): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.query) chips.push({ key: 'query', label: filters.query });
    for (const city of filters.cities ?? []) chips.push({ key: 'city', value: city, label: city });
    for (const item of filters.specialties ?? []) chips.push({ key: 'spec', value: item, label: item });
    if (filters.minRating) chips.push({ key: 'rating', label: `${String(filters.minRating).replace('.', ',')} et plus` });
    if ((filters.minPrice ?? 0) > PRICE_MIN || (filters.maxPrice ?? PRICE_MAX) < PRICE_MAX) {
      chips.push({ key: 'price', label: `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}` });
    }
    for (const item of filters.availability ?? []) chips.push({ key: 'dispo', value: item, label: item });
    for (const item of filters.workshopTypes ?? []) chips.push({ key: 'type', value: item, label: item });
    for (const item of filters.statuses ?? []) {
      chips.push({ key: 'status', value: item, label: STATUSES.find((status) => status.id === item)?.label ?? item });
    }
    return chips;
  }
}

function readParams(params: ParamMap): WorkshopFilters {
  const number = (key: string, fallback: number) => {
    const value = Number(params.get(key));
    return Number.isFinite(value) && params.get(key) !== null ? value : fallback;
  };
  const list = (key: string) => (params.get(key) ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  const sort = params.get('sort');
  const allowed: WorkshopSort[] = ['rating', 'popular', 'recent', 'name-asc', 'name-desc'];
  const pageSize = number('per', 8);
  const next: WorkshopFilters = {
    sort: allowed.includes(sort as WorkshopSort) ? sort as WorkshopSort : 'rating',
    page: Math.max(1, number('page', 1)),
    pageSize: pageSize === 16 || pageSize === 24 || pageSize === 48 ? pageSize : 8,
    minPrice: number('min', PRICE_MIN),
    maxPrice: number('max', PRICE_MAX)
  };
  const query = params.get('q');
  const cities = list('city');
  const specialties = list('spec');
  const availability = list('dispo');
  const types = list('type');
  const statuses = list('status');
  if (query) next.query = query;
  if (cities.length) next.cities = cities;
  if (specialties.length) next.specialties = specialties;
  if (params.get('rating')) next.minRating = number('rating', 0);
  if (availability.length) next.availability = availability;
  if (types.length) next.workshopTypes = types;
  if (statuses.length) next.statuses = statuses;
  return next;
}

function writeParams(filters: WorkshopFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.query) params['q'] = filters.query;
  if (filters.cities?.length) params['city'] = filters.cities.join(',');
  if (filters.specialties?.length) params['spec'] = filters.specialties.join(',');
  if (filters.minRating) params['rating'] = filters.minRating;
  if ((filters.minPrice ?? 0) > PRICE_MIN) params['min'] = filters.minPrice ?? 0;
  if ((filters.maxPrice ?? PRICE_MAX) < PRICE_MAX) params['max'] = filters.maxPrice ?? PRICE_MAX;
  if (filters.availability?.length) params['dispo'] = filters.availability.join(',');
  if (filters.workshopTypes?.length) params['type'] = filters.workshopTypes.join(',');
  if (filters.statuses?.length) params['status'] = filters.statuses.join(',');
  if (filters.sort && filters.sort !== 'rating') params['sort'] = filters.sort;
  if ((filters.page ?? 1) > 1) params['page'] = filters.page ?? 1;
  if (filters.pageSize && filters.pageSize !== 8) params['per'] = filters.pageSize;
  return params;
}
