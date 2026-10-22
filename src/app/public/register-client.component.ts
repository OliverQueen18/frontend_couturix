import { Component, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, distinctUntilChanged, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { GeoPoint } from '../core/models';
import { NotifyService } from '../core/notify.service';
import { BAMAKO, DEFAULT_COUNTRY, countryOptions, mapZoomFor } from '../shared/countries';
import { PhoneFieldComponent } from '../shared/phone-field.component';
import { StreetMapComponent } from '../shared/street-map.component';

@Component({
  selector: 'app-register-client-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconButton,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    PhoneFieldComponent,
    StreetMapComponent
  ],
  template: `
    <h2 mat-dialog-title>
      <span class="eyebrow">Compte client</span>
      Créez votre espace CouturiX
    </h2>
    <form class="account-form" [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <p class="muted">
          Commandez auprès des ateliers, enregistrez vos mesures et notez les maisons.
        </p>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <mat-icon matPrefix>badge</mat-icon>
            <input matInput formControlName="nom">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="prenom">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>E-mail</mat-label>
            <mat-icon matPrefix>mail_outline</mat-icon>
            <input matInput type="email" formControlName="email">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Mot de passe</mat-label>
            <mat-icon matPrefix>lock_outline</mat-icon>
            <input matInput type="password" formControlName="password">
          </mat-form-field>
          <app-phone-field class="full" formControlName="telephone" label="Téléphone" />
          <mat-form-field appearance="outline" class="full">
            <mat-label>Adresse</mat-label>
            <mat-icon matPrefix>home</mat-icon>
            <input matInput formControlName="adresse" placeholder="Rue, quartier, ville"
                   (keydown.enter)="$event.preventDefault(); locateNow()">
            <button mat-icon-button matSuffix type="button" (click)="locateNow()"
                    [disabled]="geocoding" aria-label="Localiser sur la carte">
              <mat-icon>{{ geocoding ? 'hourglass_top' : 'my_location' }}</mat-icon>
            </button>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
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
            <input matInput type="number" step="0.000001" formControlName="latitude">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Longitude</mat-label>
            <mat-icon matPrefix>explore</mat-icon>
            <input matInput type="number" step="0.000001" formControlName="longitude">
          </mat-form-field>
          <app-street-map
            class="full"
            [latitude]="mapLat"
            [longitude]="mapLng"
            [zoom]="mapZoom"
            (coordinatesChange)="onMap($event)" />
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="loading">
          <mat-icon>person_add</mat-icon>
          Créer mon compte
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    :host { display: block; }
    h2[mat-dialog-title] {
      margin: 0;
      padding: 1.3rem 1.4rem 0.2rem;
      font-family: var(--cx-display);
      font-size: 2rem;
      line-height: 1.15;
      background: linear-gradient(180deg, #f8f1fb, #fff);
    }
    .eyebrow {
      display: block;
      color: var(--cx-magenta);
      font-family: Outfit, sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }
    .muted { margin: 0 0 1rem; color: var(--cx-muted); }
    mat-dialog-content { max-height: min(72vh, 760px); padding-top: 0.4rem; }
    .account-form .form-grid { gap: 0.2rem 1rem; }
  `]
})
export class RegisterClientDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<RegisterClientDialogComponent>);
  loading = false;
  geocoding = false;
  mapLat = BAMAKO.latitude;
  mapLng = BAMAKO.longitude;
  mapZoom = 13;
  readonly countryOptions = countryOptions;
  private lastGeocoded = '';

  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required],
    adresse: [''],
    pays: [DEFAULT_COUNTRY],
    latitude: this.fb.control<number | null>(BAMAKO.latitude),
    longitude: this.fb.control<number | null>(BAMAKO.longitude),
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor() {
    this.form.valueChanges.pipe(
      debounceTime(900),
      distinctUntilChanged((a, b) => a.adresse === b.adresse && a.pays === b.pays),
      takeUntilDestroyed()
    ).subscribe((value) => this.lookupAddress(value.adresse, false));
  }

  onMap(coords: { latitude: number; longitude: number }): void {
    this.applyPoint(coords.latitude, coords.longitude);
  }

  locateNow(): void {
    this.lookupAddress(this.form.controls.adresse.value, true);
  }

  lookupAddress(raw: string | null | undefined, force = false): void {
    const adresse = (raw ?? '').trim();
    const pays = this.form.controls.pays.value.trim() || DEFAULT_COUNTRY;
    const key = `${adresse}|${pays}`;
    const countryOnly = adresse.length < (force ? 2 : 5);
    if (countryOnly && !force && !adresse) {
      if (key === this.lastGeocoded) {
        return;
      }
    } else if (adresse.length < (force ? 2 : 5) || (!force && key === this.lastGeocoded)) {
      return;
    }
    this.geocoding = true;
    this.api.get<GeoPoint>('public/geocode', {
      adresse: countryOnly ? '' : adresse,
      pays
    }).pipe(catchError(() => of(null))).subscribe({
      next: (point) => {
        this.geocoding = false;
        if (!point) {
          if (force) {
            this.notify.error('Adresse introuvable sur la carte');
          }
          return;
        }
        this.lastGeocoded = key;
        this.mapZoom = mapZoomFor(point.precision);
        this.applyPoint(point.latitude, point.longitude);
      },
      error: () => {
        this.geocoding = false;
      }
    });
  }

  private applyPoint(latitude: number, longitude: number): void {
    this.mapLat = latitude;
    this.mapLng = longitude;
    this.form.patchValue({ latitude, longitude }, { emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { pays, ...payload } = this.form.getRawValue();
    void pays;
    this.auth.registerClient(payload).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Compte créé. Vérifiez votre e-mail pour l’activer.');
        this.dialogRef.close(true);
        void this.router.navigate(['/verification-email'], {
          queryParams: { email: this.form.controls.email.value }
        });
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err, 'Impossible de créer le compte');
      }
    });
  }
}

@Component({
  selector: 'app-register-client',
  standalone: true,
  template: ''
})
export class RegisterClientComponent {
  private readonly dialogs = inject(RegisterClientDialogService);
  private readonly router = inject(Router);

  constructor() {
    this.dialogs.open().afterClosed().subscribe(() => {
      void this.router.navigateByUrl('/');
    });
  }
}

@Injectable({ providedIn: 'root' })
export class RegisterClientDialogService {
  private readonly dialog = inject(MatDialog);

  open(): MatDialogRef<RegisterClientDialogComponent> {
    return this.dialog.open(RegisterClientDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      autoFocus: 'first-tabbable',
      panelClass: 'register-client-dialog'
    });
  }
}
