import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { GeoPoint } from '../core/models';
import { NotifyService } from '../core/notify.service';
import { BAMAKO, DEFAULT_COUNTRY, countryOptions, mapZoomFor } from '../shared/countries';
import { PasswordToggleComponent } from '../shared/password-toggle.component';
import { PhoneFieldComponent } from '../shared/phone-field.component';
import { StreetMapComponent } from '../shared/street-map.component';
import { fcfa, HOME_PLANS } from './home.data';
import { PlanDetailDialogService } from './plan-detail-dialog.component';
import { PublicNavComponent } from './public-nav.component';
import { RegisterClientDialogService } from './register-client.component';

const PLAN_CODES = ['GRATUIT', 'STANDARD', 'PREMIUM', 'GOLD'] as const;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    PublicNavComponent,
    PhoneFieldComponent,
    PasswordToggleComponent,
    StreetMapComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly clients = inject(RegisterClientDialogService);
  private readonly planDialog = inject(PlanDetailDialogService);
  loading = false;
  mapZoom = 13;
  readonly countryOptions = countryOptions;
  readonly offers = [
    { code: 'GRATUIT', name: 'Gratuit', price: fcfa(0), limit: '1 atelier', tone: 'free', kicker: '15 jours d’essai' },
    { code: 'STANDARD', name: 'Standard', price: fcfa(15000), limit: '1 atelier', tone: 'standard', kicker: 'Présence' },
    { code: 'PREMIUM', name: 'Premium', price: fcfa(35000), limit: 'Jusqu’à 5 ateliers', tone: 'premium', kicker: 'Le plus choisi' },
    { code: 'GOLD', name: 'Gold', price: fcfa(60000), limit: 'Ateliers illimités', tone: 'gold', kicker: 'Maison' }
  ];

  readonly form = this.fb.nonNullable.group({
    plan: [this.readPlan(), Validators.required],
    atelierNom: ['', Validators.required],
    sigle: [''],
    rccm: [''],
    nif: [''],
    ville: [''],
    pays: [DEFAULT_COUNTRY],
    adresse: [''],
    telephoneAtelier: [''],
    latitude: this.fb.control<number | null>(BAMAKO.latitude),
    longitude: this.fb.control<number | null>(BAMAKO.longitude),
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor() {
    this.form.valueChanges.pipe(
      debounceTime(900),
      distinctUntilChanged((a, b) =>
        a.adresse === b.adresse && a.ville === b.ville && a.pays === b.pays),
      filter((value) => !!(value.adresse?.trim() || value.ville?.trim() || value.pays?.trim())),
      switchMap((value) => this.api.get<GeoPoint>('public/geocode', {
        adresse: value.adresse,
        ville: value.ville,
        pays: value.pays
      }).pipe(catchError(() => of(null)))),
      filter((point): point is GeoPoint => !!point)
    ).subscribe({
      next: (point) => {
        this.mapZoom = mapZoomFor(point.precision);
        this.form.patchValue({
          latitude: point.latitude,
          longitude: point.longitude
        }, { emitEvent: false });
      }
    });
  }

  private readPlan(): string {
    const raw = (this.route.snapshot.queryParamMap.get('plan') ?? '').toUpperCase();
    return PLAN_CODES.includes(raw as typeof PLAN_CODES[number]) ? raw : '';
  }

  choosePlan(code: string): void {
    this.form.controls.plan.setValue(code);
    this.form.controls.plan.markAsTouched();
  }

  showPlan(code: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const plan = HOME_PLANS.find((item) => item.code === code);
    if (!plan) {
      return;
    }
    this.planDialog.open(plan).afterClosed().subscribe((chosen) => {
      if (chosen) {
        this.choosePlan(chosen);
      }
    });
  }

  get selectedOffer() {
    return this.offers.find((offer) => offer.code === this.form.controls.plan.value) ?? null;
  }

  openClient(): void {
    this.clients.open();
  }

  onMap(coords: { latitude: number; longitude: number }): void {
    this.form.patchValue(coords, { emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.registerAtelier(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Atelier créé. Vérifiez votre e-mail pour activer le compte.');
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
