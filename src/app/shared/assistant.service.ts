import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AtelierPublic, Modele, PageResponse } from '../core/models';

export interface AssistantHit {
  kind: 'atelier' | 'modele' | 'page';
  title: string;
  detail: string;
  path: string;
  query?: Record<string, string>;
}

export interface AssistantReply {
  text: string;
  hits: AssistantHit[];
  suggestions: string[];
}

const STOP = new Set([
  'je', 'tu', 'on', 'veux', 'voudrais', 'cherche', 'chercher', 'recherche', 'rechercher',
  'trouve', 'trouver', 'montre', 'montrer', 'voir', 'liste', 'un', 'une', 'des', 'de', 'du',
  'la', 'le', 'les', 'a', 'au', 'aux', 'en', 'et', 'pour', 'sur', 'avec', 'dans', 'mon', 'ma',
  'mes', 'svp', 'stp', 'vous', 'plait', 'bonjour', 'salut', 'merci', 'couturix',
  'voir', 'montre', 'montrer', 'liste', 'atelier', 'ateliers', 'modele', 'modeles',
  'robe', 'robes', 'creer', 'ouvrir', 'offre', 'choisir', 'commencer', 'gratuitement', 'catalogue'
]);

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly api = inject(ApiService);

  reply(message: string): Observable<AssistantReply> {
    const text = this.fold(message);
    const tokens = this.tokens(text);
    const searching = /cherch|recherch|trouv|montre|liste|voir les|ou sont|ou est/.test(text);

    if (/mot de passe|oublie/.test(text)) {
      return of(this.page(
        'Je vous emmène vers la récupération du mot de passe. Un code sera envoyé sur votre e-mail.',
        { kind: 'page', title: 'Mot de passe oublié', detail: 'Recevoir un code', path: '/mot-de-passe-oublie' },
        ['Me connecter', 'Créer un compte client']
      ));
    }
    if (/connect|login|identifi/.test(text) && !/inscri|creer|ouvrir/.test(text)) {
      return of(this.page(
        'La connexion se fait avec l’e-mail du compte atelier ou du compte client.',
        { kind: 'page', title: 'Connexion', detail: 'Accéder à mon espace', path: '/login' },
        ['Mot de passe oublié', 'Créer mon atelier']
      ));
    }
    if (!searching && /client/.test(text)) {
      return of(this.page(
        'Un compte client permet de suivre les ateliers, d’enregistrer une adresse et de laisser un avis.',
        { kind: 'page', title: 'Créer un compte client', detail: 'Inscription en quelques champs', path: '/inscription-client' },
        ['Chercher un atelier', 'Voir le catalogue']
      ));
    }
    if (/tarif|abonnement/.test(text) && !/robe|bazin|bogolan|soiree|mariage|retouche/.test(text)) {
      return of({
        text: 'Gratuit et Standard : 1 atelier. Premium : jusqu’à 5 ateliers, 35 000 FCFA / mois. Gold : ateliers illimités, 60 000 FCFA / mois. L’annuel est à −20 %.',
        hits: [
          { kind: 'page', title: 'Voir les tarifs', detail: 'Tous les prix sont en FCFA', path: '/' },
          { kind: 'page', title: 'Choisir Premium', detail: 'Jusqu’à 5 ateliers', path: '/inscription', query: { plan: 'PREMIUM' } }
        ],
        suggestions: ['Commencer gratuitement', 'Choisir Gold', 'Créer un compte client']
      });
    }
    if (!searching && (/inscri|creer|ouvrir|abonn/.test(text) || /gold|premium|standard|gratuit/.test(text))) {
      const plan = this.plan(text);
      return of({
        text: `L’offre ${plan.label} inclut ${plan.limit}. L’inscription crée l’atelier et le compte du gérant. Un code OTP confirme l’e-mail.`,
        hits: [{
          kind: 'page',
          title: `Créer mon atelier — ${plan.label}`,
          detail: plan.price,
          path: '/inscription',
          query: { plan: plan.code }
        }, {
          kind: 'page',
          title: 'Comparer les tarifs',
          detail: 'Gratuit, Standard, Premium et Gold',
          path: '/'
        }],
        suggestions: ['Je suis un client', 'Chercher un atelier à Bamako', 'Voir les modèles']
      });
    }
    if (/contact|partenair|publicit/.test(text)) {
      return of(this.page(
        'Pour un partenariat ou une publicité, la section Contact de l’accueil rassemble les demandes.',
        { kind: 'page', title: 'Contact', detail: 'Écrire à CouturiX', path: '/' },
        ['Voir les tarifs', 'Créer mon atelier']
      ));
    }
    if (!searching && /^(bonjour|salut|hello|aide|help)\b|que peux|que sait|comment ca marche/.test(text) && tokens.length === 0) {
      return of(this.help());
    }

    const wantsAtelier = /atelier|maison|coutur/.test(text);
    const wantsModele = /modele|robe|bazin|bogolan|tenue|retouche|broder|catalogue|creation|mariage|soiree/.test(text);
    const kind = wantsAtelier && !wantsModele ? 'ateliers' : wantsModele && !wantsAtelier ? 'modeles' : 'both';
    return this.search(kind, tokens);
  }

  private search(kind: 'ateliers' | 'modeles' | 'both', tokens: string[]): Observable<AssistantReply> {
    const query = tokens.join(' ');
    const ateliers$ = kind === 'modeles' ? of([] as AssistantHit[]) : this.ateliers(query, tokens);
    const modeles$ = kind === 'ateliers' ? of([] as AssistantHit[]) : this.modeles(query, tokens);
    return forkJoin({ ateliers: ateliers$, modeles: modeles$ }).pipe(
      map(({ ateliers, modeles }) => {
        const hits = [...ateliers, ...modeles].slice(0, 6);
        if (!hits.length) {
          const catalogue = kind === 'modeles';
          return {
            text: query
              ? `Je n’ai rien trouvé pour « ${query} ». La page de recherche reste ouverte avec ce mot, ou essayez une ville et un type de création.`
              : 'Dites-moi une ville ou un type de création, par exemple « atelier à Sikasso » ou « robe en bazin ».',
            hits: query ? [{
              kind: 'page' as const,
              title: catalogue ? 'Ouvrir le catalogue' : 'Ouvrir les ateliers',
              detail: `Recherche « ${query} »`,
              path: catalogue ? '/catalogue' : '/ateliers',
              query: { q: query }
            }] : [],
            suggestions: ['Atelier Faso', 'Modèles', 'Créer mon atelier', 'Voir les tarifs']
          };
        }
        const label = query ? `pour « ${query} »` : 'sur CouturiX';
        return {
          text: `Voici ce que j’ai trouvé ${label}. Ouvrez une fiche, ou affinez la recherche.`,
          hits,
          suggestions: ['Créer mon atelier', 'Créer un compte client', 'Voir les tarifs']
        };
      })
    );
  }

  private ateliers(query: string, tokens: string[]): Observable<AssistantHit[]> {
    return this.api.get<AtelierPublic[]>('public/ateliers', query ? { q: query } : undefined).pipe(
      switchMap((rows) => {
        const found = this.rankAteliers(rows ?? [], tokens);
        if (found.length || tokens.length < 2) {
          return of(found);
        }
        return this.api.get<AtelierPublic[]>('public/ateliers').pipe(
          map((all) => this.rankAteliers(all ?? [], tokens))
        );
      }),
      map((rows) => rows.slice(0, 3).map((atelier) => ({
        kind: 'atelier' as const,
        title: atelier.nom,
        detail: [atelier.ville, atelier.pays].filter(Boolean).join(', ') || 'Atelier',
        path: `/ateliers/${atelier.slug}`
      })))
    );
  }

  private modeles(query: string, tokens: string[]): Observable<AssistantHit[]> {
    return this.api.get<PageResponse<Modele>>('public/modeles', { q: query || undefined, page: 0, size: 48 }).pipe(
      switchMap((page) => {
        const found = this.rankModeles(page.content ?? [], tokens);
        if (found.length || !query) {
          return of(found);
        }
        return this.api.get<PageResponse<Modele>>('public/modeles', { page: 0, size: 48 }).pipe(
          map((all) => this.rankModeles(all.content ?? [], tokens))
        );
      }),
      map((rows) => rows.slice(0, 3).map((modele) => ({
        kind: 'modele' as const,
        title: modele.nom,
        detail: [modele.categorieNom, this.fcfa(modele.prixIndicatif)].filter(Boolean).join(' · '),
        path: `/catalogue/${modele.id}`
      })))
    );
  }

  private rankAteliers(rows: AtelierPublic[], tokens: string[]): AtelierPublic[] {
    if (!tokens.length) {
      return rows;
    }
    return rows.filter((atelier) => {
      const blob = this.fold([atelier.nom, atelier.ville, atelier.pays, atelier.description].filter(Boolean).join(' '));
      return tokens.some((token) => blob.includes(token));
    });
  }

  private rankModeles(rows: Modele[], tokens: string[]): Modele[] {
    if (!tokens.length) {
      return rows;
    }
    return rows.filter((modele) => {
      const blob = this.fold([modele.nom, modele.description, modele.categorieNom, modele.tissuRecommande].filter(Boolean).join(' '));
      return tokens.some((token) => blob.includes(token));
    });
  }

  private help(): AssistantReply {
    return {
      text: 'Je peux chercher un atelier ou un modèle, comparer les offres, et ouvrir l’inscription d’un atelier ou d’un compte client.',
      hits: [
        { kind: 'page', title: 'Ateliers', detail: 'Maisons de couture publiées', path: '/ateliers' },
        { kind: 'page', title: 'Catalogue', detail: 'Modèles publiés', path: '/catalogue' },
        { kind: 'page', title: 'Créer mon atelier', detail: 'Offre Gratuite', path: '/inscription', query: { plan: 'GRATUIT' } }
      ],
      suggestions: ['Ateliers à Bamako', 'Robes de soirée', 'Voir les tarifs', 'Créer un compte client']
    };
  }

  private page(text: string, hit: AssistantHit, suggestions: string[]): AssistantReply {
    return { text, hits: [hit], suggestions };
  }

  private plan(text: string): { code: string; label: string; limit: string; price: string } {
    if (text.includes('gold')) {
      return { code: 'GOLD', label: 'Gold', limit: 'des ateliers illimités', price: '60 000 FCFA / mois' };
    }
    if (text.includes('premium')) {
      return { code: 'PREMIUM', label: 'Premium', limit: 'jusqu’à 5 ateliers', price: '35 000 FCFA / mois' };
    }
    if (text.includes('standard')) {
      return { code: 'STANDARD', label: 'Standard', limit: '1 atelier', price: '15 000 FCFA / mois' };
    }
    return { code: 'GRATUIT', label: 'Gratuite', limit: '1 atelier', price: '0 FCFA' };
  }

  private tokens(text: string): string[] {
    return text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP.has(word));
  }

  private fold(value: string): string {
    return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  }

  private fcfa(amount?: number | null): string {
    if (amount == null) {
      return '';
    }
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
  }
}
