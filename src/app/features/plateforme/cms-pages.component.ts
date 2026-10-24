import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { SitePage } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { SiteContentService } from '../../core/site-content.service';

@Component({
  selector: 'app-cms-pages',
  standalone: true,
  imports: [
    DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatTableModule, MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>article</mat-icon></span>
          <div>
            <h1>Pages du site</h1>
            <p class="muted">Modifiez les textes comme dans un CMS : titres, chapô et contenu HTML.</p>
          </div>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="create()">Nouvelle page</button>
      </header>
      <div class="cms-layout">
        <div class="table-card">
          <table mat-table [dataSource]="rows">
            <ng-container matColumnDef="title"><th mat-header-cell *matHeaderCellDef>Titre</th><td mat-cell *matCellDef="let r">{{ r.title }}</td></ng-container>
            <ng-container matColumnDef="slug"><th mat-header-cell *matHeaderCellDef>Slug</th><td mat-cell *matCellDef="let r">{{ r.slug }}</td></ng-container>
            <ng-container matColumnDef="published"><th mat-header-cell *matHeaderCellDef>Publiée</th><td mat-cell *matCellDef="let r">{{ r.published ? 'Oui' : 'Non' }}</td></ng-container>
            <ng-container matColumnDef="updated"><th mat-header-cell *matHeaderCellDef>Maj</th><td mat-cell *matCellDef="let r">{{ r.updatedAt | date:'dd/MM/yyyy' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols" (click)="edit(row)" class="clickable"></tr>
          </table>
        </div>
        @if (editing) {
          <form class="card-block dialog-form" [formGroup]="form" (ngSubmit)="save()">
            <h2>{{ current?.id ? 'Modifier la page' : 'Nouvelle page' }}</h2>
            <mat-form-field appearance="outline"><mat-label>Titre</mat-label><input matInput formControlName="title"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Slug</mat-label><input matInput formControlName="slug" placeholder="a-propos" [readonly]="!!current?.id && reserved(current?.slug)"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Surligne</mat-label><input matInput formControlName="eyebrow"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Chapô</mat-label><textarea matInput rows="2" formControlName="lead"></textarea></mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>Contenu HTML</mat-label>
              <textarea matInput rows="12" formControlName="body"></textarea>
            </mat-form-field>
            <p class="muted">HTML accepté : titres, listes, liens, paragraphes. Les scripts sont retirés.</p>
            <mat-slide-toggle formControlName="published">Publiée</mat-slide-toggle>
            <div class="actions">
              <button mat-button type="button" (click)="editing = false">Annuler</button>
              @if (current?.id && !reserved(current?.slug)) {
                <button mat-button type="button" color="warn" (click)="remove()">Supprimer</button>
              }
              <a mat-button [href]="preview(form.controls.slug.value)" target="_blank" rel="noopener">Voir</a>
              <button mat-flat-button color="primary" type="submit">Enregistrer</button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
  styles: [`
    .cms-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 1.1fr); gap: 1.2rem; align-items: start; }
    .clickable { cursor: pointer; }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
    @media (max-width: 960px) { .cms-layout { grid-template-columns: 1fr; } }
  `]
})
export class CmsPagesComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  private readonly site = inject(SiteContentService);
  rows: SitePage[] = [];
  cols = ['title', 'slug', 'published', 'updated'];
  editing = false;
  current: SitePage | null = null;
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    slug: [''],
    eyebrow: [''],
    lead: [''],
    body: [''],
    published: [true]
  });

  constructor() {
    this.load();
  }

  reserved(slug?: string | null): boolean {
    return ['a-propos', 'contact', 'partenaires', 'conditions-utilisation', 'politique-confidentialite'].includes(slug ?? '');
  }

  preview(slug: string): string {
    const known = this.reserved(slug);
    return known ? `/${slug}` : `/p/${slug}`;
  }

  load(): void {
    this.api.get<SitePage[]>('admin/site/pages').subscribe({
      next: (rows) => (this.rows = rows),
      error: (err) => this.notify.error(err)
    });
  }

  create(): void {
    this.current = null;
    this.form.reset({ title: '', slug: '', eyebrow: '', lead: '', body: '', published: true });
    this.editing = true;
  }

  edit(row: SitePage): void {
    this.current = row;
    this.form.reset({
      title: row.title,
      slug: row.slug,
      eyebrow: row.eyebrow ?? '',
      lead: row.lead ?? '',
      body: row.body ?? '',
      published: row.published
    });
    this.editing = true;
  }

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body = this.form.getRawValue();
    const req = this.current?.id
      ? this.api.put<SitePage>(`admin/site/pages/${this.current.id}`, body)
      : this.api.post<SitePage>('admin/site/pages', body);
    req.subscribe({
      next: () => {
        this.notify.success('Page enregistrée');
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
    this.api.delete(`admin/site/pages/${this.current.id}`).subscribe({
      next: () => {
        this.notify.success('Page supprimée');
        this.editing = false;
        this.load();
        this.site.refresh(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}
