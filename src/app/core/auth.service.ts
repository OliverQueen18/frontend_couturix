import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, shareReplay, tap, throwError } from 'rxjs';
import { AuthUser, TokenResponse } from './models';
import { ApiService } from './api.service';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';
const USER = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private refreshInFlight: Observable<TokenResponse> | null = null;

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  accessToken(): string | null {
    return localStorage.getItem(ACCESS);
  }

  refreshToken(): string | null {
    return localStorage.getItem(REFRESH);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken() && !!this.user;
  }

  hasAnyRole(roles: string[]): boolean {
    const current = this.user?.roles ?? [];
    return roles.some((role) => current.includes(role));
  }

  isStaff(): boolean {
    return this.hasAnyRole([
      'SUPER_ADMIN',
      'ADMIN',
      'GERANT',
      'RECEPTIONNISTE',
      'CAISSIER',
      'TAILLEUR',
      'MAGASINIER',
      'COMPTABLE'
    ]);
  }

  isClient(): boolean {
    return this.hasAnyRole(['CLIENT']) && !this.isStaff();
  }

  isSuperAdmin(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN']);
  }

  isPlatformTeam(): boolean {
    return this.hasAnyRole(['SUPER_ADMIN', 'ADMIN']);
  }

  homeAfterLogin(): string {
    if (this.isPlatformTeam()) {
      return '/app/plateforme';
    }
    if (this.isStaff()) {
      return '/app/dashboard';
    }
    if (this.hasAnyRole(['CLIENT'])) {
      return '/ateliers';
    }
    return '/';
  }

  registerClient(payload: Record<string, unknown>): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('auth/register-client', payload).pipe(
      tap((response) => this.persist(response))
    );
  }

  isEmailVerified(): boolean {
    return this.user?.emailVerified !== false;
  }

  registerAtelier(payload: Record<string, unknown>): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('auth/register-atelier', payload).pipe(
      tap((response) => this.persist(response))
    );
  }

  login(email: string, password: string): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('auth/login', { email, password }).pipe(
      tap((response) => this.persist(response))
    );
  }

  refreshTokens(): Observable<TokenResponse> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('Session expirée'));
    }
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.api.post<TokenResponse>('auth/refresh', { refreshToken }).pipe(
        tap((response) => this.persist(response)),
        catchError((err) => {
          this.clearSession();
          void this.router.navigateByUrl('/login');
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1)
      );
    }
    return this.refreshInFlight;
  }

  forgotPassword(email: string): Observable<void> {
    return this.api.post<void>('auth/forgot-password', { email });
  }

  verifyEmail(email: string, code: string): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('auth/verify-email', { email, code }).pipe(
      tap((response) => this.persist(response))
    );
  }

  resendOtp(email: string, purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET'): Observable<void> {
    return this.api.post<void>('auth/resend-otp', { email, purpose });
  }

  resetPasswordOtp(email: string, code: string, newPassword: string): Observable<void> {
    return this.api.post<void>('auth/reset-password-otp', { email, code, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.api.post<void>('auth/change-password', { currentPassword, newPassword });
  }

  logout(): void {
    const refreshToken = this.refreshToken();
    this.api.post<void>('auth/logout', { refreshToken }).subscribe({
      error: () => undefined
    });
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
    this.userSubject.next(null);
  }

  displayName(): string {
    const user = this.user;
    if (!user) {
      return '';
    }
    return `${user.prenom} ${user.nom}`.trim();
  }

  private persist(response: TokenResponse): void {
    localStorage.setItem(ACCESS, response.accessToken);
    localStorage.setItem(REFRESH, response.refreshToken);
    const user: AuthUser = {
      userId: response.userId,
      email: response.email,
      nom: response.nom,
      prenom: response.prenom,
      roles: [...(response.roles ?? [])],
      mustChangePassword: response.mustChangePassword,
      emailVerified: response.emailVerified !== false,
      atelierId: response.atelierId,
      atelierNom: response.atelierNom,
      atelierLogoUrl: response.atelierLogoUrl
    };
    localStorage.setItem(USER, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
