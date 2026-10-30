import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DEMO_CENTER } from '@/lib/env';

const pin = L.divIcon({
  className: '',
  html: '<span class="cp-map-pin cp-map-pin--P1"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickToPick({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

function Recenter({ value }) {
  const map = useMap();
  const last = useRef(null);

  useEffect(() => {
    if (!value) return;
    const key = `${value.lat}:${value.lng}`;
    if (last.current === key) return;
    last.current = key;
    map.setView([value.lat, value.lng], map.getZoom(), { animate: false });
  }, [map, value]);

  return null;
}

export default function LocationPicker({ value, onChange, height = 280 }) {
  const center = value ? [value.lat, value.lng] : [DEMO_CENTER.lat, DEMO_CENTER.lng];

  return (
    <div
      className="relative z-0 overflow-hidden rounded-xl border border-slate-300"
      style={{ height }}
    >
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPick onPick={onChange} />
        <Recenter value={value} />
        {value ? (
          <Marker
            position={[value.lat, value.lng]}
            icon={pin}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng();
                onChange({
                  lat: Number(lat.toFixed(6)),
                  lng: Number(lng.toFixed(6)),
                });
              },
            }}
          />
        ) : null}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-navy-900/80 px-3 py-1.5 text-[11px] text-white">
        Tap the map to place the pin · drag to adjust
      </div>
    </div>
  );
}
