import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { PageResponse, Paie, STATUT_LABELS, Tailleur } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-paie',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Paie des tailleurs</h1></header>
      <form class="card-block dialog-form" [formGroup]="form" (ngSubmit)="calculer()" style="margin-bottom:1rem">
        <h2>Calculer une paie</h2>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Tailleur</mat-label>
            <mat-select formControlName="tailleurId">
              @for (t of tailleurs; track t.id) { <mat-option [value]="t.id">{{ t.prenom }} {{ t.nom }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Début</mat-label><input matInput type="date" formControlName="periodeDebut"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Fin</mat-label><input matInput type="date" formControlName="periodeFin"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Primes</mat-label><input matInput type="number" formControlName="primes"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Retenues</mat-label><input matInput type="number" formControlName="retenues"></mat-form-field>
        </div>
        <button mat-flat-button color="primary" type="submit">Calculer</button>
      </form>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="tailleur"><th mat-header-cell *matHeaderCellDef>Tailleur</th><td mat-cell *matCellDef="let r">{{ r.tailleurNom }}</td></ng-container>
          <ng-container matColumnDef="periode"><th mat-header-cell *matHeaderCellDef>Période</th><td mat-cell *matCellDef="let r">{{ r.periodeDebut | date:'dd/MM/yyyy' }} - {{ r.periodeFin | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="brut"><th mat-header-cell *matHeaderCellDef>Brut</th><td mat-cell *matCellDef="let r">{{ r.montantBrut | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="net"><th mat-header-cell *matHeaderCellDef>Net</th><td mat-cell *matCellDef="let r">{{ r.montantNet | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let r">{{ labels[r.statut] || r.statut }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button (click)="valider(r)" [disabled]="r.statut!=='BROUILLON'">Valider</button>
              <button mat-button (click)="payer(r)" [disabled]="r.statut!=='VALIDEE'">Payer</button>
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
export class PaieComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  tailleurs: Tailleur[] = [];
  rows: Paie[] = [];
  page = 0;
  size = 20;
  total = 0;
  cols = ['tailleur', 'periode', 'brut', 'net', 'statut', 'actions'];
  labels = STATUT_LABELS;
  readonly form = this.fb.group({
    tailleurId: [null as number | null, Validators.required],
    periodeDebut: ['', Validators.required],
    periodeFin: ['', Validators.required],
    primes: [0],
    retenues: [0]
  });

  constructor() {
    this.api.get<Tailleur[] | PageResponse<Tailleur>>('tailleurs', { size: 200 }).subscribe({
      next: (p) => (this.tailleurs = Array.isArray(p) ? p : p.content ?? [])
    });
    this.load();
  }

  load(): void {
    this.api.get<Paie[] | PageResponse<Paie>>('paies', { page: this.page, size: this.size }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, this.page, this.size);
        this.rows = page.content ?? [];
        this.total = page.totalElements ?? 0;
      },
      error: (err) => this.notify.error(err)
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  calculer(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    this.api.post<Paie>('paies/calculer', this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Paie calculée');
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }

  valider(row: Paie): void {
    this.api.post<Paie>(`paies/${row.id}/valider`).subscribe({
      next: () => { this.notify.success('Paie validée'); this.load(); },
      error: (err) => this.notify.error(err)
    });
  }

  payer(row: Paie): void {
    this.api.post<Paie>(`paies/${row.id}/payer`).subscribe({
      next: () => { this.notify.success('Paie payée'); this.load(); },
      error: (err) => this.notify.error(err)
    });
  }
}
