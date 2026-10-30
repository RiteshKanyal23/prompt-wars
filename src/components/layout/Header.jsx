import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import Container from './Container';
import MobileNav from './MobileNav';
import logoMark from '@/assets/logo-mark.svg';
import { NAV_ITEMS } from '@/lib/constants';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="CivicPulse AI home">
            <img src={logoMark} alt="" width="36" height="36" className="h-9 w-9" />
            <span className="text-[17px] font-bold tracking-tight text-navy-900">
              CivicPulse <span className="text-teal-600">AI</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-navy-50 hover:text-navy-900',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/report" className="btn btn-accent btn-sm hidden sm:inline-flex">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Report an issue
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-navy-900 hover:bg-navy-50 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
