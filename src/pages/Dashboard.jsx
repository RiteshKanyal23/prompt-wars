import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import HonestyNote from '@/components/ui/HonestyNote';

const KPIS = ['Total reports', 'Open', 'P0 + P1', 'Resolved (30 d)', 'Duplicate rate'];

export default function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Reveal"
        title="Dashboard"
        description="Patterns a list hides: priority ranking, hotspots, category mix and the reports that should be fixed first."
        actions={
          <>
            <Badge tone="warning" dot>
              Live data arrives in Phase 6
            </Badge>
            <Link to="/admin" className="btn btn-ghost">
              Open admin
            </Link>
          </>
        }
      />

      <Container className="py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {KPIS.map((label) => (
            <Card key={label} className="card-pad">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">Map</h2>
              <Badge tone="neutral">Leaflet · OpenStreetMap</Badge>
            </div>
            <div className="relative flex h-80 items-center justify-center bg-[#e8eef6]">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    'linear-gradient(#d7e1ee 1px, transparent 1px), linear-gradient(90deg, #d7e1ee 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
                aria-hidden="true"
              />
              <div className="relative text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy-700 shadow-card">
                  <Map className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-navy-900">
                  Priority pins and hotspot circles
                </p>
                <p className="mt-1 text-xs text-slate-500">Wired in Phase 6</p>
              </div>
            </div>
          </Card>

          <Card padded>
            <h2 className="text-base font-semibold">Fix first</h2>
            <p className="mt-1 text-xs text-slate-500">Ranked by priority score, with factors.</p>
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="rounded-xl border border-slate-200 p-3">
                  <Skeleton className="h-4 w-2/3" />
                  <div className="mt-2 flex items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card padded>
            <h2 className="text-base font-semibold">Reports by category</h2>
            <Skeleton className="mt-4 h-40 w-full" />
          </Card>
          <Card padded>
            <h2 className="text-base font-semibold">Priority mix</h2>
            <Skeleton className="mt-4 h-40 w-full" />
          </Card>
        </div>

        <HonestyNote className="mt-6" title="Charts are intentionally empty">
          The dashboard renders skeletons until the seed and repository land. No chart will show
          invented data; when it does render, all widgets will read from the same filtered array.
        </HonestyNote>
      </Container>
    </>
  );
}
