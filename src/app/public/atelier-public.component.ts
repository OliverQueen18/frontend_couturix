import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { AtelierAvis, AtelierPublic } from '../core/models';
import { NotifyService } from '../core/notify.service';
import { WorkshopService } from './ateliers/workshop.service';
import { Workshop } from './ateliers/workshop.models';
import { PublicNavComponent } from './public-nav.component';
import { RegisterClientDialogService } from './register-client.component';
import { StarsComponent } from './stars.component';

@Component({
  selector: 'app-atelier-public',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    PublicNavComponent,
    StarsComponent
  ],
  template: `
    <app-public-nav />
    @if (atelier) {
      <section class="section atelier-hero" [class.featured]="atelier.mieuxNote">
        <a routerLink="/ateliers" class="back">← Tous les ateliers</a>
        <div class="atelier-head">
          <img [src]="atelier.logoUrl || 'logo-couturix.png'" [alt]="atelier.nom">
          <div>
            @if (atelier.mieuxNote) {
              <p class="eyebrow">Maison mieux notée</p>
            }
            <h1>{{ atelier.nom }}</h1>
            <p class="muted">{{ location }}</p>
            <app-stars [value]="atelier.noteMoyenne ?? 0" [count]="atelier.nombreAvis ?? 0" [showScore]="true" />
            @if (tags.length) {
              <p class="tags">{{ tags.join(' · ') }}</p>
            }
            <div class="actions">
              <a mat-flat-button color="primary" [routerLink]="['/catalogue']" [queryParams]="{ atelier: atelier.slug }">
                Voir le catalogue
              </a>
              @if (atelier.telephone) {
                <a mat-stroked-button [href]="'tel:' + atelier.telephone">{{ atelier.telephone }}</a>
              }
            </div>
          </div>
        </div>
        @if (atelier.description) {
          <p class="lead">{{ atelier.description }}</p>
        }
      </section>

      <section class="section alt" id="avis">
        <h2>Avis des clients</h2>
        @if (demo) {
          <p class="muted">Consultez la note de l’atelier. Le dépôt d’avis en ligne s’ouvre pour les maisons publiées.</p>
        } @else if (auth.isClient()) {
          <form class="cx-form-card rate-card" [formGroup]="form" (ngSubmit)="save()">
            <h3>{{ mine ? 'Modifier votre note' : 'Noter cet atelier' }}</h3>
            <app-stars [value]="form.controls.note.value" [interactive]="true" (rated)="form.controls.note.setValue($event)" />
            <mat-form-field appearance="outline" class="full">
              <mat-label>Votre avis (optionnel)</mat-label>
              <textarea matInput rows="3" formControlName="commentaire"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="loading">Publier</button>
          </form>
        } @else {
          <p class="section-lead">
            Connectez-vous avec un compte client pour noter cet atelier.
            <button type="button" class="text-link" (click)="openClient()">Créer un compte</button>
            ou
            <a routerLink="/login">se connecter</a>.
          </p>
        }

        @if (!demo && !avis.length) {
          <p class="muted">Soyez le premier à laisser un avis.</p>
        } @else if (!demo) {
          <ul class="avis-list">
            @for (item of avis; track item.id) {
              <li>
                <strong>{{ item.auteur }}</strong>
                <app-stars [value]="item.note" />
                @if (item.commentaire) {
                  <p>{{ item.commentaire }}</p>
                }
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
  styles: [`
    .atelier-hero { padding-top: 2rem; }
    .atelier-hero.featured {
      background:
        radial-gradient(circle at top right, rgba(241, 196, 83, 0.22), transparent 40%),
        #fff;
    }
    .back { color: var(--cx-magenta); font-weight: 600; text-decoration: none; }
    .atelier-head {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 1.4rem;
      align-items: center;
      margin-top: 1rem;
    }
    .atelier-head img {
      width: 120px;
      height: 120px;
      object-fit: contain;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 16px 36px rgba(46, 16, 82, 0.08);
    }
    .actions { display: flex; gap: 0.7rem; flex-wrap: wrap; margin-top: 1rem; }
    .rate-card { margin: 1rem 0 2rem; max-width: 560px; }
    .avis-list { list-style: none; padding: 0; display: grid; gap: 1rem; }
    .avis-list li {
      background: #fff;
      border-radius: 18px;
      padding: 1rem 1.1rem;
      box-shadow: 0 10px 24px rgba(46, 16, 82, 0.06);
    }
    .text-link {
      background: none;
      border: 0;
      padding: 0;
      color: var(--cx-magenta);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    #avis { scroll-margin-top: 92px; }
    .tags { color: var(--cx-magenta); font-weight: 600; }
    @media (max-width: 700px) {
      .atelier-head { grid-template-columns: 1fr; }
    }
  `]
})
export class AtelierPublicComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly clients = inject(RegisterClientDialogService);
  private readonly directory = inject(WorkshopService);

  atelier: AtelierPublic | null = null;
  avis: AtelierAvis[] = [];
  mine: AtelierAvis | null = null;
  loading = false;
  demo = false;
  tags: string[] = [];
  readonly form = this.fb.nonNullable.group({
    note: [5, Validators.required],
    commentaire: ['']
  });

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const local = this.directory.findBySlug(slug);
    if (local) {
      this.demo = true;
      this.atelier = this.asPublic(local);
      this.tags = local.specialties.slice(0, 6);
      return;
    }
    this.api.get<AtelierPublic>(`public/ateliers/${slug}`).subscribe({
      next: (atelier) => (this.atelier = atelier),
      error: (err) => this.notify.error(err, 'Atelier introuvable')
    });
    this.api.get<AtelierAvis[]>(`public/ateliers/${slug}/avis`).subscribe({
      next: (rows) => (this.avis = rows ?? [])
    });
    if (this.auth.isClient()) {
      this.api.get<AtelierAvis | null>(`avis/ateliers/${slug}`).subscribe({
        next: (mine) => {
          this.mine = mine;
          if (mine) {
            this.form.patchValue({ note: mine.note, commentaire: mine.commentaire ?? '' });
          }
        }
      });
    }
  }

  openClient(): void {
    this.clients.open();
  }

  get location(): string {
    if (!this.atelier) {
      return '';
    }
    return [this.atelier.ville, this.atelier.pays].filter(Boolean).join(', ') || 'Congo';
  }

  private asPublic(workshop: Workshop): AtelierPublic {
    return {
      nom: workshop.name,
      slug: workshop.slug,
      description: workshop.description ?? null,
      ville: workshop.city,
      pays: 'Mali',
      logoUrl: workshop.logo ?? null,
      telephone: workshop.phone ?? null,
      whatsapp: workshop.whatsapp ?? null,
      noteMoyenne: workshop.rating,
      nombreAvis: workshop.reviewCount,
      mieuxNote: !!workshop.topRated
    };
  }

  save(): void {
    if (!this.atelier || this.form.invalid) {
      return;
    }
    this.loading = true;
    this.api.put<AtelierAvis>(`avis/ateliers/${this.atelier.slug}`, this.form.getRawValue()).subscribe({
      next: (saved) => {
        this.loading = false;
        this.mine = saved;
        this.notify.success('Merci pour votre avis');
        this.api.get<AtelierAvis[]>(`public/ateliers/${this.atelier?.slug}/avis`).subscribe({
          next: (rows) => (this.avis = rows ?? [])
        });
        this.api.get<AtelierPublic>(`public/ateliers/${this.atelier?.slug}`).subscribe({
          next: (atelier) => (this.atelier = atelier)
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err, 'Impossible d’enregistrer l’avis');
      }
    });
  }
}
