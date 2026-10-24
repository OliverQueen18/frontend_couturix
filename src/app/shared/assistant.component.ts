import { AfterViewChecked, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AssistantHit, AssistantService } from './assistant.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  hits?: AssistantHit[];
}

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <section class="assistant" [class.open]="open">
      @if (open) {
        <div class="panel" role="dialog" aria-label="Assistant CouturiX">
          <header>
            <div>
              <strong>Assistant CouturiX</strong>
              <span>Ateliers, modèles, inscription</span>
            </div>
            <button type="button" (click)="open = false" aria-label="Fermer l’assistant">
              <mat-icon>close</mat-icon>
            </button>
          </header>
          <div class="log" #log>
            @for (message of messages; track $index) {
              <article [class.user]="message.role === 'user'">
                <p>{{ message.text }}</p>
                @if (message.hits?.length) {
                  <div class="hits">
                    @for (hit of message.hits; track hit.path + hit.title) {
                      <button type="button" (click)="openHit(hit)">
                        <mat-icon>{{ hit.kind === 'atelier' ? 'storefront' : hit.kind === 'modele' ? 'checkroom' : 'arrow_forward' }}</mat-icon>
                        <span><strong>{{ hit.title }}</strong><small>{{ hit.detail }}</small></span>
                      </button>
                    }
                  </div>
                }
              </article>
            }
            @if (busy) {
              <p class="wait">Je cherche…</p>
            }
          </div>
          @if (suggestions.length) {
            <div class="ideas">
              @for (idea of suggestions; track idea) {
                <button type="button" (click)="ask(idea)">{{ idea }}</button>
              }
            </div>
          }
          <form (ngSubmit)="ask()">
            <input name="q" [(ngModel)]="draft" placeholder="Un atelier, un modèle, une inscription…" aria-label="Message à l’assistant" autocomplete="off">
            <button type="submit" [disabled]="busy || !draft.trim()" aria-label="Envoyer">
              <mat-icon>send</mat-icon>
            </button>
          </form>
        </div>
      }
      <button type="button" class="launcher" (click)="toggle()" [attr.aria-expanded]="open">
        <mat-icon>{{ open ? 'close' : 'auto_awesome' }}</mat-icon>
        <span>Assistant</span>
      </button>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .assistant {
      position: fixed;
      right: 1.1rem;
      bottom: 1.1rem;
      z-index: 80;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.7rem;
      font-family: Outfit, "Segoe UI", sans-serif;
    }
    .launcher, .panel header button, .hits button, .ideas button, form button {
      font: inherit;
      cursor: pointer;
    }
    .launcher {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      height: 52px;
      padding: 0 1rem 0 0.85rem;
      border: 0;
      border-radius: 999px;
      background: #2e1052;
      color: #fff;
      font-weight: 700;
      box-shadow: 0 16px 36px rgba(46, 16, 82, 0.28);
    }
    .panel {
      display: flex;
      flex-direction: column;
      width: min(400px, calc(100vw - 1.5rem));
      height: min(560px, calc(100vh - 7rem));
      border-radius: 22px;
      overflow: hidden;
      background: #fff;
      color: #25142f;
      box-shadow: 0 24px 60px rgba(36, 10, 58, 0.22);
    }
    header, form { display: flex; align-items: center; }
    header {
      justify-content: space-between;
      gap: 0.8rem;
      padding: 0.9rem 0.9rem 0.8rem 1rem;
      background: linear-gradient(135deg, #2e1052, #71145f);
      color: #fff;
    }
    header strong, header span { display: block; }
    header span { color: rgba(255, 255, 255, 0.78); font-size: 0.78rem; }
    header button {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }
    .log { flex: 1; overflow: auto; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.65rem; }
    article {
      max-width: 92%;
      padding: 0.7rem 0.8rem;
      border-radius: 16px;
      background: #f6f1f8;
    }
    article.user { align-self: flex-end; background: #2e1052; color: #fff; }
    article p, .wait { margin: 0; line-height: 1.45; }
    .wait { color: #766c7d; font-size: 0.88rem; }
    .hits { display: grid; gap: 0.4rem; margin-top: 0.65rem; }
    .hits button {
      display: flex;
      gap: 0.55rem;
      align-items: center;
      width: 100%;
      padding: 0.55rem 0.6rem;
      border: 0;
      border-radius: 12px;
      background: #fff;
      color: #25142f;
      text-align: left;
    }
    .hits strong, .hits small { display: block; }
    .hits small { color: #766c7d; font-size: 0.75rem; }
    .hits mat-icon { color: #e21b70; }
    .ideas { display: flex; gap: 0.35rem; flex-wrap: wrap; padding: 0 0.8rem 0.35rem; }
    .ideas button {
      border: 1px solid rgba(46, 16, 82, 0.12);
      border-radius: 999px;
      background: #fff;
      color: #2e1052;
      padding: 0.28rem 0.65rem;
      font-size: 0.78rem;
      font-weight: 600;
    }
    form { gap: 0.4rem; padding: 0.7rem; border-top: 1px solid rgba(46, 16, 82, 0.08); }
    input {
      flex: 1;
      min-width: 0;
      height: 44px;
      border: 0;
      outline: none;
      background: #f6f1f8;
      border-radius: 14px;
      padding: 0 0.8rem;
      font: inherit;
    }
    form button {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 14px;
      background: #e21b70;
      color: #fff;
    }
    form button:disabled { opacity: 0.45; cursor: default; }
  `]
})
export class AssistantComponent implements AfterViewChecked {
  private readonly assistant = inject(AssistantService);
  private readonly router = inject(Router);
  @ViewChild('log') private log?: ElementRef<HTMLElement>;

  open = false;
  busy = false;
  private stickToEnd = false;
  draft = '';
  suggestions = ['Ateliers à Bamako', 'Voir les modèles', 'Créer mon atelier', 'Créer un compte client'];
  messages: ChatMessage[] = [{
    role: 'assistant',
    text: 'Bonjour. Je peux trouver un atelier, un modèle, ou ouvrir la bonne inscription.'
  }];

  ngAfterViewChecked(): void {
    if (!this.stickToEnd) {
      return;
    }
    const node = this.log?.nativeElement;
    if (!node) {
      return;
    }
    this.stickToEnd = false;
    node.scrollTop = node.scrollHeight;
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.scroll();
    }
  }

  ask(text = this.draft): void {
    const message = text.trim();
    if (!message || this.busy) {
      return;
    }
    this.draft = '';
    this.messages.push({ role: 'user', text: message });
    this.busy = true;
    this.scroll();
    this.assistant.reply(message).subscribe({
      next: (answer) => {
        this.busy = false;
        this.suggestions = answer.suggestions;
        this.messages.push({ role: 'assistant', text: answer.text, hits: answer.hits });
        this.scroll();
      },
      error: () => {
        this.busy = false;
        this.messages.push({
          role: 'assistant',
          text: 'Je n’arrive pas à joindre CouturiX pour le moment. Réessayez dans un instant.'
        });
        this.scroll();
      }
    });
  }

  openHit(hit: AssistantHit): void {
    const fragment = hit.path === '/' && hit.title.toLowerCase().includes('tarif') ? 'tarifs' : undefined;
    void this.router.navigate([hit.path], { queryParams: hit.query, fragment });
    this.open = false;
  }

  private scroll(): void {
    this.stickToEnd = true;
  }
}
