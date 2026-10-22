import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ParamMap, ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';
import { PublicNavComponent } from '../../public/public-nav.component';
import { CatalogueFiltersComponent } from './catalogue-filters.component';
import { CatalogueHeroComponent } from './catalogue-hero.component';
import { CategoryBarComponent } from './category-bar.component';
import { ModelCardComponent } from './model-card.component';
import { CatalogueService } from './catalogue.service';
import {
  CATALOGUE_CATEGORIES,
  CatalogueFilters,
  CatalogueModel,
  CatalogueSort,
  PRICE_MAX,
  PRICE_MIN,
  emptyFilters,
  formatPrice
} from './catalogue.models';

interface FilterChip {
  key: string;
  value?: string;
  label: string;
}

const SORTS: CatalogueSort[] = ['recent', 'popular', 'rating', 'price-asc', 'price-desc'];

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    PublicNavComponent,
    CatalogueHeroComponent,
    CategoryBarComponent,
    CatalogueFiltersComponent,
    ModelCardComponent
  ],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss'
})
export class CatalogueComponent implements OnDestroy {
  private readonly catalogue = inject(CatalogueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly filters = signal<CatalogueFilters>(emptyFilters());
  readonly layout = signal<'grid' | 'list'>('grid');
  readonly drawer = signal(false);
  readonly loading = signal(true);
  readonly warning = signal('');
  readonly subscribed = signal(false);
  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8];
  private readonly rows = signal<CatalogueModel[] | null>(null);

  readonly result = computed(() => {
    const rows = this.rows();
    return rows ? this.catalogue.query(rows, this.filters()) : null;
  });
  readonly chips = computed(() => this.buildChips(this.filters()));
  readonly activeCategory = computed(() => {
    const categories = this.filters().categories ?? [];
    if (categories.length === 1) return categories[0];
    return categories.length ? '' : 'tous';
  });
  readonly formatPrice = formatPrice;
  readonly year = new Date().getFullYear();

