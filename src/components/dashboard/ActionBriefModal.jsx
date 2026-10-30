import { useEffect, useState } from 'react';
import { Check, Copy, FileText, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { buildActionBrief } from '@/services/ai/brief';
import { copyText } from '@/lib/clipboard';

function briefToText(brief) {
  return [
    brief.title,
    '',
    `Location: ${brief.location}`,
    `Pattern: ${brief.pattern}`,
    `Risk: ${brief.risk}`,
    `Suggested owner: ${brief.owner}`,
    `Action: ${brief.action}`,
    `Confidence: ${brief.confidence}`,
    '',
    'Evidence:',
    ...brief.evidence.map((item) => `- ${item}`),
    '',
    `Note: ${brief.mocked}`,
  ].join('\n');
}

export default function ActionBriefModal({ cluster, onClose }) {
  const [copied, setCopied] = useState(false);
  const brief = cluster ? buildActionBrief(cluster) : null;

  useEffect(() => {
    if (!cluster) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [cluster, onClose]);

  useEffect(() => {
    setCopied(false);
  }, [cluster]);

  if (!brief) return null;

  async function handleCopy() {
    const ok = await copyText(briefToText(brief));
    if (ok) setCopied(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-navy-950/55" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-title"
        className="relative z-10 max-h-[92dvh] w-full max-w-2xl animate-fade-in overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Template-generated
            </p>
            <h2 id="brief-title" className="mt-1 text-lg font-semibold text-navy-900">
              {brief.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close action brief"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-navy-900 hover:bg-navy-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="teal" dot>
              {brief.owner}
            </Badge>
            <Badge tone="neutral">{brief.confidence}</Badge>
            <Badge tone="warning">Recommendation only</Badge>
          </div>

          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
            {[
              ['Location', brief.location],
              ['Pattern', brief.pattern],
              ['Risk', brief.risk],
              ['Suggested action', brief.action],
            ].map(([label, value]) => (
              <div key={label} className="py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Evidence
            </p>
            <ul className="mt-2 space-y-1.5">
              {brief.evidence.map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-semibold text-navy-900">MOCKED</p>
            <p className="mt-0.5 leading-6 text-slate-600">{brief.mocked}</p>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Copied' : 'Copy brief'}
          </Button>
        </div>
      </div>
    </div>
  );
}
