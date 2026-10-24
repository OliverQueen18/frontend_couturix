import { Routes } from '@angular/router';
import { authGuard, guestGuard, staffGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'inscription',
    canActivate: [guestGuard],
    loadComponent: () => import('./public/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'inscription-client',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./public/register-client.component').then((m) => m.RegisterClientComponent)
  },
  {
    path: 'ateliers',
    loadComponent: () => import('./public/ateliers-public.component').then((m) => m.AteliersPublicComponent)
  },
  {
    path: 'ateliers/:slug',
    loadComponent: () =>
      import('./public/atelier-public.component').then((m) => m.AtelierPublicComponent)
  },
  {
    path: 'verification-email',
    loadComponent: () => import('./public/verify-email.component').then((m) => m.VerifyEmailComponent)
  },
  {
    path: 'mot-de-passe-oublie',
    canActivate: [guestGuard],
    loadComponent: () => import('./public/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./features/catalogue/catalogue.component').then((m) => m.CatalogueComponent)
  },
  {
    path: 'catalogue/:id',
    loadComponent: () =>
      import('./features/catalogue/catalogue-detail.component').then((m) => m.CatalogueDetailComponent)
  },
  {
    path: 'a-propos',
    loadComponent: () => import('./public/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'about' }
  },
  {
    path: 'contact',
    loadComponent: () => import('./public/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'contact' }
  },
  {
    path: 'partenaires',
    loadComponent: () => import('./public/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'partners' }
  },
  {
    path: 'conditions-utilisation',
    loadComponent: () => import('./public/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'terms' }
  },
  {
    path: 'politique-confidentialite',
    loadComponent: () => import('./public/site-page.component').then((m) => m.SitePageComponent),
    data: { page: 'privacy' }
  },
  {
    path: 'p/:slug',
    loadComponent: () => import('./public/site-page.component').then((m) => m.SitePageComponent)
  },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard, staffGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'plateforme',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/plateforme.component').then((m) => m.PlateformeComponent)
      },
      {
        path: 'comptes-clients',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/comptes-clients.component').then((m) => m.ComptesClientsComponent)
      },
      {
        path: 'site/pages',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/cms-pages.component').then((m) => m.CmsPagesComponent)
      },
      {
        path: 'site/menus',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/cms-menus.component').then((m) => m.CmsMenusComponent)
      },
      {
        path: 'site/slider',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/cms-slider.component').then((m) => m.CmsSliderComponent)
      },
      {
        path: 'site/apparence',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/cms-apparence.component').then((m) => m.CmsApparenceComponent)
      },
      {
        path: 'offres',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/plateforme/cms-offres.component').then((m) => m.CmsOffresComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients.component').then((m) => m.ClientsComponent)
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/clients/client-detail.component').then((m) => m.ClientDetailComponent)
      },
      {
        path: 'modeles',
        loadComponent: () => import('./features/modeles/modeles.component').then((m) => m.ModelesComponent)
      },
      {
        path: 'modeles/:id',
        loadComponent: () =>
          import('./features/modeles/modele-detail.component').then((m) => m.ModeleDetailComponent)
      },
      {
        path: 'commandes',
        loadComponent: () => import('./features/commandes/commandes.component').then((m) => m.CommandesComponent)
      },
      {
        path: 'commandes/:id',
        loadComponent: () =>
          import('./features/commandes/commande-detail.component').then((m) => m.CommandeDetailComponent)
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./features/production/production.component').then((m) => m.ProductionComponent)
      },
      {
        path: 'stocks',
        loadComponent: () => import('./features/stocks/stocks.component').then((m) => m.StocksComponent)
      },
      {
        path: 'fournisseurs',
        loadComponent: () =>
          import('./features/fournisseurs/fournisseurs.component').then((m) => m.FournisseursComponent)
      },
      {
        path: 'caisse',
        loadComponent: () => import('./features/caisse/caisse.component').then((m) => m.CaisseComponent)
      },
      {
        path: 'paiements',
        loadComponent: () =>
          import('./features/paiements/paiements.component').then((m) => m.PaiementsComponent)
      },
      {
        path: 'tailleurs',
        loadComponent: () => import('./features/tailleurs/tailleurs.component').then((m) => m.TailleursComponent)
      },
      {
        path: 'paie',
        loadComponent: () => import('./features/paie/paie.component').then((m) => m.PaieComponent)
      },
      {
        path: 'compositions',
        loadComponent: () =>
          import('./features/compositions/compositions.component').then((m) => m.CompositionsComponent)
      },
      {
        path: 'simulateur',
        loadComponent: () =>
          import('./features/simulateur/simulateur.component').then((m) => m.SimulateurComponent)
      },
      {
        path: 'devis',
        loadComponent: () => import('./features/devis/devis.component').then((m) => m.DevisComponent)
      },
      {
        path: 'rapports',
        loadComponent: () => import('./features/rapports/rapports.component').then((m) => m.RapportsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent)
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'GERANT'] },
        loadComponent: () =>
          import('./features/utilisateurs/utilisateurs.component').then((m) => m.UtilisateursComponent)
      },
      {
        path: 'ateliers',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'GERANT'] },
        loadComponent: () => import('./features/ateliers/ateliers.component').then((m) => m.AteliersComponent)
      },
      {
        path: 'parametres',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'GERANT'] },
        loadComponent: () =>
          import('./features/parametres/parametres.component').then((m) => m.ParametresComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
