import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { Composition, CostBreakdown, Modele, PageResponse } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money } from '../../core/format';

@Component({
  selector: 'app-compositions',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Compositions</h1></header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Modèle</mat-label>
          <mat-select [(ngModel)]="modeleId" (selectionChange)="loadList()">
            @for (m of modeles; track m.id) { <mat-option [value]="m.id">{{ m.nom }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button (click)="nouvelle()">Nouvelle version</button>
      </div>
      <div class="table-card" style="margin-bottom:1rem">
        <table mat-table [dataSource]="versions">
          <ng-container matColumnDef="version"><th mat-header-cell *matHeaderCellDef>Version</th><td mat-cell *matCellDef="let r">v{{ r.version }}</td></ng-container>
          <ng-container matColumnDef="libelle"><th mat-header-cell *matHeaderCellDef>Libellé</th><td mat-cell *matCellDef="let r">{{ r.libelle }}</td></ng-container>
          <ng-container matColumnDef="active"><th mat-header-cell *matHeaderCellDef>Active</th><td mat-cell *matCellDef="let r">{{ r.active ? 'Oui' : 'Non' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r"><button mat-button (click)="edit(r)">Ouvrir</button></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['version','libelle','active','actions']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['version','libelle','active','actions']"></tr>
        </table>
      </div>
      @if (current) {
        <form class="card-block" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ current.id ? 'Version ' + current.version : 'Nouvelle composition' }}</h2>
          <mat-form-field appearance="outline"><mat-label>Libellé</mat-label><input matInput formControlName="libelle"></mat-form-field>
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
          <button mat-flat-button color="primary" type="submit">Enregistrer</button>
        </form>
        @if (cout) {
          <div class="kpi-grid" style="margin-top:1rem">
            <article class="kpi-card"><div class="label">Matière</div><div class="value">{{ money(cout.coutMatiere) }}</div></article>
            <article class="kpi-card gold"><div class="label">Main d'œuvre</div><div class="value">{{ money(cout.coutMainOeuvre) }}</div></article>
            <article class="kpi-card purple"><div class="label">Total</div><div class="value">{{ money(cout.coutTotal) }}</div></article>
            <article class="kpi-card"><div class="label">Prix de revient</div><div class="value">{{ money(cout.prixRevient) }}</div></article>
          </div>
        }
      }
    </section>
  `
})
export class CompositionsComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  modeleId: number | null = null;
  modeles: Modele[] = [];
  versions: Composition[] = [];
  current: Composition | null = null;
  cout: CostBreakdown | null = null;
  money = money;
  readonly form = this.fb.group({
    libelle: [''],
    lignes: this.fb.array([this.lineGroup()])
  });

  get lignes(): FormArray {
    return this.form.controls.lignes;
  }

  constructor() {
    this.api.get<PageResponse<Modele>>('modeles', { size: 200 }).subscribe({ next: (p) => (this.modeles = p.content ?? []) });
  }

  lineGroup(line?: { typeLigne?: string; designation?: string; quantite?: number; coutUnitaire?: number }) {
    return this.fb.group({
      typeLigne: [line?.typeLigne ?? 'MATIERE', Validators.required],
      designation: [line?.designation ?? '', Validators.required],
      quantite: [line?.quantite ?? 1, Validators.required],
      coutUnitaire: [line?.coutUnitaire ?? 0, Validators.required]
    });
  }

  loadList(): void {
    if (!this.modeleId) {
      return;
    }
    this.api.get<Composition[] | PageResponse<Composition>>(`compositions/modele/${this.modeleId}`).subscribe({
      next: (res) => {
        this.versions = Array.isArray(res) ? res : res.content ?? [];
      },
      error: (err) => this.notify.error(err)
    });
  }

  nouvelle(): void {
    this.current = { id: 0, modeleId: this.modeleId ?? 0, version: 0, active: true, lignes: [] };
    this.form.reset({ libelle: '' });
    this.lignes.clear();
    this.addLine();
    this.cout = null;
  }

  edit(row: Composition): void {
    this.api.get<Composition>(`compositions/${row.id}`).subscribe({
      next: (comp) => {
        this.current = comp;
        this.form.patchValue({ libelle: comp.libelle ?? '' });
        this.lignes.clear();
        (comp.lignes ?? []).forEach((l) => this.lignes.push(this.lineGroup(l)));
        this.cout = comp.cout ?? null;
        if (!this.cout) {
          this.api.get<CostBreakdown>(`compositions/${comp.id}/cout`).subscribe({ next: (c) => (this.cout = c) });
        }
      },
      error: (err) => this.notify.error(err)
    });
  }

  addLine(): void {
    this.lignes.push(this.lineGroup());
  }

  removeLine(index: number): void {
    this.lignes.removeAt(index);
  }

  save(): void {
    if (!this.modeleId || this.form.invalid) {
      return;
    }
    const body = { modeleId: this.modeleId, ...this.form.getRawValue() };
    const req = this.current?.id
      ? this.api.put<Composition>(`compositions/${this.current.id}`, body)
      : this.api.post<Composition>('compositions', body);
    req.subscribe({
      next: (comp) => {
        this.notify.success('Composition enregistrée');
        this.current = comp;
        this.cout = comp.cout ?? this.cout;
        this.loadList();
      },
      error: (err) => this.notify.error(err)
    });
  }
}
