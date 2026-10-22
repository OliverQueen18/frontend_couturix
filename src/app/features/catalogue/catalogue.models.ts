export interface CatalogueModel {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  image: string;
  tone: string;
  kind: GarmentKind;
  categoryId: string;
  categoryName: string;
  workshopId: number;
  workshopName: string;
  workshopSlug?: string;
  city?: string;
  fabric?: string;
  gender?: string;
  occasion?: string;
  style?: string;
  sizes?: string[];
  colors?: string[];
  rating: number;
  reviewCount: number;
  favorite?: boolean;
  badge?: 'Nouveau' | 'Populaire' | 'Promo' | 'Premium' | 'Enfant';
  availability?: string;
  createdAt?: string;
  remote?: boolean;
}

export type GarmentKind = 'robe' | 'boubou' | 'mariee' | 'homme' | 'enfant' | 'accessoire' | 'retouche';

export interface CatalogueFilters {
  query?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  fabrics?: string[];
  genders?: string[];
  occasions?: string[];
  styles?: string[];
  sizes?: string[];
  colors?: string[];
  city?: string;
  workshopId?: number;
  minRating?: number;
  availability?: string[];
  sort?: CatalogueSort;
  page?: number;
  pageSize?: number;
}

export type CatalogueSort = 'recent' | 'popular' | 'rating' | 'price-asc' | 'price-desc';

export interface CatalogueCategory {
  id: string;
  label: string;
  icon: string;
}

export interface CatalogueResult {
  items: CatalogueModel[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  counts: Record<string, number>;
  workshops: { id: number; name: string }[];
}

export const PRICE_MIN = 0;
export const PRICE_MAX = 500_000;

export const CATALOGUE_CATEGORIES: CatalogueCategory[] = [
  { id: 'tous', label: 'Tous', icon: 'apps' },
  { id: 'robes-femme', label: 'Robes femme', icon: 'checkroom' },
  { id: 'robes-soiree', label: 'Robes de soirée', icon: 'nightlife' },
  { id: 'robes-mariee', label: 'Robes de mariée', icon: 'diamond' },
  { id: 'traditionnel', label: 'Tenues traditionnelles', icon: 'dry_cleaning' },
  { id: 'homme', label: 'Mode homme', icon: 'man' },
  { id: 'enfants', label: 'Enfants', icon: 'child_care' },
  { id: 'retouches', label: 'Retouches', icon: 'content_cut' },
  { id: 'accessoires', label: 'Accessoires', icon: 'shopping_bag' }
];

export const FABRICS = ['Bazin', 'Bogolan', 'Wax', 'Soie', 'Coton', 'Dentelle', 'Velours', 'Lin', 'Jean', 'Autre'];
export const GENDERS = ['Femme', 'Homme', 'Enfant', 'Mixte'];
export const OCCASIONS = ['Mariage', 'Baptême', 'Cérémonie', 'Fête', 'Travail', 'Quotidien', 'Soirée', 'Traditionnel', 'Religion', 'Autre'];
export const STYLES = ['Traditionnel', 'Moderne', 'Élégant', 'Classique', 'Africain', 'Casual', 'Chic', 'Haute couture'];
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Sur mesure'];
export const COLORS = [
  { name: 'Noir', hex: '#1c1c1c' },
  { name: 'Blanc', hex: '#f4f1ea' },
  { name: 'Rouge', hex: '#c0392b' },
  { name: 'Bleu', hex: '#2457c5' },
  { name: 'Vert', hex: '#1f8a4c' },
  { name: 'Jaune', hex: '#e2b007' },
  { name: 'Rose', hex: '#e21b70' },
  { name: 'Violet', hex: '#6f2485' },
  { name: 'Marron', hex: '#7a4b2e' },
  { name: 'Beige', hex: '#d9c3a1' },
  { name: 'Multicolore', hex: 'conic-gradient(#e21b70, #f1c453, #2457c5, #1f8a4c, #e21b70)' }
];
export const CITIES = ['Bamako', 'Kati', 'Koulikoro', 'Sikasso', 'Ségou', 'Kayes', 'Mopti', 'Gao', 'Tombouctou'];
export const RATINGS = [
  { value: 4.5, label: '4.5 et plus' },
  { value: 4, label: '4 et plus' },
  { value: 3, label: '3 et plus' }
];
export const AVAILABILITY = ['Disponible', 'Sur commande', 'Livraison rapide', 'Promotion'];

export function formatPrice(price?: number | null): string {
  return `${new Intl.NumberFormat('fr-FR').format(Number(price ?? 0))} FCFA`;
}

export function emptyFilters(): CatalogueFilters {
  return { sort: 'recent', page: 1, pageSize: 12, minPrice: PRICE_MIN, maxPrice: PRICE_MAX };
}
