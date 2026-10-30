import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, Copy, Inbox, Map, Menu, Table2, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const ADMIN_NAV = [
  { label: 'Queue', icon: Inbox, active: true },
  { label: 'Duplicates', icon: Copy, active: false },
  { label: 'Hotspots', icon: Map, active: false },
  { label: 'Reports', icon: Table2, active: false },
];

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-navy-800 px-4">
        <Building2 className="h-5 w-5 text-teal-500" aria-hidden="true" />
        <span className="text-sm font-semibold text-white">Operator console</span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 space-y-1 px-3 py-4">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.label}
            to="/admin"
            onClick={onNavigate}
            aria-current={item.active ? 'page' : undefined}
            title={item.active ? undefined : 'Available in Phase 7'}
            className={[
              'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
              item.active
                ? 'bg-teal-500/15 text-teal-200'
                : 'text-navy-100/75 hover:bg-navy-800 hover:text-white',
            ].join(' ')}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
            {!item.active ? (
              <span className="ml-auto rounded bg-navy-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy-100/60">
                P7
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-navy-800 p-4">
        <p className="text-xs leading-5 text-navy-100/60">
          Unauthenticated demo. Auth and roles arrive in P9.
        </p>
        <Link
          to="/"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-teal-400 transition-colors hover:text-teal-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-mist">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-900 focus:shadow-lift"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-900 lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin menu"
                aria-expanded={drawerOpen}
                aria-controls="admin-drawer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-navy-900 hover:bg-navy-50 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Admin
                </p>
                <p className="text-sm font-semibold text-navy-900">Queue &amp; workflow</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone="warning" dot className="hidden sm:inline-flex">
                Unauthenticated demo
              </Badge>
              <Link to="/" className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to site
              </Link>
            </div>
          </div>
        </header>

        <main id="admin-main" className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            id="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] animate-fade-in bg-navy-900 shadow-lift"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close admin menu"
              className="absolute right-3 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-100 hover:bg-navy-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
