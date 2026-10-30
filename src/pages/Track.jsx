import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, History, Search, SearchX } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import HonestyNote from '@/components/ui/HonestyNote';
import Skeleton from '@/components/ui/Skeleton';
import { useRecentCodes } from '@/hooks/useRecentCodes';
import { timeAgo } from '@/lib/format';
import { normalizeReferenceCode } from '@/lib/referenceCode';
import { validateTrackingCode } from '@/lib/validation';

export default function Track() {
  const navigate = useNavigate();
  const { codes, loading, clear } = useRecentCodes();
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const message = validateTrackingCode(value);
    if (message) {
      setError(message);
      return;
    }

    setError(null);
    navigate(`/track/${normalizeReferenceCode(value)}`);
  }

  async function handleClear() {
    setClearing(true);
    try {
      await clear();
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Close the loop"
        title="Track a complaint"
        description="Enter the tracking code you received when you submitted. No account, phone number or email needed."
      />

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card padded>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Look up by code</h2>
              <Badge tone="teal" dot>
                Public timeline
              </Badge>
            </div>

            <form className="mt-5" onSubmit={handleSubmit} noValidate>
              <label htmlFor="tracking-code" className="label">
                Tracking code
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="tracking-code"
                  className="input font-mono uppercase tracking-widest"
                  placeholder="CP-7K2M9Q"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'tracking-code-error' : 'tracking-code-hint'}
                />
                <Button type="submit" variant="primary" className="shrink-0">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Track
                </Button>
              </div>
              {error ? (
                <p id="tracking-code-error" className="error-text" role="alert">
                  {error}
                </p>
              ) : (
                <p id="tracking-code-hint" className="hint">
                  Codes are case-insensitive and look like CP-7K2M9Q.
                </p>
              )}
            </form>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <SearchX className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Lost the code?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Codes are shown on the analysis page right after you submit, and recent codes are
                kept on this device below. Unknown codes always get an explanation, never a generic
                404.
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card padded>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Recent codes on this device</h2>
                <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Codes you submit are remembered locally so you can return without retyping them.
                Nothing leaves your browser.
              </p>

              {loading ? (
                <Skeleton className="mt-4 h-16 w-full" />
              ) : codes.length === 0 ? (
                <EmptyState
                  className="mt-4 border-0 bg-transparent px-0 py-6"
                  icon={History}
                  title="No codes yet"
                  description="Submit a report and its tracking code will appear here."
                  action={
                    <Link to="/report" className="btn btn-primary">
                      Report an issue
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  }
                />
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {codes.map((entry) => (
                      <li key={entry.code} className="flex items-center justify-between gap-3 py-2.5">
                        <Link
                          to={`/track/${entry.code}`}
                          className="font-mono text-sm font-semibold tracking-wider text-navy-900 hover:text-teal-700"
                        >
                          {entry.code}
                        </Link>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {timeAgo(entry.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    loading={clearing}
                    onClick={handleClear}
                  >
                    Clear recent codes
                  </Button>
                </>
              )}
            </Card>

            <HonestyNote title="What you will see">
              A public timeline: received, AI processed, assigned, in progress and resolved, plus
              public notes. Internal operator notes and contact details never appear on this route.
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
