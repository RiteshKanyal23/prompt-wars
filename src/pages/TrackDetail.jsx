import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import HonestyNote from '@/components/ui/HonestyNote';

export default function TrackDetail() {
  const { code } = useParams();
  const displayCode = (code || 'CP-XXXXXX').toUpperCase();

  return (
    <>
      <PageHeader
        eyebrow="Public timeline"
        title={displayCode}
        description="The citizen-facing view of a complaint: status, public updates and the resolution note."
        actions={
          <Link to="/track" className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Track another
          </Link>
        }
      >
        <p className="mt-3">
          <Badge tone="warning" dot>
            Timeline arrives in Phase 4
          </Badge>
        </p>
      </PageHeader>

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card padded>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Public updates</h2>
              <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>

            <ol className="mt-5 space-y-4">
              {['Received', 'AI processed', 'Assigned', 'In progress', 'Resolved'].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span
                    className={[
                      'mt-0.5 h-3 w-3 shrink-0 rounded-full border-2',
                      index === 0 ? 'border-teal-500 bg-teal-500' : 'border-slate-300 bg-white',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={index === 0 ? 'text-sm font-semibold text-navy-900' : 'text-sm text-slate-500'}>
                      {step}
                    </p>
                    <Skeleton className="mt-1.5 h-3 w-32" />
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <div className="space-y-4">
            <Card padded>
              <h2 className="text-base font-semibold">Report</h2>
              <Skeleton className="mt-3" lines={4} />
            </Card>

            <HonestyNote title="Unknown codes">
              If this code does not exist, this page will explain that and offer a new lookup — it
              will not crash or show a generic 404.
            </HonestyNote>
          </div>
        </div>
      </Container>
    </>
  );
}
