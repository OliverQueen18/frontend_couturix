import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AtelierPublic } from '../../core/models';
import { WORKSHOP_MOCKS } from './workshop.data';
import {
  PRICE_MAX,
  PRICE_MIN,
  Workshop,
  WorkshopFilters,
  WorkshopResult,
  WorkshopSort
} from './workshop.models';

const FAVORITES = 'cx-workshop-favorites';

/**
 * Annuaire public des ateliers.
 * Branche actuelle : GET /api/v1/public/ateliers et GET /api/v1/public/ateliers/{slug}.
 * Les filtres riches (ville, spécialité, note, prix, type) sont appliqués ici
 * en attendant GET /api/v1/public/workshops?query&city&specialty&rating&sort.
 * Les favoris sont locaux en attendant POST et DELETE /api/v1/favorites/workshops/{id}.
 */
@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly api = inject(ApiService);
  private readonly favorites = signal<Set<string>>(this.readFavorites());
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly shelf$ = this.refresh$.pipe(
    switchMap(() => this.api.get<AtelierPublic[]>('public/ateliers').pipe(
      map((rows) => ({ rows: this.merge(rows ?? []), warning: '' })),
      catchError(() => of({
        rows: WORKSHOP_MOCKS.map((item) => ({ ...item })),
        warning: 'Impossible de charger les ateliers publiés pour le moment.'
      }))
    )),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  reload(): void {
    this.refresh$.next();
  }

  query(rows: Workshop[], filters: WorkshopFilters): WorkshopResult {
    const favoriteSlugs = this.favorites();
    const priced = rows.filter((item) => this.matches(item, filters, false));
    const filtered = priced.filter((item) => this.matches(item, filters, true));
    const sorted = this.sort(filtered, filters.sort ?? 'rating');
    const pageSize = this.pageSize(filters.pageSize);
    const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const page = Math.min(Math.max(1, filters.page ?? 1), pages);
    const start = (page - 1) * pageSize;
    return {
      items: sorted.slice(start, start + pageSize).map((item) => ({
        ...item,
        favorite: favoriteSlugs.has(item.slug)
      })),
      total: sorted.length,
      page,
      pageSize,
      pages,
      cityCounts: this.cityCounts(priced)
    };
  }

  findBySlug(slug: string): Workshop | null {
    const local = WORKSHOP_MOCKS.find((item) => item.slug === slug);
    return local ? { ...local, favorite: this.favorites().has(slug) } : null;
  }

  toggleFavorite(slug: string): void {
    const next = new Set(this.favorites());
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    this.favorites.set(next);
    localStorage.setItem(FAVORITES, JSON.stringify([...next]));
  }

  private merge(remote: AtelierPublic[]): Workshop[] {
    const names = new Set(WORKSHOP_MOCKS.map((item) => fold(item.name)));
    const slugs = new Set(WORKSHOP_MOCKS.map((item) => item.slug));
    const published = remote
      .filter((item) => item.slug && !slugs.has(item.slug) && !names.has(fold(item.nom)))
      .map((item) => this.fromRemote(item));
    return [...WORKSHOP_MOCKS.map((item) => ({ ...item })), ...published];
  }

  private fromRemote(atelier: AtelierPublic): Workshop {
    const workshop: Workshop = {
      id: slugId(atelier.slug),
      slug: atelier.slug,
      name: atelier.nom,
      tone: '#4A1364',
      city: atelier.ville?.trim() || 'Brazzaville',
      rating: atelier.noteMoyenne ?? 0,
      reviewCount: atelier.nombreAvis ?? 0,
      specialties: ['Sur mesure'],
      services: ['Sur mesure'],
      type: 'Maison de couture',
      verified: true,
      topRated: !!atelier.mieuxNote,
      availability: ['Sur rendez-vous', 'Commande ouverte'],
      priceMin: 15_000,
      priceMax: 180_000,
      coverImage: 'images/workshops/cover-faso.jpg',
      remote: true
    };
    if (atelier.description) workshop.description = atelier.description;
    if (atelier.logoUrl) workshop.logo = atelier.logoUrl;
    if (atelier.telephone) workshop.phone = atelier.telephone;
    if (atelier.whatsapp) workshop.whatsapp = atelier.whatsapp;
    if (atelier.pays) workshop.district = atelier.pays;
    return workshop;
  }

  private matches(workshop: Workshop, filters: WorkshopFilters, withCity: boolean): boolean {
    const query = fold(filters.query ?? '');
    if (query) {
      const haystack = fold([
        workshop.name,
        workshop.city,
        workshop.district ?? '',
        workshop.description ?? '',
        workshop.type ?? '',
        ...workshop.specialties,
        ...workshop.services
      ].join(' '));
      if (!haystack.includes(query)) return false;
    }
    if (withCity && filters.cities?.length && !filters.cities.includes(workshop.city)) return false;
    if (filters.specialties?.length && !filters.specialties.some((item) => workshop.specialties.includes(item) || workshop.services.includes(item))) {
      return false;
    }
    if (filters.minRating && workshop.rating < filters.minRating) return false;
    const min = filters.minPrice ?? PRICE_MIN;
    const max = filters.maxPrice ?? PRICE_MAX;
    const low = workshop.priceMin ?? 0;
    const high = workshop.priceMax ?? low;
    if (high < min || low > max) return false;
    if (filters.availability?.length && !filters.availability.some((item) => workshop.availability?.includes(item))) {
      return false;
    }
    if (filters.workshopTypes?.length && !filters.workshopTypes.includes(workshop.type ?? '')) return false;
    if (filters.statuses?.length && !filters.statuses.every((status) => this.hasStatus(workshop, status))) return false;
    return true;
  }

  private hasStatus(workshop: Workshop, status: string): boolean {
    if (status === 'verified') return !!workshop.verified;
    if (status === 'premium') return !!workshop.premium;
    if (status === 'gold') return !!workshop.gold;
    if (status === 'top') return !!workshop.topRated;
    if (status === 'new') return !!workshop.isNew;
    return false;
  }

  private sort(rows: Workshop[], sort: WorkshopSort): Workshop[] {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sort === 'popular') return b.reviewCount - a.reviewCount || b.rating - a.rating;
      if (sort === 'recent') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      if (sort === 'name-asc') return a.name.localeCompare(b.name, 'fr');
      if (sort === 'name-desc') return b.name.localeCompare(a.name, 'fr');
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    });
    return copy;
  }

  private cityCounts(rows: Workshop[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.city] = (counts[row.city] ?? 0) + 1;
    }
    return counts;
  }

  private pageSize(value?: number): number {
    return value === 16 || value === 24 || value === 48 ? value : 8;
  }

  private readFavorites(): Set<string> {
    try {
      const raw = JSON.parse(localStorage.getItem(FAVORITES) ?? '[]') as unknown;
      return new Set(Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : []);
    } catch {
      return new Set();
    }
  }
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function slugId(slug: string): number {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 800_000 + (hash % 100_000);
}

export type WorkshopShelf = { rows: Workshop[]; warning: string };
