import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import {
  Client,
  COMMANDE_STATUTS,
  Commande,
  Modele,
  PageResponse,
  STATUT_LABELS,
  Tailleur
} from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { requireValid } from '../../core/forms';
import { isRetard, isoDate } from '../../core/format';
import { bindAtelierScope } from '../../core/platform-scope.service';

@Component({
  selector: 'app-commande-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>receipt_long</mat-icon></span>
      Nouvelle commande
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>handshake</mat-icon><span>Client & modèle</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Client</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <mat-select formControlName="clientId">
              @for (c of clients; track c.id) { <mat-option [value]="c.id">{{ c.prenom }} {{ c.nom }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Modèle</mat-label>
            <mat-icon matPrefix>checkroom</mat-icon>
            <mat-select formControlName="modeleId">
              @for (m of modeles; track m.id) { <mat-option [value]="m.id">{{ m.nom }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <div class="form-section"><mat-icon>payments</mat-icon><span>Quantité & tarif</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Quantité</mat-label>
            <mat-icon matPrefix>numbers</mat-icon>
            <input matInput type="number" formControlName="quantite">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prix unitaire</mat-label>
            <mat-icon matPrefix>sell</mat-icon>
            <input matInput type="number" formControlName="prixUnitaire">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Remise</mat-label>
            <mat-icon matPrefix>percent</mat-icon>
            <input matInput type="number" formControlName="remise">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Priorité</mat-label>
            <mat-icon matPrefix>flag</mat-icon>
            <mat-select formControlName="priorite">
              <mat-option value="BASSE">Basse</mat-option>
              <mat-option value="NORMALE">Normale</mat-option>
              <mat-option value="HAUTE">Haute</mat-option>
              <mat-option value="URGENTE">Urgente</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="form-section"><mat-icon>event</mat-icon><span>Planning</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Date prévue</mat-label>
            <mat-icon matPrefix>event</mat-icon>
            <input matInput type="date" formControlName="datePrevue">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Notes</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput rows="3" formControlName="notes"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Créer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class CommandeFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CommandeFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  clients: Client[] = [];
  modeles: Modele[] = [];
  readonly form = this.fb.nonNullable.group({
    clientId: [null as number | null, Validators.required],
    modeleId: [null as number | null],
    quantite: [1, Validators.required],
    prixUnitaire: [0, Validators.required],
    remise: [0],
    priorite: ['NORMALE'],
    datePrevue: [isoDate(new Date())],
    notes: ['']
  });

  constructor() {
    this.api.get<PageResponse<Client>>('clients', { size: 200 }).subscribe({ next: (p) => (this.clients = p.content ?? []) });
    this.api.get<PageResponse<Modele>>('modeles', { size: 200 }).subscribe({ next: (p) => (this.modeles = p.content ?? []) });
    this.form.controls.modeleId.valueChanges.subscribe((id) => {
      const modele = this.modeles.find((m) => m.id === id);
      if (!modele?.tempsFabricationJours) {
        return;
      }
      const date = new Date();
      date.setDate(date.getDate() + modele.tempsFabricationJours);
      this.form.patchValue({ datePrevue: isoDate(date) });
    });
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    this.api.post<Commande>('commandes', this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Commande créée');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
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
          <span class="page-icon"><mat-icon>receipt_long</mat-icon></span>
          <div>
            <h1>Commandes</h1>
            <p class="muted">Du premier essai à la livraison</p>
          </div>
        </div>
        <button mat-flat-button color="primary" (click)="create()">
          <mat-icon>add</mat-icon>
          Nouvelle commande
        </button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Statut</mat-label>
          <mat-select [(ngModel)]="statut" (selectionChange)="load()">
            <mat-option value="">Tous</mat-option>
            @for (s of statuts; track s) { <mat-option [value]="s">{{ labels[s] || s }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><mat-icon matPrefix>search</mat-icon><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <button mat-stroked-button (click)="load()">Filtrer</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="numero"><th mat-header-cell *matHeaderCellDef>N°</th><td mat-cell *matCellDef="let r">{{ r.numero }}</td></ng-container>
          <ng-container matColumnDef="client"><th mat-header-cell *matHeaderCellDef>Client</th><td mat-cell *matCellDef="let r">{{ r.clientNom }}</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let r">
              {{ labels[r.statut] || r.statut }}
              @if (late(r)) { <span class="badge-danger badge">Retard</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Prévue</th><td mat-cell *matCellDef="let r">{{ r.datePrevue | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let r">{{ r.montantTotal | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r"><button mat-button (click)="open(r)">Détail</button></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
      </div>
    </section>
  `
})
export class CommandesComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  q = '';
  statut = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Commande[] = [];
  cols = ['numero', 'client', 'statut', 'date', 'total', 'actions'];
  statuts = COMMANDE_STATUTS;
  labels = STATUT_LABELS;

  constructor() {
    bindAtelierScope(() => this.load());
  }

  late(row: Commande): boolean {
    return row.retard === true || isRetard(row.datePrevue, row.statut);
  }

  load(): void {
    this.api.get<PageResponse<Commande>>('commandes', { q: this.q, statut: this.statut, page: this.page, size: this.size }).subscribe({
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

  open(row: Commande): void {
    void this.router.navigate(['/app/commandes', row.id]);
  }

  create(): void {
    this.dialog.open(CommandeFormDialogComponent, { width: '760px' }).afterClosed().subscribe((ok) => ok && this.load());
  }
}
