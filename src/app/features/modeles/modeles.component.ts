import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { CategorieModele, Modele, PageResponse, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { joursLabel } from '../../core/format';

export interface ModeleFormData {
  modele: Modele | null;
  categories: CategorieModele[];
}

@Component({
  selector: 'app-modele-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>checkroom</mat-icon></span>
      {{ data.modele ? 'Modifier le modèle' : 'Nouveau modèle' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>style</mat-icon><span>Identité</span></div>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Nom</mat-label>
            <mat-icon matPrefix>checkroom</mat-icon>
            <input matInput formControlName="nom">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Catégorie</mat-label>
            <mat-icon matPrefix>category</mat-icon>
            <mat-select formControlName="categorieId">
              @for (c of data.categories; track c.id) { <mat-option [value]="c.id">{{ c.nom }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <div class="form-section"><mat-icon>schedule</mat-icon><span>Prix & délai</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Prix indicatif</mat-label>
            <mat-icon matPrefix>payments</mat-icon>
            <input matInput type="number" formControlName="prixIndicatif">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Délai (jours)</mat-label>
            <mat-icon matPrefix>event</mat-icon>
            <input matInput type="number" min="0" step="1" formControlName="tempsFabricationJours">
          </mat-form-field>
          <div class="form-section"><mat-icon>notes</mat-icon><span>Détails</span></div>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Tissu recommandé</mat-label>
            <mat-icon matPrefix>texture</mat-icon>
            <input matInput formControlName="tissuRecommande">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Description</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput rows="3" formControlName="description"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class ModeleFormDialogComponent {
  readonly data = inject<ModeleFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ModeleFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  readonly form = this.fb.group({
    nom: [this.data.modele?.nom ?? '', Validators.required],
    categorieId: [this.data.modele?.categorieId ?? null],
    prixIndicatif: [this.data.modele?.prixIndicatif ?? null],
    tempsFabricationJours: [this.data.modele?.tempsFabricationJours ?? null],
    tissuRecommande: [this.data.modele?.tissuRecommande ?? ''],
    description: [this.data.modele?.description ?? '']
  });

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.data.modele?.id
      ? this.api.put<Modele>(`modeles/${this.data.modele.id}`, body)
      : this.api.post<Modele>('modeles', body);
    req.subscribe({
      next: () => {
        this.notify.success('Modèle enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-modeles',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>checkroom</mat-icon></span>
          <div>
            <h1>Modèles</h1>
            <p class="muted">Catalogue de la maison</p>
          </div>
        </div>
        <button mat-flat-button color="primary" (click)="edit()">
          <mat-icon>add</mat-icon>
          Nouveau modèle
        </button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><mat-icon matPrefix>search</mat-icon><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Statut</mat-label>
          <mat-select [(ngModel)]="statut" (selectionChange)="load()">
            <mat-option value="">Tous</mat-option>
            <mat-option value="BROUILLON">Brouillon</mat-option>
            <mat-option value="PUBLIE">Publié</mat-option>
            <mat-option value="DEPUBLIE">Dépublié</mat-option>
            <mat-option value="ARCHIVE">Archivé</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button (click)="load()">Filtrer</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.nom }}</td></ng-container>
          <ng-container matColumnDef="categorie"><th mat-header-cell *matHeaderCellDef>Catégorie</th><td mat-cell *matCellDef="let r">{{ r.categorieNom }}</td></ng-container>
          <ng-container matColumnDef="prix"><th mat-header-cell *matHeaderCellDef>Prix</th><td mat-cell *matCellDef="let r">{{ r.prixIndicatif | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="delai"><th mat-header-cell *matHeaderCellDef>Délai</th><td mat-cell *matCellDef="let r">{{ jours(r.tempsFabricationJours) }}</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let r">{{ labels[r.statut] || r.statut }}</td></ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button (click)="open(r)">Fiche</button>
              <button mat-button (click)="edit(r)">Modifier</button>
              <button mat-button (click)="action(r, 'publier')" [disabled]="r.statut==='PUBLIE'">Publier</button>
              <button mat-button (click)="action(r, 'depublier')" [disabled]="r.statut!=='PUBLIE'">Dépublier</button>
              <button mat-button (click)="action(r, 'archiver')">Archiver</button>
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
export class ModelesComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  q = '';
  statut = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Modele[] = [];
  categories: CategorieModele[] = [];
  cols = ['nom', 'categorie', 'prix', 'delai', 'statut', 'actions'];
  labels = STATUT_LABELS;
  jours = joursLabel;

  constructor() {
    this.api.get<CategorieModele[]>('categories-modeles').subscribe({
      next: (rows) => (this.categories = rows),
      error: () =>
        this.api.get<PageResponse<CategorieModele>>('categories-modeles', { size: 100 }).subscribe({
          next: (page) => (this.categories = page.content ?? [])
        })
    });
    this.load();
  }

  load(): void {
    this.api.get<PageResponse<Modele>>('modeles', { q: this.q, statut: this.statut, page: this.page, size: this.size }).subscribe({
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

  open(row: Modele): void {
    void this.router.navigate(['/app/modeles', row.id]);
  }

  edit(row?: Modele): void {
    this.dialog
      .open(ModeleFormDialogComponent, { width: '720px', data: { modele: row ?? null, categories: this.categories } })
      .afterClosed()
      .subscribe((ok) => ok && this.load());
  }

  action(row: Modele, verb: 'publier' | 'depublier' | 'archiver'): void {
    this.api.post<Modele>(`modeles/${row.id}/${verb}`).subscribe({
      next: () => {
        this.notify.success('Statut mis à jour');
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }
}
