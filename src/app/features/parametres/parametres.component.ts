import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { Parametre, TicketSignataire } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSlideToggleModule, MatTableModule, MatIconModule
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>settings</mat-icon></span>
          <div>
            <h1>Paramètres</h1>
            <p class="muted">Réglages de l’atelier, dont les signataires imprimés sur les tickets</p>
          </div>
        </div>
      </header>

      <form class="card-block dialog-form sign-card" [formGroup]="signForm" (ngSubmit)="saveSignataire()">
        <h2>Signataires des tickets</h2>
        <p class="muted">Chaque atelier configure les siens. Ils apparaissent en bas des reçus de caisse.</p>
        <div class="table-card" style="margin: .8rem 0 1rem">
          <table mat-table [dataSource]="signataires">
            <ng-container matColumnDef="libelle"><th mat-header-cell *matHeaderCellDef>Fonction</th>
              <td mat-cell *matCellDef="let r">{{ r.libelle }}</td></ng-container>
            <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th>
              <td mat-cell *matCellDef="let r">{{ r.nom || '—' }}</td></ng-container>
            <ng-container matColumnDef="ordre"><th mat-header-cell *matHeaderCellDef>Ordre</th>
              <td mat-cell *matCellDef="let r">{{ r.ordre }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-button type="button" (click)="editSignataire(r)">Modifier</button>
                <button mat-button type="button" color="warn" (click)="removeSignataire(r)">Retirer</button>
              </td></ng-container>
            <tr mat-header-row *matHeaderRowDef="signCols"></tr>
            <tr mat-row *matRowDef="let row; columns: signCols"></tr>
          </table>
        </div>
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Fonction</mat-label>
            <mat-icon matPrefix>badge</mat-icon>
            <input matInput formControlName="libelle" placeholder="Le gérant">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nom imprimé</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="nom" placeholder="Laissé vide pour une signature manuscrite">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Ordre</mat-label>
            <mat-icon matPrefix>format_list_numbered</mat-icon>
            <input matInput type="number" formControlName="ordre">
          </mat-form-field>
        </div>
        <div class="sign-actions">
          @if (editingSign) {
            <button mat-button type="button" (click)="cancelSignataire()">Annuler</button>
          }
          <button mat-flat-button color="primary" type="submit">
            {{ editingSign ? 'Enregistrer le signataire' : 'Ajouter un signataire' }}
          </button>
        </div>
      </form>

      <form class="cx-form-card dialog-form" [formGroup]="form" (ngSubmit)="save()" style="margin-top:1.2rem">
        <h2>Réglages généraux</h2>
        @for (p of params; track p.cle) {
          <div>
            <p><strong>{{ p.cle }}</strong></p>
            <p class="muted">{{ p.description }}</p>
            @if (p.cle === 'stock.allowNegative' || isBoolean(p.valeur)) {
              <mat-slide-toggle [formControlName]="p.cle">{{ p.cle === 'stock.allowNegative' ? 'Autoriser le stock négatif' : p.cle }}</mat-slide-toggle>
            } @else {
              <mat-form-field appearance="outline"><mat-label>Valeur</mat-label><input matInput [formControlName]="p.cle"></mat-form-field>
            }
          </div>
        }
        <button mat-flat-button color="primary">Enregistrer</button>
      </form>
    </section>
  `,
  styles: [`
    .sign-card { margin-bottom: .4rem; }
    .sign-actions { display: flex; flex-wrap: wrap; gap: .6rem; justify-content: flex-end; }
  `]
})
export class ParametresComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  params: Parametre[] = [];
  form = this.fb.record<FormControl<string | boolean>>({});
  signataires: TicketSignataire[] = [];
  signCols = ['libelle', 'nom', 'ordre', 'actions'];
  editingSign: TicketSignataire | null = null;
  readonly signForm = this.fb.nonNullable.group({
    libelle: ['', Validators.required],
    nom: [''],
    ordre: [0]
  });

  constructor() {
    this.api.get<Parametre[] | { content?: Parametre[] }>('parametres').subscribe({
      next: (res) => {
        this.params = Array.isArray(res) ? res : res.content ?? [];
        const record: Record<string, FormControl<string | boolean>> = {};
        this.params.forEach((p) => {
          record[p.cle] = this.fb.nonNullable.control(this.isBoolean(p.valeur) ? p.valeur === 'true' : p.valeur);
        });
        this.form = this.fb.record(record);
      },
      error: (err) => this.notify.error(err)
    });
    this.loadSignataires();
  }

  isBoolean(value: string): boolean {
    return value === 'true' || value === 'false';
  }

  loadSignataires(): void {
    this.api.get<TicketSignataire[]>('ticket-signataires').subscribe({
      next: (rows) => (this.signataires = rows ?? []),
      error: (err) => this.notify.error(err)
    });
  }

  editSignataire(row: TicketSignataire): void {
    this.editingSign = row;
    this.signForm.reset({
      libelle: row.libelle,
      nom: row.nom ?? '',
      ordre: row.ordre
    });
  }

  cancelSignataire(): void {
    this.editingSign = null;
    this.signForm.reset({ libelle: '', nom: '', ordre: 0 });
  }

  saveSignataire(): void {
    if (!requireValid(this.signForm, this.notify)) {
      return;
    }
    const body = { ...this.signForm.getRawValue(), actif: true };
    const req = this.editingSign
      ? this.api.put(`ticket-signataires/${this.editingSign.id}`, body)
      : this.api.post('ticket-signataires', body);
    req.subscribe({
      next: () => {
        this.notify.success(this.editingSign ? 'Signataire enregistré' : 'Signataire ajouté');
        this.cancelSignataire();
        this.loadSignataires();
      },
      error: (err) => this.notify.error(err)
    });
  }

  removeSignataire(row: TicketSignataire): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Retirer le signataire', message: `Retirer « ${row.libelle} » des tickets ?` }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.api.delete(`ticket-signataires/${row.id}`).subscribe({
          next: () => {
            this.notify.success('Signataire retiré');
            if (this.editingSign?.id === row.id) {
              this.cancelSignataire();
            }
            this.loadSignataires();
          },
          error: (err) => this.notify.error(err)
        });
      });
  }

  save(): void {
    const value = this.form.getRawValue();
    const updates = this.params.map((p) => {
      const raw = value[p.cle];
      const serialized = typeof raw === 'boolean' ? String(raw) : String(raw ?? '');
      return this.api.put(`parametres/${p.cle}`, { valeur: serialized });
    });
    let remaining = updates.length;
    if (!remaining) {
      return;
    }
    updates.forEach((obs) =>
      obs.subscribe({
        next: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.notify.success('Paramètres enregistrés');
          }
        },
        error: (err) => this.notify.error(err)
      })
    );
  }
}
