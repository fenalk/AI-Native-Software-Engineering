/**
 * Turns display names and tag names into URL/handle-safe slugs.
 * Accents are stripped so `Acessibilidade` and `acessibilidade` share a slug.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
