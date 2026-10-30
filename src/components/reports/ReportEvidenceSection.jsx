import { Camera, Loader2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import FormSection from '@/components/reports/FormSection';

/**
 * Group 3: evidence and contact. Photos are stored as evidence only; the copy
 * repeats that so a citizen never expects image analysis.
 */
export default function ReportEvidenceSection({
  form,
  update,
  markTouched,
  showError,
  errorProps,
  imageRef,
  consentRef,
  imageLoading,
  imageError,
  consentError,
  onImageChange,
  onClearImage,
}) {
  return (
    <FormSection
      icon={Camera}
      step={3}
      title="Evidence and contact"
      subtitle="Photo evidence is never analysed by AI."
    >
      <Field
        id="photo"
        label="Photo"
        hint="JPG, PNG or WebP up to 5 MB. Downscaled before local storage."
      >
        <input
          ref={imageRef}
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-navy-800"
          onChange={onImageChange}
          {...errorProps('image', 'photo-hint')}
        />
        {imageLoading ? (
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Preparing image…
          </p>
        ) : null}
        {imageError ? (
          <p id="image-error" className="error-text" role="alert">
            {imageError}
          </p>
        ) : null}
      </Field>

      {form.imagePreview ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
          <img
            src={form.imagePreview}
            alt="Selected evidence preview"
            className="h-24 w-full rounded-lg object-cover sm:w-32"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-navy-900">{form.imageName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {form.imagePreviewOnly
                ? 'Preview only — this photo is too large to persist locally.'
                : 'Stored locally as evidence. No image analysis runs.'}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClearImage}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="contact-name" label="Name" hint="Never shown on public pages.">
          <input
            id="contact-name"
            className="input"
            value={form.contactName}
            autoComplete="name"
            placeholder="Optional"
            onChange={(event) => update('contactName', event.target.value)}
          />
        </Field>
        <Field id="contact-phone" label="Phone" hint="Stored locally in this demo.">
          <input
            id="contact-phone"
            className="input"
            value={form.contactPhone}
            autoComplete="tel"
            inputMode="tel"
            placeholder="Optional"
            onChange={(event) => update('contactPhone', event.target.value)}
          />
        </Field>
      </div>

      <div
        className={[
          'rounded-xl border px-4 py-3',
          showError('consent') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50',
        ].join(' ')}
      >
        <label htmlFor="consent" className="flex items-start gap-3 text-sm text-slate-700">
          <input
            ref={consentRef}
            id="consent"
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            checked={form.consent}
            onChange={(event) => update('consent', event.target.checked)}
            onBlur={() => markTouched('consent')}
            aria-invalid={showError('consent') || undefined}
            aria-describedby={showError('consent') ? 'consent-error' : undefined}
          />
          <span>
            I understand this is a demo and I should not submit real personal information.
          </span>
        </label>
        {showError('consent') ? (
          <p id="consent-error" className="error-text" role="alert">
            {consentError}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
