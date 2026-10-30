const TONES = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  teal: 'border-teal-200 bg-teal-50 text-teal-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export default function Badge({ tone = 'neutral', dot = false, children, className = '' }) {
  const classes = [
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
    TONES[tone] ?? TONES.neutral,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
