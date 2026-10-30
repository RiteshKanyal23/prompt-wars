import { Link } from 'react-router-dom';
import { Brain, ClipboardList, Copy, Gauge, MapPin } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import HonestyNote from '@/components/ui/HonestyNote';

const STAGES = [
  { title: 'Normalise', icon: ClipboardList, copy: 'Lowercase, strip punctuation, remove stopwords, split sentences.' },
  { title: 'Classify', icon: Brain, copy: 'Weighted keyword lexicon across 7 categories, with confidence and alternatives.' },
  { title: 'Deduplicate', icon: Copy, copy: 'TF-IDF cosine plus 300 m and 21 days; review at 0.68, strong at 0.82.' },
  { title: 'Prioritise', icon: Gauge, copy: 'Five additive factors with a written reason for every point.' },
  { title: 'Cluster', icon: MapPin, copy: '0.003° grid, 30-day window, minimum 3 reports, hotspot score and trend.' },
];

const MODEL_FACTS = [
  ['Version', 'rules-v1'],
  ['Execution', 'Deterministic, browser-side, offline'],
  ['Classification', 'Weighted keyword lexicon'],
  ['Summary', 'Extractive sentence ranking'],
  ['Duplicates', 'TF-IDF cosine + distance + time'],
  ['Priority', 'Additive factors, bands at 80 / 60 / 40'],
  ['Clusters', '0.003° grid · 30 days · min 3'],
  ['Limitations', 'English-first, no image AI, no LLM'],
];

export default function Analysis() {
  return (
    <>
      <PageHeader
        eyebrow="Understand"
        title="AI analysis"
        description="Every number on this page comes from a stored, versioned analysis — never a hand-written claim."
        actions={
          <Link to="/dashboard" className="btn btn-ghost">
            Open dashboard
          </Link>
        }
      />

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card padded>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Pipeline</h2>
              <Badge tone="warning" dot>
                UI arrives in Phase 5
              </Badge>
            </div>

            <ol className="mt-5 space-y-2.5">
              {STAGES.map((stage, index) => (
                <li
                  key={stage.title}
                  className="flex gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
                    <stage.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {index + 1}. {stage.title}
                      </p>
                      <span className="text-xs tabular-nums text-slate-400">— reports</span>
                    </div>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">{stage.copy}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Counts stay blank until the pipeline runs over the seed in Phase 3. A pipeline diagram
              with invented numbers would be a lie.
            </p>
          </Card>

          <Card padded>
            <h2 className="text-lg font-semibold">Model card</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              What the analysis is, and what it deliberately is not.
            </p>

            <dl className="mt-4 divide-y divide-slate-100">
              {MODEL_FACTS.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="text-right text-sm text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>

            <HonestyNote className="mt-4" title="No accuracy claims">
              The prototype does not publish precision or accuracy percentages. Quality is measured
              against the labelled seed set and recorded in the README.
            </HonestyNote>
          </Card>
        </div>
      </Container>
    </>
  );
}
