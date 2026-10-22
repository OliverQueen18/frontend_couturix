import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { periodRange } from '../../core/format';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Rapports</h1></header>
      <form class="card-block dialog-form" [formGroup]="form">
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Type</mat-label>
            <mat-select formControlName="type">
              <mat-option value="ventes">Ventes</mat-option>
              <mat-option value="commandes">Commandes</mat-option>
              <mat-option value="stocks">Stocks</mat-option>
              <mat-option value="caisse">Caisse</mat-option>
              <mat-option value="paie">Paie</mat-option>
              <mat-option value="clients">Clients</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Période</mat-label>
            <mat-select formControlName="period">
              <mat-option value="today">Aujourd'hui</mat-option>
              <mat-option value="week">Semaine</mat-option>
              <mat-option value="month">Mois</mat-option>
              <mat-option value="quarter">Trimestre</mat-option>
              <mat-option value="year">Année</mat-option>
              <mat-option value="custom">Personnalisé</mat-option>
            </mat-select>
          </mat-form-field>
          @if (form.controls.period.value === 'custom') {
            <mat-form-field appearance="outline"><mat-label>Du</mat-label><input matInput type="date" formControlName="from"></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Au</mat-label><input matInput type="date" formControlName="to"></mat-form-field>
          }
        </div>
        <div class="toolbar-actions">
          <button mat-stroked-button type="button" (click)="download('csv')">CSV</button>
          <button mat-stroked-button type="button" (click)="download('xlsx')">Excel</button>
          <button mat-flat-button color="primary" type="button" (click)="download('pdf')">PDF</button>
        </div>
      </form>
    </section>
  `
})
export class RapportsComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    type: ['ventes', Validators.required],
    period: ['month'],
    from: [''],
    to: ['']
  });

  download(format: 'csv' | 'xlsx' | 'pdf'): void {
    const value = this.form.getRawValue();
    const range = periodRange(value.period as 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom', value.from, value.to);
    this.api.download(`rapports/${value.type}`, { ...range, format }).subscribe({
      next: (blob) => this.api.openBlob(blob),
      error: (err) => this.notify.error(err)
    });
  }
}
