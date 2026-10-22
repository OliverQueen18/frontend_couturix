import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Commande, PageResponse, ProductionColumn, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { isRetard } from '../../core/format';

const STEPS = ['EN_PREPARATION', 'EN_COUPE', 'EN_COUTURE', 'FINITION', 'CONTROLE', 'PRETE'];

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Tableau de production</h1>
        <button mat-stroked-button (click)="load()">Actualiser</button>
      </header>
      <div class="board">
        @for (col of columns; track col.etape) {
          <div class="board-col">
            <h3>{{ labels[col.etape] || col.etape }}</h3>
            @for (cmd of col.commandes; track cmd.id) {
              <article class="board-card">
                <a [routerLink]="['/app/commandes', cmd.id]"><strong>{{ cmd.numero }}</strong></a>
                <p>{{ cmd.clientNom }}</p>
                <p class="muted">{{ cmd.tailleurNom || 'Non assigné' }}</p>
                @if (cmd.retard || late(cmd)) { <span class="badge badge-danger">Retard</span> }
              </article>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class ProductionComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  columns: ProductionColumn[] = STEPS.map((etape) => ({ etape, commandes: [] }));
  labels = STATUT_LABELS;

  constructor() {
    this.load();
  }

  late(cmd: Commande): boolean {
    return isRetard(cmd.datePrevue, cmd.statut);
  }

  load(): void {
    this.api.get<PageResponse<Commande>>('commandes', { size: 200 }).subscribe({
      next: (page) => {
        const rows = page.content ?? [];
        this.columns = STEPS.map((etape) => ({
          etape,
          commandes: rows.filter((c) => c.statut === etape)
        }));
      },
      error: (err) => this.notify.error(err)
    });
  }
}
