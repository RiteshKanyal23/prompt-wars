import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';

export default function MobileNav({ open, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} aria-hidden="true" />
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] animate-fade-in flex-col bg-white shadow-lift"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Menu</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-navy-900 hover:bg-navy-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex min-h-[48px] items-center rounded-xl px-3 text-[15px] font-medium',
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-navy-50',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <Link to="/report" onClick={onClose} className="btn btn-accent w-full">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Report an issue
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">Prototype · synthetic data</p>
        </div>
      </div>
    </div>
  );
}
