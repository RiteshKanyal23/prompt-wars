import { AlertTriangle, Info } from 'lucide-react';

export default function HonestyNote({ tone = 'info', title, children, className = '' }) {
  const isWarning = tone === 'warning';
  const Icon = isWarning ? AlertTriangle : Info;

  return (
    <div
      role="note"
      className={[
        'flex gap-3 rounded-2xl border px-4 py-3.5 text-sm',
        isWarning ? 'border-amber-200 bg-amber-50' : 'border-teal-200 bg-teal-50/70',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon
        className={['mt-0.5 h-4 w-4 shrink-0', isWarning ? 'text-amber-600' : 'text-teal-600'].join(' ')}
        aria-hidden="true"
      />
      <div className="min-w-0">
        {title ? <p className="font-semibold text-navy-900">{title}</p> : null}
        <div className="mt-0.5 leading-6 text-slate-600">{children}</div>
      </div>
    </div>
  );
}
