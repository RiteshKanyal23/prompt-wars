import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { ToastProvider } from '@/app/providers';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="analysis/:id" element={<AnalysisDetail />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="track" element={<Track />} />
            <Route path="track/:code" element={<TrackDetail />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
            <Route path="home" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Admin />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
