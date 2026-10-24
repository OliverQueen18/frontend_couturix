export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuthUser {
  userId: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  mustChangePassword: boolean;
  emailVerified?: boolean;
  atelierId?: number | null;
  atelierNom?: string | null;
  atelierLogoUrl?: string | null;
}

export interface TokenResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface Atelier {
  id: number;
  parentId?: number | null;
  nom: string;
  slug: string;
  description?: string | null;
  adresse?: string | null;
  ville?: string | null;
  pays?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  rccm?: string | null;
  nif?: string | null;
  sigle?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logoUrl?: string | null;
  devise: string;
  actif: boolean;
  enfants?: Atelier[];
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  label?: string;
  precision?: 'street' | 'city' | 'country';
}

export interface AtelierPublic {
  nom: string;
  slug: string;
  description?: string | null;
  ville?: string | null;
  pays?: string | null;
  logoUrl?: string | null;
  telephone?: string | null;
  siteWeb?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  noteMoyenne?: number;
  nombreAvis?: number;
  mieuxNote?: boolean;
}

export interface AtelierAvis {
  id: number;
  auteur: string;
  note: number;
  commentaire?: string | null;
  createdAt?: string;
  mine?: boolean;
}

export interface ErrorResponse {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  path?: string;
  details?: string[];
}

export interface Client {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  adresse?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  solde: number;
}

export interface ClientRequest {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  adresse?: string | null;
  notes?: string | null;
}

export interface Mesure {
  id?: number;
  tourCou?: number | null;
  tourPoitrine?: number | null;
  tourTaille?: number | null;
  tourHanches?: number | null;
  tourBras?: number | null;
  tourPoignet?: number | null;
  epaule?: number | null;
  longueurDos?: number | null;
  longueurDevant?: number | null;
  longueurManche?: number | null;
  tourCuisse?: number | null;
  tourGenou?: number | null;
  basPantalon?: number | null;
  longueurPantalon?: number | null;
  hauteur?: number | null;
  notes?: string | null;
  datePrise?: string | null;
  courante?: boolean;
}

export interface CategorieModele {
  id: number;
  nom: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  actif?: boolean;
}

export interface ModeleImage {
  id?: number;
  url: string;
  ordre?: number;
  principale?: boolean;
}

export interface Modele {
  id: number;
  nom: string;
  description?: string | null;
  prixIndicatif?: number | null;
  tissuRecommande?: string | null;
  tempsFabricationJours?: number | null;
  statut: string;
  categorieId?: number | null;
  categorieNom?: string | null;
  images?: (ModeleImage | string)[];
}

export interface Commande {
  id: number;
  numero: string;
  clientId: number;
  clientNom?: string;
  modeleId?: number | null;
  modeleNom?: string | null;
  compositionId?: number | null;
  devisId?: number | null;
  tailleurId?: number | null;
  tailleurNom?: string | null;
  statut: string;
  priorite: string;
  datePrevue?: string | null;
  dateLivraison?: string | null;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  montantTotal: number;
  notes?: string | null;
  retard?: boolean;
}

export interface ProductionColumn {
  etape: string;
  commandes: Commande[];
}

export interface ArticleStock {
  id: number;
  nom: string;
  sku: string;
  unite: string;
  stockActuel: number;
  stockMinimum: number;
  prixAchat: number;
  prixVente?: number | null;
  actif: boolean;
  categorieId?: number | null;
  categorieNom?: string | null;
  fournisseurId?: number | null;
  fournisseurNom?: string | null;
}

export interface MouvementStock {
  id?: number;
  articleId: number;
  articleNom?: string | null;
  type?: string;
  typeMouvement?: string;
  quantite: number;
  stockAvant?: number;
  stockApres?: number;
  motif?: string | null;
  referenceMetier?: string | null;
  createdAt?: string;
}

export interface InventaireResultat {
  reference: string;
  lignesCompte: number;
  ajustements: number;
  mouvements: MouvementStock[];
}

export interface Fournisseur {
  id: number;
  nom: string;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  notes?: string | null;
  actif: boolean;
}

export interface Caisse {
  id: number;
  dateOuverture: string;
  dateCloture?: string | null;
  soldeInitial: number;
  soldeTheorique?: number | null;
  soldeReel?: number | null;
  statut: string;
  notes?: string | null;
  operations?: CaisseOperation[];
}

export interface CaisseOperation {
  id?: number;
  typeOperation: string;
  categorie: string;
  montant: number;
  moyenPaiement: string;
  motif: string;
  referenceMetier?: string | null;
  createdAt?: string;
}

