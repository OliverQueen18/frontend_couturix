export function matchesSearch(q: string, ...values: unknown[]): boolean {
  const needle = q.trim().toLocaleLowerCase('fr');
  if (!needle) {
    return true;
  }
  return values.some((value) => String(value ?? '').toLocaleLowerCase('fr').includes(needle));
}
