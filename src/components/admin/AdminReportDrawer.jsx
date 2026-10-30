import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Gauge,
  History,
  MapPin,
  MessageSquarePlus,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import HonestyNote from '@/components/ui/HonestyNote';
import PriorityBadge from '@/components/reports/PriorityBadge';
import StatusBadge from '@/components/reports/StatusBadge';
import Timeline from '@/components/reports/Timeline';
import ReportMap from '@/components/map/ReportMap';
import { useReport } from '@/hooks/useReport';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useUpdateReport } from '@/hooks/useUpdateReport';
import { useToast } from '@/hooks/useToast';
import {
  ALLOWED_TRANSITIONS,
  CATEGORY_MAP,
  DEPARTMENTS,
  PRIORITY_BANDS,
  STATUS_META,
} from '@/lib/constants';
import { toUserMessage } from '@/lib/errors';
import { formatDateTime, formatPercent, timeAgo } from '@/lib/format';

const FLOW = ['submitted', 'triaged', 'assigned', 'in_progress', 'resolved', 'closed'];
const TERMINAL = ['rejected', 'duplicate'];

function defaultSla(band) {
  const hours = PRIORITY_BANDS[band]?.slaHours ?? PRIORITY_BANDS.P2.slaHours;
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

/** datetime-local needs a local-time string, not the ISO UTC one. */
function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function Stepper({ status }) {
  const currentIndex = FLOW.indexOf(status);

  if (TERMINAL.includes(status)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
        <p className="text-sm font-semibold text-navy-900">
          {STATUS_META[status].label} — terminal state
        </p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">
          {status === 'duplicate'
            ? 'This report is linked to another issue. It cannot move again.'
            : 'A rejected report cannot move again. Reopen is out of scope for this prototype.'}
        </p>
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
      {FLOW.map((key, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={key} className="min-w-0">
            <div
              className={[
                'rounded-lg border px-1.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide',
                active
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : done
                    ? 'border-navy-200 bg-navy-50 text-navy-700'
                    : 'border-slate-200 bg-white text-slate-400',
              ].join(' ')}
            >
              {STATUS_META[key].label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminReportDrawer({ report, onClose }) {
  const { report: fresh, events, loading } = useReport(report.id);
  const { updateReport, saving } = useUpdateReport();
  const { push } = useToast();
  const drawerRef = useFocusTrap(true, onClose);

  const data = fresh?.id === report.id ? fresh : report;
  const [department, setDepartment] = useState(data.department ?? '');
  const [assignee, setAssignee] = useState(data.assignedTo ?? '');
  const [sla, setSla] = useState(toLocalInput(data.slaDueAt ?? defaultSla(data.priorityBand)));
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [error, setError] = useState(null);

  const category = CATEGORY_MAP[data.category] ?? CATEGORY_MAP.other;
  const factors = data.ai?.priority?.factors ?? [];
  const allowed = (ALLOWED_TRANSITIONS[data.status] ?? []).filter((status) => status !== 'duplicate');
  const bandSla = PRIORITY_BANDS[data.priorityBand]?.slaHours ?? PRIORITY_BANDS.P2.slaHours;

  async function handleAssign(event) {
    event.preventDefault();
    setError(null);

    if (!department) {
      setError('Choose a department before assigning this report.');
      return;
    }

    const owner = assignee.trim() || department;
    const dueAt = fromLocalInput(sla) ?? defaultSla(data.priorityBand);

    try {
      const from = data.status;
      let eventFrom = from;

      if (from === 'submitted') {
        await updateReport(
          data.id,
          { status: 'triaged' },
          {
            type: 'status_changed',
            note: 'Triaged and routed for assignment',
            isPublic: true,
            fromStatus: 'submitted',
            toStatus: 'triaged',
          },
        );
        eventFrom = 'triaged';
      }

      const assignNow = ['submitted', 'triaged'].includes(from);
      const patch = { department, assignedTo: owner, slaDueAt: dueAt };
      if (assignNow) patch.status = 'assigned';

      await updateReport(data.id, patch, {
        type: assignNow ? 'status_changed' : 'note',
        note: assignNow
          ? `Assigned to ${owner} · SLA ${formatDateTime(dueAt)}`
          : `Assignment updated to ${owner}`,
        isPublic: assignNow,
        fromStatus: eventFrom,
        toStatus: patch.status ?? from,
      });

      push({
        tone: 'success',
        title: assignNow ? 'Report assigned' : 'Assignment updated',
        description: `${owner} · due ${formatDateTime(dueAt)}`,
      });
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  }

  async function handleTransition(target) {
    setError(null);

    if (!allowed.includes(target)) {
      setError(`A ${STATUS_META[data.status]?.label ?? data.status} report cannot move to ${target}.`);
      return;
    }
    if (target === 'resolved' && !publicNote.trim()) {
      setError('A public resolution note is required. The citizen sees this text on /track.');
      return;
    }

    try {
      await updateReport(
        data.id,
        { status: target },
        {
          type: target === 'resolved' ? 'resolved' : 'status_changed',
          note: publicNote.trim() || `Status changed to ${STATUS_META[target].label}`,
          isPublic: true,
          fromStatus: data.status,
          toStatus: target,
        },
      );
      setPublicNote('');
      push({
        tone: 'success',
        title: `Moved to ${STATUS_META[target].label}`,
        description: 'The public tracking page refreshes immediately.',
      });
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  }

  async function handleInternalNote() {
    setError(null);
    if (!internalNote.trim()) {
      setError('Write the internal note before saving it.');
      return;
    }

    try {
      await updateReport(
        data.id,
        {},
        {
          type: 'note',
          note: internalNote.trim(),
          isPublic: false,
          fromStatus: data.status,
          toStatus: data.status,
        },
      );
      setInternalNote('');
      push({ tone: 'success', title: 'Internal note saved', description: 'Never shown on /track.' });
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-report-title"
        tabIndex={-1}
        className="relative z-10 flex h-full w-full max-w-2xl animate-fade-in flex-col bg-mist shadow-lift"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold tracking-wide text-teal-700">
              {data.referenceCode}
            </p>
            <h2 id="admin-report-title" className="mt-1 truncate text-lg font-semibold text-navy-900">
              {data.title ?? 'Untitled report'}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PriorityBadge band={data.priorityBand} score={data.priorityScore} />
              <StatusBadge status={data.status} />
              <Badge tone="neutral">{category.short}</Badge>
              <span className="text-xs text-slate-500">{timeAgo(data.createdAt)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report detail"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-navy-900 hover:bg-navy-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          {loading ? (
            <p className="mb-4 rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
              Refreshing report…
            </p>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <section aria-labelledby="drawer-summary" className="card card-pad">
            <h3 id="drawer-summary" className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
              AI summary
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{data.ai?.summary ?? data.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge tone="teal">{data.ai?.version ?? 'rules-v1'}</Badge>
              <span>{formatPercent(data.ai?.confidence ?? 0, 0)} confidence</span>
              <span aria-hidden="true">·</span>
              <span>{category.label}</span>
              {data.ai?.lowConfidence ? <Badge tone="warning">Check category</Badge> : null}
            </div>
            {data.ai?.matchedTerms?.length ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Matched terms: {data.ai.matchedTerms.slice(0, 8).join(', ')}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="drawer-factors" className="card card-pad mt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 id="drawer-factors" className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Priority arithmetic
              </h3>
              <PriorityBadge band={data.priorityBand} score={data.priorityScore} />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {data.ai?.priority?.verdict ?? 'No stored verdict for this report.'}
            </p>
            {factors.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No factor breakdown is stored.</p>
            ) : (
              <>
                <ul className="mt-3 space-y-1.5">
                  {factors.map((factor) => (
                    <li
                      key={factor.code}
                      className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span className="text-slate-600">
                        {factor.label}
                        {factor.detail ? (
                          <span className="mt-0.5 block text-[11px] text-slate-400">{factor.detail}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-navy-900">
                        +{factor.points}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  Factors sum to {data.ai.priority.score}. Critical hazards are raised to the P0
                  floor of 80 by D-008.
                </p>
              </>
            )}
          </section>

          <section aria-labelledby="drawer-location" className="card card-pad mt-4">
            <h3 id="drawer-location" className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Location and evidence
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {data.locationLabel ?? 'No location label'} · {Number(data.latitude).toFixed(4)},{' '}
              {Number(data.longitude).toFixed(4)}
            </p>
            <div className="mt-3">
              <ReportMap reports={[data]} height={190} showClusters={false} showLegend={false} />
            </div>
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt="Citizen evidence"
                className="mt-3 max-h-48 w-full rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <p className="mt-3 text-xs text-slate-500">No photo attached.</p>
            )}
          </section>

          <section aria-labelledby="drawer-assign" className="card card-pad mt-4">
            <h3 id="drawer-assign" className="flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Assignment
            </h3>
            <form className="mt-3 space-y-3" onSubmit={handleAssign}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="admin-department" label="Department" required>
                  <select
                    id="admin-department"
                    className="input"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                  >
                    <option value="">Choose a department</option>
                    {DEPARTMENTS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="admin-assignee" label="Assigned to" hint="Defaults to the department.">
                  <input
                    id="admin-assignee"
                    className="input"
                    value={assignee}
                    onChange={(event) => setAssignee(event.target.value)}
                    placeholder="Crew or officer name"
                  />
                </Field>
              </div>

              <Field
                id="admin-sla"
                label="SLA due"
                hint={`${bandSla} hours for ${data.priorityBand ?? 'unscored'} — editable.`}
              >
                <input
                  id="admin-sla"
                  type="datetime-local"
                  className="input"
                  value={sla}
                  onChange={(event) => setSla(event.target.value)}
                />
              </Field>

              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                {data.status === 'submitted' || data.status === 'triaged'
                  ? 'Assign and set SLA'
                  : 'Save assignment'}
              </Button>
            </form>
          </section>

          <section aria-labelledby="drawer-status" className="card card-pad mt-4">
            <h3 id="drawer-status" className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Lifecycle
            </h3>
            <div className="mt-3">
              <Stepper status={data.status} />
            </div>

            {allowed.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {allowed.map((target) => (
                  <Button
                    key={target}
                    size="sm"
                    variant={target === 'rejected' ? 'danger' : target === 'resolved' ? 'accent' : 'ghost'}
                    disabled={saving}
                    onClick={() => handleTransition(target)}
                  >
                    Move to {STATUS_META[target].label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No further transitions are allowed.</p>
            )}

            <div className="mt-4">
              <Field
                id="admin-public-note"
                label="Public update"
                hint="Appears on /track. Required before resolving."
              >
                <textarea
                  id="admin-public-note"
                  className="input min-h-[80px]"
                  rows={3}
                  value={publicNote}
                  onChange={(event) => setPublicNote(event.target.value)}
                  placeholder="What changed, in language a citizen can follow?"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field
                id="admin-internal-note"
                label="Internal note"
                hint="Operator-only. Never returned by the public tracking query."
              >
                <textarea
                  id="admin-internal-note"
                  className="input min-h-[70px]"
                  rows={2}
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  placeholder="Crew availability, access constraints, verification…"
                />
              </Field>
              <Button
                className="mt-2"
                size="sm"
                variant="ghost"
                onClick={handleInternalNote}
                disabled={saving || !internalNote.trim()}
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                Save internal note
              </Button>
            </div>
          </section>

          <section aria-labelledby="drawer-history" className="card card-pad mt-4">
            <h3 id="drawer-history" className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4 text-slate-500" aria-hidden="true" />
              History
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Operator view includes internal notes. The citizen view hides them.
            </p>
            <div className="mt-3">
              <Timeline events={events} emptyMessage="No events recorded yet." />
            </div>
          </section>

          <HonestyNote className="mt-4" title="Demo workflow">
            Assignments, SLA dates and notifications are stored locally and never dispatched to a
            real department. The status trail is real application state.
          </HonestyNote>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Updated {formatDateTime(data.updatedAt)}
            </p>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
