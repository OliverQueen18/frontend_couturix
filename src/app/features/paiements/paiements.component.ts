import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { Client, Commande, PageResponse, Paiement } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Paiements</h1></header>
      <form class="card-block dialog-form" [formGroup]="form" (ngSubmit)="save()" style="margin-bottom:1rem">
        <h2>Enregistrer un paiement</h2>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Client</mat-label>
            <mat-select formControlName="clientId">
              @for (c of clients; track c.id) { <mat-option [value]="c.id">{{ c.prenom }} {{ c.nom }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Commande</mat-label>
            <mat-select formControlName="commandeId">
              <mat-option [value]="null">Aucune</mat-option>
              @for (c of commandes; track c.id) { <mat-option [value]="c.id">{{ c.numero }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Montant</mat-label><input matInput type="number" formControlName="montant"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Moyen</mat-label>
            <mat-select formControlName="moyen">
              <mat-option value="ESPECES">Espèces</mat-option>
              <mat-option value="MOBILE_MONEY">Mobile money</mat-option>
              <mat-option value="VIREMENT">Virement</mat-option>
              <mat-option value="CHEQUE">Chèque</mat-option>
              <mat-option value="CARTE">Carte</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="date" formControlName="datePaiement"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Référence</mat-label><input matInput formControlName="reference"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Notes</mat-label><input matInput formControlName="notes"></mat-form-field>
        </div>
        <button mat-flat-button color="primary">Enregistrer</button>
      </form>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{ r.datePaiement | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="client"><th mat-header-cell *matHeaderCellDef>Client</th><td mat-cell *matCellDef="let r">{{ r.clientNom }}</td></ng-container>
          <ng-container matColumnDef="montant"><th mat-header-cell *matHeaderCellDef>Montant</th><td mat-cell *matCellDef="let r">{{ r.montant | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="moyen"><th mat-header-cell *matHeaderCellDef>Moyen</th><td mat-cell *matCellDef="let r">{{ r.moyen }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
      </div>
    </section>
  `
})
export class PaiementsComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  clients: Client[] = [];
  commandes: Commande[] = [];
  rows: Paiement[] = [];
  page = 0;
  size = 20;
  total = 0;
  cols = ['date', 'client', 'montant', 'moyen'];
  readonly form = this.fb.group({
    clientId: [null as number | null, Validators.required],
    commandeId: [null as number | null],
    montant: [0, Validators.required],
    moyen: ['ESPECES', Validators.required],
    datePaiement: ['', Validators.required],
    reference: [''],
    notes: ['']
  });

  constructor() {
    this.api.get<PageResponse<Client>>('clients', { size: 200 }).subscribe({ next: (p) => (this.clients = p.content ?? []) });
    this.api.get<PageResponse<Commande>>('commandes', { size: 200 }).subscribe({ next: (p) => (this.commandes = p.content ?? []) });
    this.load();
  }

  load(): void {
    this.api.get<Paiement[] | PageResponse<Paiement>>('paiements', { page: this.page, size: this.size }).subscribe({
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.api.post<Paiement>('paiements', this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Paiement enregistré');
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }
}
