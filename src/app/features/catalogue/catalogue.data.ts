import { CatalogueModel } from './catalogue.models';

const sizes = ['S', 'M', 'L', 'XL', 'Sur mesure'];

export const CATALOGUE_MOCKS: CatalogueModel[] = [
  model(1001, 'Robe en bazin brodé', 45000, 'robes-femme', 'Robes femme', 'robe', '#7a2ea8', {
    workshopId: 1, workshopName: 'Atelier Élégance', city: 'Bamako', fabric: 'Bazin', gender: 'Femme',
    occasion: 'Cérémonie', style: 'Traditionnel', colors: ['Violet', 'Or'], badge: 'Nouveau', rating: 4.9,
    reviewCount: 128, availability: 'Disponible', createdAt: '2026-10-12'
  }),
  model(1002, 'Ensemble boubou moderne', 38000, 'traditionnel', 'Tenues traditionnelles', 'boubou', '#2f8f4e', {
    workshopId: 2, workshopName: 'Maison Awa Couture', city: 'Bamako', fabric: 'Bazin', gender: 'Femme',
    occasion: 'Cérémonie', style: 'Moderne', colors: ['Vert', 'Or'], badge: 'Populaire', rating: 4.8,
    reviewCount: 96, availability: 'Disponible', createdAt: '2026-10-08'
  }),
  model(1003, 'Robe de mariée princesse', 350000, 'robes-mariee', 'Robes de mariée', 'mariee', '#f3efe8', {
    workshopId: 3, workshopName: 'Atelier Prestige', city: 'Ségou', fabric: 'Dentelle', gender: 'Femme',
    occasion: 'Mariage', style: 'Haute couture', colors: ['Blanc'], badge: 'Premium', rating: 4.9,
    reviewCount: 102, availability: 'Sur commande', createdAt: '2026-09-28'
  }),
  model(1004, 'Robe de soirée', 75000, 'robes-soiree', 'Robes de soirée', 'robe', '#1c1c1c', {
    workshopId: 4, workshopName: 'Studio Faso Chic', city: 'Kayes', fabric: 'Soie', gender: 'Femme',
    occasion: 'Soirée', style: 'Chic', colors: ['Noir', 'Or'], badge: 'Promo', oldPrice: 95000, rating: 4.7,
    reviewCount: 74, availability: 'Promotion', createdAt: '2026-10-02'
  }),
  model(1005, 'Tenue homme moderne', 60000, 'homme', 'Mode homme', 'homme', '#2457c5', {
    workshopId: 8, workshopName: 'Atelier Mode Plus', city: 'Koulikoro', fabric: 'Coton', gender: 'Homme',
    occasion: 'Cérémonie', style: 'Moderne', colors: ['Bleu'], rating: 4.6, reviewCount: 58,
    availability: 'Disponible', createdAt: '2026-09-18'
  }),
  model(1006, 'Robe traditionnelle', 40000, 'traditionnel', 'Tenues traditionnelles', 'boubou', '#c0392b', {
    workshopId: 5, workshopName: 'Créa Style', city: 'Ségou', fabric: 'Wax', gender: 'Femme',
    occasion: 'Traditionnel', style: 'Africain', colors: ['Rouge', 'Multicolore'], rating: 4.8,
    reviewCount: 81, availability: 'Disponible', createdAt: '2026-08-30'
  }),
  model(1007, 'Robe fille cérémonie', 25000, 'enfants', 'Enfants', 'enfant', '#2b3f88', {
    workshopId: 6, workshopName: 'Atelier Douceur', city: 'Bamako', fabric: 'Soie', gender: 'Enfant',
    occasion: 'Cérémonie', style: 'Élégant', colors: ['Bleu', 'Or'], badge: 'Enfant', rating: 4.9,
    reviewCount: 65, availability: 'Disponible', createdAt: '2026-10-05'
  }),
  model(1008, 'Ensemble homme africain', 55000, 'homme', 'Mode homme', 'homme', '#c4a574', {
    workshopId: 7, workshopName: 'Faso Création', city: 'Mopti', fabric: 'Bazin', gender: 'Homme',
    occasion: 'Traditionnel', style: 'Africain', colors: ['Beige', 'Or'], rating: 4.7, reviewCount: 52,
    availability: 'Livraison rapide', createdAt: '2026-09-12'
  }),
  model(1009, 'Tenue en bogolan', 42000, 'traditionnel', 'Tenues traditionnelles', 'boubou', '#1f6b4a', {
    workshopId: 1, workshopName: 'Atelier Élégance', city: 'Bamako', fabric: 'Bogolan', gender: 'Mixte',
    occasion: 'Traditionnel', style: 'Africain', colors: ['Vert', 'Jaune'], badge: 'Populaire', rating: 4.9,
    reviewCount: 110, availability: 'Disponible', createdAt: '2026-10-14'
  }),
  model(1010, 'Robe longue fendue', 80000, 'robes-soiree', 'Robes de soirée', 'robe', '#9b1b3a', {
    workshopId: 9, workshopName: 'Atelier Glamour', city: 'Bamako', fabric: 'Soie', gender: 'Femme',
    occasion: 'Soirée', style: 'Chic', colors: ['Rouge'], badge: 'Premium', rating: 4.8, reviewCount: 77,
    availability: 'Sur commande', createdAt: '2026-09-22'
  }),
  model(1011, 'Boubou prestige femme', 120000, 'robes-femme', 'Robes femme', 'boubou', '#6f2485', {
    workshopId: 2, workshopName: 'Maison Awa Couture', city: 'Sikasso', fabric: 'Bazin', gender: 'Femme',
    occasion: 'Cérémonie', style: 'Haute couture', colors: ['Violet', 'Or'], badge: 'Premium', rating: 4.9,
    reviewCount: 88, availability: 'Sur commande', createdAt: '2026-10-01'
  }),
  model(1012, 'Ensemble bazin homme', 65000, 'homme', 'Mode homme', 'homme', '#1d4e89', {
    workshopId: 4, workshopName: 'Studio Faso Chic', city: 'Kayes', fabric: 'Bazin', gender: 'Homme',
    occasion: 'Fête', style: 'Africain', colors: ['Bleu'], badge: 'Nouveau', rating: 4.5, reviewCount: 41,
    availability: 'Disponible', createdAt: '2026-10-16'
  }),
  model(1013, 'Robe cérémonie dentelle', 180000, 'robes-mariee', 'Robes de mariée', 'mariee', '#f7f1e8', {
    workshopId: 3, workshopName: 'Atelier Prestige', city: 'Bamako', fabric: 'Dentelle', gender: 'Femme',
    occasion: 'Mariage', style: 'Classique', colors: ['Blanc', 'Beige'], badge: 'Promo', oldPrice: 210000,
    rating: 4.8, reviewCount: 63, availability: 'Promotion', createdAt: '2026-09-02'
  }),
  model(1014, 'Tenue traditionnelle enfant', 30000, 'enfants', 'Enfants', 'enfant', '#e2b007', {
    workshopId: 6, workshopName: 'Atelier Douceur', city: 'Sikasso', fabric: 'Wax', gender: 'Enfant',
    occasion: 'Traditionnel', style: 'Africain', colors: ['Jaune', 'Multicolore'], badge: 'Enfant', rating: 4.6,
    reviewCount: 29, availability: 'Disponible', createdAt: '2026-08-14'
  }),
  model(1015, 'Costume africain homme', 70000, 'homme', 'Mode homme', 'homme', '#7a4b2e', {
    workshopId: 8, workshopName: 'Atelier Mode Plus', city: 'Gao', fabric: 'Lin', gender: 'Homme',
    occasion: 'Travail', style: 'Classique', colors: ['Marron'], rating: 4.4, reviewCount: 22,
    availability: 'Livraison rapide', createdAt: '2026-07-20'
  }),
  model(1016, 'Robe wax moderne', 35000, 'robes-femme', 'Robes femme', 'robe', '#e21b70', {
    workshopId: 5, workshopName: 'Créa Style', city: 'Kati', fabric: 'Wax', gender: 'Femme',
    occasion: 'Quotidien', style: 'Casual', colors: ['Rose', 'Multicolore'], badge: 'Nouveau', rating: 4.7,
    reviewCount: 54, availability: 'Disponible', createdAt: '2026-10-11'
  }),
  model(1017, 'Retouche ourlet express', 8000, 'retouches', 'Retouches', 'retouche', '#f1c453', {
    workshopId: 1, workshopName: 'Atelier Élégance', city: 'Bamako', fabric: 'Coton', gender: 'Mixte',
    occasion: 'Quotidien', style: 'Classique', colors: ['Beige'], rating: 4.8, reviewCount: 40,
    availability: 'Livraison rapide', createdAt: '2026-10-09'
  }),
  model(1018, 'Sac perles cérémonie', 15000, 'accessoires', 'Accessoires', 'accessoire', '#f4d7e6', {
    workshopId: 9, workshopName: 'Atelier Glamour', city: 'Bamako', fabric: 'Autre', gender: 'Femme',
    occasion: 'Fête', style: 'Chic', colors: ['Rose', 'Or'], rating: 4.6, reviewCount: 18,
    availability: 'Disponible', createdAt: '2026-09-07'
  })
];

function model(
  id: number,
  name: string,
  price: number,
  categoryId: string,
  categoryName: string,
  kind: CatalogueModel['kind'],
  tone: string,
  extra: Partial<CatalogueModel>
): CatalogueModel {
  return {
    id,
    name,
    price,
    categoryId,
    categoryName,
    kind,
    tone,
    image: '',
    description: `${name}, créé par ${extra.workshopName} à ${extra.city}. Pièce pensée pour une commande sur mesure.`,
    sizes,
    rating: extra.rating ?? 0,
    reviewCount: extra.reviewCount ?? 0,
    workshopId: extra.workshopId ?? 0,
    workshopName: extra.workshopName ?? 'Atelier',
    ...extra
  };
}
