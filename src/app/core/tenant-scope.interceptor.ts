import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { PlatformScopeService } from './platform-scope.service';

export const tenantScopeInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const scope = inject(PlatformScopeService);
  const atelierId = scope.atelierId();
  if (!auth.isPlatformTeam() || atelierId == null || req.method !== 'GET' || !shouldScope(req.url) || req.params.has('atelierId')) {
    return next(req);
  }
  return next(req.clone({ setParams: { atelierId: String(atelierId) } }));
};

function shouldScope(url: string): boolean {
  if (/\/api\/v1\/(auth|public|admin|files)\b/.test(url)) {
    return false;
  }
  if (/\/api\/v1\/ateliers(\?|$)/.test(url) || /\/api\/v1\/ateliers\/courant/.test(url)) {
    return false;
  }
  return /\/api\/v1\//.test(url);
}
