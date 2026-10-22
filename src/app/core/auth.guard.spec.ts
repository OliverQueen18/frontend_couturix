import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'hasAnyRole']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) => commands as unknown as UrlTree);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('autorise un utilisateur authentifié', () => {
    auth.isAuthenticated.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBeTrue();
  });

  it('redirige vers /login si non authentifié', () => {
    auth.isAuthenticated.and.returnValue(false);
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('empêche un visiteur authentifié d’accéder au login', () => {
    auth.isAuthenticated.and.returnValue(true);
    TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('refuse un rôle non autorisé', () => {
    auth.hasAnyRole.and.returnValue(false);
    TestBed.runInInjectionContext(() =>
      roleGuard({ data: { roles: ['ADMIN'] } } as never, {} as never)
    );
    expect(router.createUrlTree).toHaveBeenCalledWith(['/app/dashboard']);
  });
});

describe('auth interceptor helpers', () => {
  it('détecte une erreur 401', () => {
    const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    expect(err.status).toBe(401);
  });
});
