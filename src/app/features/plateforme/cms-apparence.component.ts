import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { SiteSettings } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { SiteContentService } from '../../core/site-content.service';

@Component({
  selector: 'app-cms-apparence',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>web</mat-icon></span>
          <div>
            <h1>En-tête et pied de page</h1>
            <p class="muted">Marque, boutons, coordonnées et réseaux du site public.</p>
          </div>
        </div>
      </header>
      <form class="card-block dialog-form" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-section"><mat-icon>branding_watermark</mat-icon><span>Marque</span></div>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Nom affiché</mat-label><input matInput formControlName="brandName"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Accroche</mat-label><input matInput formControlName="tagline"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Bouton d’en-tête</mat-label><input matInput formControlName="headerCtaLabel"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Lien du bouton</mat-label><input matInput formControlName="headerCtaPath"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Texte du pied de page</mat-label><input matInput formControlName="footerTagline"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Note de bas de page</mat-label><input matInput formControlName="footerNote"></mat-form-field>
        </div>
        <div class="form-section"><mat-icon>call</mat-icon><span>Coordonnées</span></div>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>E-mail</mat-label><input matInput formControlName="contactEmail"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Téléphones</mat-label><input matInput formControlName="contactPhones"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Adresse</mat-label><input matInput formControlName="contactAddress"></mat-form-field>
        </div>
        <div class="form-section"><mat-icon>share</mat-icon><span>Réseaux</span></div>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Facebook</mat-label><input matInput formControlName="facebookUrl"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Instagram</mat-label><input matInput formControlName="instagramUrl"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>TikTok</mat-label><input matInput formControlName="tiktokUrl"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>LinkedIn</mat-label><input matInput formControlName="linkedinUrl"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>YouTube</mat-label><input matInput formControlName="youtubeUrl"></mat-form-field>
        </div>
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </form>
    </section>
  `
})
export class CmsApparenceComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  private readonly site = inject(SiteContentService);
  readonly form = this.fb.nonNullable.group({
    brandName: ['CouturiX', Validators.required],
    tagline: [''],
    footerTagline: [''],
    footerNote: [''],
    headerCtaLabel: [''],
    headerCtaPath: [''],
    contactEmail: [''],
    contactPhones: [''],
    contactAddress: [''],
    facebookUrl: [''],
    instagramUrl: [''],
    tiktokUrl: [''],
    linkedinUrl: [''],
    youtubeUrl: ['']
  });

  constructor() {
    this.api.get<SiteSettings>('admin/site/settings').subscribe({
      next: (row) => this.form.patchValue({
        brandName: row.brandName ?? 'CouturiX',
        tagline: row.tagline ?? '',
        footerTagline: row.footerTagline ?? '',
        footerNote: row.footerNote ?? '',
        headerCtaLabel: row.headerCtaLabel ?? '',
        headerCtaPath: row.headerCtaPath ?? '',
        contactEmail: row.contactEmail ?? '',
        contactPhones: row.contactPhones ?? '',
        contactAddress: row.contactAddress ?? '',
        facebookUrl: row.facebookUrl ?? '',
        instagramUrl: row.instagramUrl ?? '',
        tiktokUrl: row.tiktokUrl ?? '',
        linkedinUrl: row.linkedinUrl ?? '',
        youtubeUrl: row.youtubeUrl ?? ''
      }),
      error: (err) => this.notify.error(err)
    });
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    this.api.put('admin/site/settings', this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Apparence enregistrée');
        this.site.refresh(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}
