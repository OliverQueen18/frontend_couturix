import { Component, input } from '@angular/core';
import { GarmentKind } from './catalogue.models';

let garmentSeq = 0;

@Component({
  selector: 'app-garment',
  standalone: true,
  template: `
    <svg viewBox="0 0 240 300" role="img" [attr.aria-label]="label()">
      <title>{{ label() }}</title>
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" [attr.stop-color]="tone()" />
          <stop offset="100%" stop-color="#2a1038" />
        </linearGradient>
      </defs>
      <rect width="240" height="300" [attr.fill]="'url(#' + gid + ')'" />
      <circle cx="120" cy="58" r="22" fill="#f3d7c3" />
      @switch (kind()) {
        @case ('mariee') {
          <path d="M120 36c28 8 36 40 8 58-20-8-40-6-48-28 8-18 22-32 40-30z" fill="#fff" opacity=".85" />
          <path d="M86 108c10-24 58-24 68 0l22 150H64L86 108z" fill="#fff" />
          <path d="M96 150h48l8 108H88L96 150z" fill="#f7f1ea" />
        }
        @case ('homme') {
          <path d="M78 104c14-18 70-18 84 0l18 168H60L78 104z" fill="#f4efe6" />
          <path d="M108 118h24v154h-24z" fill="#fff" opacity=".35" />
          <path d="M92 168h56" stroke="#2a1038" stroke-width="3" opacity=".35" />
        }
        @case ('enfant') {
          <circle cx="120" cy="78" r="16" fill="#f3d7c3" />
          <path d="M92 112c8-16 48-16 56 0l16 120H76L92 112z" fill="#fff" />
          <circle cx="108" cy="160" r="4" fill="#f1c453" />
          <circle cx="132" cy="176" r="4" fill="#f1c453" />
        }
        @case ('accessoire') {
          <rect x="78" y="110" width="84" height="70" rx="16" fill="#fff" />
          <path d="M98 110c0-16 44-16 44 0" fill="none" stroke="#fff" stroke-width="8" />
          <circle cx="120" cy="146" r="8" fill="#e21b70" />
        }
        @case ('retouche') {
          <path d="M70 90h100l-12 150H82L70 90z" fill="#fff" opacity=".9" />
          <path d="M120 96v130" stroke="#e21b70" stroke-width="3" stroke-dasharray="6 6" />
        }
        @case ('boubou') {
          <path d="M48 118c22-30 122-30 144 0l-8 150H56L48 118z" fill="#fff" opacity=".92" />
          <path d="M108 112h24l6 156h-36l6-156z" [attr.fill]="tone()" opacity=".55" />
        }
        @default {
          <path d="M84 108c12-26 60-26 72 0l26 160H58L84 108z" fill="#fff" opacity=".94" />
          <path d="M104 150c12 18 20 18 32 0" fill="none" [attr.stroke]="tone()" stroke-width="6" />
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    svg { display: block; width: 100%; height: 100%; }
  `]
})
export class GarmentComponent {
  readonly kind = input<GarmentKind>('robe');
  readonly tone = input('#6f2485');
  readonly label = input('Modèle de couture');
  readonly gid = `cxg${++garmentSeq}`;
}
