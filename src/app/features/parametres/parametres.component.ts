import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/api.service';
import { Parametre } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Paramètres</h1></header>
      <form class="cx-form-card dialog-form" [formGroup]="form" (ngSubmit)="save()">
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
  `
})
export class ParametresComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  params: Parametre[] = [];
  form = this.fb.record<FormControl<string | boolean>>({});

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
  }

  isBoolean(value: string): boolean {
    return value === 'true' || value === 'false';
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
