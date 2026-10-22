import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { COMMANDE_WORKFLOW, Commande, PageResponse, STATUT_LABELS, Tailleur } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { isRetard } from '../../core/format';

@Component({
  selector: 'app-commande-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    @if (commande) {
      <section class="page">
        <a routerLink="/app/commandes">← Commandes</a>
        <header class="page-header">
          <div>
            <h1>Commande {{ commande.numero }}</h1>
            <p class="muted">
              {{ commande.clientNom }} · {{ labels[commande.statut] || commande.statut }}
              @if (late()) { <span class="badge badge-danger">Retard</span> }
            </p>
          </div>
        </header>
        <div class="card-block">
          <p>Modèle : {{ commande.modeleNom || '—' }}</p>
          <p>Quantité : {{ commande.quantite }} · Prix unitaire {{ commande.prixUnitaire | currency:'XOF':'symbol':'1.0-0':'fr' }}</p>
          <p>Remise {{ commande.remise | currency:'XOF':'symbol':'1.0-0':'fr' }} · Total {{ commande.montantTotal | currency:'XOF':'symbol':'1.0-0':'fr' }}</p>
          <p>Date prévue : {{ commande.datePrevue | date:'dd/MM/yyyy' }}</p>
          <p>{{ commande.notes }}</p>
        </div>
        <div class="toolbar-actions" style="margin:1rem 0">
          @for (next of nextStatuts(); track next) {
            <button mat-flat-button color="primary" (click)="changeStatut(next)">{{ labels[next] || next }}</button>
          }
        </div>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Tailleur</mat-label>
            <mat-select [(ngModel)]="tailleurId">
              @for (t of tailleurs; track t.id) {
                <mat-option [value]="t.id">{{ t.prenom }} {{ t.nom }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button (click)="assign()">Assigner</button>
        </div>
      </section>
    }
  `
})
export class CommandeDetailComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly route = inject(ActivatedRoute);
  commande: Commande | null = null;
  tailleurs: Tailleur[] = [];
  tailleurId: number | null = null;
  labels = STATUT_LABELS;

  constructor() {
    this.reload();
    this.api.get<Tailleur[] | PageResponse<Tailleur>>('tailleurs', { size: 200 }).subscribe({
      next: (page) => (this.tailleurs = Array.isArray(page) ? page : page.content ?? []),
      error: () =>
        this.api.get<Tailleur[]>('tailleurs').subscribe({ next: (rows) => (this.tailleurs = rows) })
    });
  }

  late(): boolean {
    return !!this.commande && (this.commande.retard === true || isRetard(this.commande.datePrevue, this.commande.statut));
  }

  nextStatuts(): string[] {
    return this.commande ? (COMMANDE_WORKFLOW[this.commande.statut] ?? []) : [];
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<Commande>(`commandes/${id}`).subscribe({
      next: (commande) => {
        this.commande = commande;
        this.tailleurId = commande.tailleurId ?? null;
      },
      error: (err) => this.notify.error(err)
    });
  }

  changeStatut(statut: string): void {
    if (!this.commande) {
      return;
    }
    this.api.post<Commande>(`commandes/${this.commande.id}/statut`, { statut }).subscribe({
      next: (commande) => {
        this.commande = commande;
        this.notify.success('Statut mis à jour');
      },
      error: (err) => this.notify.error(err)
    });
  }

  assign(): void {
    if (!this.commande || !this.tailleurId) {
      return;
    }
    this.api.post<Commande>(`commandes/${this.commande.id}/assigner`, { tailleurId: this.tailleurId }).subscribe({
      next: (commande) => {
        this.commande = commande;
        this.notify.success('Tailleur assigné');
      },
      error: (err) => this.notify.error(err)
    });
  }
}
