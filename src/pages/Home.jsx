import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Camera,
  CheckCircle2,
  ClipboardList,
  Copy,
  Gauge,
  Layers,
  Map,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const STAGES = [
  {
    title: 'Capture',
    icon: Camera,
    copy: 'A citizen pins the problem and describes it in under a minute — on a phone.',
  },
  {
    title: 'Understand',
    icon: Brain,
    copy: 'The pipeline classifies the text, writes a summary, finds duplicates and scores urgency.',
  },
  {
    title: 'Reveal',
    icon: Map,
    copy: 'Hotspots, priority ranking and category mix show what a flat list hides.',
  },
  {
    title: 'Act',
    icon: CheckCircle2,
    copy: 'Operators assign, progress and resolve, with a public timeline the citizen can follow.',
  },
];

const CAPABILITIES = [
  {
    title: 'Categorise',
    icon: Layers,
    copy: 'Weighted keywords map free text to 7 civic categories, with a confidence score.',
  },
  {
    title: 'Summarise',
    icon: ClipboardList,
    copy: 'Extractive sentence ranking produces a one-line brief an operator can scan.',
  },
  {
    title: 'Deduplicate',
    icon: Copy,
    copy: 'TF-IDF cosine plus distance and time finds likely repeats — a human confirms.',
  },
  {
    title: 'Prioritise',
    icon: Gauge,
    copy: 'Five visible factors add up to a score, so every rank can be explained.',
  },
  {
    title: 'Cluster',
    icon: MapPin,
    copy: 'Nearby reports within a time window become hotspots with an action brief.',
  },
];

const STATS = [
  { label: 'Reports captured', value: '—' },
  { label: 'Hotspots found', value: '—' },
  { label: 'Duplicates linked', value: '—' },
  { label: 'P0 + P1 open', value: '—' },
];

const PIPELINE_STEPS = [
  'Normalise text',
  'Classify + summarise',
  'Find duplicates',
  'Score priority',
  'Detect hotspots',
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_0%,rgba(15,181,166,0.18),transparent)]"
          aria-hidden="true"
        />
        <Container className="relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
              AI for civic impact
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              From complaints
              <br className="hidden sm:block" /> to action.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-navy-100 sm:text-lg">
              CivicPulse AI captures scattered reports, explains what matters, reveals hotspots and
              gives operators a clear next step.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/report" className="btn btn-accent">
                Report an issue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/dashboard"
                className="btn border border-white/25 text-white hover:bg-white/10"
              >
                View dashboard
              </Link>
            </div>

            <p className="mt-5 inline-flex items-center gap-2 text-xs text-navy-100/80">
              <ShieldCheck className="h-4 w-4 text-teal-400" aria-hidden="true" />
              Prototype · synthetic data · no real personal information
            </p>
          </div>

          <div className="relative">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Analysis pipeline
                </p>
                <Badge tone="teal" dot>
                  rules-v1
                </Badge>
              </div>

              <ol className="mt-4 space-y-2.5">
                {PIPELINE_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-navy-900">{step}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Deterministic, browser-side and offline. The pipeline is wired in Phase 3; this
                shell shows the contract, not fake output.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <Container className="grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold tabular-nums text-navy-900">{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </Container>
        <Container className="pb-6">
          <p className="text-xs text-slate-500">
            Numbers are deliberately blank until the 42-report seed lands in Phase 2. Nothing on this
            page is hard-coded sample output.
          </p>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Four stages, one loop
            </h2>
            <p className="mt-3 text-[15px] leading-6 text-slate-600">
              Every screen belongs to one stage. If a feature does not move a complaint from capture
              to action, it is out of scope.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage, index) => (
              <Card key={stage.title} className="card-pad">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-900">
                    <stage.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{stage.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{stage.copy}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                The AI
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Five capabilities, all explainable
              </h2>
            </div>
            <Link
              to="/analysis"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-600"
            >
              See the model card
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CAPABILITIES.map((capability) => (
              <div key={capability.title} className="rounded-2xl border border-slate-200 p-4">
                <capability.icon className="h-5 w-5 text-teal-600" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold">{capability.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">{capability.copy}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <Card className="overflow-hidden">
            <div className="grid lg:grid-cols-[1fr_20rem]">
              <div className="card-pad">
                <Badge tone="warning" dot>
                  Hotspots arrive in Phase 6
                </Badge>
                <h2 className="mt-3 text-xl font-semibold">One complaint is a data point. Seven is a pattern.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Once the seed and clustering run, this panel will show the strongest hotspot, its
                  category mix and a generated action brief — not a static mock-up.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-600"
                >
                  Open the dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="relative hidden items-center justify-center bg-navy-900 lg:flex">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                  aria-hidden="true"
                />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/10">
                  <MapPin className="h-8 w-8 text-teal-400" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl bg-navy-800 px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                See the loop from report to resolution.
              </h2>
              <p className="mt-1.5 text-sm text-navy-100/80">
                Start with a report, then follow the analysis and the tracking timeline.
              </p>
            </div>
            <Link to="/report" className="btn btn-accent shrink-0">
              Report an issue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
