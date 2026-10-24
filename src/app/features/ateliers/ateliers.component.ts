import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { AbonnementCourant, Atelier, GeoPoint } from '../../core/models';
import { AuthService } from '../../core/auth.service';
import { NotifyService } from '../../core/notify.service';
import { BAMAKO, DEFAULT_COUNTRY, countryOptions, mapZoomFor } from '../../shared/countries';
import { PhoneFieldComponent } from '../../shared/phone-field.component';
import { StreetMapComponent } from '../../shared/street-map.component';

@Component({
  selector: 'app-ateliers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    PhoneFieldComponent,
    StreetMapComponent,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>storefront</mat-icon></span>
          <div>
            <h1>Ateliers</h1>
            <p class="muted">{{ quotaLabel }}</p>
          </div>
        </div>
        <button mat-stroked-button type="button" (click)="startCreate()" [disabled]="quota !== null && !quota.peutCreer">
          <mat-icon>add_business</mat-icon>
          Nouvel atelier
        </button>
      </header>

      <div class="atelier-layout">
        <aside class="cx-form-card tree-card">
          <h2>Organisation</h2>
          @if (flat.length === 0) {
            <p class="muted">Aucun atelier</p>
          }
          @for (row of flat; track row.node.id) {
            <button type="button" class="tree-node" [class.active]="selected?.id === row.node.id"
                    [style.paddingLeft.px]="12 + row.level * 16" (click)="select(row.node)">
              {{ row.node.sigle ? row.node.sigle + ' — ' : '' }}{{ row.node.nom }}
            </button>
          }
        </aside>

        <form class="cx-form-card" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ creating ? 'Nouveau sous-atelier' : 'Fiche atelier' }}</h2>
          <div class="logo-row">
            <img [src]="api.fileUrl(selected?.logoUrl)" alt="Logo" class="photo-preview">
            @if (selected && !creating) {
              <label class="upload">
                Changer le logo
                <input type="file" accept="image/*" (change)="onLogo($event)">
              </label>
            }
          </div>
          <div class="form-grid">
            <div class="form-section"><mat-icon>storefront</mat-icon><span>Identité</span></div>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Nom</mat-label>
              <mat-icon matPrefix>business</mat-icon>
              <input matInput formControlName="nom">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sigle</mat-label>
              <mat-icon matPrefix>sell</mat-icon>
              <input matInput formControlName="sigle">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Devise</mat-label>
              <mat-icon matPrefix>payments</mat-icon>
              <input matInput formControlName="devise">
            </mat-form-field>
            <div class="form-section"><mat-icon>gavel</mat-icon><span>Informations légales</span></div>
            <mat-form-field appearance="outline">
              <mat-label>RCCM</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="rccm">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>NIF</mat-label>
              <mat-icon matPrefix>pin</mat-icon>
              <input matInput formControlName="nif">
            </mat-form-field>
            <div class="form-section"><mat-icon>contact_mail</mat-icon><span>Contact</span></div>
            <app-phone-field class="full" formControlName="telephone" label="Téléphone" />
            <mat-form-field appearance="outline">
              <mat-label>E-mail</mat-label>
              <mat-icon matPrefix>mail_outline</mat-icon>
              <input matInput formControlName="email">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Site web</mat-label>
              <mat-icon matPrefix>language</mat-icon>
              <input matInput formControlName="siteWeb">
            </mat-form-field>
            <div class="form-section"><mat-icon>place</mat-icon><span>Adresse & carte</span></div>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Adresse</mat-label>
              <mat-icon matPrefix>home</mat-icon>
              <input matInput formControlName="adresse">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Ville</mat-label>
              <mat-icon matPrefix>location_city</mat-icon>
              <input matInput formControlName="ville">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Pays</mat-label>
              <mat-icon matPrefix>public</mat-icon>
              <mat-select formControlName="pays">
                @for (name of countryOptions(form.controls.pays.value); track name) {
                  <mat-option [value]="name">{{ name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Latitude</mat-label>
              <mat-icon matPrefix>explore</mat-icon>
              <input matInput type="number" formControlName="latitude">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Longitude</mat-label>
              <mat-icon matPrefix>explore</mat-icon>
              <input matInput type="number" formControlName="longitude">
            </mat-form-field>
            <app-street-map
              [latitude]="form.controls.latitude.value"
              [longitude]="form.controls.longitude.value"
              [zoom]="mapZoom"
              (coordinatesChange)="onMap($event)" />
            <mat-form-field appearance="outline" class="full">
              <mat-label>Description</mat-label>
              <mat-icon matPrefix>notes</mat-icon>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
            <mat-slide-toggle formControlName="actif">Atelier actif</mat-slide-toggle>
          </div>
          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit">Enregistrer</button>
            @if (creating) {
              <button mat-button type="button" (click)="cancelCreate()">Annuler</button>
            }
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .atelier-layout { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; gap: 1.2rem; align-items: start; }
    .tree-card h2 { font-size: 1rem; }
    .tree-node {
      display: block; width: 100%; text-align: left; border: 0; background: transparent;
      padding: 0.55rem 0.7rem; border-radius: 10px; cursor: pointer; font-weight: 600; color: var(--cx-purple);
    }
    .tree-node.active { background: #fde8ef; color: var(--cx-magenta); }
    .logo-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
    .upload { font-weight: 600; color: var(--cx-magenta); cursor: pointer; }
    .upload input { display: none; }
    @media (max-width: 900px) { .atelier-layout { grid-template-columns: 1fr; } }
  `]
})
export class AteliersComponent {
  readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  readonly auth = inject(AuthService);
  quota: AbonnementCourant | null = null;
  private readonly fb = inject(FormBuilder);
  tree: Atelier[] = [];
  selected: Atelier | null = null;
  creating = false;
  parentId: number | null = null;
  flat: { node: Atelier; level: number }[] = [];
  private geocoding = false;
  private skipGeocode = false;
  mapZoom = 13;
  readonly countryOptions = countryOptions;

  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    sigle: [''],
    rccm: [''],
    nif: [''],
    telephone: [''],
    email: [''],
    ville: [''],
    pays: [DEFAULT_COUNTRY],
    adresse: [''],
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
    siteWeb: [''],
    description: [''],
    devise: ['XOF'],
    actif: [true]
  });

  get quotaLabel(): string {
    if (this.auth.hasAnyRole(['SUPER_ADMIN'])) {
      return 'Super administrateur — tous les ateliers de la plateforme';
    }
    if (!this.quota) {
      return 'Identité, informations légales, carte et ateliers';
    }
    if (this.quota.illimite) {
      return `Abonnement ${this.quota.libelle} — ateliers illimités (${this.quota.ateliersUtilises} créé(s))`;
    }
    const max = this.quota.ateliersMax ?? this.quota.ateliersUtilises;
    return `Abonnement ${this.quota.libelle} — ${this.quota.ateliersUtilises} / ${max} atelier(s)`;
  }

  constructor() {
    this.load();
    this.loadQuota();
    this.form.valueChanges.pipe(
      debounceTime(900),
      distinctUntilChanged((a, b) =>
        a.adresse === b.adresse && a.ville === b.ville && a.pays === b.pays),
      filter((value) => {
        if (this.skipGeocode) {
          this.skipGeocode = false;
          return false;
        }
        return !this.geocoding && !!(value.adresse?.trim() || value.ville?.trim() || value.pays?.trim());
      }),
      switchMap((value) => this.api.get<GeoPoint>('public/geocode', {
        adresse: value.adresse,
        ville: value.ville,
        pays: value.pays
      }).pipe(catchError(() => of(null)))),
      filter((point): point is GeoPoint => !!point)
    ).subscribe((point) => {
      this.mapZoom = mapZoomFor(point.precision);
      this.form.patchValue({
        latitude: point.latitude,
        longitude: point.longitude
      }, { emitEvent: false });
    });
  }

  loadQuota(): void {
    this.api.get<AbonnementCourant>('abonnements/courant').subscribe({
      next: (quota) => (this.quota = quota),
      error: () => (this.quota = null)
    });
  }

  load(): void {
    this.api.get<Atelier[]>('ateliers').subscribe({
      next: (rows) => {
        this.tree = rows ?? [];
        this.flat = this.flatten(this.tree, 0);
        if (!this.creating) {
          this.select(this.findSelected() ?? this.tree[0] ?? null);
        }
      },
      error: (err) => this.notify.error(err)
    });
  }

  select(node: Atelier | null): void {
    this.creating = false;
    this.selected = node;
    if (!node) {
      return;
    }
    this.geocoding = true;
    this.skipGeocode = true;
    this.mapZoom = node.latitude != null && node.longitude != null ? 15 : 6;
    this.form.patchValue({
      nom: node.nom,
      sigle: node.sigle ?? '',
      rccm: node.rccm ?? '',
      nif: node.nif ?? '',
      telephone: node.telephone ?? '',
      email: node.email ?? '',
      ville: node.ville ?? '',
      pays: node.pays ?? DEFAULT_COUNTRY,
      adresse: node.adresse ?? '',
      latitude: node.latitude ?? null,
      longitude: node.longitude ?? null,
      siteWeb: node.siteWeb ?? '',
      description: node.description ?? '',
      devise: node.devise || 'XOF',
      actif: node.actif
    });
    setTimeout(() => { this.geocoding = false; }, 50);
  }

  startCreate(): void {
    if (this.quota && !this.quota.peutCreer) {
      this.notify.error('Votre abonnement ne permet pas de créer un atelier supplémentaire');
      return;
    }
    this.parentId = this.selected?.id ?? this.tree[0]?.id ?? null;
    this.creating = true;
    this.geocoding = true;
    this.skipGeocode = true;
    this.mapZoom = 13;
    this.form.reset({
      nom: '',
      sigle: '',
      rccm: '',
      nif: '',
      telephone: '',
      email: '',
      ville: '',
      pays: DEFAULT_COUNTRY,
      adresse: '',
      latitude: BAMAKO.latitude,
      longitude: BAMAKO.longitude,
      siteWeb: '',
      description: '',
      devise: 'XOF',
      actif: true
    });
    setTimeout(() => { this.geocoding = false; }, 50);
  }

  cancelCreate(): void {
    this.creating = false;
    this.select(this.selected);
  }

  onMap(coords: { latitude: number; longitude: number }): void {
    this.form.patchValue(coords, { emitEvent: false });
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = { ...this.form.getRawValue(), parentId: this.creating ? this.parentId : this.selected?.parentId };
    const req = this.creating
      ? this.api.post<Atelier>('ateliers', body)
      : this.api.put<Atelier>(`ateliers/${this.selected!.id}`, body);
    req.subscribe({
      next: (saved) => {
        this.notify.success('Atelier enregistré');
        this.creating = false;
        this.selected = saved;
        this.load();
        this.loadQuota();
      },
      error: (err) => this.notify.error(err)
    });
  }

  onLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.selected) {
      return;
    }
    this.api.upload<Atelier>(`ateliers/${this.selected.id}/logo`, file).subscribe({
      next: (saved) => {
        this.notify.success('Logo mis à jour');
        this.selected = saved;
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }

  private flatten(nodes: Atelier[], level: number): { node: Atelier; level: number }[] {
    const rows: { node: Atelier; level: number }[] = [];
    for (const node of nodes) {
      rows.push({ node, level });
      rows.push(...this.flatten(node.enfants ?? [], level + 1));
    }
    return rows;
  }

  private findSelected(): Atelier | null {
    return this.flat.find((row) => row.node.id === this.selected?.id)?.node ?? null;
  }
}
