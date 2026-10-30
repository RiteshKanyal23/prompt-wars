/**
 * Text normalisation shared by every rules-v1 component.
 *
 * Everything here is pure and synchronous: the same input always produces the
 * same tokens. That property is what makes the pipeline deterministic.
 */

const STOPWORDS = new Set(
  `a an the and or but if then than that this these those is are was were be been being
   to of in on at for with from by as it its into over under near after before since about
   across along around there here their they we you i he she my our your report reported
   please kindly very really just also has have had do does did can could would should
   will may might must not no`.split(/\s+/).filter(Boolean),
);

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value = '') {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/**
 * Tiny suffix stripper used only for similarity, never for display. It folds
 * the common inflections that make two citizens describe the same defect with
 * different words (crack / cracks / cracking, sink / sinking).
 */
export function stem(token = '') {
  const word = String(token);
  if (word.length <= 4) return word;

  const irregular = { sunk: 'sink', sank: 'sink', broken: 'break', broke: 'break' };
  if (irregular[word]) return irregular[word];

  if (word.endsWith('ies') && word.length > 5) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ing') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function stemTokens(tokens = []) {
  return tokens.map((token) => stem(token));
}

export function splitSentences(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** Truncate on a word boundary and never exceed `max` characters. */
export function truncate(value = '', max = 220) {
  const text = String(value).trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, Math.max(1, max - 1));
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : cut.length).trim()}\u2026`;
}
