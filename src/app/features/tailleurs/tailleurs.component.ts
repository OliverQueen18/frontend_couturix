import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { PageResponse, Specialite, Tailleur } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { PhoneFieldComponent } from '../../shared/phone-field.component';

@Component({
  selector: 'app-tailleur-form-dialog',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatIconModule, PhoneFieldComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>content_cut</mat-icon></span>
      {{ data.tailleur ? 'Modifier le tailleur' : 'Nouveau tailleur' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>badge</mat-icon><span>Identité</span></div>
          <mat-form-field appearance="outline"><mat-label>Nom</mat-label><mat-icon matPrefix>badge</mat-icon><input matInput formControlName="nom"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Prénom</mat-label><mat-icon matPrefix>face</mat-icon><input matInput formControlName="prenom"></mat-form-field>
          <app-phone-field class="full" formControlName="telephone" label="Téléphone" />
          <mat-form-field appearance="outline" class="full"><mat-label>E-mail</mat-label><mat-icon matPrefix>mail_outline</mat-icon><input matInput formControlName="email"></mat-form-field>
          <div class="form-section"><mat-icon>account_balance_wallet</mat-icon><span>Rémunération</span></div>
          <mat-form-field appearance="outline"><mat-label>Rémunération</mat-label>
            <mat-icon matPrefix>payments</mat-icon>
            <mat-select formControlName="modeRemuneration">
              <mat-option value="FIXE">Fixe</mat-option>
              <mat-option value="PIECE">À la pièce</mat-option>
              <mat-option value="POURCENTAGE">Pourcentage</mat-option>
              <mat-option value="MIXTE">Mixte</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Salaire fixe</mat-label><mat-icon matPrefix>attach_money</mat-icon><input matInput type="number" formControlName="salaireFixe"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Taux pièce</mat-label><mat-icon matPrefix>sell</mat-icon><input matInput type="number" formControlName="tauxPiece"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Pourcentage</mat-label><mat-icon matPrefix>percent</mat-icon><input matInput type="number" formControlName="pourcentage"></mat-form-field>
          <mat-form-field appearance="outline" class="full"><mat-label>Spécialités</mat-label>
            <mat-icon matPrefix>auto_awesome</mat-icon>
            <mat-select formControlName="specialiteIds" multiple panelClass="spec-panel"
                        (openedChange)="onSpecPanel($event)">
              <div class="spec-search" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
                <mat-icon>search</mat-icon>
                <input #specSearch type="text" [(ngModel)]="specQuery" [ngModelOptions]="{standalone: true}"
                       placeholder="Rechercher ou créer" autocomplete="off">
              </div>
              @if (canCreateSpec()) {
                <button type="button" class="spec-create" [disabled]="creatingSpec"
                        (mousedown)="$event.preventDefault()" (click)="createSpec()">
                  <mat-icon>add</mat-icon>
                  Créer « {{ specName() }} »
                </button>
              }
              @for (s of filteredSpecs(); track s.id) {
                <mat-option [value]="s.id">{{ s.libelle }}</mat-option>
              }
              @if (!filteredSpecs().length && !canCreateSpec()) {
                <div class="spec-empty">Aucune spécialité</div>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <mat-slide-toggle formControlName="actif">Actif</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class TailleurFormDialogComponent {
  readonly data = inject<{ tailleur: Tailleur | null; specialites: Specialite[] }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TailleurFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    nom: [this.data.tailleur?.nom ?? '', Validators.required],
    prenom: [this.data.tailleur?.prenom ?? '', Validators.required],
    telephone: [this.data.tailleur?.telephone ?? ''],
    email: [this.data.tailleur?.email ?? ''],
    modeRemuneration: [this.data.tailleur?.modeRemuneration ?? 'FIXE'],
    salaireFixe: [this.data.tailleur?.salaireFixe ?? 0],
    tauxPiece: [this.data.tailleur?.tauxPiece ?? 0],
    pourcentage: [this.data.tailleur?.pourcentage ?? 0],
    specialiteIds: [this.data.tailleur?.specialiteIds ?? []],
    actif: [this.data.tailleur?.actif ?? true]
  });
  specialites: Specialite[] = [...(this.data.specialites ?? [])];
  specQuery = '';
  creatingSpec = false;
  private readonly specSearch = viewChild<ElementRef<HTMLInputElement>>('specSearch');

  specName(): string {
    return this.specQuery.trim().replace(/\s+/g, ' ');
  }

  filteredSpecs(): Specialite[] {
    const q = this.specName().toLocaleLowerCase('fr');
    if (!q) {
      return this.specialites;
    }
    return this.specialites.filter((item) => (item.libelle ?? '').toLocaleLowerCase('fr').includes(q));
  }

  canCreateSpec(): boolean {
    const name = this.specName();
    if (name.length < 2) {
      return false;
    }
    return !this.specialites.some((item) => (item.libelle ?? '').toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr'));
  }

  onSpecPanel(open: boolean): void {
    if (!open) {
      return;
    }
    this.specQuery = '';
    queueMicrotask(() => this.specSearch()?.nativeElement.focus());
  }

  createSpec(): void {
    const libelle = this.specName();
    if (!this.canCreateSpec()) {
      return;
    }
    this.creatingSpec = true;
    this.api.post<Specialite>('specialites', { libelle }).subscribe({
      next: (created) => {
        this.creatingSpec = false;
        this.specialites = this.sortSpecialites([
          ...this.specialites.filter((item) => item.id !== created.id),
          created
        ]);
        const selected = new Set(this.form.controls.specialiteIds.value ?? []);
        selected.add(created.id);
        this.form.controls.specialiteIds.setValue([...selected]);
        this.specQuery = '';
        this.notify.success(`Spécialité « ${created.libelle} » créée`);
      },
      error: (err) => {
        this.creatingSpec = false;
        this.notify.error(err);
      }
    });
  }

  private sortSpecialites(rows: Specialite[]): Specialite[] {
    return [...(rows ?? [])].sort((a, b) => (a.libelle ?? '').localeCompare(b.libelle ?? '', 'fr'));
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.data.tailleur?.id
      ? this.api.put(`tailleurs/${this.data.tailleur.id}`, body)
      : this.api.post('tailleurs', body);
    req.subscribe({
      next: () => {
        this.notify.success('Tailleur enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-tailleurs',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>content_cut</mat-icon></span>
          <div>
            <h1>Tailleurs</h1>
            <p class="muted">Équipe de confection de la maison</p>
          </div>
        </div>
        <button mat-flat-button color="primary" (click)="edit()">Nouveau</button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><mat-icon matPrefix>search</mat-icon><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
        <button mat-stroked-button (click)="load()">Rechercher</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.prenom }} {{ r.nom }}</td></ng-container>
          <ng-container matColumnDef="mode"><th mat-header-cell *matHeaderCellDef>Rémunération</th><td mat-cell *matCellDef="let r">{{ r.modeRemuneration }}</td></ng-container>
          <ng-container matColumnDef="specialites"><th mat-header-cell *matHeaderCellDef>Spécialités</th><td mat-cell *matCellDef="let r">{{ (r.specialites || []).join(', ') }}</td></ng-container>
          <ng-container matColumnDef="actif"><th mat-header-cell *matHeaderCellDef>Actif</th><td mat-cell *matCellDef="let r">{{ r.actif ? 'Oui' : 'Non' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r"><button mat-button (click)="edit(r)">Modifier</button></td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
      </div>
    </section>
  `
})
export class TailleursComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Tailleur[] = [];
  specialites: Specialite[] = [];
  cols = ['nom', 'mode', 'specialites', 'actif', 'actions'];

  constructor() {
    this.loadSpecialites();
    bindAtelierScope(() => this.load());
  }

  private loadSpecialites(): void {
    this.api.get<Specialite[]>('specialites').subscribe({
      next: (rows) => (this.specialites = this.sortSpecialites(rows)),
      error: () =>
        this.api.get<PageResponse<Specialite>>('specialites', { size: 200 }).subscribe({
          next: (page) => (this.specialites = this.sortSpecialites(page.content ?? []))
        })
    });
  }

  private sortSpecialites(rows: Specialite[]): Specialite[] {
    return [...(rows ?? [])].sort((a, b) => (a.libelle ?? '').localeCompare(b.libelle ?? '', 'fr'));
  }

  load(): void {
    this.api.get<Tailleur[] | PageResponse<Tailleur>>('tailleurs', { q: this.q, page: this.page, size: this.size }).subscribe({
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

  edit(row?: Tailleur): void {
    this.dialog.open(TailleurFormDialogComponent, {
      width: '760px',
      data: { tailleur: row ?? null, specialites: this.specialites }
    }).afterClosed().subscribe((ok) => {
      this.loadSpecialites();
      if (ok) {
        this.load();
      }
    });
  }
}
