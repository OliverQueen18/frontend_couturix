import { DatePipe } from '@angular/common';
import { Component, Injectable, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/api.service';
import { compressImage } from '../../core/compress-image';
import { SiteMedia } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

export interface MediaLibraryData {
  currentUrl?: string | null;
}

@Component({
  selector: 'app-media-library-dialog',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <span class="dialog-icon"><mat-icon>photo_library</mat-icon></span>
      Bibliothèque du site
    </h2>
    <mat-dialog-content class="lib">
      <div class="toolbar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="q" placeholder="Rechercher un fichier" name="media-q">
        </mat-form-field>
        <label class="upload" [class.busy]="uploading">
          <mat-icon>{{ uploading ? 'hourglass_top' : 'upload' }}</mat-icon>
          {{ uploading ? 'Envoi…' : 'Téléverser' }}
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)" [disabled]="uploading">
        </label>
      </div>
      @if (loading) {
        <p class="muted empty">Chargement de la bibliothèque…</p>
      } @else if (!filtered().length) {
        <p class="muted empty">{{ items.length ? 'Aucun fichier ne correspond.' : 'Aucun média pour l’instant. Téléversez une image JPEG, PNG ou WebP.' }}</p>
      } @else {
        <div class="layout">
          <div class="grid">
            @for (item of filtered(); track item.id) {
              <button type="button" class="tile" [class.on]="selected?.id === item.id" (click)="selected = item">
                <img [src]="preview(item.url)" [alt]="item.originalName">
              </button>
            }
          </div>
          @if (selected; as item) {
            <aside class="details">
              <img [src]="preview(item.url)" [alt]="item.originalName">
              <strong>{{ item.originalName }}</strong>
              <span>{{ item.createdAt | date: 'd MMM yyyy' }}</span>
              @if (item.sizeBytes) {
                <span>{{ sizeLabel(item.sizeBytes) }}</span>
              }
            </aside>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!selected" (click)="use()">Utiliser cette image</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .lib { min-height: 22rem; }
    .toolbar { display: flex; gap: .7rem; align-items: center; margin-bottom: .9rem; }
    .search { flex: 1; }
    .upload { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem .85rem; border-radius: 999px; background: #f7eef4; color: #2e1052; cursor: pointer; font-weight: 600; white-space: nowrap; }
    .upload.busy { opacity: .65; pointer-events: none; }
    .upload input { display: none; }
    .upload mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .empty { margin: 2rem 0; text-align: center; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 1rem; align-items: start; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: .55rem; max-height: 52vh; overflow: auto; padding: .1rem; }
    .tile { border: 2px solid transparent; border-radius: 10px; padding: 0; overflow: hidden; background: #f3edf7; cursor: pointer; aspect-ratio: 4 / 3; }
    .tile.on { border-color: #e21b70; box-shadow: 0 0 0 2px rgba(226, 27, 112, .18); }
    .tile img, .details img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .details { display: grid; gap: .35rem; }
    .details img { height: 120px; border-radius: 10px; background: #260838; }
    .details strong { font-size: .88rem; word-break: break-word; }
    .details span { color: #6b5d76; font-size: .78rem; }
    @media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class MediaLibraryDialogComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly dialogRef = inject(MatDialogRef<MediaLibraryDialogComponent, string>);
  private readonly data = inject<MediaLibraryData>(MAT_DIALOG_DATA, { optional: true });
  items: SiteMedia[] = [];
  selected: SiteMedia | null = null;
  q = '';
  loading = true;
  uploading = false;

  constructor() {
    this.load();
  }

  filtered(): SiteMedia[] {
    const q = this.q.trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter((item) => item.originalName.toLowerCase().includes(q));
  }

  preview(url: string): string {
    if (url.startsWith('http') || url.startsWith('images/')) {
      return url;
    }
    return this.api.fileUrl(url);
  }

  sizeLabel(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} o`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.uploading) {
      return;
    }
    this.uploading = true;
    try {
      const ready = await compressImage(file);
      this.api.upload<SiteMedia>('admin/site/media', ready).subscribe({
        next: (item) => {
          this.uploading = false;
          this.items = [item, ...this.items.filter((row) => row.url !== item.url)];
          this.selected = item;
          this.notify.success('Image ajoutée à la bibliothèque');
        },
        error: (err) => {
          this.uploading = false;
          this.notify.error(err);
        }
      });
    } catch {
      this.uploading = false;
      this.notify.error('Impossible de lire cette image');
    }
  }

  use(): void {
    if (this.selected) {
      this.dialogRef.close(this.selected.url);
    }
  }

  private load(): void {
    this.api.get<SiteMedia[]>('admin/site/media').subscribe({
      next: (rows) => {
        this.items = rows ?? [];
        const current = this.data?.currentUrl;
        this.selected = this.items.find((item) => item.url === current) ?? this.items[0] ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err);
      }
    });
  }
}

@Injectable({ providedIn: 'root' })
export class MediaLibraryDialogService {
  private readonly dialog = inject(MatDialog);

  open(currentUrl?: string | null) {
    return this.dialog.open(MediaLibraryDialogComponent, {
      data: { currentUrl },
      width: '860px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
      panelClass: 'media-library-dialog'
    });
  }
}
