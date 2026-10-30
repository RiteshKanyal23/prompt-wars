import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Check,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import HonestyNote from '@/components/ui/HonestyNote';
import LocationPicker from '@/components/map/LocationPicker';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/useToast';
import { useCreateReport } from '@/hooks/useCreateReport';
import { CATEGORY_MAP, CATEGORIES } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { isValidCoordinate } from '@/lib/geo';
import { prepareImageFile } from '@/lib/image';
import { formatPercent } from '@/lib/format';
import { validateReport } from '@/lib/validation';
import { classifyReport } from '@/services/ai/classify';
import { findDuplicateCandidates } from '@/services/ai/duplicates';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'auto',
  locationLabel: '',
  latitude: '',
  longitude: '',
  imageUrl: null,
  imagePreview: null,
  imagePreviewOnly: false,
  imageName: '',
  contactName: '',
  contactPhone: '',
  consent: false,
};

const FIELD_ORDER = ['title', 'description', 'category', 'location', 'image', 'consent'];

const NEXT_STEPS = [
  'Your text is classified and summarised.',
  'Likely duplicates are proposed, never auto-merged.',
  'Five priority factors produce a score and a band.',
  'Nearby reports are grouped into a hotspot.',
];

function coord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(5) : '—';
}

export default function ReportIssue() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { data: corpus } = useReports();
  const { createReport, submitting } = useCreateReport();

  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState([]);

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const categoryRef = useRef(null);
  const latitudeRef = useRef(null);
  const imageRef = useRef(null);
  const consentRef = useRef(null);

  const refs = {
    title: titleRef,
    description: descriptionRef,
    category: categoryRef,
    location: latitudeRef,
    image: imageRef,
    consent: consentRef,
  };

  const mapValue = useMemo(
    () =>
      isValidCoordinate(form.latitude, form.longitude)
        ? { lat: Number(form.latitude), lng: Number(form.longitude) }
        : null,
    [form.latitude, form.longitude],
  );

  function validate(values) {
    const result = validateReport({
      title: values.title,
      description: values.description,
      category: values.category,
      latitude: values.latitude,
      longitude: values.longitude,
    });

    const next = { ...result.errors };
    if (imageError) next.image = imageError;
    if (!values.consent) next.consent = 'Please confirm this is a demo report.';
    return next;
  }

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (touched[field] || attempted) setErrors(validate(next));
      return next;
    });
  }

  function markTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validate(form));
  }

  function showError(field) {
    return Boolean(errors[field]) && (touched[field] || attempted);
  }

  function errorProps(field, hintId) {
    return {
      'aria-invalid': showError(field) || undefined,
      'aria-describedby': showError(field) ? `${field}-error` : hintId,
    };
  }

  function handlePickLocation(next) {
    setForm((current) => ({
      ...current,
      latitude: String(next.lat),
      longitude: String(next.lng),
    }));
    setTouched((current) => ({ ...current, location: true }));
    setDuplicateWarning([]);
    if (attempted) {
      setErrors(
        validate({ ...form, latitude: String(next.lat), longitude: String(next.lng) }),
      );
    }
  }

  function handleSuggest() {
    const result = classifyReport({ title: form.title, description: form.description });
    setSuggestion(result);
  }

  function applySuggestion() {
    if (!suggestion) return;
    update('category', suggestion.category);
    setSuggestion((current) => ({ ...current, applied: true }));
  }

  function handleDescriptionBlur() {
    markTouched('description');

    if (form.description.trim().length < 20 || !isValidCoordinate(form.latitude, form.longitude)) {
      return;
    }

    const draft = {
      id: 'draft-report',
      title: form.title,
      description: form.description,
      category: form.category === 'auto' ? 'other' : form.category,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      createdAt: new Date().toISOString(),
      status: 'submitted',
    };

    const candidates = findDuplicateCandidates(draft, corpus, { now: new Date(), limit: 2 })
      .filter((candidate) => candidate.level !== 'low');
    setDuplicateWarning(candidates);
  }

  async function handleImage(event) {
    const file = event.target.files?.[0];
    setImageError(null);
    setDuplicateWarning([]);

    if (!file) {
      setForm((current) => ({
        ...current,
        imageUrl: null,
        imagePreview: null,
        imagePreviewOnly: false,
        imageName: '',
      }));
      return;
    }

    setImageLoading(true);
    try {
      const result = await prepareImageFile(file);
      if (!result.valid) {
        setImageError(result.error);
        setForm((current) => ({
          ...current,
          imageUrl: null,
          imagePreview: null,
          imagePreviewOnly: false,
          imageName: '',
        }));
        return;
      }

      setForm((current) => ({
        ...current,
        imageUrl: result.previewOnly ? null : result.dataUrl,
        imagePreview: result.dataUrl,
        imagePreviewOnly: result.previewOnly,
        imageName: file.name,
      }));
    } catch {
      setImageError('That image could not be read. Try a different file.');
    } finally {
      setImageLoading(false);
    }
  }

  function clearImage() {
    setImageError(null);
    setForm((current) => ({
      ...current,
      imageUrl: null,
      imagePreview: null,
      imagePreviewOnly: false,
      imageName: '',
    }));
    if (imageRef.current) imageRef.current.value = '';
  }

  function focusFirstError(nextErrors) {
    const first = FIELD_ORDER.find((field) => nextErrors[field]);
    if (!first) return;
    const target = refs[first]?.current;
    if (target) {
      target.focus({ preventScroll: false });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setAttempted(true);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setTouched(
        Object.fromEntries(FIELD_ORDER.map((field) => [field, true])),
      );
      focusFirstError(nextErrors);
      return;
    }

    setSubmitError(null);

    try {
      const report = await createReport({
        title: form.title,
        description: form.description,
        category: form.category,
        locationLabel: form.locationLabel,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        imageUrl: form.imageUrl,
        contact: {
          name: form.contactName.trim() || null,
          phone: form.contactPhone.trim() || null,
        },
      });

      push({
        tone: 'success',
        title: 'Report submitted',
        message: `${report.referenceCode} · ${report.priorityBand} priority`,
      });

      navigate(`/analysis/${report.id}`, { state: { justSubmitted: true } });
    } catch (error) {
      setSubmitError(toUserMessage(error));
      push({
        tone: 'danger',
        title: 'Could not submit',
        message: toUserMessage(error),
      });
    }
  }

  const suggestedLabel = suggestion ? CATEGORY_MAP[suggestion.category]?.label ?? suggestion.category : null;
  const selectedCategory = form.category === 'auto' ? 'Auto-detect with AI' : CATEGORY_MAP[form.category]?.label;

  return (
    <>
      <PageHeader
        eyebrow="Capture"
        title="Report an issue"
        description="Tell us what is wrong and where. The pipeline will categorise it, write a summary, check for duplicates and score urgency."
        actions={
          <Button as="a" href="/dashboard" variant="ghost">
            View dashboard
          </Button>
        }
      />

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <form id="report-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            {submitError ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-navy-900">Your report was not saved</p>
                  <p className="mt-0.5 leading-6 text-slate-600">
                    {submitError} Every field is still here, so you can retry.
                  </p>
                </div>
              </div>
            ) : null}

            <Card padded>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">1. What is the problem?</h2>
                  <p className="text-xs text-slate-500">Required: a description of at least 20 characters.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <Field id="title" label="Title" hint="A short headline helps operators scan the queue.">
                  <input
                    ref={titleRef}
                    id="title"
                    className="input"
                    value={form.title}
                    maxLength={80}
                    placeholder="Storm drain overflowing near Sunrise School"
                    onChange={(event) => update('title', event.target.value)}
                    onBlur={() => markTouched('title')}
                    {...errorProps('title', 'title-hint')}
                  />
                </Field>

                <Field
                  id="description"
                  label="Description"
                  required
                  hint="What is wrong, how long has it been there, and who is affected?"
                >
                  <textarea
                    ref={descriptionRef}
                    id="description"
                    className="input min-h-[132px] resize-y"
                    value={form.description}
                    maxLength={1000}
                    placeholder="The storm drain outside Sunrise School has been overflowing since Tuesday night. Water is knee deep on the footpath and children are walking through it."
                    onChange={(event) => update('description', event.target.value)}
                    onBlur={handleDescriptionBlur}
                    {...errorProps('description', 'description-hint')}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="hint mt-0">
                      {form.description.trim().length < 20
                        ? `${20 - form.description.trim().length} more characters needed`
                        : 'Enough detail for a useful summary'}
                    </p>
                    <p className="text-xs tabular-nums text-slate-400">{form.description.length}/1000</p>
                  </div>
                </Field>

                <div>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <Field id="category" label="Category" className="min-w-[12rem] flex-1">
                      <select
                        ref={categoryRef}
                        id="category"
                        className="input"
                        value={form.category}
                        onChange={(event) => {
                          update('category', event.target.value);
                          setSuggestion(null);
                        }}
                        onBlur={() => markTouched('category')}
                        {...errorProps('category')}
                      >
                        <option value="auto">Auto-detect with AI</option>
                        {CATEGORIES.map((category) => (
                          <option key={category.key} value={category.key}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Button
                      variant="ghost"
                      onClick={handleSuggest}
                      disabled={form.description.trim().length < 10}
                      className="shrink-0"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Suggest category
                    </Button>
                  </div>
                  <p className="hint">
                    Current choice: <span className="font-medium text-navy-900">{selectedCategory}</span>
                  </p>
                </div>

                {suggestion ? (
                  <div className="ai-panel px-4 py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                          <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
                          Suggested: {suggestedLabel} · {formatPercent(suggestion.confidence, 0)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {suggestion.lowConfidence
                            ? 'Low confidence. An operator will review this category.'
                            : `Matched terms: ${suggestion.matches.slice(0, 5).join(', ') || 'none'}.`}
                        </p>
                      </div>
                      {suggestion.applied ? (
                        <Badge tone="success" dot>
                          Applied
                        </Badge>
                      ) : (
                        <Button size="sm" variant="primary" onClick={applySuggestion}>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Apply
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {suggestion.alternatives.slice(0, 3).map((alternative) => (
                        <div key={alternative.category} className="flex items-center gap-2">
                          <span className="w-28 shrink-0 truncate text-xs text-slate-600">
                            {CATEGORY_MAP[alternative.category]?.short ?? alternative.category}
                          </span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                            <span
                              className="block h-full rounded-full bg-teal-500"
                              style={{ width: `${Math.max(2, Math.round(alternative.confidence * 100))}%` }}
                            />
                          </span>
                          <span className="w-9 text-right text-[11px] tabular-nums text-slate-500">
                            {formatPercent(alternative.confidence, 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {duplicateWarning.length > 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <p className="text-sm font-semibold text-navy-900">
                      Possible existing report nearby
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600">
                      This is a non-blocking check. Submit anyway if this is a different problem.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {duplicateWarning.map((candidate) => (
                        <li key={candidate.reportId} className="text-xs text-slate-700">
                          <span className="font-mono font-semibold">{candidate.referenceCode}</span>
                          {' · '}
                          {candidate.score.toFixed(2)} similarity · {candidate.distanceMeters} m away
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card padded>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">2. Where is it?</h2>
                  <p className="text-xs text-slate-500">Tap the map to drop a pin, or type coordinates.</p>
                </div>
              </div>

              <div className="mt-5">
                <LocationPicker value={mapValue} onChange={handlePickLocation} height={280} />

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field id="latitude" label="Latitude" hint="Decimal degrees, for example 12.97085">
                    <input
                      ref={latitudeRef}
                      id="latitude"
                      className="input"
                      inputMode="decimal"
                      value={form.latitude}
                      placeholder="12.97085"
                      onChange={(event) => update('latitude', event.target.value)}
                      onBlur={() => markTouched('location')}
                      {...errorProps('location', 'latitude-hint')}
                    />
                  </Field>
                  <Field id="longitude" label="Longitude" hint="Decimal degrees, for example 77.59355">
                    <input
                      id="longitude"
                      className="input"
                      inputMode="decimal"
                      value={form.longitude}
                      placeholder="77.59355"
                      onChange={(event) => update('longitude', event.target.value)}
                      onBlur={() => markTouched('location')}
                      {...errorProps('location', 'longitude-hint')}
                    />
                  </Field>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Pin: {coord(form.latitude)}, {coord(form.longitude)}
                  </p>
                  {showError('location') ? (
                    <p id="location-error" className="error-text mt-0" role="alert">
                      {errors.location}
                    </p>
                  ) : null}
                </div>

                <Field
                  id="location-label"
                  label="Address or landmark"
                  className="mt-3"
                  hint="Optional, but it makes the hotspot label readable."
                >
                  <input
                    id="location-label"
                    className="input"
                    value={form.locationLabel}
                    placeholder="4th Cross, Sector 12"
                    onChange={(event) => update('locationLabel', event.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card padded>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">3. Evidence and contact</h2>
                  <p className="text-xs text-slate-500">Photo evidence is never analysed by AI.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
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
                    onChange={handleImage}
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
                    <Button size="sm" variant="ghost" onClick={clearImage}>
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
                      I understand this is a demo and I should not submit real personal
                      information.
                    </span>
                  </label>
                  {showError('consent') ? (
                    <p id="consent-error" className="error-text" role="alert">
                      {errors.consent}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>

            <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
              <p className="text-xs leading-5 text-slate-500">
                Submit runs the rules-v1 pipeline in your browser. Nothing leaves this device.
              </p>
              <Button type="submit" variant="accent" size="lg" loading={submitting}>
                {submitting ? 'Analysing report…' : 'Submit report'}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            <Card padded>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">What happens next</h2>
                <Badge tone="teal" dot>
                  rules-v1
                </Badge>
              </div>
              <ol className="mt-4 space-y-3">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-xl bg-navy-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                After submission you get a tracking code and the analysis page. Keep the code to
                follow the public timeline.
              </p>
            </Card>

            <HonestyNote title="No image AI">
              Photos are stored as evidence only. Nothing in this prototype analyses image content,
              and a missing photo never blocks a report.
            </HonestyNote>

            <HonestyNote tone="warning" title="Demo data">
              This prototype stores reports in your browser. Do not submit real personal
              information. Reset demo data from the footer at any time.
            </HonestyNote>

            <Card padded className="bg-navy-900 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-teal-400" aria-hidden="true" />
                Privacy by default
              </p>
              <p className="mt-2 text-sm leading-6 text-navy-100/80">
                Only the tracking code is needed to view a citizen timeline. Contact details stay
                local and internal notes never appear on public routes.
              </p>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-slate-200 bg-mist/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-mist/80 sm:-mx-6 sm:px-6 lg:hidden">
          <p className="pr-3 text-xs leading-5 text-slate-500">Runs in your browser. Nothing leaves this device.</p>
          <Button type="submit" form="report-form" variant="accent" loading={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Analysing…
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Submit
              </>
            )}
          </Button>
        </div>
      </Container>
    </>
  );
}
