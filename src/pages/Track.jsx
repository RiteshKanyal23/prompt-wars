import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import HonestyNote from '@/components/ui/HonestyNote';

export default function Track() {
  return (
    <>
      <PageHeader
        eyebrow="Close the loop"
        title="Track a complaint"
        description="Enter the tracking code you received when you submitted. No account needed."
      />

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card padded>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Look up by code</h2>
              <Badge tone="warning" dot>
                Lookup arrives in Phase 4
              </Badge>
            </div>

            <form className="mt-5" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="tracking-code" className="label">
                Tracking code
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="tracking-code"
                  className="input font-mono uppercase tracking-widest"
                  placeholder="CP-XXXXXX"
                  autoComplete="off"
                  disabled
                />
                <button type="submit" className="btn btn-primary shrink-0" disabled>
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Track
                </button>
              </div>
              <p className="hint">
                Codes are case-insensitive and use 6 characters, for example CP-7K2M9Q.
              </p>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              The form is disabled on purpose: no reports exist until the seed and submission flow
              are wired. An unknown code will show a helpful empty state, never a 404 page.
            </div>
          </Card>

          <div className="space-y-4">
            <Card padded>
              <h2 className="text-base font-semibold">Recent codes on this device</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Submitted codes are stored locally so you can return without retyping them. Nothing
                leaves your browser.
              </p>
              <p className="mt-3 text-sm text-slate-400">No codes yet.</p>
            </Card>

            <HonestyNote title="What you will see">
              A public timeline: received, AI processed, assigned, in progress and resolved — plus
              public notes. Internal notes stay internal.
            </HonestyNote>

            <Link to="/report" className="btn btn-ghost w-full">
              Report a new issue
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
