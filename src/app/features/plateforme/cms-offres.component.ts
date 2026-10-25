import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/api.service';
import { PlanOffre, PlanServiceGroup } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { fcfa } from '../../public/home.data';

interface ServiceDraft {
  title: string;
  items: string;
}

@Component({
  selector: 'app-cms-offres',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSlideToggleModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>workspace_premium</mat-icon></span>
          <div>
            <h1>Offres</h1>
            <p class="muted">Prix en FCFA, textes et délais d’essai affichés sur l’accueil et l’inscription.</p>
          </div>
        </div>
      </header>
      <div class="cms-layout">
        <div class="table-card picks">
          @for (row of rows; track row.code) {
            <button type="button" class="pick" [class.on]="draft?.code === row.code" (click)="edit(row)">
              <strong>{{ row.libelle }}</strong>
              <span>{{ priceLabel(row) }}</span>
              <em>{{ row.actif ? (row.popular ? 'Mise en avant' : 'Publiée') : 'Masquée' }}</em>
            </button>
          }
        </div>
        @if (draft; as row) {
          <form class="card-block dialog-form" (ngSubmit)="save()">
            <h2>{{ row.libelle }} <small>{{ row.code }}</small></h2>
            <div class="grid">
              <mat-form-field appearance="outline">
                <mat-label>Libellé</mat-label>
                <input matInput name="libelle" [(ngModel)]="row.libelle" required maxlength="80">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Surligne</mat-label>
                <input matInput name="kicker" [(ngModel)]="row.kicker" maxlength="80">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Prix mensuel (FCFA)</mat-label>
                <input matInput type="number" min="0" name="prix" [(ngModel)]="row.prixMensuel">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Remise annuelle (%)</mat-label>
                <input matInput type="number" min="0" max="80" name="remise" [(ngModel)]="row.remiseAnnuelle">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Jours d’essai</mat-label>
                <input matInput type="number" min="0" max="3650" name="trial" [(ngModel)]="row.trialDays">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Ateliers max</mat-label>
                <input matInput type="number" min="1" name="ateliers" [(ngModel)]="row.maxAteliers" placeholder="Illimité">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Bouton</mat-label>
                <input matInput name="cta" [(ngModel)]="row.cta" maxlength="80">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Description</mat-label>
              <textarea matInput rows="2" name="description" [(ngModel)]="row.description"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Points forts (un par ligne)</mat-label>
              <textarea matInput rows="5" name="features" [(ngModel)]="featuresText"></textarea>
            </mat-form-field>
            <div class="toggles">
              <mat-slide-toggle [(ngModel)]="row.sms" name="sms">SMS inclus</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="row.popular" name="popular">Mise en avant</mat-slide-toggle>
              <mat-slide-toggle [(ngModel)]="row.actif" name="actif">Visible sur le site</mat-slide-toggle>
            </div>
            <h3>Services détaillés</h3>
            @for (group of serviceDrafts; track $index) {
              <div class="group">
                <div class="group-head">
                  <mat-form-field appearance="outline" class="grow">
                    <mat-label>Groupe</mat-label>
                    <input matInput [(ngModel)]="group.title" [name]="'gt' + $index">
                  </mat-form-field>
                  <button mat-icon-button type="button" (click)="removeGroup($index)" aria-label="Retirer le groupe">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Services (un par ligne)</mat-label>
                  <textarea matInput rows="4" [(ngModel)]="group.items" [name]="'gi' + $index"></textarea>
                </mat-form-field>
              </div>
            }
            <button mat-button type="button" (click)="addGroup()">Ajouter un groupe</button>
            <div class="actions">
              <button mat-button type="button" (click)="draft = null">Annuler</button>
              <button mat-flat-button color="primary" type="submit">Enregistrer</button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
  styles: [`
    .cms-layout { display: grid; grid-template-columns: minmax(220px, .72fr) minmax(0, 1.28fr); gap: 1.2rem; align-items: start; }
    .picks { display: grid; gap: .55rem; padding: .85rem; }
    .pick { display: grid; gap: .15rem; text-align: left; border: 1px solid #eadff0; background: #fff; border-radius: 14px; padding: .85rem 1rem; cursor: pointer; color: inherit; }
    .pick.on { border-color: #e21b70; box-shadow: 0 0 0 2px rgba(226, 27, 112, .12); }
    .pick span { color: #2e1052; font-weight: 700; }
    .pick em { color: #6b5d76; font-style: normal; font-size: .82rem; }
    h2 small { margin-left: .4rem; color: #6b5d76; font-weight: 500; }
    h3 { margin: 1rem 0 .5rem; font-size: .92rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 .7rem; }
    .full, .grow { width: 100%; }
    .toggles { display: flex; flex-wrap: wrap; gap: .9rem 1.2rem; margin: .2rem 0 1rem; }
    .group { margin-bottom: .35rem; }
    .group-head { display: flex; gap: .4rem; align-items: flex-start; }
    .actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .8rem; }
    @media (max-width: 960px) { .cms-layout, .grid { grid-template-columns: 1fr; } }
  `]
})
export class CmsOffresComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  rows: PlanOffre[] = [];
  draft: PlanOffre | null = null;
  featuresText = '';
  serviceDrafts: ServiceDraft[] = [];

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get<PlanOffre[]>('admin/offres').subscribe({
      next: (rows) => {
        this.rows = rows ?? [];
        if (this.draft) {
          const current = this.rows.find((row) => row.code === this.draft?.code);
          if (current) {
            this.edit(current);
          }
        }
      },
      error: (err) => this.notify.error(err)
    });
  }

  edit(row: PlanOffre): void {
    this.draft = {
      ...row,
      kicker: row.kicker ?? '',
      description: row.description ?? '',
      cta: row.cta ?? '',
      features: [...(row.features ?? [])],
      services: (row.services ?? []).map((group) => ({ title: group.title, items: [...(group.items ?? [])] }))
    };
    this.featuresText = (row.features ?? []).join('\n');
    this.serviceDrafts = (row.services ?? []).map((group) => ({
      title: group.title ?? '',
      items: (group.items ?? []).join('\n')
    }));
  }

  addGroup(): void {
    this.serviceDrafts = [...this.serviceDrafts, { title: '', items: '' }];
  }

  removeGroup(index: number): void {
    this.serviceDrafts = this.serviceDrafts.filter((_, i) => i !== index);
  }

  priceLabel(row: PlanOffre): string {
    return row.prixMensuel > 0 ? `${fcfa(row.prixMensuel)} / mois` : 'Gratuit';
  }

  save(): void {
    const row = this.draft;
    if (!row) {
      return;
    }
    const libelle = row.libelle?.trim() ?? '';
    const prix = Math.floor(Number(row.prixMensuel));
    const remise = Math.floor(Number(row.remiseAnnuelle));
    const trial = Math.floor(Number(row.trialDays));
    const maxRaw = row.maxAteliers == null || String(row.maxAteliers) === '' ? null : Number(row.maxAteliers);
    if (!libelle) {
      this.notify.error('Indiquez le libellé de l’offre');
      return;
    }
    if (!Number.isFinite(prix) || prix < 0) {
      this.notify.error('Indiquez un prix mensuel en FCFA');
      return;
    }
    if (!Number.isFinite(remise) || remise < 0 || remise > 80) {
      this.notify.error('La remise annuelle est entre 0 et 80 %');
      return;
    }
    if (!Number.isFinite(trial) || trial < 0 || trial > 3650) {
      this.notify.error('Indiquez un délai entre 0 et 3650 jours');
      return;
    }
    const maxAteliers = maxRaw == null || !Number.isFinite(maxRaw) || maxRaw <= 0 ? null : Math.floor(maxRaw);
    const body = {
      libelle,
      kicker: row.kicker?.trim() || null,
      description: row.description?.trim() || null,
      cta: row.cta?.trim() || null,
      prixMensuel: prix,
      remiseAnnuelle: remise,
      trialDays: trial,
      maxAteliers,
      sms: !!row.sms,
      popular: !!row.popular,
      actif: !!row.actif,
      features: this.lines(this.featuresText),
      services: this.toGroups()
    };
    this.api.put<PlanOffre>(`admin/offres/${row.code}`, body).subscribe({
      next: (saved) => {
        this.rows = this.rows.map((item) => (item.code === saved.code ? saved : item));
        this.edit(saved);
        this.notify.success(`Offre ${saved.libelle} enregistrée`);
      },
      error: (err) => this.notify.error(err)
    });
  }

  private lines(value: string): string[] {
    return value.split('\n').map((line) => line.trim()).filter(Boolean);
  }

  private toGroups(): PlanServiceGroup[] {
    return this.serviceDrafts
      .map((group) => ({ title: group.title.trim(), items: this.lines(group.items) }))
      .filter((group) => group.title);
  }
}
