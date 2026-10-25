import { ErrorHandler, Injectable, inject, provideAppInitializer } from '@angular/core';
import { NavigationEnd, NavigationError, Router } from '@angular/router';

const FLAG = 'cx-chunk-reload';

function isStaleChunk(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Loading chunk [\w.-]+ failed|ChunkLoadError/i.test(
    text
  );
}

export function reloadIfStaleChunk(error: unknown): boolean {
  if (!isStaleChunk(error) || typeof sessionStorage === 'undefined') {
    return false;
  }
  if (sessionStorage.getItem(FLAG) === '1') {
    return false;
  }
  sessionStorage.setItem(FLAG, '1');
  location.reload();
  return true;
}

@Injectable()
export class StaleChunkErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (reloadIfStaleChunk(error)) {
      return;
    }
    console.error(error);
  }
}

export function provideStaleChunkReload() {
  return [
    { provide: ErrorHandler, useClass: StaleChunkErrorHandler },
    provideAppInitializer(() => {
      const router = inject(Router);
      router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          sessionStorage.removeItem(FLAG);
        } else if (event instanceof NavigationError) {
          reloadIfStaleChunk(event.error);
        }
      });
    })
  ];
}
