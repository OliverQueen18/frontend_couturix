import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../core/api.service';
import { AtelierPublic } from '../core/models';
import {
  fcfa,
  HOME_ADS,
  HOME_BANNERS,
  HOME_CITIES,
  HOME_PLANS,
  HOME_PUBLICATIONS,
  HOME_STATS,
  HOME_WORKSHOPS,
  HomeWorkshop
} from './home.data';
import { PublicNavComponent } from './public-nav.component';
import { PlanDetailDialogService } from './plan-detail-dialog.component';
import { StarsComponent } from './stars.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, PublicNavComponent, StarsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home-landing.scss', './home-market.scss', './home-offer.scss']
})
export class HomeComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly planDialog = inject(PlanDetailDialogService);

  readonly banners = HOME_BANNERS;
  readonly stats = HOME_STATS;
  slideIndex = 0;
  private slideTimer: ReturnType<typeof setInterval> | null = null;
  readonly cities = HOME_CITIES;
  readonly publications = HOME_PUBLICATIONS;
  readonly plans = HOME_PLANS;
  readonly ads = HOME_ADS;
  readonly banner = HOME_ADS.find((ad) => ad.position === 'banner');
  readonly adCards = HOME_ADS.filter((ad) => ad.position === 'card');
  readonly skeletons = [1, 2, 3, 4];
  /** Passez à true pour afficher les squelettes à la place des cartes. */
  publicationsLoading = false;
  ateliersLoading = false;
  ateliers: AtelierPublic[] = [];
  q = '';
  city = '';
  yearly = false;

  constructor() {
    this.load();
    this.startSlides();
  }

  ngOnDestroy(): void {
    this.pauseSlides();
  }

  startSlides(): void {
    this.pauseSlides();
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    this.slideTimer = setInterval(() => this.step(1), 5500);
  }

  pauseSlides(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  step(direction: number): void {
    const count = this.banners.length;
    this.slideIndex = (this.slideIndex + direction + count) % count;
  }

  goSlide(index: number): void {
    this.slideIndex = index;
  }

  get spotlight(): HomeWorkshop[] {
    const live = this.ateliers
      .filter((atelier) => !!atelier.logoUrl)
      .slice(0, 4)
      .map((atelier, index) => this.toWorkshop(atelier, index));
    const extra = HOME_WORKSHOPS.filter((row) => !live.some((item) => item.name === row.name));
    return [...live, ...extra].slice(0, 4);
  }

  load(): void {
    this.api.get<AtelierPublic[]>('public/ateliers').subscribe({
      next: (rows) => {
        this.ateliers = rows ?? [];
        this.ateliersLoading = false;
      },
      error: () => {
        this.ateliers = [];
        this.ateliersLoading = false;
      }
    });
  }

  search(): void {
    const q = [this.q.trim(), this.city.trim()].filter(Boolean).join(' ');
    void this.router.navigate(['/ateliers'], { queryParams: q ? { q } : {} });
  }

  planPrice(monthly: number): string {
    const amount = this.yearly ? Math.round(monthly * 0.8) : monthly;
    return fcfa(amount);
  }

  openPlan(plan: (typeof this.plans)[number]): void {
    this.planDialog.open(plan, this.yearly).afterClosed().subscribe((code) => {
      if (code) {
        void this.router.navigate(['/inscription'], { queryParams: { plan: code } });
      }
    });
  }

  workshopLink(workshop: HomeWorkshop): string[] {
    return workshop.slug ? ['/ateliers', workshop.slug] : ['/ateliers'];
  }

  workshopQuery(workshop: HomeWorkshop): Record<string, string> | null {
    return workshop.slug ? null : { q: workshop.name };
  }

  location(atelier: AtelierPublic): string {
    const parts = [atelier.ville, atelier.pays].filter((part, index, all) =>
      !!part && all.findIndex((other) => other === part) === index);
    return parts.join(', ') || 'Mali';
  }

  imgFallback(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.dataset['fallback'] === '1') {
      return;
    }
    img.dataset['fallback'] = '1';
    img.src = 'images/home/fallback.svg';
  }

  private toWorkshop(atelier: AtelierPublic, index: number): HomeWorkshop {
    const visuals = HOME_WORKSHOPS[index % HOME_WORKSHOPS.length];
    return {
      id: 1000 + index,
      name: atelier.nom,
      city: this.location(atelier),
      specialty: atelier.description?.trim() || visuals.specialty,
      image: atelier.logoUrl ? this.api.fileUrl(atelier.logoUrl) : visuals.image,
      rating: atelier.noteMoyenne ?? 0,
      reviewCount: atelier.nombreAvis ?? 0,
      badge: atelier.mieuxNote ? 'Top noté' : 'Atelier',
      slug: atelier.slug,
      logo: !!atelier.logoUrl
    };
  }
}
