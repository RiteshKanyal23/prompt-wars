import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useToast } from '@/app/providers';

const TONES = {
  info: { icon: Info, classes: 'border-slate-200 text-navy-900', iconClass: 'text-blue-600' },
  success: { icon: CheckCircle2, classes: 'border-green-200 text-navy-900', iconClass: 'text-green-600' },
  warning: { icon: AlertTriangle, classes: 'border-amber-200 text-navy-900', iconClass: 'text-amber-600' },
  danger: { icon: AlertTriangle, classes: 'border-red-200 text-navy-900', iconClass: 'text-red-600' },
};

export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:w-80"
    >
      {toasts.map((toast) => {
        const tone = TONES[toast.tone] ?? TONES.info;
        const Icon = tone.icon;

        return (
          <div
            key={toast.id}
            className={[
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lift animate-fade-in',
              tone.classes,
            ].join(' ')}
          >
            <Icon className={['mt-0.5 h-4 w-4 shrink-0', tone.iconClass].join(' ')} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
              {toast.message ? <p className="mt-0.5 text-sm leading-5 text-slate-600">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
