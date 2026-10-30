import { MAX_IMAGE_BYTES } from './constants';
import { isValidCoordinate } from './geo';
import { isValidReferenceCode } from './referenceCode';

export const REPORT_LIMITS = {
  descriptionMin: 20,
  descriptionMax: 1000,
  titleMax: 80,
  imageBytes: MAX_IMAGE_BYTES,
};

/**
 * Client-side validation. Mirrors the server rules in trd.md §13 and never
 * blocks typing — callers validate on submit and on blur of touched fields.
 */
export function validateReport(input = {}) {
  const errors = {};

  const title = String(input.title ?? '').trim();
  if (title.length > REPORT_LIMITS.titleMax) {
    errors.title = `Keep the title under ${REPORT_LIMITS.titleMax} characters.`;
  }

  const description = String(input.description ?? '').trim();
  if (description.length < REPORT_LIMITS.descriptionMin) {
    errors.description = `Please add at least ${REPORT_LIMITS.descriptionMin} characters.`;
  } else if (description.length > REPORT_LIMITS.descriptionMax) {
    errors.description = `Please keep it under ${REPORT_LIMITS.descriptionMax} characters.`;
  }

  if (!input.category) {
    errors.category = 'Choose a category or use auto-detect.';
  }

  if (!isValidCoordinate(input.latitude, input.longitude)) {
    errors.location = 'Pick a location on the map.';
  }

  if (input.imageFile && input.imageFile.size > REPORT_LIMITS.imageBytes) {
    errors.image = 'Image must be 5 MB or smaller.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTrackingCode(code) {
  const value = String(code ?? '').trim();
  if (!value) return 'Enter your tracking code.';
  if (!isValidReferenceCode(value)) return 'Codes look like CP-7K2M9Q.';
  return null;
}
