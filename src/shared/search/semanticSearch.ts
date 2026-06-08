/** Текстовая склейка полей для поиска (демо без ML-модели). */
export function buildSearchText(parts: Array<string | null | undefined>): string {
  return parts
    .map((s) => (s ?? '').trim())
    .filter((s) => s.length > 0)
    .join(' \u2014 ')
    .replace(/\s+/g, ' ')
    .trim()
}
