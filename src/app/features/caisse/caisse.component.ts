import { DatePipe } from '@angular/common';
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { requireValid } from '../../core/forms';
import { Caisse, CaisseOperation, TicketSignataire } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money } from '../../core/format';
import { bindAtelierScope } from '../../core/platform-scope.service';

const CATEGORIES_DEFAUT: { value: string; label: string }[] = [
  { value: 'PAIEMENT_CLIENT', label: 'Paiement client' },
  { value: 'ACHAT', label: 'Achat' },
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'AVANCE', label: 'Avance' },
  { value: 'AUTRE', label: 'Autre' }
];

const TYPES: Record<string, string> = {
  RECETTE: 'Recette',
  DEPENSE: 'Dépense'
};

const MOYENS: Record<string, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile money',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  CARTE: 'Carte'
};

function categorieLabel(value?: string | null): string {
  const raw = (value ?? '').trim();
  if (!raw) {
    return 'Autre';
  }
  const key = raw.toLocaleLowerCase('fr');
  const known = CATEGORIES_DEFAUT.find(
    (item) => item.value.toLocaleLowerCase('fr') === key || item.label.toLocaleLowerCase('fr') === key
  );
  return known?.label ?? raw;
}

function escapeHtml(value?: string | null): string {
  return (value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] ?? char));
}

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [
    DatePipe, FormsModule, ReactiveFormsModule, RouterLink, MatTableModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>point_of_sale</mat-icon></span>
          <div>
            <h1>Caisse</h1>
            <p class="muted">Opérations, tickets et clôture du jour</p>
          </div>
        </div>
        <div class="header-actions">
          @if (canEditSignataires) {
            <a mat-stroked-button routerLink="/app/parametres">Signataires</a>
          }
          @if (!caisse || caisse.statut === 'CLOTUREE') {
            <button mat-flat-button color="primary" (click)="ouvrir()">Ouvrir la caisse</button>
          }
        </div>
      </header>
      @if (caisse && caisse.statut === 'OUVERTE') {
        <div class="kpi-grid">
          <article class="kpi-card purple"><div class="label">Solde initial</div><div class="value">{{ money(caisse.soldeInitial) }}</div></article>
          <article class="kpi-card"><div class="label">Solde théorique</div><div class="value">{{ money(caisse.soldeTheorique ?? caisse.soldeInitial) }}</div></article>
        </div>
        <form class="card-block dialog-form" [formGroup]="opForm" (ngSubmit)="addOp(true)" style="margin-bottom:1rem">
          <h2>Nouvelle opération</h2>
          <div class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Type</mat-label>
              <mat-select formControlName="typeOperation">
                <mat-option value="RECETTE">Recette</mat-option>
                <mat-option value="DEPENSE">Dépense</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Catégorie</mat-label>
              <mat-select formControlName="categorie" panelClass="spec-panel" (openedChange)="onCatPanel($event)">
                <div class="spec-search" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
                  <mat-icon>search</mat-icon>
                  <input #catSearch type="text" [(ngModel)]="catQuery" [ngModelOptions]="{standalone: true}"
                         placeholder="Rechercher ou créer" autocomplete="off">
                </div>
                @if (canCreateCategorie()) {
                  <button type="button" class="spec-create" (mousedown)="$event.preventDefault()" (click)="createCategorie()">
                    <mat-icon>add</mat-icon>
                    Créer « {{ catName() }} »
                  </button>
                }
                @for (c of filteredCategories(); track c.value) {
                  <mat-option [value]="c.value">{{ c.label }}</mat-option>
                }
                @if (!filteredCategories().length && !canCreateCategorie()) {
                  <div class="spec-empty">Aucune catégorie</div>
                }
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
          <div class="op-actions">
            <button mat-stroked-button type="button" (click)="addOp(false)">Ajouter</button>
            <button mat-flat-button color="primary" type="submit">Ajouter et imprimer</button>
          </div>
        </form>
        <div class="table-card">
          <table mat-table [dataSource]="caisse.operations ?? []">
            <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td></ng-container>
            <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">{{ typeLabel(r.typeOperation) }}</td></ng-container>
            <ng-container matColumnDef="categorie"><th mat-header-cell *matHeaderCellDef>Catégorie</th>
              <td mat-cell *matCellDef="let r">{{ catLabel(r.categorie) }}</td></ng-container>
            <ng-container matColumnDef="montant"><th mat-header-cell *matHeaderCellDef>Montant</th>
              <td mat-cell *matCellDef="let r">{{ money(r.montant) }}</td></ng-container>
            <ng-container matColumnDef="motif"><th mat-header-cell *matHeaderCellDef>Motif</th>
              <td mat-cell *matCellDef="let r">{{ r.motif }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button type="button" (click)="printTicket(r)" aria-label="Imprimer le ticket">
                  <mat-icon>receipt_long</mat-icon>
                </button>
              </td></ng-container>
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
  `,
  styles: [`
    .header-actions, .op-actions { display: flex; flex-wrap: wrap; gap: .6rem; justify-content: flex-end; }
  `]
})
export class CaisseComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  caisse: Caisse | null = null;
  money = money;
  readonly canEditSignataires = this.auth.hasAnyRole(['SUPER_ADMIN', 'ADMIN', 'GERANT']);
  signataires: TicketSignataire[] = [];
  opCols = ['date', 'type', 'categorie', 'montant', 'motif', 'actions'];
  categories = [...CATEGORIES_DEFAUT];
  catQuery = '';
  private readonly catSearch = viewChild<ElementRef<HTMLInputElement>>('catSearch');
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
    bindAtelierScope(() => {
      this.load();
      this.loadCategories();
      this.loadSignataires();
    });
  }

  typeLabel(value?: string | null): string {
    return TYPES[value ?? ''] ?? value ?? '';
  }

  catLabel(value?: string | null): string {
    return categorieLabel(value);
  }

  catName(): string {
    return this.catQuery.trim().replace(/\s+/g, ' ');
  }

  filteredCategories(): { value: string; label: string }[] {
    const q = this.catName().toLocaleLowerCase('fr');
    if (!q) {
      return this.categories;
    }
    return this.categories.filter((item) =>
      item.label.toLocaleLowerCase('fr').includes(q) || item.value.toLocaleLowerCase('fr').includes(q)
    );
  }

  canCreateCategorie(): boolean {
    const name = this.catName();
    if (name.length < 2 || name.length > 80) {
      return false;
    }
    const key = name.toLocaleLowerCase('fr');
    return !this.categories.some(
      (item) => item.label.toLocaleLowerCase('fr') === key || item.value.toLocaleLowerCase('fr') === key
    );
  }

  onCatPanel(open: boolean): void {
    if (!open) {
      return;
    }
    this.catQuery = '';
    queueMicrotask(() => this.catSearch()?.nativeElement.focus());
  }

  createCategorie(): void {
    const name = this.catName();
    if (!this.canCreateCategorie()) {
      return;
    }
    this.ensureCategorie(name);
    this.opForm.controls.categorie.setValue(name);
    this.catQuery = '';
    this.notify.success(`Catégorie « ${name} » ajoutée`);
  }

  load(): void {
    this.api.get<Caisse>('caisse/courante').subscribe({
      next: (caisse) => {
        this.caisse = caisse;
        for (const op of caisse?.operations ?? []) {
          this.ensureCategorie(op.categorie);
        }
      },
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

  addOp(print: boolean): void {
    if (!this.caisse || !requireValid(this.opForm, this.notify)) {
      return;
    }
    this.api.post<CaisseOperation>(`caisse/${this.caisse.id}/operations`, this.opForm.getRawValue()).subscribe({
      next: (op) => {
        this.notify.success('Opération enregistrée');
        this.opForm.patchValue({ montant: 0, motif: '' });
        this.ensureCategorie(op.categorie);
        if (print) {
          this.printTicket(op);
        }
        this.load();
      },
      error: (err) => this.notify.error(err)
    });
  }

  printTicket(op: CaisseOperation): void {
    const html = this.ticketHtml(op);
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) {
      frame.remove();
      this.notify.error('Impression indisponible sur cet appareil');
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    const cleanup = (): void => frame.remove();
    win.addEventListener('afterprint', cleanup);
    window.setTimeout(() => {
      win.focus();
      win.print();
      window.setTimeout(cleanup, 1500);
    }, 120);
  }

  private ticketHtml(op: CaisseOperation): string {
    const atelier = this.auth.user?.atelierNom || 'CouturiX';
    const caissier = this.auth.displayName();
    const numero = op.id ? `OP-${String(op.id).padStart(5, '0')}` : 'OP-——';
    const when = op.createdAt
      ? new Date(op.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const type = this.typeLabel(op.typeOperation);
    const signe = op.typeOperation === 'DEPENSE' ? '−' : '+';
    return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Ticket ${escapeHtml(numero)}</title>
<style>
  @page { size: 80mm auto; margin: 6mm; }
  body { margin: 0; font-family: "Segoe UI", ui-sans-serif, sans-serif; color: #2e1052; background: #fff; }
  .ticket { width: 72mm; margin: 0 auto; padding: 4mm 0; }
  h1 { margin: 0; font-size: 15px; letter-spacing: .04em; text-transform: uppercase; }
  .muted { color: #6b5d76; font-size: 11px; }
  .brand { text-align: center; padding-bottom: 8px; border-bottom: 1px dashed #c9b6d6; }
  .sigle { display: inline-block; margin-bottom: 6px; padding: 4px 8px; border-radius: 8px; background: #2e1052; color: #f1c453; font-size: 10px; font-weight: 700; }
  .rows { margin: 10px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 3px 0; font-size: 12px; }
  .row span:last-child { font-weight: 600; text-align: right; }
  .amount { margin: 8px 0; padding: 8px 0; border-top: 1px dashed #c9b6d6; border-bottom: 1px dashed #c9b6d6; text-align: center; }
  .amount strong { display: block; font-size: 20px; color: #e21b70; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 8px; margin-top: 14px; }
  .sign { text-align: center; }
  .sign .role { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
  .sign .name { min-height: 14px; font-size: 11px; margin-top: 2px; }
  .sign .line { margin-top: 22px; border-top: 1px solid #2e1052; }
  .foot { text-align: center; margin-top: 10px; font-size: 11px; }
</style></head>
<body><div class="ticket">
  <div class="brand">
    <div class="sigle">CouturiX</div>
    <h1>${escapeHtml(atelier)}</h1>
    <p class="muted">Ticket d’opération ${escapeHtml(numero)}</p>
  </div>
  <div class="rows">
    <div class="row"><span>Date</span><span>${escapeHtml(when)}</span></div>
    <div class="row"><span>Type</span><span>${escapeHtml(type)}</span></div>
    <div class="row"><span>Catégorie</span><span>${escapeHtml(categorieLabel(op.categorie))}</span></div>
    <div class="row"><span>Moyen</span><span>${escapeHtml(MOYENS[op.moyenPaiement] ?? op.moyenPaiement)}</span></div>
    <div class="row"><span>Caissier</span><span>${escapeHtml(caissier)}</span></div>
  </div>
  <div class="amount">
    <span class="muted">Montant</span>
    <strong>${escapeHtml(signe + ' ' + money(op.montant))}</strong>
  </div>
  <p class="muted">Motif : ${escapeHtml(op.motif)}</p>
  ${op.referenceMetier ? `<p class="muted">Réf. ${escapeHtml(op.referenceMetier)}</p>` : ''}
  ${this.signsHtml()}
  <p class="foot">Merci · ${escapeHtml(atelier)}</p>
</div></body></html>`;
  }

  private signsHtml(): string {
    const rows = this.signataires.filter((item) => item.actif !== false);
    if (!rows.length) {
      return '';
    }
    const blocks = rows.map((item) => {
      const nom = this.signataireNom(item);
      return `<div class="sign"><div class="role">${escapeHtml(item.libelle)}</div><div class="name">${escapeHtml(nom)}</div><div class="line"></div></div>`;
    }).join('');
    return `<div class="signs">${blocks}</div>`;
  }

  private signataireNom(item: TicketSignataire): string {
    const nom = (item.nom ?? '').trim();
    if (nom) {
      return nom;
    }
    if (/caissier/i.test(item.libelle ?? '')) {
      return this.auth.displayName();
    }
    return '';
  }

  private loadSignataires(): void {
    this.api.get<TicketSignataire[]>('ticket-signataires').subscribe({
      next: (rows) => (this.signataires = rows ?? []),
      error: () => (this.signataires = [])
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

  private loadCategories(): void {
    this.api.get<string[]>('caisse/categories-operation').subscribe({
      next: (rows) => {
        for (const value of rows ?? []) {
          this.ensureCategorie(value);
        }
      }
    });
  }

  private ensureCategorie(raw?: string | null): void {
    const value = (raw ?? '').trim();
    if (!value) {
      return;
    }
    const key = value.toLocaleLowerCase('fr');
    if (this.categories.some((item) => item.value.toLocaleLowerCase('fr') === key || item.label.toLocaleLowerCase('fr') === key)) {
      return;
    }
    this.categories = [...this.categories, { value, label: value }];
  }
}
