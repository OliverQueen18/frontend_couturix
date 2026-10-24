export interface HomeStat {
  value: string;
  label: string;
}

export interface HomeWorkshop {
  id: number;
  name: string;
  city: string;
  specialty: string;
  image: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  slug?: string;
  logo?: boolean;
}

export interface HomePublication {
  id: number;
  title: string;
  description: string;
  image: string;
  workshopName: string;
  date: string;
  likes: number;
}

export interface PlanServiceGroup {
  title: string;
  items: string[];
}

export interface HomePlan {
  code: string;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  services: PlanServiceGroup[];
  tone: 'free' | 'standard' | 'premium' | 'gold';
  kicker: string;
  limit: string;
  popular?: boolean;
  cta: string;
}

export interface HomeAd {
  id: number;
  title: string;
  description: string;
  cta: string;
  position: 'banner' | 'card';
  sponsor?: string;
}

export interface HomeBanner {
  id: number;
  kicker: string;
  title: string;
  text: string;
  image: string;
  cta: string;
  link: string;
}

export const HOME_BANNERS: HomeBanner[] = [
  {
    id: 1,
    kicker: 'Bamako',
    title: 'Publiez votre maison de couture',
    text: 'Bazin, bogolan et tenues sur mesure, visibles auprès de nouveaux clients.',
    image: 'images/publications/bazin.svg',
    cta: 'Créer mon atelier',
    link: '/inscription'
  },
  {
    id: 2,
    kicker: 'Créations',
    title: 'Robes de soirée et de mariée',
    text: 'Mettez vos pièces en avant et recevez des demandes depuis toute la région.',
    image: 'images/publications/soiree.svg',
    cta: 'Voir le catalogue',
    link: '/catalogue'
  },
  {
    id: 3,
    kicker: 'Afrique de l’Ouest',
    title: 'De Sikasso à Mopti',
    text: 'Retouches, broderie et prêt-à-porter : faites découvrir votre savoir-faire.',
    image: 'images/publications/retouche.svg',
    cta: 'Explorer les ateliers',
    link: '/ateliers'
  }
];

export const HOME_CITIES = ['Bamako', 'Sikasso', 'Kayes', 'Koulikoro', 'Ségou', 'Mopti'];

export const HOME_STATS: HomeStat[] = [
  { value: '500+', label: 'Ateliers inscrits' },
  { value: '10 000+', label: 'Clients' },
  { value: '50+', label: 'Villes couvertes' },
  { value: '99%', label: 'Clients satisfaits' }
];

export const HOME_WORKSHOPS: HomeWorkshop[] = [
  {
    id: 1,
    name: 'Atelier Élégance',
    city: 'Bamako',
    specialty: 'Robes de soirée et sur mesure',
    image: 'images/workshops/elegance.svg',
    rating: 4.9,
    reviewCount: 128,
    badge: 'Premium'
  },
  {
    id: 2,
    name: 'Maison Awa Couture',
    city: 'Sikasso',
    specialty: 'Bazin et tenues traditionnelles',
    image: 'images/workshops/awa.svg',
    rating: 4.8,
    reviewCount: 96,
    badge: 'Top noté'
  },
  {
    id: 3,
    name: 'Studio Faso Chic',
    city: 'Kayes',
    specialty: 'Mode homme et prêt-à-porter',
    image: 'images/workshops/faso.svg',
    rating: 4.7,
    reviewCount: 74,
    badge: 'Premium'
  },
  {
    id: 4,
    name: 'Atelier Prestige',
    city: 'Ségou',
    specialty: 'Robes de mariée et broderie',
    image: 'images/workshops/prestige.svg',
    rating: 4.9,
    reviewCount: 102,
    badge: 'Top noté'
  }
];

export const HOME_PUBLICATIONS: HomePublication[] = [
  {
    id: 1,
    title: 'Nouvelle collection bazin',
    description: 'Pièces lumineuses, coupes amples et finitions brodées pour les cérémonies.',
    image: 'images/publications/bazin.svg',
    workshopName: 'Atelier Élégance',
    date: '18 sept. 2026',
    likes: 24
  },
  {
    id: 2,
    title: 'Robe de soirée sur mesure',
    description: 'Une silhouette fluide, pensée pour les soirées de Bamako.',
    image: 'images/publications/soiree.svg',
    workshopName: 'Maison Awa Couture',
    date: '12 sept. 2026',
    likes: 18
  },
  {
    id: 3,
    title: 'Tenue traditionnelle homme',
    description: 'Grand boubou, bogolan et coupe nette pour les grandes occasions.',
    image: 'images/publications/homme.svg',
    workshopName: 'Studio Faso Chic',
    date: '4 sept. 2026',
    likes: 32
  },
  {
    id: 4,
    title: 'Retouches express',
    description: 'Ourlets, reprises et ajustements, rendus avec le même soin que la création.',
    image: 'images/publications/retouche.svg',
    workshopName: 'Atelier Prestige',
    date: '28 août 2026',
    likes: 15
  }
];

