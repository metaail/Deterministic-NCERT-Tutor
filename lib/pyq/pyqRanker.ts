import { PyqQuestion } from './validators';

export function rankPyqs(candidates: PyqQuestion[], originalQuery: string): PyqQuestion[] {
  const qLower = originalQuery.toLowerCase();
  const queryTokens = qLower.split(/\\s+/);

  const scored = candidates.map(q => {
    let score = 0;
    const qText = (q.questionText + " " + q.solutionText).toLowerCase();

    queryTokens.forEach(token => {
      // Basic keyword matching
      if (token.length > 3 && qText.includes(token)) {
        score += 1;
      }
    });

    // Tag matching boosts
    q.topicTags?.forEach(tag => {
      if (qLower.includes(tag.toLowerCase())) score += 5;
    });

    return { ...q, _score: score };
  });

  // Filter out low scores and sort
  return scored
    .filter(q => q._score > 0)
    .sort((a, b) => b._score - a._score)
    .map(q => {
      const { _score, ...rest } = q;
      // Normalize score for UI display (cap at 1.0)
      const normalizedScore = Math.min(_score / 15, 1.0); 
      return { ...rest, score: normalizedScore } as PyqQuestion & { score: number };
    });
}
