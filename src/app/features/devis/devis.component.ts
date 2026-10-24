import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { Devis, PageResponse, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { matchesSearch } from '../../core/search';

@Component({
  selector: 'app-devis',
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
          <span class="page-icon"><mat-icon>request_quote</mat-icon></span>
          <div>
            <h1>Devis</h1>
            <p class="muted">Propositions commerciales de la maison</p>
          </div>
        </div>
        <button mat-stroked-button (click)="load()">Actualiser</button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Recherche</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="q" (ngModelChange)="apply()" placeholder="N°, client">
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Statut</mat-label>
          <mat-select [(ngModel)]="statut" (selectionChange)="load()">
            <mat-option value="">Tous</mat-option>
            <mat-option value="BROUILLON">Brouillon</mat-option>
            <mat-option value="ENVOYE">Envoyé</mat-option>
            <mat-option value="ACCEPTE">Accepté</mat-option>
            <mat-option value="REFUSE">Refusé</mat-option>
            <mat-option value="EXPIRE">Expiré</mat-option>
            <mat-option value="COMMANDE">Commande</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button (click)="load()">Filtrer</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="numero"><th mat-header-cell *matHeaderCellDef>N°</th><td mat-cell *matCellDef="let r">{{ r.numero }}</td></ng-container>
          <ng-container matColumnDef="client"><th mat-header-cell *matHeaderCellDef>Client</th><td mat-cell *matCellDef="let r">{{ r.clientNom }}</td></ng-container>
          <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let r">{{ r.montantTotal | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="validite"><th mat-header-cell *matHeaderCellDef>Validité</th><td mat-cell *matCellDef="let r">{{ r.validite | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let r">{{ labels[r.statut] || r.statut }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button (click)="accepter(r)" [disabled]="r.statut==='ACCEPTE' || r.statut==='COMMANDE'">Accepter</button>
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
export class DevisComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  q = '';
  statut = '';
  page = 0;
  size = 20;
  total = 0;
  all: Devis[] = [];
  rows: Devis[] = [];
  cols = ['numero', 'client', 'total', 'validite', 'statut', 'actions'];
  labels = STATUT_LABELS;

  constructor() {
    bindAtelierScope(() => this.load());
  }

  load(): void {
    this.page = 0;
    this.api.get<Devis[] | PageResponse<Devis>>('devis', { statut: this.statut, page: 0, size: 200 }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, 0, 200);
        this.all = page.content ?? [];
        this.apply();
      },
      error: (err) => this.notify.error(err)
    });
  }

  apply(): void {
    const filtered = this.all.filter((row) => matchesSearch(this.q, row.numero, row.clientNom, this.labels[row.statut], row.statut));
    this.total = filtered.length;
    this.rows = filtered.slice(this.page * this.size, this.page * this.size + this.size);
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.apply();
  }

  accepter(row: Devis): void {
    this.api.post<Devis>(`devis/${row.id}/accepter`).subscribe({
      next: () => {
        this.notify.success('Devis accepté');
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }
}
