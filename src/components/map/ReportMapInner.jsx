import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { CATEGORY_MAP } from '@/lib/constants';
import { DEMO_CENTER } from '@/lib/env';

const PIN_COLOR = {
  P0: '#dc2626',
  P1: '#f59e0b',
  P2: '#2563eb',
  P3: '#64748b',
};

function pinFor(band) {
  const colour = PIN_COLOR[band] ?? PIN_COLOR.P3;
  return L.divIcon({
    className: '',
    html: `<span class="cp-map-pin" style="background:${colour}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const ICONS = {
  P0: pinFor('P0'),
  P1: pinFor('P1'),
  P2: pinFor('P2'),
  P3: pinFor('P3'),
};

const BAND_LABEL = {
  P0: 'Critical',
  P1: 'High',
  P2: 'Medium',
  P3: 'Low',
};

function FitToReports({ reports, clusters }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...reports.map((report) => [Number(report.latitude), Number(report.longitude)]),
      ...clusters.map((cluster) => [Number(cluster.latitude), Number(cluster.longitude)]),
    ].filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

    if (points.length === 0) {
      map.setView([DEMO_CENTER.lat, DEMO_CENTER.lng], 12, { animate: false });
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(points).pad(0.2), { animate: false });
  }, [map, reports, clusters]);

  return null;
}

export default function ReportMap({
  reports = [],
  clusters = [],
  height = 380,
  showClusters = true,
  showLegend = true,
}) {
  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
      <MapContainer
        center={[DEMO_CENTER.lat, DEMO_CENTER.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToReports reports={reports} clusters={showClusters ? clusters : []} />

        {showClusters
          ? clusters.map((cluster) => (
              <Circle
                key={cluster.id}
                center={[cluster.latitude, cluster.longitude]}
                radius={Math.max(60, cluster.radiusMeters)}
                pathOptions={{
                  color: '#0FB5A6',
                  weight: 1.5,
                  fillColor: '#0FB5A6',
                  fillOpacity: 0.12,
                  dashArray: '4 4',
                }}
              >
                <Popup>
                  <p className="text-sm font-semibold text-navy-900">{cluster.label}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {cluster.count} reports · hotspot {cluster.hotspotScore}/100 · {cluster.trend}
                  </p>
                </Popup>
              </Circle>
            ))
          : null}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[Number(report.latitude), Number(report.longitude)]}
            icon={ICONS[report.priorityBand] ?? ICONS.P3}
          >
            <Popup>
              <p className="text-sm font-semibold text-navy-900">
                {report.title ?? report.referenceCode}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {CATEGORY_MAP[report.category]?.label ?? report.category} ·{' '}
                {BAND_LABEL[report.priorityBand] ?? 'Unscored'}
                {Number.isFinite(report.priorityScore) ? ` (${report.priorityScore})` : ''}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-wide text-slate-500">
                {report.referenceCode}
              </p>
              <Link
                to={`/analysis/${report.id}`}
                className="mt-2 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-600"
              >
                Open analysis
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showLegend ? (
        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg border border-slate-200 bg-white/95 px-2.5 py-2 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Priority</p>
          <ul className="mt-1 space-y-0.5">
            {Object.keys(PIN_COLOR).map((band) => (
              <li key={band} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow"
                  style={{ background: PIN_COLOR[band] }}
                  aria-hidden="true"
                />
                {band} · {BAND_LABEL[band]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
