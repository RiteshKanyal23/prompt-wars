import { Link } from 'react-router-dom';
import { ArrowRight, Layers, MapPin, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatMeters } from '@/lib/geo';

const TREND = {
  rising: { icon: TrendingUp, label: 'Rising', tone: 'warning' },
  falling: { icon: TrendingDown, label: 'Falling', tone: 'success' },
  steady: { icon: Minus, label: 'Steady', tone: 'neutral' },
};

const CATEGORY_COLOR = {
  roads: '#2563eb',
  water: '#0ea5e9',
  waste: '#f59e0b',
  electricity: '#eab308',
  sanitation: '#14b8a6',
  public_safety: '#dc2626',
  other: '#94a3b8',
};

export default function HotspotMembershipCard({ snapshot, cluster }) {
  const data = snapshot ?? cluster ?? null;

  return (
    <Card padded>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Layers className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Hotspot membership
        </h2>
        {data ? (
          <Badge tone={(TREND[data.trend] ?? TREND.steady).tone} dot>
            {(TREND[data.trend] ?? TREND.steady).label}
          </Badge>
        ) : null}
      </div>

      {!data ? (
        <>
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm leading-6 text-slate-600">
            This report is not part of a hotspot. A hotspot needs at least 3 related reports within
            the same 0.003° grid cell in the last 30 days.
          </p>
          <Link
            to="/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-600"
          >
            See the hotspot map
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            <MapPin className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            {data.label}
          </p>

          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
            {Object.entries(data.categories ?? {})
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <span
                  key={category}
                  title={`${CATEGORY_MAP[category]?.label ?? category}: ${count}`}
                  style={{
                    width: `${(count / Math.max(1, data.count)) * 100}%`,
                    background: CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other,
                  }}
                />
              ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(data.categories ?? {})
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <li key={category} className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other }}
                    aria-hidden="true"
                  />
                  {CATEGORY_MAP[category]?.short ?? category} {count}
                </li>
              ))}
          </ul>

          <dl className="mt-3 divide-y divide-slate-100">
            <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <dt className="text-slate-500">Reports in cluster</dt>
              <dd className="font-semibold tabular-nums text-navy-900">{data.count}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <dt className="text-slate-500">Average priority</dt>
              <dd className="font-semibold tabular-nums text-navy-900">{data.avgPriority}/100</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <dt className="text-slate-500">Hotspot score</dt>
              <dd className="font-semibold tabular-nums text-navy-900">{data.hotspotScore}/100</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
              <dt className="text-slate-500">Radius</dt>
              <dd className="font-semibold tabular-nums text-navy-900">
                {formatMeters(data.radiusMeters)}
              </dd>
            </div>
          </dl>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              to={`/dashboard?q=${encodeURIComponent(data.label)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-600"
            >
              Open on the dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {cluster?.members?.length ? (
              <Link
                to={`/analysis/${cluster.members[0].id}`}
                className="text-xs font-semibold text-slate-500 hover:text-navy-900"
              >
                Highest-priority member
              </Link>
            ) : null}
          </div>
        </>
      )}
    </Card>
  );
}