export const HOME_PLANS: HomePlan[] = [
  {
    code: 'GRATUIT',
    name: 'Gratuit',
    priceMonthly: 0,
    tone: 'free',
    kicker: '15 jours d’essai',
    limit: '1 atelier',
    description: 'Pour ouvrir votre maison et être visible, sans frais, avec 15 jours d’essai des fonctionnalités.',
    features: ['15 jours d’essai des fonctionnalités', 'Fiche publique dans l’annuaire', '1 atelier et le compte gérant', 'Demandes de contact', 'Notifications par e-mail'],
    services: [
      {
        title: 'Présence en ligne',
        items: [
          'Fiche publique : nom, ville, pays, spécialités et description',
          'Logo, photo de couverture et page partageable',
          'Adresse, téléphone et position sur la carte OpenStreetMap',
          'Apparition dans la recherche par ville et par nom',
          'Visibilité standard, sans mise en avant sur l’accueil',
          'Horaires et moyens de contact affichés aux visiteurs'
        ]
      },
      {
        title: 'Maison et compte',
        items: [
          'Un seul atelier rattaché au compte',
          '15 jours d’essai des fonctionnalités (SMS clients compris)',
          'Compte gérant pour modifier la fiche à tout moment',
          'Sigle, RCCM et NIF enregistrés sur la maison',
          'Mot de passe et accès sécurisé à l’espace',
          'Changement d’offre possible plus tard, sans recréer le compte'
        ]
      },
      {
        title: 'Relation avec les clients',
        items: [
          'Les visiteurs voient vos coordonnées et peuvent vous écrire',
          'Demandes de contact reçues depuis la fiche publique',
          'Pas de carnet de commandes ni de prises de mesures',
          'SMS clients pendant la période d’essai, puis dès l’offre Standard',
          'Idéal pour tester CouturiX avant de passer à une offre payante'
        ]
      },
      {
        title: 'Accompagnement',
        items: [
          'Création du compte guidée, sans carte bancaire',
          'Aide par e-mail pour publier la fiche',
          'Sans engagement : l’offre reste gratuite tant que vous le souhaitez',
          'Passage vers Standard, Premium ou Gold en un clic'
        ]
      }
    ],
    cta: 'Commencer gratuitement'
  },
  {
    code: 'STANDARD',
    name: 'Standard',
    priceMonthly: 15000,
    tone: 'standard',
    kicker: 'Présence',
    limit: '1 atelier',
    description: 'Pour tenir le carnet de commandes et la relation client.',
    features: ['Vitrine complète', 'Commandes, clients et mesures', 'SMS clients (SMS Gateway)', 'Statistiques de base'],
    services: [
      {
        title: 'Vitrine',
        items: [
          'Fiche complète : spécialités, description, galerie et logo',
          'Horaires, téléphone, WhatsApp et réseaux sociaux',
          'Carte OpenStreetMap et itinéraire vers l’atelier',
          'Présentation soignée dans l’annuaire des maisons',
          'Page publique prête à être partagée avec vos clients'
        ]
      },
      {
        title: 'Commandes et clients',
        items: [
          'Création des commandes : modèle, tissu, délai et prix en FCFA',
          'Suivi des statuts, de la prise de mesures jusqu’à la livraison',
          'Fiches clients, historique et coordonnées',
          'Mensurations enregistrées et réutilisées à chaque tenue',
          'Notes d’essayage et de retouche liées à la commande',
          'SMS au client dès qu’une commande avance (SMS Gateway)',
          'Rappels SMS depuis l’espace Notifications'
        ]
      },
      {
        title: 'Catalogue et publications',
        items: [
          'Modèles publiés avec prix, tissu conseillé et délai',
          'Catégories : bazin, soirée, mariée, homme, retouche',
          'Demandes reçues depuis le catalogue public',
          'Publications de créations dans le fil CouturiX',
          'Photos des pièces pour montrer le savoir-faire'
        ]
      },
      {
        title: 'Pilotage',
        items: [
          'Un atelier et le compte du gérant',
          'Tableau de bord : commandes en cours et clients',
          'Statistiques de base sur l’activité du mois',
          'Devis simples à remettre au client',
          'Support par e-mail les jours ouvrés'
        ]
      }
    ],
    cta: 'Choisir Standard'
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    priceMonthly: 35000,
    tone: 'premium',
    kicker: 'Le plus choisi',
    limit: 'Jusqu’à 5 ateliers',
    description: 'Pour une maison qui encaisse, stocke et fait travailler une équipe.',
    popular: true,
    features: ['Jusqu’à 5 ateliers et 5 utilisateurs', 'Caisse, dépenses et stocks', 'SMS clients inclus', 'Statistiques détaillées'],
    services: [
      {
        title: 'Tout Standard, et l’équipe',
        items: [
          'Vitrine, commandes, clients, mesures, devis, catalogue et SMS',
          'Jusqu’à 5 ateliers sous le même compte',
          'Jusqu’à 5 utilisateurs : gérant, tailleur, caissier, réception',
          'Chaque collaborateur ne voit que son périmètre',
          'Fiches tailleurs et attribution des pièces à coudre',
          'Notifications internes pour l’équipe'
        ]
      },
      {
        title: 'Caisse, devis et paiements',
        items: [
          'Encaissements liés aux commandes, acomptes et soldes',
          'Journal de caisse du jour et des mouvements',
          'Suivi des dépenses de tissus, fils, loyer et fournitures',
          'Devis détaillés et transformation en commande',
          'Paiements enregistrés, toujours en FCFA',
          'Lecture rapide de ce qui reste à encaisser'
        ]
      },
      {
        title: 'Stocks, fournisseurs et production',
        items: [
          'Tissus et fournitures, avec seuil d’alerte',
          'Entrées, sorties et lien avec la commande',
          'Fiches fournisseurs et historique d’achats',
          'Compositions : métrage, fournitures et coût d’une pièce',
          'Suivi de production : à couper, en cours, à l’essayage, prêt',
          'Vue des pièces en cours par tailleur'
        ]
      },
      {
        title: 'Visibilité et chiffres',
        items: [
          'Publications mises en avant dans le fil',
          'Badge Premium visible sur la fiche publique',
          'Statistiques détaillées des ventes, commandes et clients',
          'Rapports d’activité pour suivre le mois',
          'Support prioritaire par e-mail'
        ]
      }
    ],
    cta: 'Choisir Premium'
  },
  {
    code: 'GOLD',
    name: 'Gold',
    priceMonthly: 60000,
    tone: 'gold',
    kicker: 'Maison',
    limit: 'Ateliers illimités',
    description: 'Pour un réseau de maisons, avec mise en avant et accompagnement.',
    features: ['Ateliers et utilisateurs illimités', 'Mise en avant sur CouturiX', 'SMS clients inclus', 'Accompagnement personnalisé'],
    services: [
      {
        title: 'Réseau de maisons',
        items: [
          'Toutes les fonctions Premium : caisse, stocks, production, équipe et SMS',
          'Ateliers illimités, y compris annexes et comptoirs',
          'Utilisateurs illimités et rôles séparés',
          'Un pilotage commun, avec le détail de chaque maison',
          'Droits distincts pour la comptabilité, le magasin et l’atelier',
          'Paie de l’équipe suivie à côté de l’activité'
        ]
      },
      {
        title: 'Mise en avant',
        items: [
          'Présence prioritaire dans l’annuaire et la recherche',
          'Maison mise en avant sur l’accueil CouturiX',
          'Publications placées en tête du fil',
          'Badge Gold visible par les clients',
          'Modèles du catalogue mieux exposés aux visiteurs'
        ]
      },
      {
        title: 'Pilotage avancé',
        items: [
          'Statistiques par atelier, par période et par activité',
          'Rapports de caisse, de stocks, de commandes et de production',
          'Simulateur pour estimer tissu, coût et prix de vente en FCFA',
          'Export des chiffres pour le suivi de la maison',
          'Comparaison des annexes pour voir ce qui avance',
          'Lecture consolidée de toute l’activité'
        ]
      },
      {
        title: 'Accompagnement',
        items: [
          'Prise en main personnalisée de l’espace',
          'Aide à organiser les ateliers, les rôles et la caisse',
          'Support prioritaire, avec un interlocuteur dédié',
          'Point régulier pour ajuster l’usage de CouturiX',
          'Accompagnement lors de l’ouverture d’une nouvelle annexe'
        ]
      }
    ],
    cta: 'Choisir Gold'
  }
];

export const HOME_ADS: HomeAd[] = [
  {
    id: 1,
    title: 'Votre publicité ici',
    description: 'Touchez des milliers d’ateliers, couturiers et passionnés de mode en Afrique de l’Ouest.',
    cta: 'Nous contacter',
    position: 'banner'
  },
  {
    id: 2,
    title: 'Annonce sponsorisée',
    description: 'Mettez en avant votre marque de tissus, machines ou accessoires.',
    cta: 'En savoir plus',
    position: 'card',
    sponsor: 'Tissus & machines'
  },
  {
    id: 3,
    title: 'Espace partenaire',
    description: 'Associez votre entreprise à l’univers CouturiX.',
    cta: 'Nous contacter',
    position: 'card',
    sponsor: 'Partenaire'
  }
];

export function fcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}