  constructor() {
    this.title.setTitle('Catalogue de modèles de couture | CouturiX');
    this.meta.updateTag({
      name: 'description',
      content: 'Découvrez les modèles de couture publiés par les ateliers CouturiX : bazin, robes, tenues traditionnelles, mode homme, femme et enfant.'
    });
    this.route.queryParamMap.subscribe((params) => {
      const next = this.readParams(params);
      if (JSON.stringify(next) !== JSON.stringify(this.filters())) {
        this.filters.set(next);
      }
    });
    this.catalogue.shelf$.subscribe((shelf) => {
      this.rows.set(shelf.rows);
      this.warning.set(shelf.warning);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.title.setTitle('CouturiX');
  }

  onFilters(next: CatalogueFilters): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: this.writeParams(next) });
  }

  pickCategory(id: string): void {
    this.onFilters({ ...this.filters(), categories: id === 'tous' ? [] : [id], page: 1 });
  }

  removeChip(chip: FilterChip): void {
    const next: CatalogueFilters = { ...this.filters(), page: 1 };
    if (chip.key === 'price') {
      next.minPrice = PRICE_MIN;
      next.maxPrice = PRICE_MAX;
    } else if (chip.key === 'query' || chip.key === 'city') {
      next[chip.key] = undefined;
    } else if (chip.key === 'workshopId' || chip.key === 'minRating') {
      next[chip.key] = undefined;
    } else if (chip.value) {
      const key = chip.key as ListKey;
      next[key] = (next[key] ?? []).filter((item) => item !== chip.value);
    }
    this.onFilters(next);
  }

  reset(): void {
    this.drawer.set(false);
    this.onFilters(emptyFilters());
  }

  closeDrawer(): void {
    this.drawer.set(false);
    document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  go(page: number): void {
    if (page < 1 || page > (this.result()?.pages ?? 1)) return;
    this.onFilters({ ...this.filters(), page });
    document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setSort(sort: string): void {
    this.onFilters({ ...this.filters(), sort: SORTS.includes(sort as CatalogueSort) ? sort as CatalogueSort : 'recent', page: 1 });
  }

  setPer(value: string): void {
    const pageSize = Number(value);
    this.onFilters({ ...this.filters(), pageSize: pageSize === 24 || pageSize === 48 ? pageSize : 12, page: 1 });
  }

  toggleFavorite(model: CatalogueModel): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.catalogue.toggleFavorite(model.id);
  }

  retry(): void {
    this.loading.set(true);
    this.catalogue.reload();
  }

  subscribeNews(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const email = new FormData(form).get('email');
    if (typeof email === 'string' && email.includes('@')) {
      this.subscribed.set(true);
    }
  }

  foundLabel(): string {
    return `${new Intl.NumberFormat('fr-FR').format(this.result()?.total ?? 0)} modèles trouvés`;
  }

  pageList(current: number, pages: number): (number | string)[] {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, index) => index + 1);
    }
    const items: (number | string)[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(pages - 1, current + 1);
    if (start > 2) items.push('…');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < pages - 1) items.push('…');
    items.push(pages);
    return items;
  }

  private buildChips(filters: CatalogueFilters): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.query) chips.push({ key: 'query', label: filters.query });
    for (const id of filters.categories ?? []) {
      chips.push({ key: 'categories', value: id, label: CATALOGUE_CATEGORIES.find((item) => item.id === id)?.label ?? id });
    }
    const min = filters.minPrice ?? PRICE_MIN;
    const max = filters.maxPrice ?? PRICE_MAX;
    if (min > PRICE_MIN || max < PRICE_MAX) {
      chips.push({ key: 'price', label: `${formatPrice(min)} – ${formatPrice(max)}` });
    }
    for (const key of ['fabrics', 'genders', 'occasions', 'styles', 'sizes', 'colors', 'availability'] as const) {
      for (const value of filters[key] ?? []) chips.push({ key, value, label: value });
    }
    if (filters.city) chips.push({ key: 'city', label: filters.city });
    if (filters.workshopId) {
      const name = this.result()?.workshops.find((item) => item.id === filters.workshopId)?.name ?? 'Atelier';
      chips.push({ key: 'workshopId', label: name });
    }
    if (filters.minRating) chips.push({ key: 'minRating', label: `${filters.minRating} et plus` });
    return chips;
  }

  private readParams(params: ParamMap): CatalogueFilters {
    const sort = params.get('sort');
    const per = Number(params.get('per'));
    return {
      query: params.get('q') || undefined,
      categories: this.list(params.get('cat')),
      minPrice: this.numberOr(params.get('min'), PRICE_MIN),
      maxPrice: this.numberOr(params.get('max'), PRICE_MAX),
      fabrics: this.list(params.get('fabric')),
      genders: this.list(params.get('gender')),
      occasions: this.list(params.get('occasion')),
      styles: this.list(params.get('style')),
      sizes: this.list(params.get('size')),
      colors: this.list(params.get('color')),
      city: params.get('city') || undefined,
      workshopId: params.get('workshop') ? Number(params.get('workshop')) : undefined,
      minRating: params.get('rating') ? Number(params.get('rating')) : undefined,
      availability: this.list(params.get('dispo')),
      sort: SORTS.includes(sort as CatalogueSort) ? sort as CatalogueSort : 'recent',
      page: Math.max(1, Number(params.get('page') ?? 1) || 1),
      pageSize: per === 24 || per === 48 ? per : 12
    };
  }

  private writeParams(filters: CatalogueFilters): Record<string, string | null> {
    return {
      q: filters.query || null,
      cat: filters.categories?.join(',') || null,
      min: (filters.minPrice ?? 0) > PRICE_MIN ? String(filters.minPrice) : null,
      max: (filters.maxPrice ?? PRICE_MAX) < PRICE_MAX ? String(filters.maxPrice) : null,
      fabric: filters.fabrics?.join(',') || null,
      gender: filters.genders?.join(',') || null,
      occasion: filters.occasions?.join(',') || null,
      style: filters.styles?.join(',') || null,
      size: filters.sizes?.join(',') || null,
      color: filters.colors?.join(',') || null,
      city: filters.city || null,
      workshop: filters.workshopId ? String(filters.workshopId) : null,
      rating: filters.minRating ? String(filters.minRating) : null,
      dispo: filters.availability?.join(',') || null,
      sort: filters.sort && filters.sort !== 'recent' ? filters.sort : null,
      page: (filters.page ?? 1) > 1 ? String(filters.page) : null,
      per: filters.pageSize && filters.pageSize !== 12 ? String(filters.pageSize) : null
    };
  }

  private list(value: string | null): string[] | undefined {
    const items = value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
    return items.length ? items : undefined;
  }

  private numberOr(value: string | null, fallback: number): number {
    if (value == null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}

type ListKey = 'categories' | 'fabrics' | 'genders' | 'occasions' | 'styles' | 'sizes' | 'colors' | 'availability';
