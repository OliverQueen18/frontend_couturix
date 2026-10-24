import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { PlatformOverview } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-plateforme',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>admin_panel_settings</mat-icon></span>
          <div>
            <h1>Administration du site</h1>
            <p class="muted">Super administrateur — gestion de la plateforme CouturiX, distincte des offres atelier.</p>
          </div>
        </div>
      </header>
      <div class="cards">
        @for (card of cards; track card.path) {
          <a class="card-block dash-card" [routerLink]="card.path">
            <mat-icon>{{ card.icon }}</mat-icon>
            <strong>{{ card.value }}</strong>
            <span>{{ card.label }}</span>
          </a>
        }
      </div>
    </section>
  `,
  styles: [`
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
    .dash-card { display: grid; gap: .35rem; text-decoration: none; color: inherit; }
    .dash-card mat-icon { color: #e21b70; }
    .dash-card strong { font-size: 1.8rem; }
    .dash-card span { color: #6b5d76; }
  `]
})
export class PlateformeComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  cards: { label: string; path: string; icon: string; value: string }[] = [
    { label: 'Ateliers', path: '/app/ateliers', icon: 'storefront', value: '—' },
    { label: 'Comptes clients', path: '/app/comptes-clients', icon: 'person', value: '—' },
    { label: 'Utilisateurs', path: '/app/utilisateurs', icon: 'manage_accounts', value: '—' },
        { label: 'Pages', path: '/app/site/pages', icon: 'article', value: '—' },
        { label: 'Menus', path: '/app/site/menus', icon: 'menu', value: '—' },
        { label: 'En-tête et pied', path: '/app/site/apparence', icon: 'web', value: 'CMS' }
  ];

  constructor() {
    this.api.get<PlatformOverview>('admin/site/overview').subscribe({
      next: (res) => {
        this.cards = [
          { label: 'Ateliers', path: '/app/ateliers', icon: 'storefront', value: String(res.ateliers) },
          { label: 'Comptes clients', path: '/app/comptes-clients', icon: 'person', value: String(res.comptesClients) },
          { label: 'Utilisateurs', path: '/app/utilisateurs', icon: 'manage_accounts', value: String(res.utilisateurs) },
          { label: 'Pages', path: '/app/site/pages', icon: 'article', value: String(res.pages) },
          { label: 'Menus', path: '/app/site/menus', icon: 'menu', value: String(res.menus) },
          { label: 'En-tête et pied', path: '/app/site/apparence', icon: 'web', value: 'CMS' }
        ];
      },
      error: (err) => this.notify.error(err)
    });
  }
}
