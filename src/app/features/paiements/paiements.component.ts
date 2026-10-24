import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { isoDate } from '../../core/format';
import { Client, Commande, PageResponse, Paiement } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { matchesSearch } from '../../core/search';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CurrencyPipe, DatePipe, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>payments</mat-icon></span>
          <div>
            <h1>Paiements</h1>
            <p class="muted">Encaissements clients de la maison</p>
          </div>
        </div>
      </header>
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
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </form>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Recherche</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="q" (ngModelChange)="apply()" placeholder="Client, moyen, référence">
        </mat-form-field>
      </div>
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
  q = '';
  clients: Client[] = [];
  commandes: Commande[] = [];
  all: Paiement[] = [];
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
    datePaiement: [isoDate(new Date()), Validators.required],
    reference: [''],
    notes: ['']
  });

  constructor() {
    bindAtelierScope(() => {
      this.api.get<PageResponse<Client>>('clients', { size: 200 }).subscribe({ next: (p) => (this.clients = p.content ?? []) });
      this.api.get<PageResponse<Commande>>('commandes', { size: 200 }).subscribe({ next: (p) => (this.commandes = p.content ?? []) });
      this.load();
    });
  }

  load(): void {
    this.page = 0;
    this.api.get<Paiement[] | PageResponse<Paiement>>('paiements', { page: 0, size: 200 }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, 0, 200);
        this.all = page.content ?? [];
        this.apply();
      },
      error: (err) => this.notify.error(err)
    });
  }

  apply(): void {
    const filtered = this.all.filter((row) => matchesSearch(this.q, row.clientNom, row.moyen, row.reference, row.notes));
    this.total = filtered.length;
    this.rows = filtered.slice(this.page * this.size, this.page * this.size + this.size);
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.apply();
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
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
