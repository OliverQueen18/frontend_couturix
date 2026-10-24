import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Commande, PageResponse, ProductionColumn, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { isRetard } from '../../core/format';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { matchesSearch } from '../../core/search';

const STEPS = ['EN_PREPARATION', 'EN_COUPE', 'EN_COUTURE', 'FINITION', 'CONTROLE', 'PRETE'];

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>precision_manufacturing</mat-icon></span>
          <div>
            <h1>Tableau de production</h1>
            <p class="muted">Suivi des pièces d’atelier, de la coupe à la livraison</p>
          </div>
        </div>
        <button mat-stroked-button (click)="load()">Actualiser</button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Recherche</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="q" (ngModelChange)="apply()" placeholder="N°, client, tailleur">
        </mat-form-field>
      </div>
      <div class="board">
        @for (col of columns; track col.etape) {
          <div class="board-col">
            <h3>{{ labels[col.etape] || col.etape }} <span class="muted">({{ col.commandes.length }})</span></h3>
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
  q = '';
  all: Commande[] = [];
  columns: ProductionColumn[] = STEPS.map((etape) => ({ etape, commandes: [] }));
  labels = STATUT_LABELS;

  constructor() {
    bindAtelierScope(() => this.load());
  }

  late(cmd: Commande): boolean {
    return isRetard(cmd.datePrevue, cmd.statut);
  }

  load(): void {
    this.api.get<PageResponse<Commande>>('commandes', { size: 200 }).subscribe({
      next: (page) => {
        this.all = page.content ?? [];
        this.apply();
      },
      error: (err) => this.notify.error(err)
    });
  }

  apply(): void {
    const rows = this.all.filter((cmd) =>
      matchesSearch(this.q, cmd.numero, cmd.clientNom, cmd.tailleurNom, this.labels[cmd.statut], cmd.statut)
    );
    this.columns = STEPS.map((etape) => ({
      etape,
      commandes: rows.filter((c) => c.statut === etape)
    }));
  }
}
