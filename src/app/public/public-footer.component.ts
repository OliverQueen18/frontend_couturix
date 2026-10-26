import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteMenuLocation } from '../core/models';
import { SiteContentService } from '../core/site-content.service';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="foot">
      <div class="wrap grid">
        <div>
          <img src="logo-couturix.png" [alt]="settings().brandName">
          <p>{{ settings().footerTagline || settings().tagline }}</p>
        </div>
        <div>
          <p>Plateforme</p>
          @for (item of menus('FOOTER_PLATEFORME'); track item.id) {
            @if (parts(item.path).href; as href) {
              <a [href]="href" target="_blank" rel="noopener">{{ item.label }}</a>
            } @else {
              <a [routerLink]="parts(item.path).link" [fragment]="parts(item.path).fragment">{{ item.label }}</a>
            }
          }
        </div>
        <div>
          <p>Entreprise</p>
          @for (item of menus('FOOTER_ENTREPRISE'); track item.id) {
            @if (parts(item.path).href; as href) {
              <a [href]="href" target="_blank" rel="noopener">{{ item.label }}</a>
            } @else {
              <a [routerLink]="parts(item.path).link" [fragment]="parts(item.path).fragment">{{ item.label }}</a>
            }
          }
        </div>
        <div>
          <p>Légal</p>
          @for (item of menus('FOOTER_LEGAL'); track item.id) {
            @if (parts(item.path).href; as href) {
              <a [href]="href" target="_blank" rel="noopener">{{ item.label }}</a>
            } @else {
              <a [routerLink]="parts(item.path).link" [fragment]="parts(item.path).fragment">{{ item.label }}</a>
            }
          }
        </div>
      </div>
      <div class="wrap base">
        <span>© {{ year }} {{ settings().brandName }}. Tous droits réservés.</span>
        <span class="socials">
          @if (settings().facebookUrl) { <a [href]="settings().facebookUrl!" target="_blank" rel="noopener" aria-label="Facebook">Fb</a> }
          @if (settings().instagramUrl) { <a [href]="settings().instagramUrl!" target="_blank" rel="noopener" aria-label="Instagram">Ig</a> }
          @if (settings().tiktokUrl) { <a [href]="settings().tiktokUrl!" target="_blank" rel="noopener" aria-label="TikTok">Tk</a> }
          @if (settings().linkedinUrl) { <a [href]="settings().linkedinUrl!" target="_blank" rel="noopener" aria-label="LinkedIn">In</a> }
          @if (settings().youtubeUrl) { <a [href]="settings().youtubeUrl!" target="_blank" rel="noopener" aria-label="YouTube">Yt</a> }
        </span>
        <span>{{ settings().footerNote }}</span>
      </div>
    </footer>
  `,
  styles: [`
    .foot { padding: 3rem 0 1.3rem; background: #1d082f; color: rgba(255,255,255,.78); }
    .wrap { width: min(1180px, calc(100% - 2.5rem)); margin-inline: auto; }
    .grid { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 1.5rem; }
    img { height: 64px; width: auto; max-width: min(240px, 70vw); object-fit: contain; display: block; margin-bottom: .7rem; }
    p { margin: 0 0 .55rem; }
    .grid p { color: #fff; font-size: .78rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    a { display: block; margin: .35rem 0; color: rgba(255,255,255,.78); text-decoration: none; }
    a:hover { color: #fff; }
    .base { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,.1); font-size: .85rem; }
    .socials { display: flex; gap: .4rem; }
    .socials a { display: grid; place-items: center; width: 34px; height: 34px; margin: 0; border-radius: 12px; background: rgba(255,255,255,.08); font-size: .72rem; font-weight: 800; }
    @media (max-width: 1020px) { .grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 760px) { .grid, .base { grid-template-columns: 1fr; flex-direction: column; } }
  `]
})
export class PublicFooterComponent {
  private readonly site = inject(SiteContentService);
  readonly year = new Date().getFullYear();

  settings() {
    return this.site.settings();
  }

  menus(location: SiteMenuLocation) {
    return this.site.menus(location);
  }

  parts(path: string) {
    return this.site.parts(path);
  }
}
