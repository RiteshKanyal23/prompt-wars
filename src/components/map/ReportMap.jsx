import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

/**
 * Leaflet is browser-only. Loading the inner map lazily keeps the SSR smoke
 * test (and the initial bundle) away from `window` and `document`.
 */
export default function ReportMap(props) {
  const [Map, setMap] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    import('./ReportMapInner')
      .then((module) => {
        if (active) setMap(() => module.default);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
        style={{ minHeight: props.height ?? 360 }}
      >
        <MapPin className="h-6 w-6 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-navy-900">Map could not load</p>
        <p className="max-w-xs text-xs leading-5 text-slate-500">
          The list beside the map carries the same reports, priority and hotspot membership.
        </p>
      </div>
    );
  }

  if (!Map) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
        style={{ height: props.height ?? 360 }}
        aria-label="Loading map"
      >
        <Skeleton className="h-full w-full rounded-none" />
        <p className="absolute inset-x-0 bottom-0 bg-navy-900/80 px-3 py-1.5 text-[11px] text-white">
          Loading map · the list view below always works offline
        </p>
      </div>
    );
  }

  return <Map {...props} />;
}
