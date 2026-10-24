import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Atelier } from './models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export function bindAtelierScope(load: () => void): void {
  const auth = inject(AuthService);
  const scope = inject(PlatformScopeService);
  if (!auth.isPlatformTeam()) {
    load();
    return;
  }
  effect(() => {
    scope.atelierId();
    untracked(() => load());
  });
}

const STORAGE = 'platformAtelierId';

@Injectable({ providedIn: 'root' })
export class PlatformScopeService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly ateliers = signal<{ id: number; nom: string }[]>([]);
  readonly atelierId = signal<number | null>(this.readStored());

  constructor() {
    if (this.auth.isPlatformTeam()) {
      this.refresh();
    }
  }

  setAtelier(id: number | null): void {
    this.atelierId.set(id);
    if (id == null) {
      localStorage.removeItem(STORAGE);
    } else {
      localStorage.setItem(STORAGE, String(id));
    }
  }

  refresh(): void {
    this.api.get<Atelier[]>('ateliers').subscribe({
      next: (rows) => {
        const flat = this.flatten(rows ?? []);
        this.ateliers.set(flat);
        const current = this.atelierId();
        if (current && !flat.some((row) => row.id === current)) {
          this.setAtelier(null);
        }
      },
      error: () => undefined
    });
  }

  private flatten(rows: Atelier[], prefix = ''): { id: number; nom: string }[] {
    const out: { id: number; nom: string }[] = [];
    for (const row of rows) {
      const nom = prefix ? `${prefix} / ${row.nom}` : row.nom;
      out.push({ id: row.id, nom });
      if (row.enfants?.length) {
        out.push(...this.flatten(row.enfants, nom));
      }
    }
    return out;
  }

  private readStored(): number | null {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) {
      return null;
    }
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
}
