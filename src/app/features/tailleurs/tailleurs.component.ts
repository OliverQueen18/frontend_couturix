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
import { PageResponse, Specialite, Tailleur } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { PhoneFieldComponent } from '../../shared/phone-field.component';

@Component({
  selector: 'app-tailleur-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatIconModule, PhoneFieldComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>content_cut</mat-icon></span>
      {{ data.tailleur ? 'Modifier le tailleur' : 'Nouveau tailleur' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>badge</mat-icon><span>Identité</span></div>
          <mat-form-field appearance="outline"><mat-label>Nom</mat-label><mat-icon matPrefix>badge</mat-icon><input matInput formControlName="nom"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Prénom</mat-label><mat-icon matPrefix>face</mat-icon><input matInput formControlName="prenom"></mat-form-field>
          <app-phone-field class="full" formControlName="telephone" label="Téléphone" />
          <mat-form-field appearance="outline" class="full"><mat-label>E-mail</mat-label><mat-icon matPrefix>mail_outline</mat-icon><input matInput formControlName="email"></mat-form-field>
          <div class="form-section"><mat-icon>account_balance_wallet</mat-icon><span>Rémunération</span></div>
          <mat-form-field appearance="outline"><mat-label>Rémunération</mat-label>
            <mat-icon matPrefix>payments</mat-icon>
            <mat-select formControlName="modeRemuneration">
              <mat-option value="FIXE">Fixe</mat-option>
              <mat-option value="PIECE">À la pièce</mat-option>
              <mat-option value="POURCENTAGE">Pourcentage</mat-option>
              <mat-option value="MIXTE">Mixte</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Salaire fixe</mat-label><mat-icon matPrefix>attach_money</mat-icon><input matInput type="number" formControlName="salaireFixe"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Taux pièce</mat-label><mat-icon matPrefix>sell</mat-icon><input matInput type="number" formControlName="tauxPiece"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Pourcentage</mat-label><mat-icon matPrefix>percent</mat-icon><input matInput type="number" formControlName="pourcentage"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Spécialités</mat-label>
            <mat-icon matPrefix>auto_awesome</mat-icon>
            <mat-select formControlName="specialiteIds" multiple>
              @for (s of data.specialites; track s.id) { <mat-option [value]="s.id">{{ s.libelle }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        <mat-slide-toggle formControlName="actif">Actif</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class TailleurFormDialogComponent {
  readonly data = inject<{ tailleur: Tailleur | null; specialites: Specialite[] }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TailleurFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    nom: [this.data.tailleur?.nom ?? '', Validators.required],
    prenom: [this.data.tailleur?.prenom ?? '', Validators.required],
    telephone: [this.data.tailleur?.telephone ?? ''],
    email: [this.data.tailleur?.email ?? ''],
    modeRemuneration: [this.data.tailleur?.modeRemuneration ?? 'FIXE'],
    salaireFixe: [this.data.tailleur?.salaireFixe ?? 0],
    tauxPiece: [this.data.tailleur?.tauxPiece ?? 0],
    pourcentage: [this.data.tailleur?.pourcentage ?? 0],
    specialiteIds: [this.data.tailleur?.specialiteIds ?? []],
    actif: [this.data.tailleur?.actif ?? true]
  });

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.data.tailleur?.id
      ? this.api.put(`tailleurs/${this.data.tailleur.id}`, body)
      : this.api.post('tailleurs', body);
    req.subscribe({
      next: () => {
        this.notify.success('Tailleur enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-tailleurs',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Tailleurs</h1>
        <button mat-flat-button color="primary" (click)="edit()">Nouveau</button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <button mat-stroked-button (click)="load()">Rechercher</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.prenom }} {{ r.nom }}</td></ng-container>
          <ng-container matColumnDef="mode"><th mat-header-cell *matHeaderCellDef>Rémunération</th><td mat-cell *matCellDef="let r">{{ r.modeRemuneration }}</td></ng-container>
          <ng-container matColumnDef="specialites"><th mat-header-cell *matHeaderCellDef>Spécialités</th><td mat-cell *matCellDef="let r">{{ (r.specialites || []).join(', ') }}</td></ng-container>
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
export class TailleursComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Tailleur[] = [];
  specialites: Specialite[] = [];
  cols = ['nom', 'mode', 'specialites', 'actif', 'actions'];

  constructor() {
    this.api.get<Specialite[]>('specialites').subscribe({
      next: (rows) => (this.specialites = rows),
      error: () =>
        this.api.get<PageResponse<Specialite>>('specialites', { size: 100 }).subscribe({
          next: (page) => (this.specialites = page.content ?? [])
        })
    });
    this.load();
  }

  load(): void {
    this.api.get<Tailleur[] | PageResponse<Tailleur>>('tailleurs', { q: this.q, page: this.page, size: this.size }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, this.page, this.size);
        this.rows = page.content ?? [];
        this.total = page.totalElements ?? 0;
      },
      error: (err) => this.notify.error(err)
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  edit(row?: Tailleur): void {
    this.dialog.open(TailleurFormDialogComponent, {
      width: '760px',
      data: { tailleur: row ?? null, specialites: this.specialites }
    }).afterClosed().subscribe((ok) => ok && this.load());
  }
}
