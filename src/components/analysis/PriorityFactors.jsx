import { Gauge } from 'lucide-react';
import Card from '@/components/ui/Card';
import PriorityBadge from '@/components/reports/PriorityBadge';
import { factorsMatchScore, sumFactorPoints } from '@/lib/analysis';

function signedPoints(value) {
  const points = Number(value ?? 0);
  return points > 0 ? `+${points}` : `${points}`;
}

export default function PriorityFactors({ priority, band, score }) {
  if (!priority) {
    return (
      <Card padded>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Gauge className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Priority
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No priority score is stored for this report.
        </p>
      </Card>
    );
  }

  const factors = priority.factors ?? [];
  const total = sumFactorPoints(priority);
  const matches = factorsMatchScore(priority);
  const displayScore = Number.isFinite(Number(score)) ? Number(score) : priority.score;

  return (
    <Card padded>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Gauge className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Priority factors
        </h2>
        <PriorityBadge band={band} score={displayScore} />
      </div>

      <div className="mt-4 flex items-end gap-3">
        <p className="text-4xl font-bold tabular-nums text-navy-900">{displayScore}</p>
        <p className="pb-1 text-sm text-slate-500">out of 100</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{priority.verdict}</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Priority factors, their points and the reason for each point
          </caption>
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-2.5 py-2 font-semibold sm:px-3">
                Factor
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold sm:px-3">
                Points
              </th>
              <th scope="col" className="px-2.5 py-2 font-semibold sm:px-3">
                Why
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {factors.map((factor) => (
              <tr key={factor.code} className="align-top">
                <th scope="row" className="px-2.5 py-2.5 font-medium text-slate-700 sm:px-3">
                  {factor.label}
                </th>
                <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-navy-900 sm:px-3">
                  {signedPoints(factor.points)}
                </td>
                <td className="px-2.5 py-2.5 text-xs leading-5 text-slate-600 sm:px-3">
                  {factor.detail}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
              <th scope="row" className="px-2.5 py-2.5 text-slate-700 sm:px-3">
                Total
              </th>
              <td className="px-2 py-2.5 text-right tabular-nums text-navy-900 sm:px-3">
                {total}
              </td>
              <td className="px-2.5 py-2.5 text-xs font-normal leading-5 text-slate-600 sm:px-3">
                {matches
                  ? `Matches the stored score of ${displayScore}.`
                  : `Stored score is ${displayScore}; check the raw payload.`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Hazard escalation and the 100-point cap appear as their own rows, so the arithmetic always
        closes. Points come from category severity, urgency language, cluster size, confirmed
        duplicates and recency.
      </p>
    </Card>
  );
}
