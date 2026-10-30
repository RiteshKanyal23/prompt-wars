import { splitSentences, tokenize, truncate } from './normalize';
import { CATEGORY_LEXICON } from './classify';

/**
 * Extractive summary: ranks the citizen's own sentences and never invents
 * facts. The first sentence gets a bonus because complaints lead with the
 * core issue.
 */
export function summarizeReport({ title = '', description = '', category = 'other' }) {
  const sentences = splitSentences(description);
  if (sentences.length === 0) return truncate(title || 'No description provided.', 220);
  if (sentences.length === 1) return truncate(sentences[0], 220);

  const lexicon = CATEGORY_LEXICON[category] ?? {};
  const categoryTerms = new Set(Object.keys(lexicon).flatMap((term) => term.split(' ')));
  const titleTerms = new Set(tokenize(title));

  const ranked = sentences.map((sentence, index) => {
    const tokens = new Set(tokenize(sentence));
    let hits = 0;
    for (const token of tokens) {
      if (categoryTerms.has(token)) hits += 1;
      if (titleTerms.has(token)) hits += 1;
    }
    const lengthBonus = Math.min(sentence.length / 140, 1);
    const positionBonus = index === 0 ? 3 : 0;
    return { sentence, index, score: hits * 2 + lengthBonus + positionBonus };
  });

  const chosen = [...ranked]
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index);

  return truncate(chosen.map((item) => item.sentence).join(' '), 220);
}
