import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ToastViewport from '@/components/ui/ToastViewport';

export default function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-mist">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-900 focus:shadow-lift"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1 pb-16">
        <Outlet />
      </main>
      <Footer />
      <ToastViewport />
    </div>
  );
}
