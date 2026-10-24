import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardKpi } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money, periodRange } from '../../core/format';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month';
  customFrom = '';
  customTo = '';
  loading = false;
  data: DashboardKpi | null = null;
  money = money;

  constructor() {
    if (this.auth.isSuperAdmin()) {
      void this.router.navigateByUrl('/app/plateforme');
      return;
    }
    this.load();
  }

  load(): void {
    const range = periodRange(this.period, this.customFrom, this.customTo);
    this.loading = true;
    this.api.get<DashboardKpi>('dashboard', range).subscribe({
      next: (data) => {
        this.data = {
          ...data,
          benefice: data.benefice ?? data.beneficeEstime ?? 0,
          retards: data.retards ?? data.commandesEnRetard ?? 0
        };
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err);
      }
    });
  }

  maxProd(): number {
    const rows = this.data?.productionParTailleur ?? [];
    return Math.max(1, ...rows.map((r) => r.count ?? r.productions ?? 0));
  }

  label(row: NonNullable<DashboardKpi['productionParTailleur']>[number]): string {
    return row.libelle || `${row.prenom ?? ''} ${row.nom ?? ''}`.trim() || `Tailleur ${row.tailleurId ?? ''}`;
  }
}
