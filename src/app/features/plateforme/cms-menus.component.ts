import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { SiteMenu, SiteMenuLocation } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { SiteContentService } from '../../core/site-content.service';

@Component({
  selector: 'app-cms-menus',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSlideToggleModule, MatTableModule, MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>menu</mat-icon></span>
          <div>
            <h1>Menus</h1>
            <p class="muted">En-tête et colonnes du pied de page. L’ordre croissant place les liens de gauche à droite.</p>
          </div>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="create()">Nouveau lien</button>
      </header>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="location"><th mat-header-cell *matHeaderCellDef>Emplacement</th><td mat-cell *matCellDef="let r">{{ locLabel(r.location) }}</td></ng-container>
          <ng-container matColumnDef="label"><th mat-header-cell *matHeaderCellDef>Libellé</th><td mat-cell *matCellDef="let r">{{ r.label }}</td></ng-container>
          <ng-container matColumnDef="path"><th mat-header-cell *matHeaderCellDef>Lien</th><td mat-cell *matCellDef="let r">{{ r.path }}</td></ng-container>
          <ng-container matColumnDef="sortOrder"><th mat-header-cell *matHeaderCellDef>Ordre</th><td mat-cell *matCellDef="let r">{{ r.sortOrder }}</td></ng-container>
          <ng-container matColumnDef="visible"><th mat-header-cell *matHeaderCellDef>Visible</th><td mat-cell *matCellDef="let r">{{ r.visible ? 'Oui' : 'Non' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button type="button" (click)="edit(r)">Modifier</button>
              <button mat-button type="button" color="warn" (click)="remove(r)">Retirer</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </div>
      @if (editing) {
        <form class="card-block dialog-form" style="margin-top:1rem" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ current?.id ? 'Modifier le lien' : 'Nouveau lien' }}</h2>
          <div class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Emplacement</mat-label>
              <mat-select formControlName="location">
                @for (loc of locations; track loc.id) { <mat-option [value]="loc.id">{{ loc.label }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Libellé</mat-label><input matInput formControlName="label"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Chemin</mat-label><input matInput formControlName="path" placeholder="/a-propos ou /#tarifs"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ordre</mat-label><input matInput type="number" formControlName="sortOrder"></mat-form-field>
          </div>
          <mat-slide-toggle formControlName="visible">Visible</mat-slide-toggle>
          <div class="actions">
            <button mat-button type="button" (click)="editing = false">Annuler</button>
            <button mat-flat-button color="primary" type="submit">Enregistrer</button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`.actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }`]
})
export class CmsMenusComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  private readonly site = inject(SiteContentService);
  rows: SiteMenu[] = [];
  cols = ['location', 'label', 'path', 'sortOrder', 'visible', 'actions'];
  editing = false;
  current: SiteMenu | null = null;
  readonly locations: { id: SiteMenuLocation; label: string }[] = [
    { id: 'HEADER', label: 'En-tête' },
    { id: 'FOOTER_PLATEFORME', label: 'Pied — Plateforme' },
    { id: 'FOOTER_ENTREPRISE', label: 'Pied — Entreprise' },
    { id: 'FOOTER_LEGAL', label: 'Pied — Légal' }
  ];
  readonly form = this.fb.nonNullable.group({
    location: ['HEADER' as SiteMenuLocation, Validators.required],
    label: ['', Validators.required],
    path: ['/', Validators.required],
    sortOrder: [10],
    visible: [true]
  });

  constructor() {
    this.load();
  }

  locLabel(location: SiteMenuLocation): string {
    return this.locations.find((item) => item.id === location)?.label ?? location;
  }

  load(): void {
    this.api.get<SiteMenu[]>('admin/site/menus').subscribe({
      next: (rows) => (this.rows = rows),
      error: (err) => this.notify.error(err)
    });
  }

  create(): void {
    this.current = null;
    this.form.reset({ location: 'HEADER', label: '', path: '/', sortOrder: 10, visible: true });
    this.editing = true;
  }

  edit(row: SiteMenu): void {
    this.current = row;
    this.form.reset(row);
    this.editing = true;
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.current?.id
      ? this.api.put(`admin/site/menus/${this.current.id}`, body)
      : this.api.post('admin/site/menus', body);
    req.subscribe({
      next: () => {
        this.notify.success('Menu enregistré');
        this.editing = false;
        this.load();
        this.site.refresh(true);
      },
      error: (err) => this.notify.error(err)
    });
  }

  remove(row: SiteMenu): void {
    this.api.delete(`admin/site/menus/${row.id}`).subscribe({
      next: () => {
        this.notify.success('Lien retiré');
        this.load();
        this.site.refresh(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}
