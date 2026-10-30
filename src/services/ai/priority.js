import { CATEGORY_MAP } from '@/lib/constants';
import { normalizeText } from './normalize';

export const PRIORITY_BANDS = [
  { band: 'P0', min: 80 },
  { band: 'P1', min: 60 },
  { band: 'P2', min: 40 },
  { band: 'P3', min: 0 },
];

/**
 * Urgency phrases and their points. Matched on normalised text.
 *
 * Single-word terms match their inflections ("collapse" also matches
 * "collapsed"), because citizens do not write in canonical dictionary forms.
 * The cap keeps one dramatic paragraph from dominating the whole score.
 */
const URGENCY_TERMS = [
  ['live wire', 8], ['electric wire', 6], ['electrocution', 8],
  ['open manhole', 8], ['gas leak', 8], ['drowning', 8], ['collapse', 7],
  ['sinkhole', 7], ['fire', 6], ['sparking', 5], ['exposed wire', 6],
  ['emergency', 6], ['accident', 5], ['injury', 5], ['injured', 5],
  ['danger', 5], ['hazard', 5], ['missing', 3],
  ['school', 4], ['hospital', 4], ['children', 4], ['child', 4], ['elderly', 4],
  ['urgent', 4], ['severe', 4], ['since last night', 3], ['blocked', 3],
  ['deep', 3], ['huge', 3], ['overflowing', 2], ['night', 2], ['market', 2],
  ['bus stop', 2], ['bus stand', 2], ['playground', 2],
];

const URGENCY_CAP = 20;

/**
 * D-008: a small set of hazards is critical even when the citizen writes
 * calmly. These phrases raise the final score to the P0 floor of 80. They are
 * matched as events, not predictions: "has collapsed" escalates, "will
 * collapse" does not.
 */
export const CRITICAL_HAZARDS = [
  ['live wire', 'live wire'],
  ['electric wire', 'exposed electric wire'],
  ['open manhole', 'open manhole'],
  ['missing manhole cover', 'missing manhole cover'],
  ['manhole cover is missing', 'missing manhole cover'],
  ['road collapse', 'road collapse'],
  ['building collapse', 'building collapse'],
  ['wall collapse', 'wall collapse'],
  ['has collapsed', 'collapsed road or structure'],
  ['collapsed into', 'collapsed road or structure'],
  ['electrocution', 'electrocution risk'],
  ['gas leak', 'gas leak'],
  ['drowning', 'drowning risk'],
];

const CRITICAL_HAZARD_FLOOR = 80;

function criticalHazards(text) {
  const matched = [];
  for (const [phrase, label] of CRITICAL_HAZARDS) {
    if (matchesTerm(text, phrase) && !matched.includes(label)) matched.push(label);
  }
  return matched;
}

function matchesTerm(text, term) {
  if (term.includes(' ')) return text.includes(term);
  return text.split(' ').some((word) => word.startsWith(term));
}

function urgencyPoints(text) {
  const matched = [];
  let points = 0;
  for (const [term, value] of URGENCY_TERMS) {
    if (matchesTerm(text, term)) {
      points += value;
      matched.push(term);
    }
  }
  return { points: Math.min(URGENCY_CAP, points), matched, capped: points > URGENCY_CAP };
}

function clusterPoints(count) {
  if (count <= 1) return 0;
  if (count === 2) return 4;
  if (count === 3) return 8;
  if (count === 4) return 12;
  if (count === 5) return 16;
  return 20;
}

function recencyPoints(createdAt, now) {
  const created = new Date(createdAt ?? 0).getTime();
  const current = new Date(now).getTime();
  if (!Number.isFinite(created) || !Number.isFinite(current)) return 0;
  const hours = Math.max(0, (current - created) / 3_600_000);
  if (hours <= 24) return 10;
  if (hours <= 72) return 7;
  if (hours <= 168) return 4;
  if (hours <= 336) return 2;
  return 0;
}

export function bandForScore(score) {
  return PRIORITY_BANDS.find((entry) => score >= entry.min)?.band ?? 'P3';
}

/**
 * @returns {{score:number, band:string, factors:Array, verdict:string,
 *   matchedUrgency:string[]}}
 */
export function computePriority({
  category = 'other',
  title = '',
  description = '',
  clusterCount = 1,
  confirmedDuplicates = 0,
  createdAt,
  now = new Date(),
}) {
  const text = normalizeText(`${title} ${description}`);
  const baseSeverity = CATEGORY_MAP[category]?.baseSeverity ?? 12;
  const urgency = urgencyPoints(text);
  const hazards = criticalHazards(text);
  const impact = clusterPoints(clusterCount);
  const corroboration = Math.min(10, Math.max(0, confirmedDuplicates) * 5);
  const recency = recencyPoints(createdAt, now);

  const factors = [
    {
      code: 'severity',
      label: 'Category severity',
      points: baseSeverity,
      detail: `${CATEGORY_MAP[category]?.label ?? category} has an inherent risk weight of ${baseSeverity}/40.`,
    },
    {
      code: 'urgency',
      label: 'Urgency language',
      points: urgency.points,
      detail: urgency.matched.length
        ? `Matched: ${urgency.matched.join(', ')}.${urgency.capped ? ` Capped at ${URGENCY_CAP}.` : ''}`
        : 'No urgent or vulnerable-location language detected.',
    },
    {
      code: 'cluster',
      label: 'Cluster impact',
      points: impact,
      detail:
        clusterCount > 1
          ? `${clusterCount} related reports within ~330 m in the last 30 days.`
          : 'No nearby cluster yet.',
    },
    {
      code: 'corroboration',
      label: 'Duplicate corroboration',
      points: corroboration,
      detail: `${confirmedDuplicates} confirmed duplicate(s) increase confidence.`,
    },
    {
      code: 'recency',
      label: 'Recency',
      points: recency,
      detail: 'Newer unresolved reports rank higher than older ones.',
    },
  ];

  const raw = factors.reduce((sum, factor) => sum + factor.points, 0);
  const escalation =
    hazards.length > 0 && raw < CRITICAL_HAZARD_FLOOR ? CRITICAL_HAZARD_FLOOR - raw : 0;

  if (escalation > 0) {
    factors.push({
      code: 'hazard',
      label: 'Critical hazard escalation',
      points: escalation,
      detail: `Critical hazard detected: ${hazards.join(', ')}. Score raised to the ${CRITICAL_HAZARD_FLOOR}-point P0 floor.`,
    });
  }

  const score = Math.min(100, raw + escalation);

  if (raw > 100) {
    factors.push({
      code: 'cap',
      label: 'Maximum score cap',
      points: 100 - raw,
      detail: `Raw score ${raw} is capped at 100.`,
    });
  }

  const band = bandForScore(score);
  const drivers = factors
    .filter((factor) => factor.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((factor) => `${factor.label.toLowerCase()} (+${factor.points})`);

  const verdict = `Priority ${band} (${score}/100). Main drivers: ${drivers.join(', ')}.`;

  return {
    score,
    band,
    factors,
    verdict,
    matchedUrgency: urgency.matched,
    criticalHazards: hazards,
  };
}
