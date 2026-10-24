import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AppUser, PageResponse } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { UserFormDialogComponent } from '../utilisateurs/utilisateurs.component';

@Component({
  selector: 'app-comptes-clients',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>person</mat-icon></span>
          <div>
            <h1>Comptes clients</h1>
            <p class="muted">Visiteurs inscrits depuis le site public, distincts des clients d’un atelier.</p>
          </div>
        </div>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><mat-icon matPrefix>search</mat-icon><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <button mat-stroked-button type="button" (click)="load()">Rechercher</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.prenom }} {{ r.nom }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>E-mail</th><td mat-cell *matCellDef="let r">{{ r.email }}</td></ng-container>
          <ng-container matColumnDef="telephone"><th mat-header-cell *matHeaderCellDef>Téléphone</th><td mat-cell *matCellDef="let r">{{ r.telephone || '—' }}</td></ng-container>
          <ng-container matColumnDef="actif"><th mat-header-cell *matHeaderCellDef>Actif</th><td mat-cell *matCellDef="let r">{{ r.actif ? 'Oui' : 'Non' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button type="button" (click)="edit(r)">Modifier</button>
              <button mat-button type="button" (click)="toggle(r)">{{ r.actif ? 'Désactiver' : 'Activer' }}</button>
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
export class ComptesClientsComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: AppUser[] = [];
  cols = ['nom', 'email', 'telephone', 'actif', 'actions'];

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<PageResponse<AppUser>>('users', { role: 'CLIENT', q: this.q, page: this.page, size: this.size }).subscribe({
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

  edit(row: AppUser): void {
    this.dialog.open(UserFormDialogComponent, { width: '720px', data: row }).afterClosed().subscribe((ok) => ok && this.load());
  }

  toggle(row: AppUser): void {
    this.api.patch(`users/${row.id}/actif?actif=${!row.actif}`, {}).subscribe({
      next: () => this.load(),
      error: (err) => this.notify.error(err)
    });
  }
}
