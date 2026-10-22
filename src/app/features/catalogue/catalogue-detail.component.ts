import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { DemandePublique } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { PhoneFieldComponent } from '../../shared/phone-field.component';
import { PublicNavComponent } from '../../public/public-nav.component';
import { GarmentComponent } from './garment.component';
import { CatalogueModel, formatPrice } from './catalogue.models';
import { CatalogueService } from './catalogue.service';

@Component({
  selector: 'app-catalogue-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, PhoneFieldComponent, PublicNavComponent, GarmentComponent],
  template: `
    <app-public-nav />
    @if (model) {
      <section class="page">
        <a routerLink="/catalogue">← Retour au catalogue</a>
        <header class="page-header">
          <div>
            <h1>{{ model.name }}</h1>
            <p class="muted">{{ model.categoryName }} · {{ price(model.price) }}@if (model.oldPrice) { · <s>{{ price(model.oldPrice) }}</s> }</p>
          </div>
        </header>
        <div class="form-grid">
          <div class="card-block">
            @if (model.image) {
              <img [src]="model.image" [alt]="model.name" style="width:100%;border-radius:12px;max-height:420px;object-fit:cover">
            } @else {
              <div style="height:420px;border-radius:12px;overflow:hidden">
                <app-garment [kind]="model.kind" [tone]="model.tone" [label]="model.name" />
              </div>
            }
            <p>{{ model.description }}</p>
            <p class="muted">Tissu : {{ model.fabric || '—' }} · {{ model.city || 'Atelier CouturiX' }}</p>
            <p><a [routerLink]="model.workshopSlug ? ['/ateliers', model.workshopSlug] : ['/ateliers']" [queryParams]="model.workshopSlug ? null : { q: model.workshopName }">{{ model.workshopName }}</a></p>
          </div>
          <form class="card-block dialog-form" [formGroup]="form" (ngSubmit)="send()">
            <h2>Demande de commande</h2>
            <mat-form-field appearance="outline"><mat-label>Nom</mat-label><input matInput formControlName="nom"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Prénom</mat-label><input matInput formControlName="prenom"></mat-form-field>
            <app-phone-field formControlName="telephone" label="Téléphone" />
            <mat-form-field appearance="outline"><mat-label>E-mail</mat-label><input matInput formControlName="email"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Quantité</mat-label><input matInput type="number" formControlName="quantite"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Notes</mat-label><textarea matInput formControlName="notes"></textarea></mat-form-field>
            <button mat-flat-button color="primary" type="submit">Envoyer la demande</button>
          </form>
        </div>
      </section>
    }
    @if (missing) {
      <section class="page">
        <h1>Modèle introuvable</h1>
        <a routerLink="/catalogue">Retour au catalogue</a>
      </section>
    }
  `
})
export class CatalogueDetailComponent {
  private readonly api = inject(ApiService);
  private readonly catalogue = inject(CatalogueService);
  private readonly notify = inject(NotifyService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  model: CatalogueModel | null = null;
  missing = false;
  readonly price = formatPrice;
  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    telephone: ['', Validators.required],
    email: [''],
    quantite: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalogue.resolve(id).subscribe((model) => {
      this.model = model;
      this.missing = !model;
    });
  }

  send(): void {
    if (this.form.invalid || !this.model) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.model.remote) {
      this.notify.success('Pour commander ce modèle, contactez l’atelier depuis sa fiche.');
      return;
    }
    const payload: DemandePublique = this.form.getRawValue();
    this.api.post('public/demandes', { ...payload, modeleId: this.model.id }).subscribe({
      next: () => {
        this.notify.success('Demande envoyée. Nous vous recontacterons.');
        this.form.reset({ quantite: 1, nom: '', prenom: '', telephone: '', email: '', notes: '' });
      },
      error: (err) => this.notify.error(err)
    });
  }
}
