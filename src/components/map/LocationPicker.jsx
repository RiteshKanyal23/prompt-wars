import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

/**
 * Leaflet is browser-only. The inner map is loaded dynamically so the report
 * page and the SSR smoke test can render without touching `window` or
 * `document` at module load.
 */
export default function LocationPicker(props) {
  const [Map, setMap] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    import('./LocationPickerInner')
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
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
        style={{ minHeight: props.height ?? 280 }}
      >
        <MapPin className="h-6 w-6 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-navy-900">Map could not load</p>
        <p className="max-w-xs text-xs leading-5 text-slate-500">
          Use the latitude and longitude fields below. The rest of the form works offline.
        </p>
      </div>
    );
  }

  if (!Map) {
    return (
      <div
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
        style={{ height: props.height ?? 280 }}
        aria-label="Loading map"
      >
        <Skeleton className="h-full w-full rounded-none" />
        <p className="absolute inset-x-0 bottom-0 bg-navy-900/80 px-3 py-1.5 text-[11px] text-white">
          Loading map · or type coordinates below
        </p>
      </div>
    );
  }

  return <Map {...props} />;
}
