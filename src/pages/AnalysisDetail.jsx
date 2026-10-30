import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import HonestyNote from '@/components/ui/HonestyNote';

export default function AnalysisDetail() {
  const { id } = useParams();
  const shortId = id ? `${id.slice(0, 8)}…` : 'unknown';

  return (
    <>
      <PageHeader
        eyebrow="Understand · one report"
        title="Analysis detail"
        description="The explainability view: original text, summary, category confidence, duplicate evidence, priority arithmetic and hotspot membership."
        actions={
          <Link to="/analysis" className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All analyses
          </Link>
        }
      >
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
          <Badge tone="neutral">id {shortId}</Badge>
          <Badge tone="warning" dot>
            Detail view arrives in Phase 5
          </Badge>
        </p>
      </PageHeader>

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card padded>
            <h2 className="text-base font-semibold">Original report</h2>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              The description, photo disclaimer and location mini-map render here once the
              repository and pipeline exist.
            </p>
          </Card>

          <div className="space-y-4">
            <Card padded>
              <h2 className="text-base font-semibold">AI summary</h2>
              <Skeleton className="mt-4" lines={3} />
            </Card>

            <Card padded>
              <h2 className="text-base font-semibold">Priority</h2>
              <div className="mt-4 flex items-center gap-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="mt-4" lines={5} />
            </Card>
          </div>
        </div>

        <HonestyNote className="mt-6" title="This is a placeholder, not an analysis">
          No AI fields exist for <code className="rounded bg-white/60 px-1">{shortId}</code> yet. In
          Phase 5 this page will show the stored analysis and a clear &ldquo;report not found&rdquo;
          state for unknown ids.
        </HonestyNote>
      </Container>
    </>
  );
}
