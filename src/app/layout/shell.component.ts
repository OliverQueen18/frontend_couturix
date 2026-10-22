import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  title = 'Tableau de bord';
  titleIcon = 'dashboard';

  readonly groups: NavGroup[] = [
    {
      label: 'Pilotage',
      items: [
        { label: 'Tableau de bord', icon: 'dashboard', path: '/app/dashboard' },
        { label: 'Clients', icon: 'groups', path: '/app/clients' },
        { label: 'Commandes', icon: 'receipt_long', path: '/app/commandes' },
        { label: 'Production', icon: 'precision_manufacturing', path: '/app/production' }
      ]
    },
    {
      label: 'Création',
      items: [
        { label: 'Modèles', icon: 'checkroom', path: '/app/modeles' },
        { label: 'Compositions', icon: 'layers', path: '/app/compositions' },
        { label: 'Simulateur', icon: 'calculate', path: '/app/simulateur' },
        { label: 'Devis', icon: 'request_quote', path: '/app/devis' }
      ]
    },
    {
      label: 'Magasin',
      items: [
        { label: 'Stocks', icon: 'inventory_2', path: '/app/stocks' },
        { label: 'Fournisseurs', icon: 'local_shipping', path: '/app/fournisseurs' }
      ]
    },
    {
      label: 'Finance',
      items: [
        { label: 'Caisse', icon: 'point_of_sale', path: '/app/caisse' },
        { label: 'Paiements', icon: 'payments', path: '/app/paiements' },
        { label: 'Paie', icon: 'account_balance_wallet', path: '/app/paie' },
        { label: 'Rapports', icon: 'assessment', path: '/app/rapports' }
      ]
    },
    {
      label: 'Maison',
      items: [
        { label: 'Tailleurs', icon: 'content_cut', path: '/app/tailleurs' },
        { label: 'Notifications', icon: 'notifications', path: '/app/notifications' },
        { label: 'Utilisateurs', icon: 'manage_accounts', path: '/app/utilisateurs', roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Ateliers', icon: 'storefront', path: '/app/ateliers', roles: ['SUPER_ADMIN', 'ADMIN', 'GERANT'] },
        { label: 'Paramètres', icon: 'settings', path: '/app/parametres', roles: ['SUPER_ADMIN', 'ADMIN', 'GERANT'] }
      ]
    }
  ];

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const item = this.groups.flatMap((g) => g.items).find((nav) => e.urlAfterRedirects.startsWith(nav.path));
      this.title = item?.label ?? 'CouturiX';
      this.titleIcon = item?.icon ?? 'auto_awesome';
    });
  }

  visibleGroups(): NavGroup[] {
    return this.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || this.auth.hasAnyRole(item.roles))
      }))
      .filter((group) => group.items.length);
  }

  logout(): void {
    this.auth.logout();
  }
}
