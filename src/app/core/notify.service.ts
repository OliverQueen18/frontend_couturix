import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorResponse } from './models';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, 'OK', { duration: 3500, panelClass: 'cx-snack-ok' });
  }

  error(err: unknown, fallback = 'Une erreur est survenue'): void {
    this.snack.open(this.message(err, fallback), 'Fermer', { duration: 5000 });
  }

  message(err: unknown, fallback = 'Une erreur est survenue'): string {
    if (typeof err === 'string') {
      return err;
    }
    const http = err as HttpErrorResponse;
    if (http?.status === 413) {
      return 'Image trop volumineuse. Choisissez un JPEG, PNG ou WebP plus léger.';
    }
    if (http?.status === 401) {
      return 'Session expirée. Reconnectez-vous pour continuer.';
    }
    const body = http?.error as ErrorResponse | string | undefined;
    if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) {
      return body;
    }
    if (body && typeof body === 'object' && body.message) {
      const extra = body.details?.length ? ` (${body.details.join(', ')})` : '';
      return `${body.message}${extra}`;
    }
    return fallback;
  }
}