export interface TicketSignataire {
  id: number;
  libelle: string;
  nom?: string | null;
  ordre: number;
  actif: boolean;
}

export interface ClotureCaisse {
  soldeReel: number;
  commentaires?: string;
  ecart?: number;
}

export interface Paiement {
  id?: number;
  commandeId?: number | null;
  clientId: number;
  clientNom?: string;
  montant: number;
  moyen: string;
  datePaiement: string;
  reference?: string | null;
  notes?: string | null;
}

export interface Specialite {
  id: number;
  libelle: string;
}

export interface Tailleur {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string | null;
  email?: string | null;
  modeRemuneration: string;
  salaireFixe?: number;
  tauxPiece?: number;
  pourcentage?: number;
  actif: boolean;
  specialiteIds?: number[];
  specialites?: string[];
}

export interface Paie {
  id: number;
  tailleurId: number;
  tailleurNom?: string;
  periodeDebut: string;
  periodeFin: string;
  montantBrut: number;
  primes: number;
  retenues: number;
  avances: number;
  montantNet: number;
  statut: string;
  notes?: string | null;
}

export interface CompositionLigne {
  id?: number;
  typeLigne: string;
  articleId?: number | null;
  designation: string;
  quantite: number;
  coutUnitaire: number;
}

export interface Composition {
  id: number;
  modeleId: number;
  modeleNom?: string;
  version: number;
  libelle?: string | null;
  active: boolean;
  lignes?: CompositionLigne[];
  cout?: CostBreakdown;
}

export interface CostBreakdown {
  coutMatiere: number;
  coutConsommables: number;
  coutAccessoires: number;
  coutMainOeuvre: number;
  fraisIndirects: number;
  coutEmballage: number;
  coutTotal: number;
  coutUnitaire: number;
  prixRevient: number;
}

export interface ProfitResult {
  costs: CostBreakdown;
  prixVente: number;
  remise: number;
  montantNet: number;
  benefice: number;
  marge: number;
}

export interface Simulation {
  id?: number;
  modeleId?: number | null;
  compositionId?: number | null;
  libelle?: string | null;
  quantite: number;
  coutMatiere?: number;
  coutMainOeuvre?: number;
  fraisIndirects?: number;
  coutTotal?: number;
  prixRevient?: number;
  prixVente: number;
  remise: number;
  benefice?: number;
  marge?: number;
  lignes?: CompositionLigne[];
}

export interface Devis {
  id: number;
  numero: string;
  clientId: number;
  clientNom?: string;
  modeleId?: number | null;
  compositionId?: number | null;
  simulationId?: number | null;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  montantTotal: number;
  delaiJours?: number | null;
  conditions?: string | null;
  validite?: string | null;
  statut: string;
}

export interface NotificationItem {
  id: number;
  canal: string;
  evenement: string;
  destinataire: string;
  sujet?: string | null;
  contenu: string;
  statut: string;
  erreur?: string | null;
  createdAt?: string;
  sentAt?: string | null;
}

export type SiteMenuLocation = 'HEADER' | 'FOOTER_PLATEFORME' | 'FOOTER_ENTREPRISE' | 'FOOTER_LEGAL';

export interface SiteSettings {
  brandName: string;
  tagline?: string | null;
  footerTagline?: string | null;
  footerNote?: string | null;
  headerCtaLabel?: string | null;
  headerCtaPath?: string | null;
  contactEmail?: string | null;
  contactPhones?: string | null;
  contactAddress?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
}

export interface SiteMenu {
  id: number;
  location: SiteMenuLocation;
  label: string;
  path: string;
  sortOrder: number;
  visible: boolean;
}

export interface SitePage {
  id: number;
  slug: string;
  title: string;
  eyebrow?: string | null;
  lead?: string | null;
  body: string;
  published: boolean;
  updatedAt?: string | null;
}

export interface SiteSlide {
  id: number;
  kicker?: string | null;
  title: string;
  body?: string | null;
  imageUrl: string;
  ctaLabel?: string | null;
  ctaPath?: string | null;
  sortOrder: number;
  visible: boolean;
}

export interface SiteSnapshot {
  settings: SiteSettings;
  menus: SiteMenu[];
  pages: SitePage[];
  slides: SiteSlide[];
}

export interface PlatformOverview {
  ateliers: number;
  utilisateurs: number;
  comptesClients: number;
  pages: number;
  menus: number;
  slides: number;
}

export interface AbonnementCourant {
  plan: string;
  libelle: string;
  ateliersUtilises: number;
  ateliersMax: number | null;
  illimite: boolean;
  peutCreer: boolean;
  sms: boolean;
  smsGatewayReady: boolean;
  essai?: boolean;
  essaiJours?: number;
  essaiJoursRestants?: number | null;
  essaiFin?: string | null;
}

