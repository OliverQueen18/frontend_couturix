import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { Client, Commande, MESURE_FIELDS, Mesure, PageResponse, Paiement } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    @if (client) {
      <section class="page">
        <a routerLink="/app/clients">← Clients</a>
        <header class="page-header">
          <div>
            <h1>{{ client.prenom }} {{ client.nom }}</h1>
            <p class="muted">{{ client.telephone }} · {{ client.email }} · Solde {{ client.solde | currency:'XOF':'symbol':'1.0-0':'fr' }}</p>
          </div>
        </header>
        <div class="form-grid" style="margin-bottom:1rem">
          <img class="photo-preview" [src]="api.fileUrl(client.photoUrl)" alt="Photo client">
          <div>
            <input type="file" accept="image/*" (change)="upload($event)">
            <p>{{ client.adresse }}</p>
            <p class="muted">{{ client.notes }}</p>
          </div>
        </div>
        <mat-tab-group>
          <mat-tab label="Mesures">
            <form class="card-block" style="margin-top:1rem" [formGroup]="mesureForm" (ngSubmit)="saveMesure()">
              <div class="form-grid">
                @for (field of fields; track field.key) {
                  <mat-form-field appearance="outline">
                    <mat-label>{{ field.label }}</mat-label>
                    <input matInput type="number" [formControlName]="field.key">
                  </mat-form-field>
                }
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes"></textarea>
                </mat-form-field>
              </div>
              <button mat-flat-button color="primary">Enregistrer les mesures</button>
            </form>
            <div class="table-card" style="margin-top:1rem">
              <table mat-table [dataSource]="mesures">
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let m">{{ m.datePrise | date:'dd/MM/yyyy' }}</td></ng-container>
                <ng-container matColumnDef="courante"><th mat-header-cell *matHeaderCellDef>Courante</th><td mat-cell *matCellDef="let m">{{ m.courante ? 'Oui' : 'Non' }}</td></ng-container>
                <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let m">{{ m.notes }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['date','courante','notes']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['date','courante','notes']"></tr>
              </table>
            </div>
          </mat-tab>
          <mat-tab label="Commandes">
            <div class="table-card" style="margin-top:1rem">
              <table mat-table [dataSource]="commandes">
                <ng-container matColumnDef="numero"><th mat-header-cell *matHeaderCellDef>N°</th><td mat-cell *matCellDef="let c">{{ c.numero }}</td></ng-container>
                <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let c">{{ c.statut }}</td></ng-container>
                <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let c">{{ c.montantTotal | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['numero','statut','total']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['numero','statut','total']"></tr>
              </table>
            </div>
          </mat-tab>
          <mat-tab label="Paiements">
            <div class="table-card" style="margin-top:1rem">
              <table mat-table [dataSource]="paiements">
                <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let p">{{ p.datePaiement | date:'dd/MM/yyyy' }}</td></ng-container>
                <ng-container matColumnDef="montant"><th mat-header-cell *matHeaderCellDef>Montant</th><td mat-cell *matCellDef="let p">{{ p.montant | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
                <ng-container matColumnDef="moyen"><th mat-header-cell *matHeaderCellDef>Moyen</th><td mat-cell *matCellDef="let p">{{ p.moyen }}</td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['date','montant','moyen']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['date','montant','moyen']"></tr>
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>
      </section>
    }
  `
})
export class ClientDetailComponent {
  readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  client: Client | null = null;
  mesures: Mesure[] = [];
  commandes: Commande[] = [];
  paiements: Paiement[] = [];
  fields = MESURE_FIELDS;
  readonly mesureForm = this.fb.group(
    Object.fromEntries([...MESURE_FIELDS.map((f) => [f.key, [null]]), ['notes', ['']]])
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<Client>(`clients/${id}`).subscribe({
      next: (client) => {
        this.client = client;
        this.loadExtras();
      },
      error: (err) => this.notify.error(err)
    });
  }

  loadExtras(): void {
    if (!this.client) {
      return;
    }
    const id = this.client.id;
    this.api.get<Mesure[]>(`clients/${id}/mesures`).subscribe({
      next: (rows) => {
        this.mesures = rows;
        const current = rows.find((m) => m.courante) ?? rows[0];
        if (current) {
          this.mesureForm.patchValue(current as never);
        }
      }
    });
    this.api.get<Commande[] | PageResponse<Commande>>(`clients/${id}/commandes`).subscribe({
      next: (res) => (this.commandes = Array.isArray(res) ? res : res.content ?? [])
    });
    this.api.get<Paiement[] | PageResponse<Paiement>>(`clients/${id}/paiements`).subscribe({
      next: (res) => (this.paiements = Array.isArray(res) ? res : res.content ?? [])
    });
  }

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.client) {
      return;
    }
    this.api.upload<Client>(`clients/${this.client.id}/photo`, file).subscribe({
      next: (client) => {
        this.client = client;
        this.notify.success('Photo mise à jour');
      },
      error: (err) => this.notify.error(err)
    });
  }

  saveMesure(): void {
    if (!this.client) {
      return;
    }
    this.api.post<Mesure>(`clients/${this.client.id}/mesures`, this.mesureForm.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Mesures enregistrées');
        this.loadExtras();
      },
      error: (err) => this.notify.error(err)
    });
  }
}
