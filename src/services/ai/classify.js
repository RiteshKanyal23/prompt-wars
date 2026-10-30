import { CATEGORY_MAP } from '@/lib/constants';
import { normalizeText, tokenize } from './normalize';

/**
 * Weighted lexicon. Weights: 4 = decisive, 3 = strong, 2 = moderate, 1 = weak.
 * Multi-word entries are matched against the normalised text.
 */
export const CATEGORY_LEXICON = {
  roads: {
    pothole: 4, potholes: 4, road: 2, roads: 2, footpath: 3, pavement: 2,
    crack: 2, cracked: 2, tar: 2, asphalt: 2, 'speed breaker': 3, signboard: 1,
    'road collapse': 4, collapse: 2, cave: 2, 'broken road': 4, divider: 1,
  },
  water: {
    waterlogging: 4, waterlogged: 4, waterlog: 3, drain: 3, drainage: 3,
    sewer: 3, sewage: 3, overflow: 3, overflowing: 3, leak: 2, leaking: 2,
    pipeline: 2, pipe: 2, 'water supply': 3, tap: 1, stagnant: 3, flood: 3,
    flooded: 3, 'storm drain': 3, 'manhole cover': 2, muddy: 1,
  },
  waste: {
    garbage: 4, waste: 3, trash: 3, bin: 4, bins: 4, dumping: 4, dump: 3,
    litter: 3, littering: 3, pickup: 2, collection: 2, smell: 1, stink: 2,
    'overflowing bin': 4, 'solid waste': 3, debris: 2,
  },
  electricity: {
    streetlight: 4, 'street light': 4, 'street lights': 4, lamp: 3, lampost: 3,
    wire: 4, wires: 4, electric: 3, electricity: 3, transformer: 3, pole: 2,
    power: 2, outage: 3, spark: 3, sparking: 4, shock: 3, 'live wire': 4,
    'dark street': 3, flickering: 2,
  },
  sanitation: {
    toilet: 4, toilets: 4, sanitation: 3, defecation: 4, 'public health': 3,
    mosquito: 3, mosquitoes: 3, pest: 3, rodents: 3, rats: 3, hygiene: 3,
    cleaning: 2, sweeper: 2, sweeping: 2, 'garbage burning': 3,
  },
  public_safety: {
    manhole: 4, 'open manhole': 4, unsafe: 3, collapse: 3, 'collapsed wall': 4,
    stray: 3, dogs: 3, fire: 3, hazard: 3, accident: 3, injury: 3, injured: 3,
    building: 1, wall: 2, tree: 2, 'fallen tree': 3, 'exposed wire': 4,
    drowning: 4, dangerous: 3,
  },
  other: {},
};

const LOW_CONFIDENCE = 0.45;

/**
 * @param {{title?: string, description?: string}} report
 * @returns {{category: string, confidence: number, lowConfidence: boolean,
 *   alternatives: object[], matches: string[]}}
 */
export function classifyReport({ title = '', description = '' }) {
  const text = normalizeText(`${title} ${description}`);
  const tokens = new Set(tokenize(`${title} ${description}`));

  const scored = Object.entries(CATEGORY_LEXICON).map(([category, lexicon]) => {
    let score = 0;
    const matches = [];
    for (const [term, weight] of Object.entries(lexicon)) {
      const hit = term.includes(' ') ? text.includes(term) : tokens.has(term);
      if (hit) {
        score += weight;
        matches.push(term);
      }
    }
    return { category, score, matches };
  });

  scored.sort((a, b) => b.score - a.score || a.category.localeCompare(b.category));
  const top = scored[0];

  if (!top || top.score === 0) {
    return {
      category: 'other',
      confidence: 0.25,
      lowConfidence: true,
      alternatives: scored.slice(0, 3).map((item) => ({
        category: item.category,
        label: CATEGORY_MAP[item.category]?.label ?? item.category,
        score: 0,
        confidence: 0,
        matches: [],
      })),
      matches: [],
    };
  }

  const topThree = scored.slice(0, 3);
  const denominator = topThree.reduce((sum, item) => sum + item.score, 0) || top.score;
  const confidence = Math.min(0.98, Math.max(0.35, top.score / denominator));

  return {
    category: top.category,
    confidence: Number(confidence.toFixed(2)),
    lowConfidence: confidence < LOW_CONFIDENCE,
    alternatives: topThree.map((item) => ({
      category: item.category,
      label: CATEGORY_MAP[item.category]?.label ?? item.category,
      score: item.score,
      confidence: Number((item.score / denominator).toFixed(2)),
      matches: item.matches,
    })),
    matches: top.matches,
  };
}
