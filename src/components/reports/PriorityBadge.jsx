import Badge from '@/components/ui/Badge';
import { PRIORITY_BANDS } from '@/lib/constants';

const TONE_MAP = {
  red: 'danger',
  amber: 'warning',
  blue: 'info',
  slate: 'neutral',
};

export default function PriorityBadge({ band, score, citizen = false }) {
  if (!band) {
    return <Badge tone="neutral">Unscored</Badge>;
  }

  const meta = PRIORITY_BANDS[band] ?? PRIORITY_BANDS.P3;
  return (
    <Badge tone={TONE_MAP[meta.tone] ?? 'neutral'} dot>
      {band} · {citizen ? meta.citizen : meta.label}
      {score !== undefined && score !== null ? ` · ${score}` : ''}
    </Badge>
  );
}
