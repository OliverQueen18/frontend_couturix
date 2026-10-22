import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { Devis, PageResponse, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-devis',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Devis</h1></header>
      <div class="filters">
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
  statut = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Devis[] = [];
  cols = ['numero', 'client', 'total', 'validite', 'statut', 'actions'];
  labels = STATUT_LABELS;

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<Devis[] | PageResponse<Devis>>('devis', { statut: this.statut, page: this.page, size: this.size }).subscribe({
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
