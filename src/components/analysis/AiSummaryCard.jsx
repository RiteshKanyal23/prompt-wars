import { useState } from 'react';
import { AlertTriangle, Check, Copy, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { buildCopySummary } from '@/lib/analysis';
import { CATEGORY_MAP } from '@/lib/constants';
import { copyText } from '@/lib/clipboard';
import { formatPercent } from '@/lib/format';

export default function AiSummaryCard({ report, ai }) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyText(buildCopySummary(report));
    if (ok) {
      setCopied(true);
      push({
        tone: 'success',
        title: 'Analysis summary copied',
        message: 'Paste it into a handover note or the demo script.',
      });
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      push({
        tone: 'danger',
        title: 'Could not copy',
        message: 'Select the summary text and copy it manually.',
      });
    }
  }

  if (!ai) {
    return (
      <Card padded>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-slate-400" aria-hidden="true" />
          AI summary
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This report has no stored analysis. It was saved before the pipeline ran.
        </p>
      </Card>
    );
  }

  const alternatives = (ai.alternatives ?? []).filter(
    (alternative) => alternative.category !== ai.category,
  );
  const matchedTerms = (ai.matchedTerms ?? []).slice(0, 10);

  return (
    <Card padded>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
            AI summary
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Extractive — it reuses the citizen&apos;s own sentences.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={ai.lowConfidence ? 'warning' : 'teal'} dot>
            {ai.lowConfidence ? 'Low confidence' : 'Classified'}
          </Badge>
          <Button size="sm" variant="ghost" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy summary'}
          </Button>
        </div>
      </div>

      <p className="mt-3 rounded-xl bg-navy-50 px-4 py-3 text-sm leading-6 text-navy-900">
        {ai.summary}
      </p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-slate-600">
            Category · {CATEGORY_MAP[ai.category]?.label ?? ai.category}
          </span>
          <span className="font-semibold tabular-nums text-navy-900">
            {formatPercent(ai.confidence, 0)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500"
            style={{ width: `${Math.max(3, Math.round(ai.confidence * 100))}%` }}
          />
        </div>
      </div>

      {alternatives.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Runner-up categories
          </p>
          <div className="mt-2 space-y-2">
            {alternatives.map((alternative) => (
              <div key={alternative.category} className="flex items-center gap-2">
                <span className="w-28 shrink-0 truncate text-xs text-slate-600">
                  {CATEGORY_MAP[alternative.category]?.short ?? alternative.category}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-navy-300"
                    style={{
                      width: `${Math.max(2, Math.round(alternative.confidence * 100))}%`,
                    }}
                  />
                </span>
                <span className="w-10 text-right text-[11px] tabular-nums text-slate-500">
                  {formatPercent(alternative.confidence, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {matchedTerms.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Matched terms
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {matchedTerms.map((term) => (
              <li
                key={term}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
              >
                {term}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ai.lowConfidence ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-navy-900">Category needs a human check</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">
              Confidence is below the 45% threshold. An operator should confirm the category before
              dispatch.
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
