import { Workshop } from './workshop.models';

const COVERS = [
  'images/workshops/cover-elegance.jpg',
  'images/workshops/cover-awa.jpg',
  'images/workshops/cover-prestige.jpg',
  'images/workshops/cover-faso.jpg'
];

function workshop(index: number, extra: Omit<Workshop, 'services' | 'coverImage'>): Workshop {
  return {
    ...extra,
    services: extra.specialties.slice(0, 3),
    availability: extra.availability ?? ['Sur rendez-vous', 'Commande ouverte'],
    priceMin: extra.priceMin ?? 15_000,
    priceMax: extra.priceMax ?? 180_000,
    coverImage: COVERS[index % COVERS.length]
  };
}

export const WORKSHOP_MOCKS: Workshop[] = [
  workshop(0, {
    id: 2001, slug: 'atelier-elegance', name: 'Atelier Élégance', tone: '#4A1364',
    city: 'Bamako', district: 'Hamdallaye', rating: 4.9, reviewCount: 128,
    specialties: ['Robes de soirée', 'Sur mesure', 'Bazin', 'Broderie'],
    type: 'Maison de couture', verified: true, topRated: true,
    availability: ['Disponible maintenant', 'Sur rendez-vous', 'Livraison disponible'],
    priceMin: 35_000, priceMax: 250_000, phone: '+223 70 11 20 01', whatsapp: '+22370112001',
    description: 'Maison bamakoise réputée pour ses robes de soirée en bazin brodé et le sur-mesure.',
    createdAt: '2024-03-12'
  }),
  workshop(1, {
    id: 2002, slug: 'maison-awa-couture', name: 'Maison Awa Couture', tone: '#20A464',
    city: 'Bamako', district: 'Badalabougou', rating: 4.8, reviewCount: 96,
    specialties: ['Bazin', 'Tenues traditionnelles', 'Broderie'],
    type: 'Maison de couture', verified: true,
    availability: ['Sur rendez-vous', 'Commande ouverte', 'Livraison disponible'],
    priceMin: 25_000, priceMax: 160_000, phone: '+223 76 22 10 02', whatsapp: '+22376221002',
    description: 'Tenues traditionnelles et bazin riche, coupées dans un atelier vérifié du centre.',
    createdAt: '2024-06-02'
  }),
  workshop(2, {
    id: 2003, slug: 'atelier-prestige', name: 'Atelier Prestige', tone: '#7728A3',
    city: 'Sikasso', district: 'Centre', rating: 4.8, reviewCount: 102,
    specialties: ['Robes de mariée', 'Haute couture', 'Broderie'],
    type: 'Haute couture', premium: true, verified: true,
    availability: ['Sur rendez-vous', 'Commande ouverte'],
    priceMin: 80_000, priceMax: 450_000, phone: '+223 79 33 10 03', whatsapp: '+22379331003',
    description: 'Robes de mariée et haute couture, avec essayages sur rendez-vous à Sikasso.',
    createdAt: '2024-01-18'
  }),
  workshop(3, {
    id: 2004, slug: 'studio-faso-chic', name: 'Studio Faso Chic', tone: '#EB2D78',
    city: 'Bamako', district: 'ACI 2000', rating: 4.7, reviewCount: 74,
    specialties: ['Mode homme', 'Prêt-à-porter', 'Retouches'],
    type: 'Prêt-à-porter', popular: true,
    availability: ['Disponible maintenant', 'Sur rendez-vous', 'Livraison disponible'],
    priceMin: 12_000, priceMax: 90_000, phone: '+223 70 44 10 04', whatsapp: '+22370441004',
    description: 'Prêt-à-porter homme et retouches express, très demandé à ACI 2000.',
    createdAt: '2025-02-11'
  }),
  workshop(4, {
    id: 2005, slug: 'crea-style', name: 'Créa Style', tone: '#81175F',
    city: 'Ségou', district: 'Médine', rating: 4.8, reviewCount: 65,
    specialties: ['Tenues traditionnelles', 'Bazin', 'Enfants'],
    type: 'Créateur / Designer', isNew: true,
    availability: ['Commande ouverte', 'Sur rendez-vous', 'Service à domicile'],
    priceMin: 18_000, priceMax: 120_000, phone: '+223 75 55 10 05', whatsapp: '+22375551005',
    description: 'Jeune maison de Ségou : bazin, tenues de cérémonie et une ligne enfant.',
    createdAt: '2026-08-20'
  }),
  workshop(5, {
    id: 2006, slug: 'atelier-douceur', name: 'Atelier Douceur', tone: '#20A464',
    city: 'Mopti', district: 'Komoguel', rating: 4.7, reviewCount: 52,
    specialties: ['Mode femme', 'Sur mesure', 'Retouches'],
    type: 'Atelier individuel', verified: true,
    availability: ['Sur rendez-vous', 'Service à domicile'],
    priceMin: 10_000, priceMax: 85_000, phone: '+223 76 66 10 06', whatsapp: '+22376661006',
    description: 'Coupe femme sur mesure et retouches soignées, avec déplacement à Mopti.',
    createdAt: '2024-11-03'
  }),
  workshop(6, {
    id: 2007, slug: 'faso-creation', name: 'Faso Création', tone: '#7728A3',
    city: 'Koulikoro', district: 'Koulikoro Gare', rating: 4.6, reviewCount: 58,
    specialties: ['Mode homme', 'Bazin', 'Prêt-à-porter'],
    type: 'Atelier mixte', premium: true,
    availability: ['Commande ouverte', 'Livraison disponible', 'Sur rendez-vous'],
    priceMin: 20_000, priceMax: 110_000, phone: '+223 70 77 10 07', whatsapp: '+22370771007',
    description: 'Boubous homme et prêt-à-porter en bazin, livrés depuis Koulikoro.',
    createdAt: '2025-04-09'
  }),
  workshop(7, {
    id: 2008, slug: 'atelier-mode-plus', name: 'Atelier Mode Plus', tone: '#C9A227',
    city: 'Bamako', district: 'Lafiabougou', rating: 4.7, reviewCount: 89,
    specialties: ['Robes de soirée', 'Accessoires', 'Sur mesure'],
    type: 'Maison de couture', topRated: true, verified: true,
    availability: ['Disponible maintenant', 'Sur rendez-vous', 'Livraison disponible'],
    priceMin: 30_000, priceMax: 200_000, phone: '+223 79 88 10 08', whatsapp: '+22379881008',
    description: 'Robes de soirée et accessoires assortis, une adresse très notée de Lafiabougou.',
    createdAt: '2023-12-01'
  }),
  workshop(8, {
    id: 2009, slug: 'maison-niala', name: 'Maison Niala', tone: '#C9A227',
    city: 'Kayes', district: 'Liberté', rating: 4.5, reviewCount: 33,
    specialties: ['Robes de mariée', 'Broderie', 'Accessoires'],
    type: 'Maison de couture', gold: true, verified: true,
    availability: ['Sur rendez-vous', 'Commande ouverte'],
    priceMin: 90_000, priceMax: 480_000, phone: '+223 70 99 10 09', whatsapp: '+22370991009',
    description: 'Maison gold de Kayes, spécialisée dans les robes de mariée brodées.',
    createdAt: '2023-05-14'
  }),
  workshop(9, {
    id: 2010, slug: 'atelier-kati-chic', name: 'Atelier Kati Chic', tone: '#4A1364',
    city: 'Kati', district: 'Centre', rating: 4.4, reviewCount: 21,
    specialties: ['Retouches', 'Sur mesure', 'Mode femme'],
    type: 'Retouches',
    availability: ['Disponible maintenant', 'Sur rendez-vous', 'Service à domicile'],
    priceMin: 5_000, priceMax: 60_000, phone: '+223 76 10 10 10', whatsapp: '+22376101010',
    description: 'Retouches du jour et petites pièces sur mesure pour Kati et ses environs.',
    createdAt: '2025-09-01'
  }),
  workshop(10, {
    id: 2011, slug: 'bogolan-house', name: 'Bogolan House', tone: '#81175F',
    city: 'Bamako', district: 'Niamakoro', rating: 4.9, reviewCount: 77,
    specialties: ['Tenues traditionnelles', 'Bazin', 'Mode homme'],
    type: 'Créateur / Designer', verified: true, popular: true,
    availability: ['Commande ouverte', 'Livraison disponible', 'Sur rendez-vous'],
    priceMin: 40_000, priceMax: 220_000, phone: '+223 70 12 11 11', whatsapp: '+22370121111',
    description: 'Bogolan, bazin et coupes homme. Une signature très suivie à Bamako.',
    createdAt: '2024-08-22'
  }),
  workshop(11, {
    id: 2012, slug: 'petite-couture', name: 'Petite Couture', tone: '#EB2D78',
    city: 'Sikasso', district: 'Wayerma', rating: 4.3, reviewCount: 18,
    specialties: ['Enfants', 'Mode femme', 'Retouches'],
    type: 'Atelier individuel', isNew: true,
    availability: ['Sur rendez-vous', 'Commande ouverte'],
    priceMin: 8_000, priceMax: 45_000, phone: '+223 75 13 12 12', whatsapp: '+22375131212',
    description: 'Vêtements enfants et retouches femme, nouvel atelier de Sikasso.',
    createdAt: '2026-07-15'
  }),
  workshop(12, {
    id: 2013, slug: 'atelier-gao-prestige', name: 'Atelier Gao Prestige', tone: '#7728A3',
    city: 'Gao', district: 'Centre', rating: 4.6, reviewCount: 27,
    specialties: ['Haute couture', 'Robes de soirée', 'Broderie'],
    type: 'Haute couture', premium: true,
    availability: ['Sur rendez-vous', 'Commande ouverte', 'Livraison disponible'],
    priceMin: 50_000, priceMax: 300_000, phone: '+223 79 14 13 13', whatsapp: '+22379141313',
    description: 'Pièces de soirée brodées et commandes haute couture expédiées depuis Gao.',
    createdAt: '2025-01-28'
  }),
  workshop(13, {
    id: 2014, slug: 'tombouctou-fil-dor', name: 'Tombouctou Fil d’Or', tone: '#C9A227',
    city: 'Tombouctou', district: 'Abaradjou', rating: 4.2, reviewCount: 12,
    specialties: ['Tenues traditionnelles', 'Broderie', 'Accessoires'],
    type: 'Broderie',
    availability: ['Commande ouverte', 'Sur rendez-vous'],
    priceMin: 15_000, priceMax: 95_000, phone: '+223 70 15 14 14', whatsapp: '+22370151414',
    description: 'Broderie traditionnelle et accessoires, commandes ouvertes à Tombouctou.',
    createdAt: '2024-10-10'
  }),
  workshop(14, {
    id: 2015, slug: 'kayes-sur-mesure', name: 'Kayes Sur Mesure', tone: '#20A464',
    city: 'Kayes', district: 'Khasso', rating: 4.7, reviewCount: 41,
    specialties: ['Sur mesure', 'Mode homme', 'Retouches'],
    type: 'Atelier individuel', verified: true,
    availability: ['Disponible maintenant', 'Sur rendez-vous', 'Service à domicile'],
    priceMin: 12_000, priceMax: 100_000, phone: '+223 76 16 15 15', whatsapp: '+22376161515',
    description: 'Costumes et tenues homme sur mesure, retouches et service à domicile.',
    createdAt: '2025-06-19'
  }),
  workshop(15, {
    id: 2016, slug: 'atelier-segou-mariage', name: 'Atelier Ségou Mariage', tone: '#EB2D78',
    city: 'Ségou', district: 'Ségou-Coura', rating: 4.8, reviewCount: 54,
    specialties: ['Robes de mariée', 'Haute couture', 'Accessoires'],
    type: 'Haute couture', premium: true, verified: true,
    availability: ['Sur rendez-vous', 'Commande ouverte', 'Livraison disponible'],
    priceMin: 70_000, priceMax: 420_000, phone: '+223 79 17 16 16', whatsapp: '+22379171616',
    description: 'Robes de mariée et cortège, une maison premium installée à Ségou.',
    createdAt: '2024-04-30'
  })
];
