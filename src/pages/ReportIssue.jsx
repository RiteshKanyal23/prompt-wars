import { Link } from 'react-router-dom';
import { Camera, FileText, MapPin, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import HonestyNote from '@/components/ui/HonestyNote';

const GROUPS = [
  {
    icon: FileText,
    title: 'What is the problem?',
    copy: 'A short title, a description of at least 20 characters, and a category with a real "Suggest" button.',
  },
  {
    icon: MapPin,
    title: 'Where is it?',
    copy: 'A Leaflet pin with a draggable marker, lat/lng readout and an address or landmark field.',
  },
  {
    icon: Camera,
    title: 'Evidence and contact',
    copy: 'An optional photo, optional contact details that are never shown publicly, and a demo consent checkbox.',
  },
];

const NEXT_STEPS = [
  'Your text is classified and summarised.',
  'Likely duplicates are proposed, never auto-merged.',
  'Five priority factors produce a score and a band.',
  'Nearby reports are grouped into a hotspot.',
];

export default function ReportIssue() {
  return (
    <>
      <PageHeader
        eyebrow="Capture"
        title="Report an issue"
        description="Tell us what is wrong and where. The pipeline will categorise it, write a summary, check for duplicates and score urgency."
        actions={
          <Link to="/dashboard" className="btn btn-ghost">
            View dashboard
          </Link>
        }
      />

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card padded>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning" dot>
                Form arrives in Phase 4
              </Badge>
              <Badge tone="neutral">3 groups · 1 page</Badge>
            </div>

            <h2 className="mt-4 text-xl font-semibold">One page, three visual groups</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              No wizard that hides progress. A citizen should be able to finish on a phone in under
              a minute, and every field that is optional says so.
            </p>

            <ol className="mt-6 space-y-3">
              {GROUPS.map((group, index) => (
                <li key={group.title} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
                    <group.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {index + 1}. {group.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{group.copy}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              The interactive form, map picker and validation land in Phase 4. This placeholder
              exists so the route and navigation are real from day one.
            </div>
          </Card>

          <div className="space-y-4">
            <Card padded>
              <h2 className="text-base font-semibold">What happens next</h2>
              <ol className="mt-4 space-y-3">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>

            <HonestyNote title="No image AI">
              Photos are stored as evidence only. Nothing in this prototype analyses image content,
              and the UI will say so on the report and analysis pages.
            </HonestyNote>

            <HonestyNote tone="warning" title="Demo data">
              This prototype stores reports in your browser. Do not submit real personal information.
            </HonestyNote>

            <Card padded className="bg-navy-900 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-teal-400" aria-hidden="true" />
                Privacy by default
              </p>
              <p className="mt-2 text-sm leading-6 text-navy-100/80">
                Only the tracking code is needed to view a citizen timeline. Internal notes never
                appear on public routes.
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
