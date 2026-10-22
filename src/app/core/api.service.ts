import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageResponse } from './models';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http.post<T>(this.url(path), this.payload(body));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), this.payload(body));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), this.payload(body));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  upload<T>(path: string, file: File, field = 'file'): Observable<T> {
    const data = new FormData();
    data.append(field, file);
    return this.http.post<T>(this.url(path), data);
  }

  download(path: string, params?: QueryParams): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: this.toParams(params),
      responseType: 'blob'
    });
  }

  fileUrl(path?: string | null): string {
    if (!path) {
      return 'favicon-couturix.jpg';
    }
    if (path.startsWith('http')) {
      return path;
    }
    if (path.startsWith('/')) {
      return path;
    }
    return `${this.baseUrl}/${path}`;
  }

  asPage<T>(res: T[] | PageResponse<T>, fallbackPage = 0, fallbackSize = 20): PageResponse<T> {
    if (Array.isArray(res)) {
      return {
        content: res,
        page: fallbackPage,
        size: res.length || fallbackSize,
        totalElements: res.length,
        totalPages: 1
      };
    }
    return res;
  }

  openBlob(blob: Blob): void {
    const href = URL.createObjectURL(blob);
    window.open(href, '_blank');
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }

  private payload(body: unknown): unknown {
    if (body instanceof FormData || body instanceof Blob) {
      return body;
    }
    return this.clean(body);
  }

  private clean(value: unknown): unknown {
    if (value === '') {
      return null;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.clean(item));
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, this.clean(item)])
      );
    }
    return value;
  }

  private toParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
