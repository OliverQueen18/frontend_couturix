import { Component, Injectable, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../core/api.service';
import { AtelierAvis } from '../../core/models';
import { Workshop, formatPrice, workshopBadge } from './workshop.models';

@Component({
  selector: 'app-workshop-profile-dialog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './workshop-profile-dialog.component.html',
  styleUrl: './workshop-profile-dialog.component.scss'
})
export class WorkshopProfileDialogComponent {
  readonly workshop = inject<Workshop>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<WorkshopProfileDialogComponent>);
  private readonly api = inject(ApiService);
  readonly badge = workshopBadge(this.workshop);
  readonly formatPrice = formatPrice;
  readonly avis = signal<AtelierAvis[]>([]);
  photoFailed = false;

  constructor() {
    if (this.workshop.remote) {
      this.api.get<AtelierAvis[]>(`public/ateliers/${this.workshop.slug}/avis`).subscribe({
        next: (rows) => this.avis.set(rows ?? [])
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  initial(): string {
    return this.workshop.name.trim().charAt(0).toUpperCase();
  }

  score(): string {
    return this.workshop.rating.toFixed(1).replace('.', ',');
  }

  whatsapp(): string {
    return (this.workshop.whatsapp ?? this.workshop.phone ?? '').replace(/\D/g, '');
  }
}

@Injectable({ providedIn: 'root' })
export class WorkshopProfileDialogService {
  private readonly dialog = inject(MatDialog);

  open(workshop: Workshop): MatDialogRef<WorkshopProfileDialogComponent> {
    return this.dialog.open(WorkshopProfileDialogComponent, {
      data: workshop,
      width: '880px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
      panelClass: 'workshop-profile-dialog',
      backdropClass: 'workshop-profile-backdrop'
    });
  }
}
