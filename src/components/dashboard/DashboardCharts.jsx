import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Skeleton from '@/components/ui/Skeleton';
import { CATEGORIES, PRIORITY_ORDER } from '@/lib/constants';
import { countBy } from '@/lib/reportStats';

const BAND_COLOR = {
  P0: '#dc2626',
  P1: '#f59e0b',
  P2: '#2563eb',
  P3: '#64748b',
};

const DAY = 24 * 60 * 60 * 1000;

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 8px 24px -12px rgba(11,31,58,.28)',
};

function trendData(reports, days = 14) {
  const now = new Date();
  const buckets = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * DAY);
    const key = date.toISOString().slice(0, 10);
    buckets.push({
      key,
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      reports: 0,
    });
  }
  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const report of reports) {
    const key = String(report.createdAt ?? '').slice(0, 10);
    const bucket = index.get(key);
    if (bucket) bucket.reports += 1;
  }
  return buckets;
}

/** Recharts needs a real DOM; render the charts only after mount so SSR stays clean. */
export default function DashboardCharts({ reports = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categoryCounts = countBy(reports, (report) => report.category);
  const categoryData = CATEGORIES.map((category) => ({
    name: category.short,
    reports: categoryCounts[category.key] ?? 0,
  }));

  const bandCounts = countBy(reports, (report) => report.priorityBand ?? 'unscored');
  const bandData = PRIORITY_ORDER.map((band) => ({
    name: band,
    value: bandCounts[band] ?? 0,
  }));

  const trend = trendData(reports);
  const totalBand = bandData.reduce((sum, item) => sum + item.value, 0);

  const categorySummary = categoryData
    .filter((entry) => entry.reports > 0)
    .map((entry) => `${entry.name} ${entry.reports}`)
    .join(', ');
  const categoryLabel = `Bar chart: reports by category across ${reports.length} reports. ${
    categorySummary || 'No reports in this filter.'
  }`;

  const bandSummary = bandData.map((entry) => `${entry.name} ${entry.value}`).join(', ');
  const bandLabel = `Donut chart: priority mix. ${bandSummary}.`;

  const trendTotal = trend.reduce((sum, bucket) => sum + bucket.reports, 0);
  const peak = trend.reduce((best, bucket) => (bucket.reports > best.reports ? bucket : best), trend[0]);
  const trendLabel = `Area chart: reports per day over the last 14 days. ${trendTotal} reports in total, peak ${peak.reports} on ${peak.label}.`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-navy-900">Reports by category</h3>
            <span className="text-xs text-slate-500">{reports.length} total</span>
          </div>
          <div className="mt-3 h-56" role="img" aria-label={categoryLabel}>
            {!mounted ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f1f5fa' }} />
                  <Bar
                    dataKey="reports"
                    fill="#0FB5A6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-navy-900">Priority mix</h3>
            <span className="text-xs text-slate-500">Bands at 80 / 60 / 40</span>
          </div>
          <div className="mt-3 h-56" role="img" aria-label={bandLabel}>
            {!mounted ? (
              <Skeleton className="h-full w-full" />
            ) : totalBand === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                No scored reports in this filter.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bandData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {bandData.map((entry) => (
                      <Cell key={entry.name} fill={BAND_COLOR[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
            {bandData.map((entry) => (
              <li key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: BAND_COLOR[entry.name] ?? '#94a3b8' }}
                  aria-hidden="true"
                />
                {entry.name} · {entry.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-navy-900">Reports per day · last 14 days</h3>
          <span className="text-xs text-slate-500">Filtered set</span>
        </div>
        <div className="mt-3 h-48" role="img" aria-label={trendLabel}>
          {!mounted ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0FB5A6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0FB5A6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#0C9A8D"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
