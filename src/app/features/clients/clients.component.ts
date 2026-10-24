import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { requireValid } from '../../core/forms';
import { Client, ClientRequest, PageResponse } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { PhoneFieldComponent } from '../../shared/phone-field.component';

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, PhoneFieldComponent],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <span class="dialog-icon"><mat-icon>person</mat-icon></span>
      {{ data ? 'Modifier le client' : 'Nouveau client' }}
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="dialog-form">
        <div class="form-grid">
          <div class="form-section"><mat-icon>badge</mat-icon><span>Identité</span></div>
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <mat-icon matPrefix>badge</mat-icon>
            <input matInput formControlName="nom">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <mat-icon matPrefix>face</mat-icon>
            <input matInput formControlName="prenom">
          </mat-form-field>
          <div class="form-section"><mat-icon>contact_mail</mat-icon><span>Coordonnées</span></div>
          <app-phone-field class="full" formControlName="telephone" label="Téléphone" />
          <mat-form-field appearance="outline" class="full">
            <mat-label>E-mail</mat-label>
            <mat-icon matPrefix>mail_outline</mat-icon>
            <input matInput formControlName="email">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Adresse</mat-label>
            <mat-icon matPrefix>home</mat-icon>
            <input matInput formControlName="adresse">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Notes</mat-label>
            <mat-icon matPrefix>notes</mat-icon>
            <textarea matInput rows="3" formControlName="notes"></textarea>
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
export class ClientFormDialogComponent {
  readonly data = inject<Client | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ClientFormDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  readonly form = this.fb.nonNullable.group({
    nom: [this.data?.nom ?? '', Validators.required],
    prenom: [this.data?.prenom ?? '', Validators.required],
    telephone: [this.data?.telephone ?? '', Validators.required],
    email: [this.data?.email ?? ''],
    adresse: [this.data?.adresse ?? ''],
    notes: [this.data?.notes ?? '']
  });

  save(): void {
    if (!requireValid(this.form, this.notify)) {
      return;
    }
    const body: ClientRequest = this.form.getRawValue();
    const req = this.data?.id
      ? this.api.put<Client>(`clients/${this.data.id}`, body)
      : this.api.post<Client>('clients', body);
    req.subscribe({
      next: () => {
        this.notify.success('Client enregistré');
        this.dialogRef.close(true);
      },
      error: (err) => this.notify.error(err)
    });
  }
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
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
          <span class="page-icon"><mat-icon>groups</mat-icon></span>
          <div>
            <h1>Clients</h1>
            <p class="muted">Carnet de la clientèle</p>
          </div>
        </div>
        <button mat-flat-button color="primary" (click)="edit()">
          <mat-icon>person_add</mat-icon>
          Nouveau client
        </button>
      </header>
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Rechercher</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="q" (keyup.enter)="load()">
        </mat-form-field>
        <button mat-stroked-button (click)="load()">Rechercher</button>
      </div>
      <div class="table-card">
        <table mat-table [dataSource]="rows">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let r">{{ r.nom }} {{ r.prenom }}</td></ng-container>
          <ng-container matColumnDef="telephone"><th mat-header-cell *matHeaderCellDef>Téléphone</th><td mat-cell *matCellDef="let r">{{ r.telephone }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>E-mail</th><td mat-cell *matCellDef="let r">{{ r.email }}</td></ng-container>
          <ng-container matColumnDef="solde"><th mat-header-cell *matHeaderCellDef>Solde</th><td mat-cell *matCellDef="let r">{{ r.solde | currency:'XOF':'symbol':'1.0-0':'fr' }}</td></ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-button (click)="open(r)">Fiche</button>
              <button mat-button (click)="edit(r)">Modifier</button>
              <button mat-button color="warn" (click)="remove(r)">Supprimer</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
      </div>
    </section>
  `
})
export class ClientsComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  q = '';
  page = 0;
  size = 20;
  total = 0;
  rows: Client[] = [];
  cols = ['nom', 'telephone', 'email', 'solde', 'actions'];

  constructor() {
    bindAtelierScope(() => this.load());
  }

  load(): void {
    this.api.get<PageResponse<Client>>('clients', { q: this.q, page: this.page, size: this.size }).subscribe({
      next: (res) => {
        this.rows = res.content ?? [];
        this.total = res.totalElements ?? 0;
      },
      error: (err) => this.notify.error(err)
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  open(row: Client): void {
    void this.router.navigate(['/app/clients', row.id]);
  }

  edit(row?: Client): void {
    this.dialog
      .open(ClientFormDialogComponent, { width: '720px', data: row ?? null })
      .afterClosed()
      .subscribe((ok) => ok && this.load());
  }

  remove(row: Client): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Supprimer', message: `Supprimer ${row.prenom} ${row.nom} ?` }
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) {
          return;
        }
        this.api.delete(`clients/${row.id}`).subscribe({
          next: () => {
            this.notify.success('Client supprimé');
            this.load();
          },
          error: (err) => this.notify.error(err)
        });
      });
  }
}
