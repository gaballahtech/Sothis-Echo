/** Pick a localized string from `{ en, ar }` (or a plain string). */
export function localized(value, language = 'en') {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[language] ?? value.en ?? '';
}
