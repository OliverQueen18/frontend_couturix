import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PublicNavComponent } from '../../public/public-nav.component';
import { RegisterClientDialogService } from '../../public/register-client.component';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    PublicNavComponent
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly clients = inject(RegisterClientDialogService);

  loading = false;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.mustChangePassword) {
          this.dialog.open(ChangePasswordDialogComponent, { disableClose: true, width: '420px' });
        }
        void this.router.navigateByUrl(this.destination());
      },
      error: (err) => {
        this.loading = false;
        if (err?.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.notify.success('Un code OTP a été envoyé à votre e-mail');
          void this.router.navigate(['/verification-email'], { queryParams: { email } });
          return;
        }
        this.notify.error(err, 'Identifiants invalides');
      }
    });
  }

  openClient(): void {
    this.clients.open();
  }

  private destination(): string {
    const back = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
    if (back.startsWith('/') && !back.startsWith('//')) {
      return back;
    }
    return this.auth.homeAfterLogin();
  }

  forgot(): void {
    void this.router.navigateByUrl('/mot-de-passe-oublie');
  }
}

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Mot de passe oublié</h2>
    <form [formGroup]="form" (ngSubmit)="send()">
      <mat-dialog-content>
        <p>Saisissez votre e-mail. Si un compte existe, un lien de réinitialisation sera envoyé.</p>
        <mat-form-field appearance="outline" class="full">
          <mat-label>E-mail</mat-label>
          <input matInput type="email" formControlName="email">
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">Envoyer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class ForgotPasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly dialogRef = inject(MatDialogRef<ForgotPasswordDialogComponent>);
  loading = false;
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  send(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading = true;
    this.auth.forgotPassword(this.form.controls.email.value).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Si un compte existe, un e-mail a été envoyé.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err);
      }
    });
  }
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Changer le mot de passe</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Mot de passe actuel</mat-label>
          <input matInput type="password" formControlName="currentPassword">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nouveau mot de passe</mat-label>
          <input matInput type="password" formControlName="newPassword">
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class ChangePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.notify.success('Mot de passe mis à jour');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}
