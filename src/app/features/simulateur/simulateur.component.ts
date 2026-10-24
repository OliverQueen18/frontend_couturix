import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { Client, Composition, Modele, PageResponse, ProfitResult, Simulation } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money } from '../../core/format';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { matchesSearch } from '../../core/search';

@Component({
  selector: 'app-simulateur',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DecimalPipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>calculate</mat-icon></span>
          <div>
            <h1>Simulateur de coûts</h1>
            <p class="muted">Prix de revient, marge et transformation en devis</p>
          </div>
        </div>
      </header>
      <form class="card-block" [formGroup]="form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Recherche modèle</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="q" [ngModelOptions]="{standalone: true}" placeholder="Filtrer les modèles">
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Modèle</mat-label>
            <mat-select formControlName="modeleId" (selectionChange)="onModele()">
              @for (m of filteredModeles(); track m.id) { <mat-option [value]="m.id">{{ m.nom }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Composition</mat-label>
            <mat-select formControlName="compositionId" (selectionChange)="onComposition()">
              @for (c of compositions; track c.id) { <mat-option [value]="c.id">v{{ c.version }} {{ c.libelle }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Libellé</mat-label><input matInput formControlName="libelle"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Quantité</mat-label><input matInput type="number" formControlName="quantite"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Prix de vente</mat-label><input matInput type="number" formControlName="prixVente"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Remise</mat-label><input matInput type="number" formControlName="remise"></mat-form-field>
        </div>
        <h3>Lignes</h3>
        <div formArrayName="lignes">
          @for (ligne of lignes.controls; track $index; let i = $index) {
            <div class="form-grid" [formGroupName]="i">
              <mat-form-field appearance="outline"><mat-label>Type</mat-label>
                <mat-select formControlName="typeLigne">
                  <mat-option value="MATIERE">Matière</mat-option>
                  <mat-option value="CONSOMMABLE">Consommable</mat-option>
                  <mat-option value="ACCESSOIRE">Accessoire</mat-option>
                  <mat-option value="MAIN_OEUVRE">Main d'œuvre</mat-option>
                  <mat-option value="EMBALLAGE">Emballage</mat-option>
                  <mat-option value="FRAIS_INDIRECTS">Frais indirects</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Désignation</mat-label><input matInput formControlName="designation"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Quantité</mat-label><input matInput type="number" formControlName="quantite"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Coût unitaire</mat-label><input matInput type="number" formControlName="coutUnitaire"></mat-form-field>
              <button mat-button type="button" (click)="removeLine(i)">Retirer</button>
            </div>
          }
        </div>
        <button mat-stroked-button type="button" (click)="addLine()">Ajouter une ligne</button>
      </form>
      @if (result) {
        <div class="kpi-grid" style="margin-top:1rem">
          <article class="kpi-card"><div class="label">Coût total</div><div class="value">{{ money(result.costs.coutTotal) }}</div></article>
          <article class="kpi-card gold"><div class="label">Prix de revient</div><div class="value">{{ money(result.costs.prixRevient) }}</div></article>
          <article class="kpi-card"><div class="label">Montant net</div><div class="value">{{ money(result.montantNet) }}</div></article>
          <article class="kpi-card purple"><div class="label">Bénéfice</div><div class="value">{{ money(result.benefice) }}</div></article>
          <article class="kpi-card"><div class="label">Marge</div><div class="value">{{ result.marge * 100 | number:'1.1-1' }} %</div></article>
        </div>
      }
      <div class="toolbar-actions" style="margin-top:1rem">
        <mat-form-field appearance="outline"><mat-label>Client pour devis</mat-label>
          <mat-select [(ngModel)]="clientId">
            @for (c of clients; track c.id) { <mat-option [value]="c.id">{{ c.prenom }} {{ c.nom }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button (click)="save()">Enregistrer la simulation</button>
        <button mat-flat-button color="primary" (click)="toDevis()">Transformer en devis</button>
      </div>
    </section>
  `
})
export class SimulateurComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  q = '';
  modeles: Modele[] = [];
  compositions: Composition[] = [];
  clients: Client[] = [];
  clientId: number | null = null;
  savedId: number | null = null;
  result: ProfitResult | null = null;
  money = money;
  readonly form = this.fb.group({
    modeleId: [null as number | null],
    compositionId: [null as number | null],
    libelle: ['Simulation'],
    quantite: [1, Validators.required],
    prixVente: [0, Validators.required],
    remise: [0],
    lignes: this.fb.array([this.lineGroup()])
  });

  get lignes(): FormArray {
    return this.form.controls.lignes;
  }

  constructor() {
    bindAtelierScope(() => {
      this.api.get<PageResponse<Modele>>('modeles', { size: 200 }).subscribe({ next: (p) => (this.modeles = p.content ?? []) });
      this.api.get<PageResponse<Client>>('clients', { size: 200 }).subscribe({ next: (p) => (this.clients = p.content ?? []) });
    });
    this.form.valueChanges.pipe(debounceTime(250)).subscribe(() => this.calculer());
  }

  filteredModeles(): Modele[] {
    return this.modeles.filter((modele) => matchesSearch(this.q, modele.nom, modele.categorieNom));
  }

  lineGroup(line?: { typeLigne?: string; designation?: string; quantite?: number; coutUnitaire?: number }) {
    return this.fb.group({
      typeLigne: [line?.typeLigne ?? 'MATIERE'],
      designation: [line?.designation ?? ''],
      quantite: [line?.quantite ?? 1],
      coutUnitaire: [line?.coutUnitaire ?? 0]
    });
  }

  addLine(): void {
    this.lignes.push(this.lineGroup());
  }

  removeLine(i: number): void {
    this.lignes.removeAt(i);
  }

  onModele(): void {
    const id = this.form.controls.modeleId.value;
    if (!id) {
      return;
    }
    this.api.get<PageResponse<Composition> | Composition[]>(`compositions/modele/${id}`).subscribe({
      next: (res) => (this.compositions = Array.isArray(res) ? res : res.content ?? [])
    });
  }

  onComposition(): void {
    const id = this.form.controls.compositionId.value;
    if (!id) {
      return;
    }
    this.api.get<Composition>(`compositions/${id}`).subscribe({
      next: (comp) => {
        this.lignes.clear();
        (comp.lignes ?? []).forEach((l) => this.lignes.push(this.lineGroup(l)));
        this.calculer();
      }
    });
  }

  calculer(): void {
    this.api.post<ProfitResult>('simulateur/calculer', this.payload()).subscribe({
      next: (result) => (this.result = result),
      error: () => (this.result = null)
    });
  }

  save(): void {
    this.api.post<Simulation>('simulateur/sauvegarder', this.payload()).subscribe({
      next: (sim) => {
        this.savedId = sim.id ?? null;
        this.notify.success('Simulation enregistrée');
      },
      error: (err) => this.notify.error(err)
    });
  }

  toDevis(): void {
    if (!this.clientId) {
      this.notify.error('Choisissez un client');
      return;
    }
    const go = (id: number) =>
      this.api.post(`simulateur/${id}/devis`, { clientId: this.clientId }).subscribe({
        next: () => this.notify.success('Devis créé à partir de la simulation'),
        error: (err) => this.notify.error(err)
      });
    if (this.savedId) {
      go(this.savedId);
      return;
    }
    this.api.post<Simulation>('simulateur/sauvegarder', this.payload()).subscribe({
      next: (sim) => {
        this.savedId = sim.id ?? null;
        if (sim.id) {
          go(sim.id);
        }
      },
      error: (err) => this.notify.error(err)
    });
  }

  private payload() {
    const value = this.form.getRawValue();
    return {
      modeleId: value.modeleId,
      compositionId: value.compositionId,
      libelle: value.libelle,
      quantite: value.quantite,
      prixVente: value.prixVente,
      remise: value.remise,
      lignes: value.lignes.map((l) => ({
        type: l.typeLigne,
        quantite: l.quantite,
        coutUnitaire: l.coutUnitaire
      }))
    };
  }
}
