import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AbonnementCourant, NotificationItem, NotificationTemplate, PageResponse, STATUT_LABELS } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { bindAtelierScope } from '../../core/platform-scope.service';
import { matchesSearch } from '../../core/search';
import { PhoneFieldComponent } from '../../shared/phone-field.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    PhoneFieldComponent
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div class="page-heading">
          <span class="page-icon"><mat-icon>notifications</mat-icon></span>
          <div>
            <h1>Notifications</h1>
            <p class="muted">Messages clients, rappels et modèles d’envoi</p>
          </div>
        </div>
      </header>
      @if (quota) {
        <p class="muted">
          @if (quota.sms) {
            SMS clients inclus (offre {{ quota.libelle }}{{ quota.essai ? ', période d’essai' : '' }}).
            @if (!quota.smsGatewayReady) {
              La passerelle n’est pas encore active : les SMS sont enregistrés, sans envoi réel.
            }
          } @else {
            Les SMS clients commencent à l’offre Standard, ou pendant l’essai de l’offre Gratuite.
            <a routerLink="/" fragment="tarifs">Voir les tarifs</a>
          }
        </p>
      }
      <mat-tab-group>
        <mat-tab label="Historique">
          <div class="filters" style="margin-top:1rem">
            <mat-form-field appearance="outline">
              <mat-label>Recherche</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="q" (ngModelChange)="apply()" placeholder="Destinataire, événement, canal">
            </mat-form-field>
          </div>
          <div class="table-card" style="margin-top:1rem">
            <table mat-table [dataSource]="rows">
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</td></ng-container>
              <ng-container matColumnDef="canal"><th mat-header-cell *matHeaderCellDef>Canal</th><td mat-cell *matCellDef="let r">{{ canalLabel(r.canal) }}</td></ng-container>
              <ng-container matColumnDef="evenement"><th mat-header-cell *matHeaderCellDef>Événement</th><td mat-cell *matCellDef="let r">{{ r.evenement }}</td></ng-container>
              <ng-container matColumnDef="destinataire"><th mat-header-cell *matHeaderCellDef>Destinataire</th><td mat-cell *matCellDef="let r">{{ r.destinataire }}</td></ng-container>
              <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let r">{{ labels[r.statut] || r.statut }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
            <mat-paginator [length]="total" [pageSize]="size" [pageIndex]="page" (page)="onPage($event)"></mat-paginator>
          </div>
        </mat-tab>
        <mat-tab label="Envoyer un rappel">
          <form class="card-block dialog-form" style="margin-top:1rem" [formGroup]="rappel" (ngSubmit)="sendRappel()">
            <mat-form-field appearance="outline">
              <mat-label>Canal</mat-label>
              <mat-select formControlName="canal">
                <mat-option value="EMAIL">E-mail</mat-option>
                <mat-option value="SMS" [disabled]="!quota?.sms">SMS{{ quota?.sms ? '' : ' — dès Standard' }}</mat-option>
              </mat-select>
            </mat-form-field>
            @if (rappel.controls.canal.value === 'SMS') {
              <app-phone-field label="Téléphone du destinataire" formControlName="destinataire"></app-phone-field>
            } @else {
              <mat-form-field appearance="outline">
                <mat-label>Destinataire</mat-label>
                <input matInput formControlName="destinataire" autocomplete="email">
              </mat-form-field>
            }
            <mat-form-field appearance="outline">
              <mat-label>Message</mat-label>
              <textarea matInput rows="4" formControlName="message"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary" [disabled]="rappel.invalid || sending">Envoyer</button>
          </form>
        </mat-tab>
        <mat-tab label="Modèles">
          <div class="card-block" style="margin-top:1rem">
            @for (tpl of templates; track tpl.id) {
              <form class="dialog-form" [formGroup]="forms[tpl.id]" (ngSubmit)="save(tpl)" style="margin-bottom:1.25rem">
                <h3>{{ tpl.evenement }} · {{ canalLabel(tpl.canal) }}</h3>
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
  q = '';
  all: NotificationItem[] = [];
  rows: NotificationItem[] = [];
  templates: NotificationTemplate[] = [];
  forms: Record<number, ReturnType<FormBuilder['group']>> = {};
  quota: AbonnementCourant | null = null;
  page = 0;
  size = 20;
  total = 0;
  sending = false;
  cols = ['date', 'canal', 'evenement', 'destinataire', 'statut'];
  labels = STATUT_LABELS;
  readonly rappel = this.fb.nonNullable.group({
    canal: ['EMAIL', Validators.required],
    destinataire: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor() {
    this.rappel.controls.canal.valueChanges.subscribe(() => {
      this.rappel.controls.destinataire.setValue('');
    });
    bindAtelierScope(() => this.load());
    this.api.get<AbonnementCourant>('abonnements/courant').subscribe({
      next: (quota) => (this.quota = quota),
      error: () => undefined
    });
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

  canalLabel(canal: string): string {
    return ({ EMAIL: 'E-mail', WHATSAPP: 'WhatsApp', SMS: 'SMS' } as Record<string, string>)[canal] ?? canal;
  }

  load(): void {
    this.page = 0;
    this.api.get<NotificationItem[] | PageResponse<NotificationItem>>('notifications', { page: 0, size: 200 }).subscribe({
      next: (res) => {
        const page = this.api.asPage(res, 0, 200);
        this.all = page.content ?? [];
        this.apply();
      },
      error: (err) => this.notify.error(err)
    });
  }

  apply(): void {
    const filtered = this.all.filter((row) =>
      matchesSearch(this.q, row.destinataire, row.evenement, this.canalLabel(row.canal), row.canal, this.labels[row.statut], row.sujet)
    );
    this.total = filtered.length;
    this.rows = filtered.slice(this.page * this.size, this.page * this.size + this.size);
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.apply();
  }

  sendRappel(): void {
    if (this.rappel.invalid) {
      this.rappel.markAllAsTouched();
      return;
    }
    this.sending = true;
    this.api.post<void>('notifications/rappel', this.rappel.getRawValue()).subscribe({
      next: () => {
        this.sending = false;
        this.notify.success('Rappel enregistré');
        this.rappel.patchValue({ message: '' });
        this.load();
      },
      error: (err) => {
        this.sending = false;
        this.notify.error(err);
      }
    });
  }

  save(tpl: NotificationTemplate): void {
    this.api.put(`notification-templates/${tpl.id}`, this.forms[tpl.id].getRawValue()).subscribe({
      next: () => this.notify.success('Modèle enregistré'),
      error: (err) => this.notify.error(err)
    });
  }
}
