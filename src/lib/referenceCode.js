/**
 * Crockford-style alphabet: no I, O, 0 or 1, so a code read aloud or copied
 * from a screenshot is unambiguous.
 */
export const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createReferenceCode(length = 6) {
  const bytes = new Uint8Array(length);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  let code = '';
  for (const byte of bytes) {
    code += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `CP-${code}`;
}

export function normalizeReferenceCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

export function isValidReferenceCode(code) {
  return /^CP-[A-HJ-NP-Z2-9]{6}$/.test(normalizeReferenceCode(code));
}
