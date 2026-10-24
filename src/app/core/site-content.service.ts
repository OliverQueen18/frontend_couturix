import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { SiteMenu, SiteMenuLocation, SitePage, SiteSettings, SiteSlide, SiteSnapshot } from './models';

const FALLBACK_SETTINGS: SiteSettings = {
  brandName: 'CouturiX',
  tagline: 'La plateforme digitale des ateliers de couture.',
  footerTagline: 'La plateforme digitale des ateliers de couture.',
  footerNote: 'Simple · Élégant · Rentable',
  headerCtaLabel: 'Créer mon atelier',
  headerCtaPath: '/inscription',
  contactEmail: 'services@olive-services.net',
  contactPhones: '(+223) 76 39 69 22 / (+223) 78 17 27 88',
  contactAddress: 'Kalaban-Coro ADEKENE, Kati – Koulikoro – Mali',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  tiktokUrl: 'https://www.tiktok.com',
  linkedinUrl: 'https://www.linkedin.com',
  youtubeUrl: 'https://youtube.com'
};

const FALLBACK_MENUS: SiteMenu[] = [
  { id: 1, location: 'HEADER', label: 'Accueil', path: '/', sortOrder: 10, visible: true },
  { id: 2, location: 'HEADER', label: 'Ateliers', path: '/ateliers', sortOrder: 20, visible: true },
  { id: 3, location: 'HEADER', label: 'Catalogue', path: '/catalogue', sortOrder: 30, visible: true },
  { id: 4, location: 'HEADER', label: 'Tarifs', path: '/#tarifs', sortOrder: 40, visible: true },
  { id: 5, location: 'HEADER', label: 'À propos', path: '/a-propos', sortOrder: 50, visible: true },
  { id: 6, location: 'HEADER', label: 'Contact', path: '/contact', sortOrder: 60, visible: true },
  { id: 7, location: 'FOOTER_PLATEFORME', label: 'Accueil', path: '/', sortOrder: 10, visible: true },
  { id: 8, location: 'FOOTER_PLATEFORME', label: 'Ateliers', path: '/ateliers', sortOrder: 20, visible: true },
  { id: 9, location: 'FOOTER_PLATEFORME', label: 'Catalogue', path: '/catalogue', sortOrder: 30, visible: true },
  { id: 10, location: 'FOOTER_PLATEFORME', label: 'Tarifs', path: '/#tarifs', sortOrder: 40, visible: true },
  { id: 11, location: 'FOOTER_ENTREPRISE', label: 'À propos', path: '/a-propos', sortOrder: 10, visible: true },
  { id: 12, location: 'FOOTER_ENTREPRISE', label: 'Contact', path: '/contact', sortOrder: 20, visible: true },
  { id: 13, location: 'FOOTER_ENTREPRISE', label: 'Partenaires', path: '/partenaires', sortOrder: 30, visible: true },
  { id: 14, location: 'FOOTER_LEGAL', label: 'Conditions d’utilisation', path: '/conditions-utilisation', sortOrder: 10, visible: true },
  { id: 15, location: 'FOOTER_LEGAL', label: 'Politique de confidentialité', path: '/politique-confidentialite', sortOrder: 20, visible: true }
];

@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly api = inject(ApiService);
  readonly snapshot = signal<SiteSnapshot>({
    settings: FALLBACK_SETTINGS,
    menus: FALLBACK_MENUS,
    pages: [],
    slides: []
  });
  private loading = false;
  private retries = 0;

  constructor() {
    this.refresh();
  }

  refresh(force = false): void {
    if (this.loading && !force) {
      return;
    }
    this.loading = true;
    this.api.get<SiteSnapshot>('public/site').subscribe({
      next: (res) => {
        this.loading = false;
        this.retries = 0;
        this.snapshot.set({
          settings: { ...FALLBACK_SETTINGS, ...res.settings },
          menus: res.menus?.length ? res.menus : FALLBACK_MENUS,
          pages: res.pages ?? [],
          slides: res.slides ?? []
        });
      },
      error: () => {
        this.loading = false;
        if (this.retries < 2) {
          this.retries += 1;
          setTimeout(() => this.refresh(), 2500);
        }
      }
    });
  }

  settings(): SiteSettings {
    return this.snapshot().settings;
  }

  menus(location: SiteMenuLocation): SiteMenu[] {
    return this.snapshot().menus
      .filter((item) => item.location === location && item.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  page(slug: string): SitePage | undefined {
    return this.snapshot().pages.find((item) => item.slug === slug);
  }

  slides(): SiteSlide[] {
    return this.snapshot().slides
      .filter((item) => item.visible !== false && !!item.imageUrl)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  parts(path: string): { link: string; fragment?: string; href?: string } {
    if (/^https?:\/\//i.test(path)) {
      return { link: path, href: path };
    }
    const hash = path.indexOf('#');
    if (hash >= 0) {
      return { link: path.slice(0, hash) || '/', fragment: path.slice(hash + 1) };
    }
    const query = path.indexOf('?');
    if (query >= 0) {
      return { link: path };
    }
    return { link: path || '/' };
  }
}
