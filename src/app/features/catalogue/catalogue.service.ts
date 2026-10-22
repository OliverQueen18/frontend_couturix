import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Modele, PageResponse } from '../../core/models';
import { CATALOGUE_MOCKS } from './catalogue.data';
import {
  CatalogueFilters,
  CatalogueModel,
  CatalogueResult,
  CatalogueSort,
  GarmentKind,
  PRICE_MAX,
  PRICE_MIN
} from './catalogue.models';

const FAVORITES = 'cx-favorites';

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly api = inject(ApiService);
  private readonly favorites = signal<Set<number>>(this.readFavorites());
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly shelf$ = this.refresh$.pipe(
    switchMap(() => this.api.get<PageResponse<Modele>>('public/modeles', { page: 0, size: 48 }).pipe(
      map((page) => ({ rows: this.merge(page.content ?? []), warning: '' })),
      catchError(() => of({
        rows: CATALOGUE_MOCKS.map((item) => ({ ...item })),
        warning: 'Impossible de charger les modèles publiés pour le moment.'
      }))
    )),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  reload(): void {
    this.refresh$.next();
  }

  query(rows: CatalogueModel[], filters: CatalogueFilters): CatalogueResult {
    const favoriteIds = this.favorites();
    const priced = rows.filter((item) => this.matches(item, filters, false));
    const filtered = priced.filter((item) => this.matches(item, filters, true));
    const sorted = this.sort(filtered, filters.sort ?? 'recent');
    const pageSize = filters.pageSize === 24 || filters.pageSize === 48 ? filters.pageSize : 12;
    const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const page = Math.min(Math.max(1, filters.page ?? 1), pages);
    const start = (page - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize).map((item) => ({ ...item, favorite: favoriteIds.has(item.id) })),
      total: sorted.length,
      page,
      pageSize,
      pages,
      counts: this.counts(priced),
      workshops: this.workshops(rows)
    };
  }

  resolve(id: number): Observable<CatalogueModel | null> {
    const local = CATALOGUE_MOCKS.find((item) => item.id === id);
    if (local) {
      return of({ ...local, favorite: this.favorites().has(id) });
    }
    return this.api.get<Modele>(`public/modeles/${id}`).pipe(
      map((modele) => ({ ...this.fromRemote(modele), favorite: this.favorites().has(id) })),
      catchError(() => of(null))
    );
  }

  isFavorite(id: number): boolean {
    return this.favorites().has(id);
  }

  toggleFavorite(id: number): void {
    const next = new Set(this.favorites());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.favorites.set(next);
    localStorage.setItem(FAVORITES, JSON.stringify([...next]));
  }

  private merge(remote: Modele[]): CatalogueModel[] {
    const names = new Set(CATALOGUE_MOCKS.map((item) => item.name.toLowerCase()));
    const extra = remote
      .filter((item) => !names.has(item.nom.toLowerCase()))
      .map((item) => this.fromRemote(item));
    return [...extra, ...CATALOGUE_MOCKS.map((item) => ({ ...item }))];
  }

  private fromRemote(modele: Modele): CatalogueModel {
    const first = modele.images?.[0];
    const url = typeof first === 'string' ? first : first?.url;
    const categoryId = this.guessCategory(modele.categorieNom, modele.nom);
    return {
      id: modele.id,
      name: modele.nom,
      description: modele.description ?? undefined,
      price: Number(modele.prixIndicatif ?? 0),
      image: url ? this.api.fileUrl(url) : '',
      tone: '#6f2485',
      kind: this.guessKind(categoryId),
      categoryId,
      categoryName: modele.categorieNom || 'Création',
      workshopId: 0,
      workshopName: 'Atelier publié',
      fabric: modele.tissuRecommande || undefined,
      rating: 0,
      reviewCount: 0,
      availability: 'Disponible',
      remote: true,
      createdAt: new Date().toISOString()
    };
  }

  private matches(item: CatalogueModel, filters: CatalogueFilters, useCategory: boolean): boolean {
    if (useCategory && filters.categories?.length && !filters.categories.includes(item.categoryId)) {
      return false;
    }
    if (filters.query) {
      const blob = [item.name, item.fabric, item.workshopName, item.city, item.categoryName, item.style, item.occasion]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!blob.includes(filters.query.trim().toLowerCase())) {
        return false;
      }
    }
    const min = filters.minPrice ?? PRICE_MIN;
    const max = filters.maxPrice ?? PRICE_MAX;
    if (item.price < min || item.price > max) {
      return false;
    }
    if (filters.fabrics?.length && !filters.fabrics.includes(item.fabric ?? '')) {
      return false;
    }
    if (filters.genders?.length && !filters.genders.includes(item.gender ?? '')) {
      return false;
    }
    if (filters.occasions?.length && !filters.occasions.includes(item.occasion ?? '')) {
      return false;
    }
    if (filters.styles?.length && !filters.styles.includes(item.style ?? '')) {
      return false;
    }
    if (filters.sizes?.length && !filters.sizes.some((size) => item.sizes?.includes(size))) {
      return false;
    }
    if (filters.colors?.length && !filters.colors.some((color) => item.colors?.includes(color))) {
      return false;
    }
    if (filters.city && item.city !== filters.city) {
      return false;
    }
    if (filters.workshopId && item.workshopId !== filters.workshopId) {
      return false;
    }
    if (filters.minRating && item.rating < filters.minRating) {
      return false;
    }
    if (filters.availability?.length && !filters.availability.includes(item.availability ?? '')) {
      return false;
    }
    return true;
  }

  private sort(rows: CatalogueModel[], sort: CatalogueSort): CatalogueModel[] {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'popular') return b.reviewCount - a.reviewCount;
      if (sort === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
    return copy;
  }

  private counts(rows: CatalogueModel[]): Record<string, number> {
    const counts: Record<string, number> = { tous: rows.length };
    for (const row of rows) {
      counts[row.categoryId] = (counts[row.categoryId] ?? 0) + 1;
    }
    return counts;
  }

  private workshops(rows: CatalogueModel[]): { id: number; name: string }[] {
    const map = new Map<number, string>();
    for (const row of rows) {
      if (row.workshopId) {
        map.set(row.workshopId, row.workshopName);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  private guessCategory(category?: string | null, name?: string): string {
    const text = `${category ?? ''} ${name ?? ''}`.toLowerCase();
    if (text.includes('mari')) return 'robes-mariee';
    if (text.includes('soir')) return 'robes-soiree';
    if (text.includes('enfant') || text.includes('fille')) return 'enfants';
    if (text.includes('homme')) return 'homme';
    if (text.includes('retouche')) return 'retouches';
    if (text.includes('accessoire') || text.includes('sac')) return 'accessoires';
    if (text.includes('bazin') || text.includes('bogolan') || text.includes('tradition') || text.includes('boubou')) {
      return 'traditionnel';
    }
    return 'robes-femme';
  }

  private guessKind(categoryId: string): GarmentKind {
    if (categoryId === 'robes-mariee') return 'mariee';
    if (categoryId === 'homme') return 'homme';
    if (categoryId === 'enfants') return 'enfant';
    if (categoryId === 'accessoires') return 'accessoire';
    if (categoryId === 'retouches') return 'retouche';
    if (categoryId === 'traditionnel') return 'boubou';
    return 'robe';
  }

  private readFavorites(): Set<number> {
    try {
      const raw = JSON.parse(localStorage.getItem(FAVORITES) ?? '[]') as number[];
      return new Set(raw.filter((id) => Number.isFinite(id)));
    } catch {
      return new Set();
    }
  }
}
