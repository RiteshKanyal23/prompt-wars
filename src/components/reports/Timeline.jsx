import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Copy,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';
import { formatDateTime } from '@/lib/format';

const EVENT_ICON = {
  created: Clock3,
  ai_processed: ShieldCheck,
  status_changed: ClipboardCheck,
  duplicate_confirmed: Copy,
  note: MessageSquareText,
  resolved: CheckCircle2,
};

const ACTOR_LABEL = {
  citizen: 'Citizen',
  operator: 'Operator',
  admin: 'Operator',
  system: 'CivicPulse system',
};

export default function Timeline({ events = [], emptyMessage = 'No updates yet.' }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-1">
      {events.map((event, index) => {
        const Icon = EVENT_ICON[event.type] ?? Clock3;
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-slate-200"
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-sm font-semibold text-navy-900">
                  {event.note || event.type.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-slate-500">
                  {ACTOR_LABEL[event.actorRole] ?? event.actorRole}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
