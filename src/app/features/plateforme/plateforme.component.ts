import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
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
            <h1>Équipe CouturiX</h1>
            <p class="muted">Pilotage de la plateforme et de toutes les maisons, avec filtre atelier dans la barre du haut.</p>
          </div>
        </div>
      </header>
      <h2 class="section-title">Plateforme</h2>
      <div class="cards">
        @for (card of platformCards; track card.path) {
          <a class="card-block dash-card" [routerLink]="card.path">
            <mat-icon>{{ card.icon }}</mat-icon>
            <strong>{{ card.value }}</strong>
            <span>{{ card.label }}</span>
          </a>
        }
      </div>
      <h2 class="section-title">Maisons</h2>
      <div class="cards">
        @for (card of metierCards; track card.path) {
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
    .section-title { margin: 1.4rem 0 .7rem; font-size: .82rem; letter-spacing: .12em; text-transform: uppercase; color: #6b5d76; }
    .dash-card { display: grid; gap: .35rem; text-decoration: none; color: inherit; }
    .dash-card mat-icon { color: #e21b70; }
    .dash-card strong { font-size: 1.8rem; }
    .dash-card span { color: #6b5d76; }
  `]
})
export class PlateformeComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly auth = inject(AuthService);
  private readonly cms = this.auth.isSuperAdmin();
  platformCards: { label: string; path: string; icon: string; value: string }[] = [
    { label: 'Ateliers', path: '/app/ateliers', icon: 'storefront', value: '—' },
    { label: 'Comptes clients', path: '/app/comptes-clients', icon: 'person', value: '—' },
    { label: 'Utilisateurs', path: '/app/utilisateurs', icon: 'manage_accounts', value: '—' },
    ...(this.cms
      ? [
          { label: 'Offres', path: '/app/offres', icon: 'workspace_premium', value: 'Délais' },
          { label: 'Pages', path: '/app/site/pages', icon: 'article', value: '—' },
          { label: 'Menus', path: '/app/site/menus', icon: 'menu', value: '—' },
          { label: 'Slider', path: '/app/site/slider', icon: 'view_carousel', value: '—' },
          { label: 'En-tête et pied', path: '/app/site/apparence', icon: 'web', value: 'CMS' }
        ]
      : [])
  ];
  metierCards: { label: string; path: string; icon: string; value: string }[] = [
    { label: 'Tableau de bord', path: '/app/dashboard', icon: 'dashboard', value: 'KPI' },
    { label: 'Clients', path: '/app/clients', icon: 'groups', value: 'Carnet' },
    { label: 'Commandes', path: '/app/commandes', icon: 'receipt_long', value: 'Suivi' },
    { label: 'Production', path: '/app/production', icon: 'precision_manufacturing', value: 'Atelier' },
    { label: 'Tailleurs', path: '/app/tailleurs', icon: 'content_cut', value: 'Équipe' },
    { label: 'Modèles', path: '/app/modeles', icon: 'checkroom', value: 'Catalogue' },
    { label: 'Compositions', path: '/app/compositions', icon: 'layers', value: 'Nomenclatures' },
    { label: 'Stocks', path: '/app/stocks', icon: 'inventory_2', value: 'Articles' },
    { label: 'Fournisseurs', path: '/app/fournisseurs', icon: 'local_shipping', value: 'Achats' },
    { label: 'Caisse', path: '/app/caisse', icon: 'point_of_sale', value: 'FCFA' },
    { label: 'Paiements', path: '/app/paiements', icon: 'payments', value: 'Encaissements' },
    { label: 'Paie', path: '/app/paie', icon: 'account_balance_wallet', value: 'Salaires' },
    { label: 'Devis', path: '/app/devis', icon: 'request_quote', value: 'Propositions' },
    { label: 'Simulateur', path: '/app/simulateur', icon: 'calculate', value: 'Coûts' },
    { label: 'Rapports', path: '/app/rapports', icon: 'assessment', value: 'Analyses' },
    { label: 'Notifications', path: '/app/notifications', icon: 'notifications', value: 'Messages' }
  ];

  constructor() {
    if (!this.cms) {
      return;
    }
    this.api.get<PlatformOverview>('admin/site/overview').subscribe({
      next: (res) => {
        this.platformCards = [
          { label: 'Ateliers', path: '/app/ateliers', icon: 'storefront', value: String(res.ateliers) },
          { label: 'Comptes clients', path: '/app/comptes-clients', icon: 'person', value: String(res.comptesClients) },
          { label: 'Utilisateurs', path: '/app/utilisateurs', icon: 'manage_accounts', value: String(res.utilisateurs) },
          { label: 'Offres', path: '/app/offres', icon: 'workspace_premium', value: 'Délais' },
          { label: 'Pages', path: '/app/site/pages', icon: 'article', value: String(res.pages) },
          { label: 'Menus', path: '/app/site/menus', icon: 'menu', value: String(res.menus) },
          { label: 'Slider', path: '/app/site/slider', icon: 'view_carousel', value: String(res.slides) },
          { label: 'En-tête et pied', path: '/app/site/apparence', icon: 'web', value: 'CMS' }
        ];
      },
      error: (err) => this.notify.error(err)
    });
  }
}
