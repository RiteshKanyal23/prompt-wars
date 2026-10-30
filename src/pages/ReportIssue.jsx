import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ImagePlus, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import ReportProblemSection from '@/components/reports/ReportProblemSection';
import ReportLocationSection from '@/components/reports/ReportLocationSection';
import ReportEvidenceSection from '@/components/reports/ReportEvidenceSection';
import ReportSidebar from '@/components/reports/ReportSidebar';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/useToast';
import { useCreateReport } from '@/hooks/useCreateReport';
import { CATEGORY_MAP } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { isValidCoordinate } from '@/lib/geo';
import { prepareImageFile } from '@/lib/image';
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
      setErrors(validate({ ...form, latitude: String(next.lat), longitude: String(next.lng) }));
    }
  }

  function handleCategoryChange(value) {
    update('category', value);
    setSuggestion(null);
  }

  function handleSuggest() {
    setSuggestion(classifyReport({ title: form.title, description: form.description }));
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

    const candidates = findDuplicateCandidates(draft, corpus, { now: new Date(), limit: 2 }).filter(
      (candidate) => candidate.level !== 'low',
    );
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
      setTouched(Object.fromEntries(FIELD_ORDER.map((field) => [field, true])));
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

  const suggestedLabel = suggestion
    ? CATEGORY_MAP[suggestion.category]?.label ?? suggestion.category
    : null;
  const selectedCategory =
    form.category === 'auto' ? 'Auto-detect with AI' : CATEGORY_MAP[form.category]?.label;

  return (
    <>
      <PageHeader
        eyebrow="Capture"
        title="Report an issue"
        description="Tell us what is wrong and where. The pipeline will categorise it, write a summary, check for duplicates and score urgency."
        actions={
          <Link to="/dashboard" className="btn btn-ghost">
            View dashboard
          </Link>
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

            <ReportProblemSection
              form={form}
              update={update}
              markTouched={markTouched}
              errorProps={errorProps}
              showError={showError}
              errors={errors}
              titleRef={titleRef}
              descriptionRef={descriptionRef}
              categoryRef={categoryRef}
              suggestion={suggestion}
              suggestedLabel={suggestedLabel}
              selectedCategory={selectedCategory}
              duplicateWarning={duplicateWarning}
              onSuggest={handleSuggest}
              onApplySuggestion={applySuggestion}
              onDescriptionBlur={handleDescriptionBlur}
              onCategoryChange={handleCategoryChange}
            />

            <ReportLocationSection
              form={form}
              update={update}
              markTouched={markTouched}
              showError={showError}
              errorProps={errorProps}
              latitudeRef={latitudeRef}
              mapValue={mapValue}
              onPickLocation={handlePickLocation}
              locationError={errors.location}
            />

            <ReportEvidenceSection
              form={form}
              update={update}
              markTouched={markTouched}
              showError={showError}
              errorProps={errorProps}
              imageRef={imageRef}
              consentRef={consentRef}
              imageLoading={imageLoading}
              imageError={imageError}
              consentError={errors.consent}
              onImageChange={handleImage}
              onClearImage={clearImage}
            />

            <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
              <p className="text-xs leading-5 text-slate-500">
                Submit runs the rules-v1 pipeline in your browser. Nothing leaves this device.
              </p>
              <Button type="submit" variant="accent" size="lg" loading={submitting}>
                {submitting ? 'Analysing report…' : 'Submit report'}
              </Button>
            </div>
          </form>

          <ReportSidebar />
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-slate-200 bg-mist/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-mist/80 sm:-mx-6 sm:px-6 lg:hidden">
          <p className="pr-3 text-xs leading-5 text-slate-500">
            Runs in your browser. Nothing leaves this device.
          </p>
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
