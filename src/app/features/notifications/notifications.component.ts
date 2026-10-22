import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { NotificationItem, NotificationTemplate, PageResponse, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MatTabsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="page">
      <header class="page-header"><h1>Notifications</h1></header>
      <mat-tab-group>
        <mat-tab label="Historique">
          <div class="table-card" style="margin-top:1rem">
            <table mat-table [dataSource]="rows">
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td></ng-container>
              <ng-container matColumnDef="canal"><th mat-header-cell *matHeaderCellDef>Canal</th><td mat-cell *matCellDef="let r">{{ r.canal }}</td></ng-container>
              <ng-container matColumnDef="evenement"><th mat-header-cell *matHeaderCellDef>Événement</th><td mat-cell *matCellDef="let r">{{ r.evenement }}</td></ng-container>
              <ng-container matColumnDef="destinataire"><th mat-header-cell *matHeaderCellDef>Destinataire</th><td mat-cell *matCellDef="let r">{{ r.destinataire }}</td></ng-container>
              <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let r">{{ labels[r.statut] || r.statut }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
            <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
          </div>
        </mat-tab>
        <mat-tab label="Modèles">
          <div class="card-block" style="margin-top:1rem">
            @for (tpl of templates; track tpl.id) {
              <form class="dialog-form" [formGroup]="forms[tpl.id]" (ngSubmit)="save(tpl)" style="margin-bottom:1.25rem">
                <h3>{{ tpl.evenement }} · {{ tpl.canal }}</h3>
                <mat-form-field appearance="outline"><mat-label>Sujet</mat-label><input matInput formControlName="sujet"></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Corps</mat-label><textarea matInput rows="3" formControlName="corps"></textarea></mat-form-field>
                <button mat-flat-button color="primary">Enregistrer</button>
              </form>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </section>
  `
})
export class NotificationsComponent {
  private readonly api = inject(ApiService);
  private readonly notify = inject(NotifyService);
  private readonly fb = inject(FormBuilder);
  rows: NotificationItem[] = [];
  templates: NotificationTemplate[] = [];
  forms: Record<number, ReturnType<FormBuilder['group']>> = {};
  page = 0;
  size = 20;
  total = 0;
  cols = ['date', 'canal', 'evenement', 'destinataire', 'statut'];
  labels = STATUT_LABELS;

  constructor() {
    this.load();
    this.api.get<NotificationTemplate[] | PageResponse<NotificationTemplate>>('notification-templates').subscribe({
      next: (res) => {
        this.templates = Array.isArray(res) ? res : res.content ?? [];
        this.templates.forEach((tpl) => {
          this.forms[tpl.id] = this.fb.group({ sujet: [tpl.sujet ?? ''], corps: [tpl.corps] });
        });
      },
      error: (err) => this.notify.error(err)
    });
  }

  load(): void {
    this.api.get<NotificationItem[] | PageResponse<NotificationItem>>('notifications', { page: this.page, size: this.size }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, this.page, this.size);
        this.rows = page.content ?? [];
        this.total = page.totalElements ?? 0;
      },
      error: (err) => this.notify.error(err)
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }

  save(tpl: NotificationTemplate): void {
    this.api.put(`notification-templates/${tpl.id}`, this.forms[tpl.id].getRawValue()).subscribe({
      next: () => this.notify.success('Modèle enregistré'),
      error: (err) => this.notify.error(err)
    });
  }
}
