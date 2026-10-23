import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../core/auth.service';
import { NotifyService } from '../core/notify.service';
import { PasswordToggleComponent } from '../shared/password-toggle.component';
import { PublicNavComponent } from './public-nav.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, PublicNavComponent, PasswordToggleComponent],
  template: `
    <app-public-nav />
    <section class="register-page">
      <div class="cx-form-card register-card">
        <p class="eyebrow">Compte</p>
        <h1>Mot de passe oublié</h1>
        @if (step === 1) {
          <p class="muted">Indiquez votre e-mail. Un code OTP sera envoyé s’il existe un compte.</p>
          <form [formGroup]="emailForm" (ngSubmit)="sendCode()">
            <mat-form-field appearance="outline" class="full">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email">
            </mat-form-field>
            <div class="form-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="loading">Envoyer le code</button>
              <a mat-button routerLink="/login">Retour</a>
            </div>
          </form>
        } @else {
          <p class="muted">Saisissez le code reçu et votre nouveau mot de passe.</p>
          <form [formGroup]="resetForm" (ngSubmit)="reset()">
            <div class="form-grid">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Code OTP</mat-label>
                <input matInput formControlName="code" inputmode="numeric" maxlength="6">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Nouveau mot de passe</mat-label>
                <input matInput [type]="pwd.inputType()" formControlName="newPassword">
                <app-password-toggle #pwd matSuffix />
              </mat-form-field>
            </div>
            <div class="form-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="loading">Réinitialiser</button>
              <button mat-button type="button" (click)="step = 1">Changer d’e-mail</button>
            </div>
          </form>
        }
      </div>
    </section>
  `
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  loading = false;
  step = 1;

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });
  readonly resetForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(4)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  sendCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.forgotPassword(this.emailForm.controls.email.value).subscribe({
      next: () => {
        this.loading = false;
        this.step = 2;
        this.notify.success('Si un compte existe, un code OTP a été envoyé.');
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err);
      }
    });
  }

  reset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const email = this.emailForm.controls.email.value;
    const { code, newPassword } = this.resetForm.getRawValue();
    this.auth.resetPasswordOtp(email, code, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Mot de passe mis à jour. Connectez-vous.');
        void this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err, 'Impossible de réinitialiser');
      }
    });
  }
}
