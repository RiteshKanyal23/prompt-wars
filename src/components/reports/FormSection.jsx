import Card from '@/components/ui/Card';

/**
 * One numbered block of the report form. Keeps the icon, heading and helper
 * copy identical across the three groups so the page reads as one document.
 */
export default function FormSection({ icon: Icon, step, title, subtitle, children }) {
  return (
    <Card padded>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold">
            {step}. {title}
          </h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  );
}
