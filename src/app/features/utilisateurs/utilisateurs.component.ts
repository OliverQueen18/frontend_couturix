import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { requireValid } from '../../core/forms';
import { ALL_ROLES, AppUser, PageResponse, ROLE_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { PhoneFieldComponent } from '../../shared/phone-field.component';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatIconModule, PhoneFieldComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>manage_accounts</mat-icon></span>
      {{ data ? "Modifier l'utilisateur" : 'Nouvel utilisateur' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>badge</mat-icon><span>Identité</span></div>
          <mat-form-field appearance="outline"><mat-label>Nom</mat-label><mat-icon matPrefix>badge</mat-icon><input matInput formControlName="nom"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Prénom</mat-label><mat-icon matPrefix>face</mat-icon><input matInput formControlName="prenom"></mat-form-field>
          <div class="form-section"><mat-icon>lock</mat-icon><span>Accès</span></div>
          <mat-form-field appearance="outline"><mat-label>E-mail</mat-label><mat-icon matPrefix>mail_outline</mat-icon><input matInput formControlName="email"></mat-form-field>
          <app-phone-field formControlName="telephone" label="Téléphone" />
          @if (!data) {
            <mat-form-field appearance="outline" class="full"><mat-label>Mot de passe</mat-label><mat-icon matPrefix>lock_outline</mat-icon><input matInput type="password" formControlName="password"></mat-form-field>
          }
          <mat-form-field appearance="outline" class="full"><mat-label>Rôles</mat-label>
            <mat-icon matPrefix>admin_panel_settings</mat-icon>
            <mat-select formControlName="roles" multiple>
              @for (role of roles; track role) { <mat-option [value]="role">{{ labels[role] }}</mat-option> }
            </mat-select>
          </mat-form-field>
          @if (superAdmin) {
            <mat-form-field appearance="outline" class="full"><mat-label>Abonnement</mat-label>
              <mat-icon matPrefix>workspace_premium</mat-icon>
              <mat-select formControlName="plan">
                @for (plan of plans; track plan.code) { <mat-option [value]="plan.code">{{ plan.label }}</mat-option> }
              </mat-select>
            </mat-form-field>
          }
        </div>
        <mat-slide-toggle formControlName="actif">Actif</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class UserFormDialogComponent {
  readonly data = inject<AppUser | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  roles = ALL_ROLES;
  labels = ROLE_LABELS;
  readonly superAdmin = this.auth.hasAnyRole(['SUPER_ADMIN']);
  readonly plans = [
    { code: 'GRATUIT', label: 'Gratuit — 1 atelier' },
    { code: 'STANDARD', label: 'Standard — 1 atelier' },
    { code: 'PREMIUM', label: 'Premium — 5 ateliers' },
    { code: 'GOLD', label: 'Gold — ateliers illimités' }
  ];
  readonly form = this.fb.group({
    nom: [this.data?.nom ?? '', Validators.required],
    prenom: [this.data?.prenom ?? '', Validators.required],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    telephone: [this.data?.telephone ?? ''],
    password: ['', this.data ? [] : [Validators.required, Validators.minLength(8)]],
    roles: [this.data?.roles ?? []],
    plan: [this.data?.plan ?? 'GRATUIT'],
    actif: [this.data?.actif ?? true]
  });

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const { plan, ...rest } = this.form.getRawValue();
    const body = this.superAdmin ? { ...rest, plan } : rest;
    const req = this.data?.id ? this.api.put(`users/${this.data.id}`, body) : this.api.post('users', body);
    req.subscribe({
      next: () => {
        this.notify.success('Utilisateur enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Utilisateurs</h1>
        <button mat-flat-button color="primary" (click)="edit()">Nouvel utilisateur</button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <button mat-stroked-button (click)="load()">Rechercher</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.prenom }} {{ r.nom }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>E-mail</th><td mat-cell *matCellDef="let r">{{ r.email }}</td></ng-container>
          <ng-container matColumnDef="roles"><th mat-header-cell *matHeaderCellDef>Rôles</th><td mat-cell *matCellDef="let r">{{ (r.roles || []).join(', ') }}</td></ng-container>
          <ng-container matColumnDef="plan"><th mat-header-cell *matHeaderCellDef>Abonnement</th><td mat-cell *matCellDef="let r">{{ planLabel(r.plan) }}</td></ng-container>
          <ng-container matColumnDef="actif"><th mat-header-cell *matHeaderCellDef>Actif</th><td mat-cell *matCellDef="let r">{{ r.actif ? 'Oui' : 'Non' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r"><button mat-button (click)="edit(r)">Modifier</button></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
      </div>
    </section>
  `
})
export class UtilisateursComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: AppUser[] = [];
  cols = this.auth.hasAnyRole(['SUPER_ADMIN'])
    ? ['nom', 'email', 'roles', 'plan', 'actif', 'actions']
    : ['nom', 'email', 'roles', 'actif', 'actions'];

  planLabel(code?: string | null): string {
    return ({ GRATUIT: 'Gratuit', STANDARD: 'Standard', PREMIUM: 'Premium', GOLD: 'Gold' } as Record<string, string>)[code ?? ''] ?? 'Gratuit';
  }

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<PageResponse<AppUser>>('users', { q: this.q, page: this.page, size: this.size }).subscribe({
      next: (res) => {
        this.rows = res.content ?? [];
        this.total = res.totalElements ?? 0;
      },
      error: (err) => this.notify.error(err)
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  edit(row?: AppUser): void {
    this.dialog.open(UserFormDialogComponent, { width: '720px', data: row ?? null }).afterClosed().subscribe((ok) => ok && this.load());
  }
}
