import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/app/providers';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import Home from '@/pages/Home';
import ReportIssue from '@/pages/ReportIssue';
import Analysis from '@/pages/Analysis';
import AnalysisDetail from '@/pages/AnalysisDetail';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import Track from '@/pages/Track';
import TrackDetail from '@/pages/TrackDetail';
import NotFound from '@/pages/NotFound';

const PUBLIC_ROUTES = [
  ['/', Home],
  ['/report', ReportIssue],
  ['/analysis', Analysis],
  ['/analysis/11111111-1111-4111-8111-111111111101', AnalysisDetail],
  ['/dashboard', Dashboard],
  ['/track', Track],
  ['/track/CP-7K2M9Q', TrackDetail],
  ['/not-a-route', NotFound],
];

function renderPublic(path, Page) {
  return renderToString(
    h(
      MemoryRouter,
      { initialEntries: [path] },
      h(
        ToastProvider,
        null,
        h(
          Routes,
          null,
          h(
            Route,
            { element: h(AppLayout) },
            h(Route, { path: '*', element: h(Page) }),
          ),
        ),
      ),
    ),
  );
}

describe('public route smoke test', () => {
  it.each(PUBLIC_ROUTES)('renders %s without throwing', (path, Page) => {
    const html = renderPublic(path, Page);

    expect(html).toContain('CivicPulse');
    expect(html.length).toBeGreaterThan(500);
  });
});

describe('admin route smoke test', () => {
  it('renders the admin layout and queue', () => {
    const html = renderToString(
      h(
        MemoryRouter,
        { initialEntries: ['/admin'] },
        h(
          ToastProvider,
          null,
          h(Routes, null, h(Route, { path: '/admin', element: h(AdminLayout) }, h(Route, { index: true, element: h(Admin) }))),
        ),
      ),
    );

    expect(html).toContain('Operator console');
    expect(html).toContain('Queue');
  });
});
