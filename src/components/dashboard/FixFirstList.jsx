import { Link } from 'react-router-dom';
import { ChevronDown, MapPin } from 'lucide-react';
import PriorityBadge from '@/components/reports/PriorityBadge';
import { CATEGORY_MAP } from '@/lib/constants';
import { timeAgo } from '@/lib/format';

export default function FixFirstList({ reports = [], limit = 6 }) {
  const ranked = reports.slice(0, limit);

  if (ranked.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
        No open reports match these filters. Clear a filter or reset the demo data.
      </p>
    );
  }

  return (
    <ol className="space-y-2.5">
      {ranked.map((report, index) => {
        const factors = report.ai?.priority?.factors ?? [];

        return (
          <li key={report.id} className="rounded-xl border border-slate-200">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-start gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold tabular-nums text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <Link
                      to={`/analysis/${report.id}`}
                      className="text-sm font-semibold text-navy-900 hover:text-teal-700"
                    >
                      {report.title ?? report.referenceCode}
                    </Link>
                    <PriorityBadge band={report.priorityBand} score={report.priorityScore} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>{CATEGORY_MAP[report.category]?.short ?? report.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {report.locationLabel ?? 'Pinned on the map'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{timeAgo(report.createdAt)}</span>
                  </p>
                </div>
                <ChevronDown
                  className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>

              <div className="border-t border-slate-100 px-3.5 py-3">
                {factors.length === 0 ? (
                  <p className="text-xs text-slate-500">No factor breakdown is stored for this report.</p>
                ) : (
                  <>
                    <p className="text-xs leading-5 text-slate-600">
                      {report.ai.priority.verdict}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {factors.map((factor) => (
                        <li
                          key={factor.code}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-600">{factor.label}</span>
                          <span className="shrink-0 font-semibold tabular-nums text-navy-900">
                            +{factor.points}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                      Factors sum to {report.ai.priority.score}. Every point is traceable to the
                      stored report text, coordinates or cluster.
                    </p>
                  </>
                )}
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
