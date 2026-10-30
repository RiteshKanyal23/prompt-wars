import { ShieldCheck } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import HonestyNote from '@/components/ui/HonestyNote';

const NEXT_STEPS = [
  'Your text is classified and summarised.',
  'Likely duplicates are proposed, never auto-merged.',
  'Five priority factors produce a score and a band.',
  'Nearby reports are grouped into a hotspot.',
];

/**
 * The right-hand rail: what happens after submit plus the honesty notes that
 * must accompany any citizen-facing form.
 */
export default function ReportSidebar() {
  return (
    <div className="space-y-4">
      <Card padded>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">What happens next</h2>
          <Badge tone="teal" dot>
            rules-v1
          </Badge>
        </div>
        <ol className="mt-4 space-y-3">
          {NEXT_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-slate-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-navy-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
          After submission you get a tracking code and the analysis page. Keep the code to follow
          the public timeline.
        </p>
      </Card>

      <HonestyNote title="No image AI">
        Photos are stored as evidence only. Nothing in this prototype analyses image content, and a
        missing photo never blocks a report.
      </HonestyNote>

      <HonestyNote tone="warning" title="Demo data">
        This prototype stores reports in your browser. Do not submit real personal information.
        Reset demo data from the footer at any time.
      </HonestyNote>

      <Card padded className="bg-navy-900 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4 text-teal-400" aria-hidden="true" />
          Privacy by default
        </p>
        <p className="mt-2 text-sm leading-6 text-navy-100/80">
          Only the tracking code is needed to view a citizen timeline. Contact details stay local
          and internal notes never appear on public routes.
        </p>
      </Card>
    </div>
  );
}
