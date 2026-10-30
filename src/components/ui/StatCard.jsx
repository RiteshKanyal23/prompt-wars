import Card from './Card';
import Skeleton from './Skeleton';

/**
 * A single labelled metric with a short explanation. Shared by the citizen
 * dashboard and the operator console so both read the same way.
 */
export default function StatCard({ label, value, hint, loading = false }) {
  return (
    <Card className="card-pad">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-16" />
      ) : (
        <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900 sm:text-3xl">{value}</p>
      )}
      {hint ? <p className="mt-1 text-[11px] leading-4 text-slate-500">{hint}</p> : null}
    </Card>
  );
}
