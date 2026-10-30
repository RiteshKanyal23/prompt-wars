import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Copy } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { duplicateContributions } from '@/lib/analysis';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import { formatMeters } from '@/lib/geo';

const DUPLICATE_TONE = {
  strong: 'danger',
  review: 'warning',
  low: 'neutral',
};

const DUPLICATE_LABEL = {
  strong: 'Strong match',
  review: 'Needs review',
  low: 'Low signal',
};

const COMPONENT_COLOR = {
  text: 'bg-teal-500',
  category: 'bg-blue-500',
  geo: 'bg-amber-500',
  time: 'bg-slate-400',
};

function ComparisonColumn({ label, report, fallbackCode }) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 font-mono text-xs font-semibold text-navy-900">{fallbackCode}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          This report is no longer in the corpus. The stored similarity evidence above is still
          valid.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <Link
        to={`/analysis/${report.id}`}
        className="mt-1 inline-block font-mono text-xs font-semibold tracking-wider text-navy-900 hover:text-teal-700"
      >
        {report.referenceCode}
      </Link>
      <p className="mt-1 text-xs font-semibold text-navy-900">
        {report.title ?? 'Untitled report'}
      </p>
      <p className="mt-1 line-clamp-4 text-xs leading-5 text-slate-600">{report.description}</p>
      <p className="mt-2 text-[11px] text-slate-500">
        {CATEGORY_MAP[report.category]?.label ?? report.category} · {formatDateTime(report.createdAt)}
      </p>
    </div>
  );
}

export default function DuplicateList({ report, ai, reportsById = {} }) {
  const [openId, setOpenId] = useState(null);

  if (!ai) {
    return (
      <Card padded>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Copy className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Duplicate evidence
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No analysis is stored, so no duplicate comparison exists for this report.
        </p>
      </Card>
    );
  }

  const candidates = ai.duplicates ?? [];

  return (
    <Card padded>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Copy className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Duplicate evidence
        </h2>
        <Badge tone="neutral">review at 0.68 · strong at 0.82</Badge>
      </div>

      {candidates.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm leading-6 text-slate-600">
          No report within 300 m and 21 days was similar enough to propose as a duplicate. Nothing
          was merged automatically.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {candidates.map((candidate) => {
            const open = openId === candidate.reportId;
            const comparison = reportsById[candidate.reportId] ?? null;
            const contributions = duplicateContributions(candidate.components);

            return (
              <li key={candidate.reportId} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/analysis/${candidate.reportId}`}
                      className="font-mono text-sm font-semibold tracking-wider text-navy-900 hover:text-teal-700"
                    >
                      {candidate.referenceCode}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatPercent(candidate.score, 0)} similarity ·{' '}
                      {formatMeters(candidate.distanceMeters)} apart ·{' '}
                      {candidate.ageDays} day(s) difference
                    </p>
                  </div>
                  <Badge tone={DUPLICATE_TONE[candidate.level] ?? 'neutral'} dot>
                    {DUPLICATE_LABEL[candidate.level] ?? candidate.level}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5">
                  {contributions.map((component) => (
                    <div key={component.key} className="flex items-center gap-2">
                      <span className="w-[104px] shrink-0 text-[11px] text-slate-600">
                        {component.label}{' '}
                        <span className="text-slate-400">{Math.round(component.weight * 100)}%</span>
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className={`block h-full rounded-full ${COMPONENT_COLOR[component.key] ?? 'bg-slate-400'}`}
                          style={{ width: `${Math.max(2, Math.round(component.raw * 100))}%` }}
                        />
                      </span>
                      <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-500">
                        {formatPercent(component.raw, 0)} · {Math.round(component.points * 100)}
                      </span>
                    </div>
                  ))}
                </div>

                {candidate.reasons.length ? (
                  <ul className="mt-2 space-y-1">
                    {candidate.reasons.map((reason) => (
                      <li key={reason} className="text-xs leading-5 text-slate-600">
                        · {reason}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : candidate.reportId)}
                    aria-expanded={open}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-600"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                    {open ? 'Close comparison' : 'Open comparison'}
                  </button>
                  <Link
                    to={`/analysis/${candidate.reportId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-navy-900"
                  >
                    Open analysis
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {open ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ComparisonColumn
                        label="This report"
                        report={report}
                        fallbackCode={report?.referenceCode}
                      />
                      <ComparisonColumn
                        label="Proposed duplicate"
                        report={comparison}
                        fallbackCode={candidate.referenceCode}
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      {formatNumber(candidate.distanceMeters)} m apart ·{' '}
                      {candidate.ageDays} day(s) between submissions. A person confirms or rejects
                      this proposal; nothing is merged automatically.
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Similarity combines text (55%), category (20%), distance (15%) and time (10%). The bars show
        the raw component value and the points it contributes to the total.
      </p>
    </Card>
  );
}
