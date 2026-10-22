import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isEmailVerified()) {
    return router.createUrlTree(['/verification-email'], { queryParams: { email: auth.user?.email } });
  }
  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return true;
  }
  if (!auth.isEmailVerified()) {
    return router.createUrlTree(['/verification-email'], { queryParams: { email: auth.user?.email } });
  }
  return router.createUrlTree([auth.homeAfterLogin()]);
};

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isStaff()) {
    return true;
  }
  return router.createUrlTree([auth.homeAfterLogin()]);
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as string[] | undefined) ?? [];
  if (roles.length === 0 || auth.hasAnyRole(roles)) {
    return true;
  }
  return router.createUrlTree([auth.homeAfterLogin()]);
};

export const matchAuthenticated: CanMatchFn = () => inject(AuthService).isAuthenticated();
export const matchGuest: CanMatchFn = () => !inject(AuthService).isAuthenticated();
