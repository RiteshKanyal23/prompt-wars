import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Copy,
  ImageOff,
  MapPin,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import HonestyNote from '@/components/ui/HonestyNote';
import Skeleton from '@/components/ui/Skeleton';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import Timeline from '@/components/reports/Timeline';
import { useReport } from '@/hooks/useReport';
import { CATEGORY_MAP } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { normalizeReferenceCode, isValidReferenceCode } from '@/lib/referenceCode';

export default function TrackDetail() {
  const { code } = useParams();
  const displayCode = normalizeReferenceCode(code) || 'CP-XXXXXX';
  const { report, events, loading, error, reload } = useReport(displayCode, {
    byCode: true,
    publicOnly: true,
  });

  // A linked parent is fetched only when this report was marked as a duplicate.
  // Seeded rows store a tracking code; operator-confirmed pairs store an id.
  const parentIdentifier = report?.duplicateOf ?? null;
  const { report: parent } = useReport(parentIdentifier, {
    byCode: isValidReferenceCode(parentIdentifier),
    publicOnly: true,
  });

  const category = report ? CATEGORY_MAP[report.category] ?? CATEGORY_MAP.other : null;

  return (
    <>
      <PageHeader
        eyebrow="Public timeline"
        title={displayCode}
        description="The citizen-facing view of a complaint: current status, public updates and the resolution note."
        actions={
          <Link to="/track" className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Track another
          </Link>
        }
      >
        {report ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} citizen />
            <PriorityBadge band={report.priorityBand} citizen />
            {category ? <Badge tone="neutral">{category.label}</Badge> : null}
          </div>
        ) : null}
      </PageHeader>

      <Container className="py-8 sm:py-10">
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card padded>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4" lines={6} />
            </Card>
            <div className="space-y-4">
              <Card padded>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-4" lines={4} />
              </Card>
              <Card padded>
                <Skeleton className="h-24 w-full" />
              </Card>
            </div>
          </div>
        ) : error ? (
          <Card padded>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-navy-900">The timeline could not be loaded.</p>
                <p className="mt-1 text-sm text-slate-600">
                  {error.message || 'Local storage may be unavailable in this browser.'}
                </p>
              </div>
              <Button variant="ghost" onClick={reload}>
                Try again
              </Button>
            </div>
          </Card>
        ) : !report ? (
          <EmptyState
            icon={SearchX}
            title={`No report found for ${displayCode}`}
            description="Check the code on your submission receipt. Codes are six characters after CP- and are not case-sensitive. Recent codes on this device are listed on the tracking page."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/track" className="btn btn-primary">
                  Try another code
                </Link>
                <Link to="/report" className="btn btn-ghost">
                  Report a new issue
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <Card padded>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Current status</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {report.status === 'resolved' || report.status === 'closed'
                        ? 'Work on this report is complete.'
                        : report.status === 'rejected'
                          ? 'This report was not accepted as a municipal issue.'
                          : report.status === 'duplicate'
                            ? 'This report has been linked to an existing issue.'
                            : 'This report is still being handled.'}
                    </p>
                  </div>
                  <StatusBadge status={report.status} citizen />
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Submitted
                      </dt>
                      <dd className="mt-0.5 text-sm text-navy-900">
                        {formatDateTime(report.createdAt)}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Last update
                      </dt>
                      <dd className="mt-0.5 text-sm text-navy-900">
                        {formatDateTime(report.updatedAt)}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Location
                      </dt>
                      <dd className="mt-0.5 text-sm text-navy-900">
                        {report.locationLabel ?? 'Pinned on the map'}
                      </dd>
                    </div>
                  </div>
                </dl>

                {report.duplicateOf ? (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2 font-semibold text-navy-900">
                      <Copy className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      Linked to an existing report
                    </p>
                    {parent ? (
                      <Link
                        to={`/track/${parent.referenceCode}`}
                        className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-semibold tracking-wider text-teal-700 hover:text-teal-600"
                      >
                        {parent.referenceCode}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <p className="mt-1 text-xs">The linked report is not public.</p>
                    )}
                  </div>
                ) : null}
              </Card>

              <Card padded>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Public updates</h2>
                  <Badge tone="neutral">{events.length} update{events.length === 1 ? '' : 's'}</Badge>
                </div>
                <div className="mt-5">
                  <Timeline
                    events={events}
                    emptyMessage="No public updates have been published yet. The report has been received."
                  />
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card padded>
                <h2 className="text-base font-semibold">Report</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">
                    {CATEGORY_MAP[report.category]?.label ?? report.category}
                  </Badge>
                  <PriorityBadge band={report.priorityBand} citizen />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-navy-900">
                  {report.title ?? 'Civic issue'}
                </h3>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {report.description}
                </p>

                {report.imageUrl ? (
                  <>
                    <img
                      src={report.imageUrl}
                      alt="Citizen-submitted evidence"
                      className="mt-4 w-full rounded-xl border border-slate-200 object-cover"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Photo evidence only. Image content is never analysed by the AI pipeline.
                    </p>
                  </>
                ) : (
                  <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs text-slate-500">
                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                    No photo was attached to this report.
                  </p>
                )}
              </Card>

              <Card padded>
                <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
                  Privacy by default
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Anyone with the code sees only this public timeline. Contact details and internal
                  operator notes are never shown.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link to={`/analysis/${report.id}`} className="btn btn-ghost">
                    How this report was analysed
                  </Link>
                  <Button variant="ghost" onClick={reload} loading={loading}>
                    Refresh timeline
                  </Button>
                </div>
              </Card>

              <HonestyNote title="Timestamps are simulated">
                Seeded reports use relative timestamps so the demo always shows recent activity.
                Status updates are generated for the prototype and do not represent a real
                municipal workflow.
              </HonestyNote>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
