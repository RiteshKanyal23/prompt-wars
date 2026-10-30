import { Link } from 'react-router-dom';
import { Database, RotateCcw, ShieldCheck } from 'lucide-react';
import Container from './Container';
import { useDataMode } from '@/app/providers';
import { useToast } from '@/hooks/useToast';
import { useResetDemoData } from '@/hooks/useResetDemoData';
import { toUserMessage } from '@/lib/errors';
import { APP } from '@/lib/constants';

const YEAR = new Date().getFullYear();

const PRODUCT_LINKS = [
  { to: '/report', label: 'Report an issue' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/track', label: 'Track a complaint' },
  { to: '/analysis', label: 'How the AI works' },
];

const CONSOLE_LINKS = [
  { to: '/admin', label: 'Operator queue' },
  { to: '/analysis', label: 'Model card' },
  { to: '/dashboard', label: 'Hotspots' },
];

export default function Footer() {
  const { isLocal } = useDataMode();
  const { push } = useToast();
  const { reset, resetting } = useResetDemoData();

  async function handleReset() {
    try {
      await reset();
      push({ tone: 'success', title: 'Demo data reset', message: '42 synthetic reports restored.' });
    } catch (error) {
      push({ tone: 'danger', title: 'Reset failed', message: toUserMessage(error) });
    }
  }

  return (
    <footer className="mt-auto bg-navy-950 text-navy-50">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-base font-bold text-white">
            CivicPulse <span className="text-teal-500">AI</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-navy-100/80">
            {APP.tagline} A prototype that turns scattered civic complaints into prioritized,
            explainable action.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-navy-700 px-3 py-1 text-xs text-navy-100">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
            No real personal data
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-500">Product</p>
          <ul className="mt-3 space-y-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-navy-100/80 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-500">Console</p>
          <ul className="mt-3 space-y-2">
            {CONSOLE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-sm text-navy-100/80 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-500">Data</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-navy-700 bg-navy-900 px-3 py-1.5 text-xs font-medium text-navy-50">
            <Database className="h-3.5 w-3.5 text-teal-500" aria-hidden="true" />
            {isLocal ? 'Demo mode · local data' : 'Supabase mode'}
          </p>
          <p className="mt-3 text-xs leading-5 text-navy-100/70">
            42 synthetic reports. Notifications and department dispatch are MOCKED. Data stays in
            this browser.
          </p>
          {isLocal ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-navy-700 px-3 text-xs font-semibold text-navy-50 transition-colors hover:border-teal-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {resetting ? 'Resetting…' : 'Reset demo data'}
            </button>
          ) : null}
        </div>
      </Container>

      <div className="border-t border-navy-800">
        <Container className="flex flex-col gap-2 py-5 text-xs text-navy-100/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} CivicPulse AI · PromptWars x ASTRA prototype</p>
          <p>
            AI: {APP.aiVersion} · deterministic · runs in your browser
          </p>
        </Container>
      </div>
    </footer>
  );
}
