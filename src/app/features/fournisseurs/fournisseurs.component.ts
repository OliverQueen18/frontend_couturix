import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { Fournisseur, PageResponse } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { PhoneFieldComponent } from '../../shared/phone-field.component';

@Component({
  selector: 'app-fournisseur-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule, MatIconModule, PhoneFieldComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>local_shipping</mat-icon></span>
      {{ data ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>store</mat-icon><span>Fournisseur</span></div>
          <mat-form-field appearance="outline" class="full"><mat-label>Nom</mat-label><mat-icon matPrefix>store</mat-icon><input matInput formControlName="nom"></mat-form-field>
          <app-phone-field class="full" formControlName="telephone" label="Téléphone" />
          <mat-form-field appearance="outline" class="full"><mat-label>E-mail</mat-label><mat-icon matPrefix>mail_outline</mat-icon><input matInput formControlName="email"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Adresse</mat-label><mat-icon matPrefix>home</mat-icon><input matInput formControlName="adresse"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Notes</mat-label><mat-icon matPrefix>notes</mat-icon><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
          <mat-slide-toggle formControlName="actif">Actif</mat-slide-toggle>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class FournisseurFormDialogComponent {
  readonly data = inject<Fournisseur | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FournisseurFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    nom: [this.data?.nom ?? '', Validators.required],
    telephone: [this.data?.telephone ?? ''],
    email: [this.data?.email ?? ''],
    adresse: [this.data?.adresse ?? ''],
    notes: [this.data?.notes ?? ''],
    actif: [this.data?.actif ?? true]
  });

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.data?.id ? this.api.put(`fournisseurs/${this.data.id}`, body) : this.api.post('fournisseurs', body);
    req.subscribe({
      next: () => {
        this.notify.success('Fournisseur enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Fournisseurs</h1>
        <button mat-flat-button color="primary" (click)="edit()">Nouveau</button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <button mat-stroked-button (click)="load()">Rechercher</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.nom }}</td></ng-container>
          <ng-container matColumnDef="telephone"><th mat-header-cell *matHeaderCellDef>Téléphone</th><td mat-cell *matCellDef="let r">{{ r.telephone }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>E-mail</th><td mat-cell *matCellDef="let r">{{ r.email }}</td></ng-container>
          <ng-container matColumnDef="actif"><th mat-header-cell *matHeaderCellDef>Actif</th><td mat-cell *matCellDef="let r">{{ r.actif ? 'Oui' : 'Non' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button (click)="edit(r)">Modifier</button>
              <button mat-button color="warn" (click)="remove(r)">Supprimer</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
      </div>
    </section>
  `
})
export class FournisseursComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Fournisseur[] = [];
  cols = ['nom', 'telephone', 'email', 'actif', 'actions'];

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<Fournisseur[] | PageResponse<Fournisseur>>('fournisseurs', { q: this.q, page: this.page, size: this.size }).subscribe({
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

  edit(row?: Fournisseur): void {
    this.dialog.open(FournisseurFormDialogComponent, { width: '640px', data: row ?? null }).afterClosed().subscribe((ok) => ok && this.load());
  }

  remove(row: Fournisseur): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Supprimer', message: `Supprimer ${row.nom} ?` } })
      .afterClosed().subscribe((ok) => {
        if (!ok) { return; }
        this.api.delete(`fournisseurs/${row.id}`).subscribe({
          next: () => { this.notify.success('Fournisseur supprimé'); this.load(); },
          error: (err) => this.notify.error(err)
        });
      });
  }
}
