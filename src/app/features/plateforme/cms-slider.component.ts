import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { SiteSlide } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { SiteContentService } from '../../core/site-content.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-cms-slider',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSlideToggleModule, MatTableModule, MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>view_carousel</mat-icon></span>
          <div>
            <h1>Slider d’accueil</h1>
            <p class="muted">Images, titres et boutons du carrousel de la page d’accueil. JPEG, PNG ou WebP.</p>
          </div>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="create()">Nouvelle image</button>
      </header>
      <div class="cms-layout">
        <div class="table-card">
          <table mat-table [dataSource]="rows">
            <ng-container matColumnDef="image">
              <th mat-header-cell *matHeaderCellDef>Image</th>
              <td mat-cell *matCellDef="let r">
                <img class="thumb" [src]="preview(r.imageUrl)" [alt]="r.title">
              </td>
            </ng-container>
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Titre</th>
              <td mat-cell *matCellDef="let r">{{ r.title }}</td>
            </ng-container>
            <ng-container matColumnDef="order">
              <th mat-header-cell *matHeaderCellDef>Ordre</th>
              <td mat-cell *matCellDef="let r">{{ r.sortOrder }}</td>
            </ng-container>
            <ng-container matColumnDef="visible">
              <th mat-header-cell *matHeaderCellDef>Visible</th>
              <td mat-cell *matCellDef="let r">{{ r.visible ? 'Oui' : 'Non' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols" (click)="edit(row)" class="clickable"></tr>
          </table>
          @if (!rows.length) {
            <p class="muted empty">Aucune image. L’accueil affiche les visuels par défaut.</p>
          }
        </div>
        @if (editing) {
          <form class="card-block dialog-form" [formGroup]="form" (ngSubmit)="save()">
            <h2>{{ current?.id ? 'Modifier l’image' : 'Nouvelle image' }}</h2>
            @if (form.controls.imageUrl.value) {
              <img class="preview" [src]="preview(form.controls.imageUrl.value)" [alt]="form.controls.title.value">
            }
            <label class="upload">
              {{ form.controls.imageUrl.value ? 'Changer l’image' : 'Choisir une image' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)">
            </label>
            <mat-form-field appearance="outline"><mat-label>Surligne</mat-label><input matInput formControlName="kicker"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Titre</mat-label><input matInput formControlName="title"></mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>Texte</mat-label>
              <textarea matInput rows="3" formControlName="body"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Bouton</mat-label><input matInput formControlName="ctaLabel"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Lien</mat-label><input matInput formControlName="ctaPath" placeholder="/inscription"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ordre</mat-label><input matInput type="number" formControlName="sortOrder"></mat-form-field>
            <mat-slide-toggle formControlName="visible">Visible sur l’accueil</mat-slide-toggle>
            <div class="actions">
              <button mat-button type="button" (click)="editing = false">Annuler</button>
              @if (current?.id) {
                <button mat-button type="button" color="warn" (click)="remove()">Supprimer</button>
              }
              <button mat-flat-button color="primary" type="submit">Enregistrer</button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
  styles: [`
    .cms-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 1.05fr); gap: 1.2rem; align-items: start; }
    .clickable { cursor: pointer; }
    .thumb { width: 72px; height: 44px; object-fit: cover; border-radius: 6px; background: #f3edf7; display: block; }
    .preview { width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; background: #260838; margin-bottom: .8rem; }
    .upload { display: inline-flex; align-items: center; margin-bottom: 1rem; padding: .45rem .8rem; border-radius: 999px; background: #f7eef4; color: #2e1052; cursor: pointer; font-weight: 600; }
    .upload input { display: none; }
    .empty { padding: 1rem; }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
    @media (max-width: 960px) { .cms-layout { grid-template-columns: 1fr; } }
  `]
})
export class CmsSliderComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  private readonly site = inject(SiteContentService);
  private readonly dialog = inject(MatDialog);
  rows: SiteSlide[] = [];
  cols = ['image', 'title', 'order', 'visible'];
  editing = false;
  current: SiteSlide | null = null;
  readonly form = this.fb.nonNullable.group({
    kicker: [''],
    title: ['', Validators.required],
    body: [''],
    imageUrl: ['', Validators.required],
    ctaLabel: [''],
    ctaPath: [''],
    sortOrder: [10],
    visible: [true]
  });

  constructor() {
    this.load();
  }

  preview(url: string | null | undefined): string {
    if (!url) {
      return 'images/home/fallback.svg';
    }
    if (url.startsWith('http') || url.startsWith('images/')) {
      return url;
    }
    return this.api.fileUrl(url);
  }

  load(): void {
    this.api.get<SiteSlide[]>('admin/site/slides').subscribe({
      next: (rows) => (this.rows = rows),
      error: (err) => this.notify.error(err)
    });
  }

  create(): void {
    this.current = null;
    const next = (this.rows.at(-1)?.sortOrder ?? 0) + 10;
    this.form.reset({
      kicker: '', title: '', body: '', imageUrl: '', ctaLabel: '', ctaPath: '/inscription',
      sortOrder: next, visible: true
    });
    this.editing = true;
  }

  edit(row: SiteSlide): void {
    this.current = row;
    this.form.reset({
      kicker: row.kicker ?? '',
      title: row.title,
      body: row.body ?? '',
      imageUrl: row.imageUrl,
      ctaLabel: row.ctaLabel ?? '',
      ctaPath: row.ctaPath ?? '',
      sortOrder: row.sortOrder,
      visible: row.visible
    });
    this.editing = true;
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.api.upload<{ url: string }>('admin/site/slides/image', file).subscribe({
      next: (res) => this.form.patchValue({ imageUrl: res.url }),
      error: (err) => this.notify.error(err)
    });
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const raw = this.form.getRawValue();
    const body = { ...raw, sortOrder: Number(raw.sortOrder) || 0 };
    const req = this.current?.id
      ? this.api.put<SiteSlide>(`admin/site/slides/${this.current.id}`, body)
      : this.api.post<SiteSlide>('admin/site/slides', body);
    req.subscribe({
      next: () => {
        this.notify.success('Image du slider enregistrée');
        this.editing = false;
        this.load();
        this.site.refresh(true);
      },
      error: (err) => this.notify.error(err)
    });
  }

  remove(): void {
    if (!this.current?.id) {
      return;
    }
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer', message: `Retirer « ${this.current.title} » du slider ?` }
    }).afterClosed().subscribe((ok) => {
      if (!ok || !this.current?.id) {
        return;
      }
      this.api.delete(`admin/site/slides/${this.current.id}`).subscribe({
        next: () => {
          this.notify.success('Image retirée');
          this.editing = false;
          this.load();
          this.site.refresh(true);
        },
        error: (err) => this.notify.error(err)
      });
    });
  }
}
