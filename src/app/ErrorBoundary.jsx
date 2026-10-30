import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Last line of defence for a demo: a render error on one route must never
 * leave a blank screen in front of a judge. The fallback keeps navigation alive
 * and offers a full reload, which re-reads the local seed.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logger.error('route_error', { message: error?.message, componentStack: info?.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-mist px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-card sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900">
            This screen could not render
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The demo data is still in this browser. Reload to try again, or go back to the home page
            and use the footer to reset the demo data if the error repeats.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reload the app
            </button>
            <Link
              to="/"
              onClick={() => this.setState({ error: null })}
              className="btn btn-ghost"
            >
              Go to home
            </Link>
          </div>

          {import.meta.env.DEV && this.state.error ? (
            <pre className="mt-5 max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}
