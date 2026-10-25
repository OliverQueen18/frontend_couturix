import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

function withBearer(req: Parameters<HttpInterceptorFn>[0], token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isPublicAuthCall(url: string): boolean {
  return /\/auth\/(login|refresh|forgot-password|reset-password|reset-password-otp|register-atelier|register-client|verify-email|resend-otp)(\?|$)/.test(url);
}

function isHtmlError(error: HttpErrorResponse): boolean {
  const body = error.error;
  return typeof body === 'string' && body.trimStart().startsWith('<');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();
  const authReq = token && !isPublicAuthCall(req.url) ? withBearer(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isPublicAuthCall(req.url) || isHtmlError(error)) {
        return throwError(() => error);
      }
      return auth.refreshTokens().pipe(
        switchMap((response) => next(withBearer(req, response.accessToken)))
      );
    })
  );
};
