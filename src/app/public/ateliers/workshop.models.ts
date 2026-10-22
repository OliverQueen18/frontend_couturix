export interface Workshop {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  tone: string;
  city: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  specialties: string[];
  services: string[];
  priceMin?: number;
  priceMax?: number;
  type?: string;
  verified?: boolean;
  premium?: boolean;
  gold?: boolean;
  popular?: boolean;
  isNew?: boolean;
  topRated?: boolean;
  favorite?: boolean;
  availability?: string[];
  phone?: string;
  whatsapp?: string;
  createdAt?: string;
  remote?: boolean;
}

export interface WorkshopFilters {
  query?: string;
  cities?: string[];
  specialties?: string[];
  services?: string[];
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  availability?: string[];
  workshopTypes?: string[];
  statuses?: string[];
  sort?: WorkshopSort;
  page?: number;
  pageSize?: number;
}

export type WorkshopSort = 'rating' | 'popular' | 'recent' | 'name-asc' | 'name-desc';

export interface WorkshopResult {
  items: Workshop[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  cityCounts: Record<string, number>;
}

export const PRICE_MIN = 0;
export const PRICE_MAX = 500_000;

export const QUICK_CITIES = ['Bamako', 'Sikasso', 'Kayes', 'Koulikoro', 'Ségou', 'Mopti'];
export const CITIES = ['Bamako', 'Kati', 'Koulikoro', 'Sikasso', 'Ségou', 'Kayes', 'Mopti', 'Gao', 'Tombouctou'];
export const SPECIALTIES = [
  'Robes de soirée', 'Robes de mariée', 'Tenues traditionnelles', 'Mode homme', 'Mode femme',
  'Enfants', 'Retouches', 'Broderie', 'Accessoires', 'Sur mesure', 'Prêt-à-porter', 'Haute couture', 'Bazin'
];
export const AVAILABILITY = ['Disponible maintenant', 'Sur rendez-vous', 'Commande ouverte', 'Livraison disponible', 'Service à domicile'];
export const WORKSHOP_TYPES = ['Atelier individuel', 'Maison de couture', 'Créateur / Designer', 'Haute couture', 'Prêt-à-porter', 'Retouches', 'Broderie', 'Atelier mixte'];
export const STATUSES = [
  { id: 'verified', label: 'Atelier vérifié' },
  { id: 'premium', label: 'Premium' },
  { id: 'gold', label: 'Gold' },
  { id: 'top', label: 'Top noté' },
  { id: 'new', label: 'Nouveau' }
];
export const RATINGS = [
  { value: 4.5, label: '4.5 et plus' },
  { value: 4, label: '4 et plus' },
  { value: 3, label: '3 et plus' }
];

export interface WorkshopBadge {
  label: string;
  kind: 'top' | 'verified' | 'premium' | 'gold' | 'popular' | 'new';
}

export function workshopBadge(workshop: Workshop): WorkshopBadge | null {
  if (workshop.gold) return { label: 'Gold', kind: 'gold' };
  if (workshop.premium) return { label: 'Premium', kind: 'premium' };
  if (workshop.topRated) return { label: 'Top noté', kind: 'top' };
  if (workshop.verified) return { label: 'Vérifié', kind: 'verified' };
  if (workshop.popular) return { label: 'Populaire', kind: 'popular' };
  if (workshop.isNew) return { label: 'Nouveau', kind: 'new' };
  return null;
}

export function formatPrice(price?: number | null): string {
  return `${new Intl.NumberFormat('fr-FR').format(Number(price ?? 0))} FCFA`;
}

export function emptyWorkshopFilters(): WorkshopFilters {
  return { sort: 'rating', page: 1, pageSize: 8, minPrice: PRICE_MIN, maxPrice: PRICE_MAX };
}
