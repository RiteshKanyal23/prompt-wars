import { Copy, Inbox, Map, Table2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import HonestyNote from '@/components/ui/HonestyNote';
import EmptyState from '@/components/ui/EmptyState';

const TABS = [
  { label: 'Queue', icon: Inbox },
  { label: 'Duplicates', icon: Copy },
  { label: 'Hotspots', icon: Map },
  { label: 'Reports', icon: Table2 },
];

export default function Admin() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Act</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Operator queue</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Triage by priority, confirm or reject duplicate proposals, assign a department and move a
            report through its lifecycle with a public trail.
          </p>
        </div>
        <Badge tone="warning" dot>
          Workflow arrives in Phase 7
        </Badge>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
        {TABS.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={index === 0}
            disabled
            className={[
              'inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-sm font-medium',
              index === 0
                ? 'border-navy-900 bg-navy-900 text-white'
                : 'border-slate-300 bg-white text-slate-500',
            ].join(' ')}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
            {index > 0 ? <span className="text-[10px] uppercase tracking-wide text-slate-400">P7</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold">Priority queue</h2>
            <Badge tone="neutral">Sorted by score</Badge>
          </div>
          <div className="p-4">
            <EmptyState
              icon={Inbox}
              title="Queue is empty in this shell"
              description="Reports appear here after the seed and repository are wired. Invalid status transitions will be disabled and guarded in the service layer."
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card padded>
            <h2 className="text-base font-semibold">Detail drawer</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Opens from any queue row with the AI summary, factor table, map, assignment, status
              stepper, notes and duplicate actions.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Assignment with SLA default by band</li>
              <li>• Guarded status transitions</li>
              <li>• Public note required on resolve</li>
              <li>• Internal notes never exposed on /track</li>
            </ul>
          </Card>

          <HonestyNote tone="warning" title="Unauthenticated demo">
            There is no login wall in local mode. The console is for demonstration only and must not
            be deployed publicly without the auth and RLS work planned for P9.
          </HonestyNote>
        </div>
      </div>
    </div>
  );
}
