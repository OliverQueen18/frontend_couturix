import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest } from 'rxjs';
import { requireValid } from '../core/forms';
import { NotifyService } from '../core/notify.service';
import { SiteContentService } from '../core/site-content.service';
import { PhoneFieldComponent } from '../shared/phone-field.component';
import { PublicFooterComponent } from './public-footer.component';
import { PublicNavComponent } from './public-nav.component';

export type SitePageKey = 'about' | 'contact' | 'partners' | 'terms' | 'privacy';

const MAIL = 'services@olive-services.net';

const KEY_SLUG: Record<SitePageKey, string> = {
  about: 'a-propos',
  contact: 'contact',
  partners: 'partenaires',
  terms: 'conditions-utilisation',
  privacy: 'politique-confidentialite'
};

export const SITE_META: Record<SitePageKey, { title: string; description: string; eyebrow: string; lead: string }> = {
  about: {
    title: 'À propos',
    description: 'CouturiX est édité par Olive Services, entreprise malienne de services numériques depuis 2020.',
    eyebrow: 'Olive Services',
    lead: 'CouturiX est conçu et édité par Olive Services, une entreprise malienne de prestations de services et de commerce général, au service des ateliers de couture en Afrique.'
  },
  contact: {
    title: 'Contact',
    description: 'Écrivez à Olive Services pour CouturiX : partenariat, publicité, support ou information.',
    eyebrow: 'Nous écrire',
    lead: 'Une question sur CouturiX, un partenariat ou un espace publicitaire ? L’équipe Olive Services vous répond depuis Kati, au Mali.'
  },
  partners: {
    title: 'Partenaires',
    description: 'Espaces publicitaires et partenariats CouturiX auprès des ateliers de couture en Afrique de l’Ouest.',
    eyebrow: 'Ensemble',
    lead: 'Associez votre marque à CouturiX : tissus, machines, formation, finance ou services aux ateliers.'
  },
  terms: {
    title: 'Conditions d’utilisation',
    description: 'Conditions d’utilisation de la plateforme CouturiX, éditée par Olive Services.',
    eyebrow: 'Légal',
    lead: 'Les présentes conditions encadrent l’accès à CouturiX, la création de comptes atelier ou client, et l’usage des services en ligne.'
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Politique de confidentialité CouturiX : données personnelles, comptes, ateliers et droits des utilisateurs.',
    eyebrow: 'Légal',
    lead: 'Olive Services explique quelles données CouturiX collecte, pourquoi, et comment les exercer.'
  }
};

const SUBJECTS = [
  { id: 'information', label: 'Information sur CouturiX' },
  { id: 'partenariat', label: 'Partenariat' },
  { id: 'publicite', label: 'Espace publicitaire' },
  { id: 'support', label: 'Support technique' },
  { id: 'autre', label: 'Autre' }
];

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PhoneFieldComponent,
    PublicNavComponent,
    PublicFooterComponent
  ],
  templateUrl: './site-page.component.html',
  styleUrl: './site-page.component.scss'
})
export class SitePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotifyService);
  readonly site = inject(SiteContentService);

  readonly oliveUrl = 'https://olive-services.net';
  readonly subjects = SUBJECTS;
  readonly year = new Date().getFullYear();
  key: SitePageKey | null = null;
  slug = '';
  sending = false;

  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: [''],
    sujet: ['information', Validators.required],
    message: ['', [Validators.required, Validators.minLength(12)]]
  });

  get cms() {
    return this.site.page(this.slug);
  }

  get page() {
    const cms = this.cms;
    const fallback = this.key ? SITE_META[this.key] : null;
    return {
      title: cms?.title || fallback?.title || 'Page',
      description: fallback?.description || cms?.lead || '',
      eyebrow: cms?.eyebrow || fallback?.eyebrow || '',
      lead: cms?.lead || fallback?.lead || ''
    };
  }

  get mail(): string {
    return this.site.settings().contactEmail || MAIL;
  }

  get address(): string {
    return this.site.settings().contactAddress || 'Kalaban-Coro ADEKENE, Kati – Koulikoro – Mali';
  }

  get phones(): string[] {
    const raw = this.site.settings().contactPhones || '(+223) 76 39 69 22 / (+223) 78 17 27 88';
    return raw.split('/').map((item) => item.trim()).filter(Boolean);
  }

  ngOnInit(): void {
    combineLatest([this.route.data, this.route.paramMap, this.route.queryParamMap]).subscribe(([data, params, query]) => {
      this.key = (data['page'] as SitePageKey | undefined) ?? null;
      this.slug = this.key ? KEY_SLUG[this.key] : (params.get('slug') ?? '');
      if (!this.site.page(this.slug)) {
        this.site.refresh(true);
      }
      const page = this.page;
      this.title.setTitle(`${page.title} | CouturiX`);
      this.meta.updateTag({ name: 'description', content: page.description });
      const sujet = query.get('sujet');
      if (sujet && SUBJECTS.some((item) => item.id === sujet)) {
        this.form.controls.sujet.setValue(sujet);
      }
    });
  }

  send(): void {
    if (!requireValid(this.form, this.notify, 'Complétez le formulaire de contact')) {
      return;
    }
    const value = this.form.getRawValue();
    const subject = this.subjects.find((item) => item.id === value.sujet)?.label ?? value.sujet;
    const body = [
      `Nom : ${value.nom}`,
      `E-mail : ${value.email}`,
      value.telephone ? `Téléphone : ${value.telephone}` : '',
      '',
      value.message
    ].filter((line) => line !== undefined).join('\n');
    this.sending = true;
    window.location.href = `mailto:${this.mail}?subject=${encodeURIComponent(`CouturiX — ${subject}`)}&body=${encodeURIComponent(body)}`;
    this.notify.success('Votre messagerie s’ouvre pour envoyer le message à Olive Services.');
    this.sending = false;
  }
}
