import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { PlanOffre } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-cms-offres',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatTableModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>workspace_premium</mat-icon></span>
          <div>
            <h1>Délais des offres</h1>
            <p class="muted">Durée d’essai des fonctionnalités pour chaque plan. L’offre Gratuite ouvre les fonctions payantes pendant ce délai.</p>
          </div>
        </div>
      </header>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="libelle">
            <th mat-header-cell *matHeaderCellDef>Offre</th>
            <td mat-cell *matCellDef="let r">{{ r.libelle }}</td>
          </ng-container>
          <ng-container matColumnDef="ateliers">
            <th mat-header-cell *matHeaderCellDef>Ateliers</th>
            <td mat-cell *matCellDef="let r">{{ r.maxAteliers == null ? 'Illimités' : r.maxAteliers }}</td>
          </ng-container>
          <ng-container matColumnDef="sms">
            <th mat-header-cell *matHeaderCellDef>SMS</th>
            <td mat-cell *matCellDef="let r">{{ r.sms ? 'Inclus' : 'Essai puis Standard' }}</td>
          </ng-container>
          <ng-container matColumnDef="trialDays">
            <th mat-header-cell *matHeaderCellDef>Jours d’essai</th>
            <td mat-cell *matCellDef="let r">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <input matInput type="number" min="0" max="3650" [(ngModel)]="r.trialDays">
              </mat-form-field>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-flat-button color="primary" type="button" (click)="save(r)">Enregistrer</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .table-card { overflow: auto; }
    td mat-form-field { width: 8rem; }
  `]
})
export class CmsOffresComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  rows: PlanOffre[] = [];
  cols = ['libelle', 'ateliers', 'sms', 'trialDays', 'actions'];

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<PlanOffre[]>('admin/offres').subscribe({
      next: (rows) => (this.rows = rows ?? []),
      error: (err) => this.notify.error(err)
    });
  }

  save(row: PlanOffre): void {
    const days = Number(row.trialDays);
    if (!Number.isFinite(days) || days < 0 || days > 3650) {
      this.notify.error('Indiquez un délai entre 0 et 3650 jours');
      return;
    }
    this.api.put<PlanOffre>(`admin/offres/${row.code}`, { trialDays: Math.floor(days) }).subscribe({
      next: (saved) => {
        row.trialDays = saved.trialDays;
        this.notify.success(`Délai d’essai de ${saved.libelle} enregistré`);
      },
      error: (err) => this.notify.error(err)
    });
  }
}
