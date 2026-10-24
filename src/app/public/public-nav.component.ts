import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth.service';
import { SiteContentService } from '../core/site-content.service';
import { RegisterClientDialogService } from './register-client.component';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './public-nav.component.html',
  styleUrl: './public-nav.component.scss'
})
export class PublicNavComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly clients = inject(RegisterClientDialogService);
  private readonly site = inject(SiteContentService);

  menuOpen = false;
  scrolled = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 8;
  }

  headerMenus() {
    return this.site.menus('HEADER');
  }

  parts(path: string) {
    return this.site.parts(path);
  }

  ctaLabel(): string {
    return this.site.settings().headerCtaLabel || 'Créer mon atelier';
  }

  cta() {
    return this.site.parts(this.site.settings().headerCtaPath || '/inscription');
  }

  openClient(): void {
    this.menuOpen = false;
    this.clients.open();
  }

  focusSearch(): void {
    this.menuOpen = false;
    const path = this.router.url.split('?')[0].split('#')[0];
    if (path === '/catalogue') {
      document.getElementById('catalogue-search')?.focus();
      document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (path === '/ateliers') {
      document.getElementById('atelier-query')?.focus();
      document.getElementById('atelier-query')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (path === '/' || path === '') {
      document.getElementById('recherche')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('atelier-search')?.focus();
      return;
    }
    void this.router.navigate(['/'], { fragment: 'recherche' });
  }
}
