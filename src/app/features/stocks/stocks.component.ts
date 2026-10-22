import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { ArticleStock, InventaireResultat, MouvementStock, PageResponse } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money } from '../../core/format';

const TYPE_MOUVEMENT: Record<string, string> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  AJUSTEMENT: 'Ajustement',
  RETOUR: 'Retour',
  CONSOMMATION_PRODUCTION: 'Consommation production'
};

interface InventaireLigne {
  articleId: number;
  nom: string;
  sku: string;
  unite: string;
  stockTheorique: number;
  quantiteReelle: number;
}

@Component({
  selector: 'app-article-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>inventory_2</mat-icon></span>
      {{ data ? "Modifier l'article" : "Nouvel article" }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>inventory</mat-icon><span>Article</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <mat-icon matPrefix>label</mat-icon>
            <input matInput formControlName="nom">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>SKU</mat-label>
            <mat-icon matPrefix>qr_code_2</mat-icon>
            <input matInput formControlName="sku">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Unité</mat-label>
            <mat-icon matPrefix>straighten</mat-icon>
            <mat-select formControlName="unite">
              <mat-option value="METRE">Mètre</mat-option>
              <mat-option value="UNITE">Unité</mat-option>
              <mat-option value="BOBINE">Bobine</mat-option>
              <mat-option value="KG">Kg</mat-option>
              <mat-option value="PAQUET">Paquet</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Stock minimum</mat-label>
            <mat-icon matPrefix>warning</mat-icon>
            <input matInput type="number" formControlName="stockMinimum">
          </mat-form-field>
          <div class="form-section"><mat-icon>payments</mat-icon><span>Tarifs</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Prix d'achat</mat-label>
            <mat-icon matPrefix>shopping_cart</mat-icon>
            <input matInput type="number" formControlName="prixAchat">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prix de vente</mat-label>
            <mat-icon matPrefix>sell</mat-icon>
            <input matInput type="number" formControlName="prixVente">
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `
})
export class ArticleFormDialogComponent {
  readonly data = inject<ArticleStock | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ArticleFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    nom: [this.data?.nom ?? '', Validators.required],
    sku: [this.data?.sku ?? '', Validators.required],
    unite: [this.data?.unite ?? 'UNITE'],
    stockMinimum: [this.data?.stockMinimum ?? 0],
    prixAchat: [this.data?.prixAchat ?? 0],
    prixVente: [this.data?.prixVente ?? null]
  });

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.data?.id ? this.api.put(`articles-stock/${this.data.id}`, body) : this.api.post('articles-stock', body);
    req.subscribe({
      next: () => {
        this.notify.success('Article enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-mouvement-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>swap_vert</mat-icon></span>
      Mouvement de stock
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Article</mat-label>
            <mat-icon matPrefix>inventory_2</mat-icon>
            <mat-select formControlName="articleId">
              @for (a of articles; track a.id) { <mat-option [value]="a.id">{{ a.nom }} ({{ a.sku }})</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-icon matPrefix>swap_horiz</mat-icon>
            <mat-select formControlName="typeMouvement">
              <mat-option value="ENTREE">Entrée</mat-option>
              <mat-option value="SORTIE">Sortie</mat-option>
              <mat-option value="AJUSTEMENT">Ajustement</mat-option>
              <mat-option value="RETOUR">Retour</mat-option>
              <mat-option value="CONSOMMATION_PRODUCTION">Consommation production</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Quantité</mat-label>
            <mat-icon matPrefix>numbers</mat-icon>
            <input matInput type="number" formControlName="quantite">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Motif</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <input matInput formControlName="motif">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Référence</mat-label>
            <mat-icon matPrefix>tag</mat-icon>
            <input matInput formControlName="referenceMetier">
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button color="primary" type="submit">Valider</button>
      </mat-dialog-actions>
    </form>
  `
})
export class MouvementFormDialogComponent {
  readonly articles = inject<ArticleStock[]>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MouvementFormDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    articleId: [null as number | null, Validators.required],
    typeMouvement: ['ENTREE', Validators.required],
    quantite: [1, Validators.required],
    motif: [''],
    referenceMetier: ['']
  });

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const value = this.form.getRawValue();
    this.api.post('stocks/mouvements', {
      articleId: value.articleId,
      type: value.typeMouvement,
      quantite: value.quantite,
      motif: value.motif,
      referenceMetier: value.referenceMetier
    }).subscribe({
      next: () => {
        this.notify.success('Mouvement enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>inventory_2</mat-icon></span>
          <div>
            <h1>Stocks</h1>
            <p class="muted">Articles, inventaire et journal</p>
          </div>
        </div>
        <div class="toolbar-actions">
          <button mat-stroked-button (click)="mouvement()">
            <mat-icon>swap_vert</mat-icon>
            Mouvement
          </button>
          <button mat-flat-button color="primary" (click)="edit()">
            <mat-icon>add</mat-icon>
            Nouvel article
          </button>
        </div>
      </header>
      <mat-tab-group>
        <mat-tab label="Articles">
          <div class="filters" style="margin-top:1rem">
            <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><input matInput [(ngModel)]="q" (keyup.enter)="load()"></mat-form-field>
            <button mat-stroked-button (click)="load()">Rechercher</button>
          </div>
          <div class="table-card">
            <table mat-table [dataSource]="rows">
              <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Article</th><td mat-cell *matCellDef="let r">{{ r.nom }}</td></ng-container>
              <ng-container matColumnDef="sku"><th mat-header-cell *matHeaderCellDef>SKU</th><td mat-cell *matCellDef="let r">{{ r.sku }}</td></ng-container>
              <ng-container matColumnDef="stock"><th mat-header-cell *matHeaderCellDef>Stock</th>
                <td mat-cell *matCellDef="let r">
                  {{ r.stockActuel | number:'1.0-2' }} {{ r.unite }}
                  @if (r.stockActuel <= r.stockMinimum) { <span class="badge badge-danger">Alerte</span> }
                </td>
              </ng-container>
              <ng-container matColumnDef="prix"><th mat-header-cell *matHeaderCellDef>Achat</th><td mat-cell *matCellDef="let r">{{ r.prixAchat | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
              <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let r"><button mat-button (click)="edit(r)">Modifier</button></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
            <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
          </div>
        </mat-tab>
        <mat-tab label="Inventaire">
          <div class="kpi-grid" style="margin-top:1rem">
            <article class="kpi-card">
              <p class="muted">Valeur du stock</p>
              <strong>{{ money(valorisation) }}</strong>
            </article>
            <article class="kpi-card gold">
              <p class="muted">Articles</p>
              <strong>{{ inventaire.length }}</strong>
            </article>
            <article class="kpi-card">
              <p class="muted">Écarts à régulariser</p>
              <strong>{{ ecarts }}</strong>
            </article>
          </div>
          <div class="toolbar-actions" style="margin-bottom:1rem">
            <button mat-stroked-button type="button" (click)="reinitialiserInventaire()">Réinitialiser aux stocks théoriques</button>
            <button mat-flat-button color="primary" type="button" (click)="validerInventaire()" [disabled]="savingInventaire || !ecarts">
              Valider l'inventaire
            </button>
          </div>
          @if (!inventaire.length) {
            <p class="muted">Aucun article en stock. Créez d'abord des articles pour lancer un inventaire.</p>
          }
          <div class="table-card">
            <table mat-table [dataSource]="inventaire">
              <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Article</th><td mat-cell *matCellDef="let r">{{ r.nom }}</td></ng-container>
              <ng-container matColumnDef="sku"><th mat-header-cell *matHeaderCellDef>SKU</th><td mat-cell *matCellDef="let r">{{ r.sku }}</td></ng-container>
              <ng-container matColumnDef="theorique"><th mat-header-cell *matHeaderCellDef>Théorique</th>
                <td mat-cell *matCellDef="let r">{{ r.stockTheorique | number:'1.0-2' }} {{ r.unite }}</td>
              </ng-container>
              <ng-container matColumnDef="reelle"><th mat-header-cell *matHeaderCellDef>Quantité réelle</th>
                <td mat-cell *matCellDef="let r">
                  <input type="number" min="0" step="0.001" [(ngModel)]="r.quantiteReelle"
                    style="width:7.5rem;padding:.45rem .6rem;border:1px solid #ddd;border-radius:8px">
                </td>
              </ng-container>
              <ng-container matColumnDef="ecart"><th mat-header-cell *matHeaderCellDef>Écart</th>
                <td mat-cell *matCellDef="let r">
                  @if (ecart(r) === 0) { <span class="badge badge-ok">OK</span> }
                  @else {
                    <span class="badge" [class.badge-danger]="ecart(r) < 0">{{ ecart(r) | number:'1.0-2' }}</span>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="invCols"></tr>
              <tr mat-row *matRowDef="let row; columns: invCols"></tr>
            </table>
          </div>
        </mat-tab>
        <mat-tab label="Journal">
          <div class="table-card" style="margin-top:1rem">
            <table mat-table [dataSource]="mouvements">
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              </ng-container>
              <ng-container matColumnDef="article"><th mat-header-cell *matHeaderCellDef>Article</th><td mat-cell *matCellDef="let r">{{ r.articleNom }}</td></ng-container>
              <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let r">{{ typeLabel(r) }}</td>
              </ng-container>
              <ng-container matColumnDef="qte"><th mat-header-cell *matHeaderCellDef>Qté</th><td mat-cell *matCellDef="let r">{{ r.quantite | number:'1.0-2' }}</td></ng-container>
              <ng-container matColumnDef="avant"><th mat-header-cell *matHeaderCellDef>Avant</th><td mat-cell *matCellDef="let r">{{ r.stockAvant | number:'1.0-2' }}</td></ng-container>
              <ng-container matColumnDef="apres"><th mat-header-cell *matHeaderCellDef>Après</th><td mat-cell *matCellDef="let r">{{ r.stockApres | number:'1.0-2' }}</td></ng-container>
              <ng-container matColumnDef="motif"><th mat-header-cell *matHeaderCellDef>Motif</th>
                <td mat-cell *matCellDef="let r">{{ r.motif }} {{ r.referenceMetier ? '(' + r.referenceMetier + ')' : '' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="mvCols"></tr>
              <tr mat-row *matRowDef="let row; columns: mvCols"></tr>
            </table>
            @if (!mouvements.length) {
              <p class="muted" style="padding:1rem">Aucun mouvement enregistré.</p>
            }
          </div>
        </mat-tab>
        <mat-tab label="Alertes">
          <div class="table-card" style="margin-top:1rem">
            <table mat-table [dataSource]="alertes">
              <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Article</th><td mat-cell *matCellDef="let r">{{ r.nom }}</td></ng-container>
              <ng-container matColumnDef="stock"><th mat-header-cell *matHeaderCellDef>Stock</th><td mat-cell *matCellDef="let r">{{ r.stockActuel }} / min {{ r.stockMinimum }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['nom','stock']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['nom','stock']"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </section>
  `
})
export class StocksComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: ArticleStock[] = [];
  allArticles: ArticleStock[] = [];
  alertes: ArticleStock[] = [];
  inventaire: InventaireLigne[] = [];
  mouvements: MouvementStock[] = [];
  valorisation = 0;
  savingInventaire = false;
  cols = ['nom', 'sku', 'stock', 'prix', 'actions'];
  invCols = ['nom', 'sku', 'theorique', 'reelle', 'ecart'];
  mvCols = ['date', 'article', 'type', 'qte', 'avant', 'apres', 'motif'];
  money = money;

  constructor() {
    this.load();
  }

  get ecarts(): number {
    return this.inventaire.filter((ligne) => this.ecart(ligne) !== 0).length;
  }

  ecart(ligne: InventaireLigne): number {
    return Number((Number(ligne.quantiteReelle) - Number(ligne.stockTheorique)).toFixed(3));
  }

  typeLabel(row: MouvementStock): string {
    const key = row.type || row.typeMouvement || '';
    return TYPE_MOUVEMENT[key] || key;
  }

  load(): void {
    this.api.get<ArticleStock[] | PageResponse<ArticleStock>>('articles-stock', { q: this.q, page: this.page, size: this.size }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, this.page, this.size);
        this.rows = page.content ?? [];
        this.total = page.totalElements ?? 0;
        this.allArticles = Array.isArray(res) ? res : page.content ?? [];
        this.inventaire = this.allArticles.map((article) => ({
          articleId: article.id,
          nom: article.nom,
          sku: article.sku,
          unite: article.unite,
          stockTheorique: Number(article.stockActuel ?? 0),
          quantiteReelle: Number(article.stockActuel ?? 0)
        }));
      },
      error: (err) => this.notify.error(err)
    });
    this.api.get<ArticleStock[] | PageResponse<ArticleStock>>('stocks/alertes').subscribe({
      next: (res) => {
        this.alertes = Array.isArray(res) ? res : res.content ?? [];
      }
    });
    this.api.get<{ valeur: number }>('stocks/valorisation').subscribe({
      next: (res) => (this.valorisation = Number(res.valeur ?? 0)),
      error: () => (this.valorisation = 0)
    });
    this.api.get<MouvementStock[]>('stocks/mouvements').subscribe({
      next: (rows) => (this.mouvements = rows ?? []),
      error: () => (this.mouvements = [])
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  edit(row?: ArticleStock): void {
    this.dialog.open(ArticleFormDialogComponent, { width: '720px', data: row ?? null }).afterClosed().subscribe((ok) => ok && this.load());
  }

  mouvement(): void {
    this.dialog.open(MouvementFormDialogComponent, { width: '640px', data: this.allArticles.length ? this.allArticles : this.rows }).afterClosed().subscribe((ok) => ok && this.load());
  }

  reinitialiserInventaire(): void {
    this.inventaire = this.inventaire.map((ligne) => ({ ...ligne, quantiteReelle: ligne.stockTheorique }));
  }

  validerInventaire(): void {
    const lignes = this.inventaire
      .filter((ligne) => this.ecart(ligne) !== 0)
      .map((ligne) => ({ articleId: ligne.articleId, quantiteReelle: Number(ligne.quantiteReelle) }));
    if (!lignes.length) {
      this.notify.success('Aucun écart à enregistrer');
      return;
    }
    this.savingInventaire = true;
    this.api.post<InventaireResultat>('stocks/inventaire', { lignes }).subscribe({
      next: (res) => {
        this.savingInventaire = false;
        this.notify.success(`Inventaire ${res.reference} : ${res.ajustements} ajustement(s)`);
        this.load();
      },
      error: (err) => {
        this.savingInventaire = false;
        this.notify.error(err);
      }
    });
  }
}
