import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { Caisse, CaisseOperation } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money } from '../../core/format';

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Caisse</h1>
        @if (!caisse || caisse.statut === 'CLOTUREE') {
          <button mat-flat-button color="primary" (click)="ouvrir()">Ouvrir la caisse</button>
        }
      </header>
      @if (caisse && caisse.statut === 'OUVERTE') {
        <div class="kpi-grid">
          <article class="kpi-card purple"><div class="label">Solde initial</div><div class="value">{{ money(caisse.soldeInitial) }}</div></article>
          <article class="kpi-card"><div class="label">Solde théorique</div><div class="value">{{ money(caisse.soldeTheorique ?? caisse.soldeInitial) }}</div></article>
        </div>
        <form class="card-block dialog-form" [formGroup]="opForm" (ngSubmit)="addOp()" style="margin-bottom:1rem">
          <h2>Nouvelle opération</h2>
          <div class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Type</mat-label>
              <mat-select formControlName="typeOperation">
                <mat-option value="RECETTE">Recette</mat-option>
                <mat-option value="DEPENSE">Dépense</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Catégorie</mat-label>
              <mat-select formControlName="categorie">
                <mat-option value="PAIEMENT_CLIENT">Paiement client</mat-option>
                <mat-option value="ACHAT">Achat</mat-option>
                <mat-option value="SALAIRE">Salaire</mat-option>
                <mat-option value="AVANCE">Avance</mat-option>
                <mat-option value="AUTRE">Autre</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Montant</mat-label><input matInput type="number" formControlName="montant"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Moyen</mat-label>
              <mat-select formControlName="moyenPaiement">
                <mat-option value="ESPECES">Espèces</mat-option>
                <mat-option value="MOBILE_MONEY">Mobile money</mat-option>
                <mat-option value="VIREMENT">Virement</mat-option>
                <mat-option value="CHEQUE">Chèque</mat-option>
                <mat-option value="CARTE">Carte</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>Motif</mat-label><input matInput formControlName="motif"></mat-form-field>
          </div>
          <button mat-flat-button color="primary" type="submit">Ajouter</button>
        </form>
        <div class="table-card">
          <table mat-table [dataSource]="caisse.operations ?? []">
            <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let r">{{ r.typeOperation }}</td></ng-container>
            <ng-container matColumnDef="categorie"><th mat-header-cell *matHeaderCellDef>Catégorie</th><td mat-cell *matCellDef="let r">{{ r.categorie }}</td></ng-container>
            <ng-container matColumnDef="montant"><th mat-header-cell *matHeaderCellDef>Montant</th><td mat-cell *matCellDef="let r">{{ r.montant | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
            <ng-container matColumnDef="motif"><th mat-header-cell *matHeaderCellDef>Motif</th><td mat-cell *matCellDef="let r">{{ r.motif }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="opCols"></tr>
            <tr mat-row *matRowDef="let row; columns: opCols"></tr>
          </table>
        </div>
        <form class="card-block dialog-form" [formGroup]="closeForm" (ngSubmit)="cloturer()" style="margin-top:1rem">
          <h2>Clôturer</h2>
          <mat-form-field appearance="outline"><mat-label>Solde réel</mat-label><input matInput type="number" formControlName="soldeReel"></mat-form-field>
          <p>Écart estimé : {{ money(ecart()) }}</p>
          <mat-form-field appearance="outline"><mat-label>Commentaires</mat-label><textarea matInput formControlName="commentaires"></textarea></mat-form-field>
          <button mat-flat-button color="primary" type="submit">Clôturer la caisse</button>
        </form>
      }
    </section>
  `
})
export class CaisseComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  caisse: Caisse | null = null;
  money = money;
  opCols = ['type', 'categorie', 'montant', 'motif'];
  readonly openForm = this.fb.nonNullable.group({ soldeInitial: [0], notes: [''] });
  readonly opForm = this.fb.nonNullable.group({
    typeOperation: ['RECETTE'],
    categorie: ['PAIEMENT_CLIENT'],
    montant: [0, Validators.required],
    moyenPaiement: ['ESPECES'],
    motif: ['', Validators.required]
  });
  readonly closeForm = this.fb.nonNullable.group({
    soldeReel: [0, Validators.required],
    commentaires: ['']
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<Caisse>('caisse/courante').subscribe({
      next: (caisse) => (this.caisse = caisse),
      error: () => (this.caisse = null)
    });
  }

  ouvrir(): void {
    this.api.post<Caisse>('caisse/ouvrir', this.openForm.getRawValue()).subscribe({
      next: (caisse) => {
        this.caisse = caisse;
        this.notify.success('Caisse ouverte');
      },
      error: (err) => this.notify.error(err)
    });
  }

  addOp(): void {
    if (!this.caisse || !requireValid(this.opForm, this.notify)) {
      return;
    }
    this.api.post<CaisseOperation>(`caisse/${this.caisse.id}/operations`, this.opForm.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Opération enregistrée');
        this.opForm.patchValue({ montant: 0, motif: '' });
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }

  ecart(): number {
    const theorique = this.caisse?.soldeTheorique ?? this.caisse?.soldeInitial ?? 0;
    return Number(this.closeForm.controls.soldeReel.value || 0) - Number(theorique);
  }

  cloturer(): void {
    if (!this.caisse || !requireValid(this.closeForm, this.notify)) {
      return;
    }
    this.api.post<Caisse>(`caisse/${this.caisse.id}/cloturer`, {
      ...this.closeForm.getRawValue(),
      ecart: this.ecart()
    }).subscribe({
      next: (caisse) => {
        this.caisse = caisse;
        this.notify.success(`Caisse clôturée. Écart : ${money(this.ecart())}`);
      },
      error: (err) => this.notify.error(err)
    });
  }
}
