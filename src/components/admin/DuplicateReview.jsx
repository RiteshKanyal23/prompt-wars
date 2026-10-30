import { useState } from 'react';
import { ArrowLeftRight, Check, Copy, MapPin, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import { CATEGORY_MAP } from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { formatDateTime, timeAgo } from '@/lib/format';
import { distanceMeters } from '@/lib/geo';

const COMPONENTS = [
  { key: 'text', label: 'Text similarity', weight: 0.55, kind: 'ratio' },
  { key: 'category', label: 'Category match', weight: 0.2, kind: 'ratio' },
  { key: 'geo', label: 'Distance', weight: 0.15, kind: 'ratio' },
  { key: 'time', label: 'Time proximity', weight: 0.1, kind: 'ratio' },
];

function ReportSide({ report, label }) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        This report is no longer in the corpus.
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <StatusBadge status={report.status} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] font-semibold text-teal-700">
        {report.referenceCode}
      </p>
      <p className="mt-1 text-sm font-semibold leading-5 text-navy-900">
        {report.title ?? 'Untitled report'}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-slate-600">{report.description}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
        <Badge tone="neutral">{CATEGORY_MAP[report.category]?.short ?? report.category}</Badge>
      </div>
      <p className="mt-2 flex items-start gap-1 text-xs text-slate-500">
        <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{report.locationLabel ?? 'No location label'}</span>
      </p>
      <p className="mt-1 text-[11px] text-slate-400">
        {timeAgo(report.createdAt)} · {formatDateTime(report.createdAt)}
      </p>
    </div>
  );
}

export default function DuplicateReview({ pair, reports, onReview }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const primary = reports.find((report) => report.id === pair.reportId) ?? null;
  const candidate = reports.find((report) => report.id === pair.duplicateOf) ?? null;
  const meters =
    primary && candidate ? Math.round(distanceMeters(primary, candidate)) : null;
  const pending = pair.status === 'pending';

  async function handle(decision) {
    setError(null);
    setBusy(true);
    try {
      await onReview(pair.id, decision, reason.trim());
      setReason('');
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Copy className="h-4 w-4 text-teal-600" aria-hidden="true" />
            {primary?.referenceCode ?? pair.reportId}
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {candidate?.referenceCode ?? pair.duplicateOf}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {pair.similarity !== undefined
              ? `${Math.round(pair.similarity * 100)}% combined score`
              : 'Combined score unavailable'}
            {meters !== null ? ` · ${meters} m apart` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={pair.level === 'strong' ? 'danger' : 'warning'} dot>
            {pair.level === 'strong' ? 'Strong match' : 'Review match'}
          </Badge>
          <Badge tone={pending ? 'info' : pair.status === 'confirmed' ? 'success' : 'neutral'}>
            {pair.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
        <ReportSide report={primary} label="Proposed duplicate" />
        <ReportSide report={candidate} label="Existing report" />
      </div>

      <div className="border-t border-slate-100 px-4 py-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Why the pipeline proposed this
        </h4>
        <ul className="mt-2.5 space-y-2">
          {COMPONENTS.map((component) => {
            const value = Number(pair.components?.[component.key] ?? 0);
            const contribution = value * component.weight;
            return (
              <li key={component.key}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">
                    {component.label}{' '}
                    <span className="text-slate-400">· weight {component.weight}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-navy-900">
                    +{(contribution * 100).toFixed(1)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Text, category, distance and time are additive. Thresholds: review at 0.62, strong at
          0.82. A human makes the final call.
        </p>
      </div>

      {pending ? (
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-4">
          <Field
            id={`duplicate-reason-${pair.id}`}
            label="Review note"
            hint="Stored with the decision and published when a merge is confirmed."
          >
            <input
              id={`duplicate-reason-${pair.id}`}
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Same blocked drain, reported twice"
            />
          </Field>

          {error ? (
            <p role="alert" className="mt-2 text-xs font-medium text-red-600">
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => handle('rejected')}
              className="justify-center"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Keep both reports
            </Button>
            <Button
              variant="primary"
              disabled={busy}
              loading={busy}
              onClick={() => handle('confirmed')}
              className="justify-center"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Confirm duplicate
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-xs text-slate-600">
            Reviewed {pair.reviewedAt ? formatDateTime(pair.reviewedAt) : '—'}
            {pair.reason ? ` · ${pair.reason}` : ''}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {pair.status === 'confirmed'
              ? 'The proposed duplicate is linked and both timelines carry a public event.'
              : 'Both reports remain open and independently actionable.'}
          </p>
        </div>
      )}
    </article>
  );
}
