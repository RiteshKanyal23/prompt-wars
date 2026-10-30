import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText, MapPin, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CATEGORY_MAP } from '@/lib/constants';

const TREND = {
  rising: { icon: TrendingUp, label: 'Rising', tone: 'warning' },
  falling: { icon: TrendingDown, label: 'Falling', tone: 'success' },
  steady: { icon: Minus, label: 'Steady', tone: 'neutral' },
};

export default function HotspotCard({ cluster, onBrief }) {
  const trend = TREND[cluster.trend] ?? TREND.steady;
  const TrendIcon = trend.icon;
  const mix = Object.entries(cluster.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${CATEGORY_MAP[key]?.short ?? key} ${count}`)
    .join(' · ');

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            <MapPin className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="truncate">{cluster.label}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {cluster.count} reports · {cluster.radiusMeters} m radius
          </p>
        </div>
        <Badge tone={trend.tone} dot>
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          {trend.label}
        </Badge>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-600">{mix}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Hotspot score
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-navy-900">
            {cluster.hotspotScore}
            <span className="text-xs font-medium text-slate-400">/100</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Avg priority
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-navy-900">
            {cluster.avgPriority}
            <span className="text-xs font-medium text-slate-400">/100</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={() => onBrief(cluster)}>
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Action brief
        </Button>
        <Link
          to={`/analysis/${cluster.members[0]?.id ?? ''}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-600"
        >
          Top report
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
