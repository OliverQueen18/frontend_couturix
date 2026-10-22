import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/api.service';
import { Modele, ModeleImage, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { money, joursLabel } from '../../core/format';

@Component({
  selector: 'app-modele-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    @if (modele) {
      <section class="page">
        <a routerLink="/app/modeles">← Modèles</a>
        <header class="page-header">
          <div>
            <h1>{{ modele.nom }}</h1>
            <p class="muted">{{ modele.categorieNom }} · {{ labels[modele.statut] || modele.statut }} · {{ money(modele.prixIndicatif) }} · {{ jours(modele.tempsFabricationJours) }}</p>
          </div>
          <div class="toolbar-actions">
            <button mat-stroked-button (click)="action('publier')">Publier</button>
            <button mat-stroked-button (click)="action('depublier')">Dépublier</button>
            <button mat-stroked-button (click)="action('archiver')">Archiver</button>
          </div>
        </header>
        <p>{{ modele.description }}</p>
        <p class="muted">Tissu recommandé : {{ modele.tissuRecommande || '—' }}</p>
        <p class="muted">Délai de fabrication : {{ jours(modele.tempsFabricationJours) }}</p>
        <div class="catalogue-grid" style="margin:1rem 0">
            @for (img of modele.images ?? []; track $index) {
              <img [src]="imageUrl(img)" [alt]="modele.nom" style="width:100%;border-radius:12px;height:180px;object-fit:cover">
            }
        </div>
        <input type="file" accept="image/*" (change)="upload($event)">
      </section>
    }
  `
})
export class ModeleDetailComponent {
  readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly route = inject(ActivatedRoute);
  modele: Modele | null = null;
  money = money;
  jours = joursLabel;
  labels = STATUT_LABELS;

  constructor() {
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<Modele>(`modeles/${id}`).subscribe({
      next: (modele) => (this.modele = modele),
      error: (err) => this.notify.error(err)
    });
  }

  imageUrl(img: string | ModeleImage): string {
    return this.api.fileUrl(typeof img === 'string' ? img : img.url);
  }

  action(verb: string): void {
    if (!this.modele) {
      return;
    }
    this.api.post<Modele>(`modeles/${this.modele.id}/${verb}`).subscribe({
      next: (modele) => {
        this.modele = modele;
        this.notify.success('Statut mis à jour');
      },
      error: (err) => this.notify.error(err)
    });
  }

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.modele) {
      return;
    }
    this.api.upload<Modele>(`modeles/${this.modele.id}/images`, file).subscribe({
      next: (modele) => {
        this.modele = modele;
        this.notify.success('Image ajoutée');
      },
      error: (err) => this.notify.error(err)
    });
  }
}
