import { MAX_IMAGE_BYTES } from './constants';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const LOCAL_IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.8;

/**
 * Validate before reading the file. SVG is rejected on purpose: it can carry
 * script and would be an XSS vector if rendered inline.
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'Choose an image first.' };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Use a JPG, PNG or WebP image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Image must be 5 MB or smaller.' };
  }
  return { valid: true, error: null };
}

/** Read a file as a data URL for local preview. Caller must validate first. */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function dataUrlBytes(dataUrl) {
  const base64 = String(dataUrl).split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode that image.'));
    image.src = source;
  });
}

/**
 * Downscale to a demo-friendly JPEG. LocalStorage has a small quota, so large
 * photos are shown for the session but not persisted. The form labels that
 * distinction instead of silently dropping evidence.
 *
 * @returns {Promise<{valid:boolean,error:string|null,dataUrl:string|null,bytes:number,previewOnly:boolean}>}
 */
export async function prepareImageFile(file) {
  const check = validateImageFile(file);
  if (!check.valid) {
    return { valid: false, error: check.error, dataUrl: null, bytes: 0, previewOnly: false };
  }

  const original = await readFileAsDataUrl(file);

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return {
      valid: true,
      error: null,
      dataUrl: original,
      bytes: file.size,
      previewOnly: file.size > LOCAL_IMAGE_MAX_BYTES,
    };
  }

  try {
    const image = await loadImage(original);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const bytes = dataUrlBytes(dataUrl);

    return {
      valid: true,
      error: null,
      dataUrl,
      bytes,
      previewOnly: bytes > LOCAL_IMAGE_MAX_BYTES,
    };
  } catch {
    return {
      valid: true,
      error: null,
      dataUrl: original,
      bytes: file.size,
      previewOnly: file.size > LOCAL_IMAGE_MAX_BYTES,
    };
  }
}