export interface PlanOffre {
  code: string;
  libelle: string;
  trialDays: number;
  maxAteliers: number | null;
  sms: boolean;
}

export interface NotificationTemplate {
  id: number;
  evenement: string;
  canal: string;
  sujet?: string | null;
  corps: string;
}

export interface AppUser {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  actif: boolean;
  roles: string[];
  mustChangePassword?: boolean;
  plan?: string | null;
  atelierId?: number | null;
  atelierNom?: string | null;
}

export interface Parametre {
  cle: string;
  valeur: string;
  description?: string | null;
}

export interface DashboardKpi {
  chiffreAffaires: number;
  depenses: number;
  benefice?: number;
  beneficeEstime?: number;
  commandes: number;
  retards?: number;
  commandesEnRetard?: number;
  stockFaible: number;
  soldeCaisse: number;
  clients?: number;
  nouveauxClients?: number;
  productionParTailleur?: { tailleurId?: number; nom?: string; prenom?: string; libelle?: string; count?: number; productions?: number }[];
}

export interface DemandePublique {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  quantite: number;
  notes?: string;
}

export const COMMANDE_STATUTS = [
  'BROUILLON',
  'CONFIRMEE',
  'EN_PREPARATION',
  'EN_COUPE',
  'EN_COUTURE',
  'FINITION',
  'CONTROLE',
  'PRETE',
  'LIVREE',
  'ANNULEE'
] as const;

export const COMMANDE_WORKFLOW: Record<string, string[]> = {
  BROUILLON: ['CONFIRMEE', 'ANNULEE'],
  CONFIRMEE: ['EN_PREPARATION', 'ANNULEE'],
  EN_PREPARATION: ['EN_COUPE', 'ANNULEE'],
  EN_COUPE: ['EN_COUTURE', 'ANNULEE'],
  EN_COUTURE: ['FINITION', 'ANNULEE'],
  FINITION: ['CONTROLE', 'ANNULEE'],
  CONTROLE: ['PRETE', 'ANNULEE'],
  PRETE: ['LIVREE', 'ANNULEE'],
  LIVREE: [],
  ANNULEE: []
};

export const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PUBLIE: 'Publié',
  DEPUBLIE: 'Dépublié',
  ARCHIVE: 'Archivé',
  CONFIRMEE: 'Confirmée',
  EN_PREPARATION: 'Préparation',
  EN_COUPE: 'Coupe',
  EN_COUTURE: 'Couture',
  FINITION: 'Finition',
  CONTROLE: 'Contrôle',
  PRETE: 'Prête',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
  OUVERTE: 'Ouverte',
  CLOTUREE: 'Clôturée',
  VALIDEE: 'Validée',
  PAYEE: 'Payée',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  EXPIRE: 'Expiré',
  COMMANDE: 'Commande',
  EN_ATTENTE: 'En attente',
  ENVOYEE: 'Envoyée',
  ECHEC: 'Échec',
  NORMALE: 'Normale',
  BASSE: 'Basse',
  HAUTE: 'Haute',
  URGENTE: 'Urgente'
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur CouturiX',
  GERANT: 'Administrateur d’atelier',
  CAISSIER: 'Caissier',
  RECEPTIONNISTE: 'Réceptionniste',
  TAILLEUR: 'Tailleur',
  MAGASINIER: 'Magasinier',
  COMPTABLE: 'Comptable',
  CLIENT: 'Client'
};

export const ALL_ROLES = Object.keys(ROLE_LABELS);

export const MESURE_FIELDS: { key: keyof Mesure; label: string }[] = [
  { key: 'tourCou', label: 'Tour de cou' },
  { key: 'tourPoitrine', label: 'Tour de poitrine' },
  { key: 'tourTaille', label: 'Tour de taille' },
  { key: 'tourHanches', label: 'Tour de hanches' },
  { key: 'tourBras', label: 'Tour de bras' },
  { key: 'tourPoignet', label: 'Tour de poignet' },
  { key: 'epaule', label: 'Épaule' },
  { key: 'longueurDos', label: 'Longueur dos' },
  { key: 'longueurDevant', label: 'Longueur devant' },
  { key: 'longueurManche', label: 'Longueur manche' },
  { key: 'tourCuisse', label: 'Tour de cuisse' },
  { key: 'tourGenou', label: 'Tour de genou' },
  { key: 'basPantalon', label: 'Bas pantalon' },
  { key: 'longueurPantalon', label: 'Longueur pantalon' },
  { key: 'hauteur', label: 'Hauteur' }
];
