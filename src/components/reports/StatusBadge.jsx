import Badge from '@/components/ui/Badge';
import { STATUS_META } from '@/lib/constants';

const TONE_MAP = {
  slate: 'neutral',
  blue: 'info',
  teal: 'teal',
  amber: 'warning',
  green: 'success',
  red: 'danger',
};

export default function StatusBadge({ status, citizen = false }) {
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <Badge tone={TONE_MAP[meta.tone] ?? 'neutral'} dot>
      {citizen ? meta.citizenLabel : meta.label}
    </Badge>
  );
}
