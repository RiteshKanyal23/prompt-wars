import { CATEGORY_FAMILIES, DUPLICATE_COMPONENT_WEIGHTS } from '@/lib/constants';
import { distanceMeters } from '@/lib/geo';
import { buildIndex, cosine, vectorize } from './tfidf';
import { tokenize } from './normalize';

export const DUPLICATE_WEIGHTS = DUPLICATE_COMPONENT_WEIGHTS;
export const DUPLICATE_THRESHOLDS = { strong: 0.82, review: 0.62, floor: 0.55 };

const MAX_DISTANCE_METERS = 300;
const MAX_AGE_DAYS = 21;
const DAY_MS = 86_400_000;

function categorySimilarity(a, b) {
  if (a === b) return 1;
  if (CATEGORY_FAMILIES[a] && CATEGORY_FAMILIES[a] === CATEGORY_FAMILIES[b]) return 0.5;
  return 0;
}

function toTime(value) {
  const time = new Date(value ?? 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function documentFor(report) {
  return `${report.title ?? ''} ${report.description ?? ''}`;
}

/**
 * Suggest possible duplicates. Candidate selection respects the category,
 * distance, age and status rules in trd.md section 10.6.
 *
 * @param {import('@/types').Report} report
 * @param {import('@/types').Report[]} corpus
 */
export function findDuplicateCandidates(report, corpus, { now = new Date(), limit = 3 } = {}) {
  const nowMs = new Date(now).getTime();
  const pool = corpus.filter(
    (candidate) =>
      candidate.id !== report.id &&
      candidate.status !== 'duplicate' &&
      candidate.status !== 'rejected' &&
      Number.isFinite(Number(candidate.latitude)) &&
      Number.isFinite(Number(candidate.longitude)),
  );
  if (pool.length === 0) return [];

  const documents = [documentFor(report), ...pool.map(documentFor)];
  const index = buildIndex(documents);
  const targetVector = vectorize(tokenize(documents[0]), index);

  const results = [];

  for (const candidate of pool) {
    const meters = distanceMeters(report, candidate);
    const ageDays = Math.abs(nowMs - toTime(candidate.createdAt)) / DAY_MS;
    if (meters > MAX_DISTANCE_METERS || ageDays > MAX_AGE_DAYS) continue;

    const candidateVector = vectorize(tokenize(documentFor(candidate)), index);
    const text = cosine(targetVector, candidateVector);
    const category = categorySimilarity(report.category, candidate.category);

    // Require either a category/family match or meaningful lexical overlap.
    if (category === 0 && text < 0.3) continue;

    const geo = Math.max(0, 1 - meters / MAX_DISTANCE_METERS);
    const time = Math.max(0, 1 - ageDays / MAX_AGE_DAYS);
    const score =
      DUPLICATE_WEIGHTS.text * text +
      DUPLICATE_WEIGHTS.category * category +
      DUPLICATE_WEIGHTS.geo * geo +
      DUPLICATE_WEIGHTS.time * time;

    if (score < DUPLICATE_THRESHOLDS.floor) continue;

    const level =
      score >= DUPLICATE_THRESHOLDS.strong
        ? 'strong'
        : score >= DUPLICATE_THRESHOLDS.review
          ? 'review'
          : 'low';

    const reasons = [];
    if (text >= 0.4) reasons.push(`Shared wording (${Math.round(text * 100)}% text similarity)`);
    if (category === 1) reasons.push('Same category');
    else if (category === 0.5) reasons.push('Related category');
    if (meters <= 100) reasons.push(`Only ${Math.round(meters)} m apart`);
    if (ageDays <= 3) reasons.push(`Reported ${Math.round(ageDays)} day(s) apart`);

    results.push({
      reportId: candidate.id,
      referenceCode: candidate.referenceCode,
      score: Number(score.toFixed(3)),
      level,
      components: {
        text: Number(text.toFixed(3)),
        category,
        geo: Number(geo.toFixed(3)),
        time: Number(time.toFixed(3)),
      },
      distanceMeters: Math.round(meters),
      ageDays: Number(ageDays.toFixed(1)),
      reasons,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
