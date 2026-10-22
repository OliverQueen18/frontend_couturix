export function money(value?: number | null): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function periodRange(
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  if (period === 'custom') {
    return { from: customFrom || to, to: customTo || to };
  }
  const from = new Date(now);
  if (period === 'today') {
    return { from: to, to };
  }
  if (period === 'week') {
    from.setDate(now.getDate() - 6);
  } else if (period === 'month') {
    from.setDate(1);
  } else if (period === 'quarter') {
    from.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    from.setMonth(0, 1);
  }
  return { from: isoDate(from), to };
}

export function isRetard(datePrevue?: string | null, statut?: string): boolean {
  if (!datePrevue || statut === 'LIVREE' || statut === 'ANNULEE') {
    return false;
  }
  return datePrevue < isoDate(new Date());
}

export function joursLabel(value?: number | null): string {
  if (value == null) {
    return '—';
  }
  return value <= 1 ? `${value} jour` : `${value} jours`;
}
