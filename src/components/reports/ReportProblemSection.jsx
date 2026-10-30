import { Check, FileText, Sparkles } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import FormSection from '@/components/reports/FormSection';
import { CATEGORIES, CATEGORY_MAP } from '@/lib/constants';
import { formatPercent } from '@/lib/format';

/**
 * Group 1: what is wrong. Owns the description counter, the optional
 * "Suggest category" call and the non-blocking duplicate warning.
 */
export default function ReportProblemSection({
  form,
  update,
  markTouched,
  errorProps,
  showError,
  errors,
  titleRef,
  descriptionRef,
  categoryRef,
  suggestion,
  suggestedLabel,
  selectedCategory,
  duplicateWarning,
  onSuggest,
  onApplySuggestion,
  onDescriptionBlur,
  onCategoryChange,
}) {
  const remaining = 20 - form.description.trim().length;
  const fieldError = (field) => (showError(field) ? errors[field] : undefined);

  return (
    <FormSection
      icon={FileText}
      step={1}
      title="What is the problem?"
      subtitle="Required: a description of at least 20 characters."
    >
      <Field
        id="title"
        label="Title"
        hint="A short headline helps operators scan the queue."
        error={fieldError('title')}
      >
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
        error={fieldError('description')}
      >
        <textarea
          ref={descriptionRef}
          id="description"
          className="input min-h-[132px] resize-y"
          value={form.description}
          maxLength={1000}
          placeholder="The storm drain outside Sunrise School has been overflowing since Tuesday night. Water is knee deep on the footpath and children are walking through it."
          onChange={(event) => update('description', event.target.value)}
          onBlur={onDescriptionBlur}
          {...errorProps('description', 'description-hint')}
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="hint mt-0">
            {remaining > 0 ? `${remaining} more characters needed` : 'Enough detail for a useful summary'}
          </p>
          <p className="text-xs tabular-nums text-slate-400">{form.description.length}/1000</p>
        </div>
      </Field>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Field
            id="category"
            label="Category"
            className="min-w-[12rem] flex-1"
            error={fieldError('category')}
          >
            <select
              ref={categoryRef}
              id="category"
              className="input"
              value={form.category}
              onChange={(event) => onCategoryChange(event.target.value)}
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
            onClick={onSuggest}
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
              <Button size="sm" variant="primary" onClick={onApplySuggestion}>
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
          <p className="text-sm font-semibold text-navy-900">Possible existing report nearby</p>
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
    </FormSection>
  );
}
