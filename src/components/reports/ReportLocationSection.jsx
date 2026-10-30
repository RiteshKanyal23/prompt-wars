import { MapPin } from 'lucide-react';
import Field from '@/components/ui/Field';
import FormSection from '@/components/reports/FormSection';
import LocationPicker from '@/components/map/LocationPicker';

function coord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(5) : '—';
}

/**
 * Group 2: where it is. The map and the coordinate inputs are two views of the
 * same lat/lng pair, so both call the same updater.
 */
export default function ReportLocationSection({
  form,
  update,
  markTouched,
  showError,
  errorProps,
  latitudeRef,
  mapValue,
  onPickLocation,
  locationError,
}) {
  return (
    <FormSection
      icon={MapPin}
      step={2}
      title="Where is it?"
      subtitle="Tap the map to drop a pin, or type coordinates."
    >
      <LocationPicker value={mapValue} onChange={onPickLocation} height={280} />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field id="latitude" label="Latitude" hint="Decimal degrees, for example 12.97085">
          <input
            ref={latitudeRef}
            id="latitude"
            className="input"
            inputMode="decimal"
            value={form.latitude}
            placeholder="12.97085"
            onChange={(event) => update('latitude', event.target.value)}
            onBlur={() => markTouched('location')}
            {...errorProps('location', 'latitude-hint')}
          />
        </Field>
        <Field id="longitude" label="Longitude" hint="Decimal degrees, for example 77.59355">
          <input
            id="longitude"
            className="input"
            inputMode="decimal"
            value={form.longitude}
            placeholder="77.59355"
            onChange={(event) => update('longitude', event.target.value)}
            onBlur={() => markTouched('location')}
            {...errorProps('location', 'longitude-hint')}
          />
        </Field>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Pin: {coord(form.latitude)}, {coord(form.longitude)}
        </p>
        {showError('location') ? (
          <p id="location-error" className="error-text mt-0" role="alert">
            {locationError}
          </p>
        ) : null}
      </div>

      <Field
        id="location-label"
        label="Address or landmark"
        className="mt-3"
        hint="Optional, but it makes the hotspot label readable."
      >
        <input
          id="location-label"
          className="input"
          value={form.locationLabel}
          placeholder="4th Cross, Sector 12"
          onChange={(event) => update('locationLabel', event.target.value)}
        />
      </Field>
    </FormSection>
  );
}
