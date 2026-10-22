import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/auth.service';
import { NotifyService } from '../core/notify.service';
import { PublicNavComponent } from './public-nav.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, PublicNavComponent],
  template: `
    <app-public-nav />
    <section class="register-page">
      <div class="cx-form-card register-card">
        <p class="eyebrow">Vérification</p>
        <h1>Confirmez votre e-mail</h1>
        <p class="muted">Saisissez le code à 6 chiffres envoyé à {{ email || 'votre adresse e-mail' }}.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <mat-form-field appearance="outline" class="full">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Code OTP</mat-label>
              <input matInput formControlName="code" inputmode="numeric" maxlength="6">
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="loading">Valider</button>
            <button mat-button type="button" (click)="resend()" [disabled]="loading">Renvoyer le code</button>
            <a mat-button routerLink="/login">Connexion</a>
          </div>
        </form>
      </div>
    </section>
  `
})
export class VerifyEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  loading = false;
  email = this.route.snapshot.queryParamMap.get('email')
    ?? this.auth.user?.email
    ?? '';

  readonly form = this.fb.nonNullable.group({
    email: [this.email, [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(4)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email, code } = this.form.getRawValue();
    this.auth.verifyEmail(email, code).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('E-mail vérifié');
        void this.router.navigateByUrl(this.auth.homeAfterLogin());
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err, 'Code invalide');
      }
    });
  }

  resend(): void {
    const email = this.form.controls.email.value;
    if (!email) {
      return;
    }
    this.auth.resendOtp(email, 'EMAIL_VERIFY').subscribe({
      next: () => this.notify.success('Un nouveau code a été envoyé'),
      error: (err) => this.notify.error(err)
    });
  }
}
