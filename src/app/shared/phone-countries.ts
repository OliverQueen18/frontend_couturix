export interface PhoneCountry {
  iso: string;
  name: string;
  dial: string;
  flag: string;
}

export const DEFAULT_PHONE_DIAL = '223';

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'ML', name: 'Mali', dial: '223', flag: '🇲🇱' },
  { iso: 'CG', name: 'Congo', dial: '242', flag: '🇨🇬' },
  { iso: 'CD', name: 'RDC', dial: '243', flag: '🇨🇩' },
  { iso: 'CM', name: 'Cameroun', dial: '237', flag: '🇨🇲' },
  { iso: 'GA', name: 'Gabon', dial: '241', flag: '🇬🇦' },
  { iso: 'GQ', name: 'Guinée équatoriale', dial: '240', flag: '🇬🇶' },
  { iso: 'CF', name: 'Centrafrique', dial: '236', flag: '🇨🇫' },
  { iso: 'TD', name: 'Tchad', dial: '235', flag: '🇹🇩' },
  { iso: 'CI', name: 'Côte d’Ivoire', dial: '225', flag: '🇨🇮' },
  { iso: 'SN', name: 'Sénégal', dial: '221', flag: '🇸🇳' },
  { iso: 'BF', name: 'Burkina Faso', dial: '226', flag: '🇧🇫' },
  { iso: 'BJ', name: 'Bénin', dial: '229', flag: '🇧🇯' },
  { iso: 'TG', name: 'Togo', dial: '228', flag: '🇹🇬' },
  { iso: 'NE', name: 'Niger', dial: '227', flag: '🇳🇪' },
  { iso: 'GN', name: 'Guinée', dial: '224', flag: '🇬🇳' },
  { iso: 'MA', name: 'Maroc', dial: '212', flag: '🇲🇦' },
  { iso: 'DZ', name: 'Algérie', dial: '213', flag: '🇩🇿' },
  { iso: 'TN', name: 'Tunisie', dial: '216', flag: '🇹🇳' },
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { iso: 'BE', name: 'Belgique', dial: '32', flag: '🇧🇪' },
  { iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' }
];

export function parsePhone(value: string | null | undefined): { dial: string; local: string } {
  const raw = (value ?? '').replace(/[^\d+]/g, '');
  if (!raw) {
    return { dial: DEFAULT_PHONE_DIAL, local: '' };
  }
  const digits = raw.replace(/^\+/, '');
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find((country) => digits.startsWith(country.dial));
  if (match) {
    return { dial: match.dial, local: digits.slice(match.dial.length) };
  }
  return { dial: DEFAULT_PHONE_DIAL, local: digits.replace(/^0+/, '') };
}

export function formatPhone(dial: string, local: string): string {
  const number = local.replace(/[^\d]/g, '').replace(/^0+/, '');
  if (!number) {
    return '';
  }
  return `+${dial}${number}`;
}
