import { Component, Injectable, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { fcfa, HomePlan, yearlyFactor } from './home.data';

export interface PlanDetailData {
  plan: HomePlan;
  yearly: boolean;
}

@Component({
  selector: 'app-plan-detail-dialog',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './plan-detail-dialog.component.html',
  styleUrl: './plan-detail-dialog.component.scss'
})
export class PlanDetailDialogComponent {
  readonly data = inject<PlanDetailData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlanDetailDialogComponent, string>);
  readonly plan = this.data.plan;

  price(): string {
    const factor = yearlyFactor(this.plan.remiseAnnuelle);
    const monthly = this.data.yearly ? Math.round(this.plan.priceMonthly * factor) : this.plan.priceMonthly;
    return fcfa(monthly);
  }

  yearTotal(): string {
    return fcfa(Math.round(this.plan.priceMonthly * yearlyFactor(this.plan.remiseAnnuelle)) * 12);
  }

  close(): void {
    this.dialogRef.close();
  }

  choose(): void {
    this.dialogRef.close(this.plan.code);
  }
}

@Injectable({ providedIn: 'root' })
export class PlanDetailDialogService {
  private readonly dialog = inject(MatDialog);

  open(plan: HomePlan, yearly = false): MatDialogRef<PlanDetailDialogComponent, string> {
    return this.dialog.open(PlanDetailDialogComponent, {
      data: { plan, yearly },
      width: '920px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
      panelClass: 'plan-detail-dialog',
      backdropClass: 'workshop-profile-backdrop'
    });
  }
}
