import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../core/api.service';
import { DemandePublique } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { PhoneFieldComponent } from '../../shared/phone-field.component';
import { GarmentComponent } from './garment.component';
import { CatalogueModel, formatPrice } from './catalogue.models';

@Component({
  selector: 'app-model-detail-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneFieldComponent, GarmentComponent],
  templateUrl: './model-detail-dialog.component.html',
  styleUrl: './model-detail-dialog.component.scss'
})
export class ModelDetailDialogComponent {
  readonly model = inject<CatalogueModel>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ModelDetailDialogComponent>);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly formatPrice = formatPrice;
  photoFailed = false;
  sending = false;
  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    telephone: ['', Validators.required],
    email: [''],
    quantite: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  close(): void {
    this.dialogRef.close();
  }

  stars(): string {
    const rating = Math.round(this.model.rating);
    return '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
  }

  atelierLink(): string[] {
    return this.model.workshopSlug ? ['/ateliers', this.model.workshopSlug] : ['/ateliers'];
  }

  atelierQuery(): { q?: string } {
    return this.model.workshopSlug ? {} : { q: this.model.workshopName };
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.model.remote) {
      this.notify.success('Pour commander ce modèle, contactez l’atelier depuis sa fiche.');
      return;
    }
    this.sending = true;
    const payload: DemandePublique = this.form.getRawValue();
    this.api.post('public/demandes', { ...payload, modeleId: this.model.id }).subscribe({
      next: () => {
        this.sending = false;
        this.notify.success('Demande envoyée. Nous vous recontacterons.');
        this.form.reset({ quantite: 1, nom: '', prenom: '', telephone: '', email: '', notes: '' });
      },
      error: (err) => {
        this.sending = false;
        this.notify.error(err);
      }
    });
  }
}

@Injectable({ providedIn: 'root' })
export class ModelDetailDialogService {
  private readonly dialog = inject(MatDialog);

  open(model: CatalogueModel): MatDialogRef<ModelDetailDialogComponent> {
    return this.dialog.open(ModelDetailDialogComponent, {
      data: model,
      width: '960px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
      panelClass: 'catalogue-model-dialog',
      backdropClass: 'workshop-profile-backdrop'
    });
  }
}
