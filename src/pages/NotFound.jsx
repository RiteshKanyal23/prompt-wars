import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Container from '@/components/layout/Container';
import Card from '@/components/ui/Card';

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">This page does not exist</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The link may be mistyped, or the page may not have been built yet. Everything below is a
          real route in this prototype.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back home
          </Link>
          <Link to="/report" className="btn btn-accent">
            Report an issue
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Looking for a complaint? Try the{' '}
          <Link to="/track" className="font-semibold text-teal-700 hover:text-teal-600">
            tracking lookup
          </Link>
          .
        </p>
      </Card>
    </Container>
  );
}
