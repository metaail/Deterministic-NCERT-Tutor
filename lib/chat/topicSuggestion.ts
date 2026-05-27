export function suggestChapterForQuery(query: string): string | null {
  const q = query.toLowerCase();
  
  // A simple heuristic for common Math chapters
  if (q.includes('empty set') || q.includes('de morgan') || q.includes('subset') || q.includes('union') || q.includes('intersection')) {
    return 'Sets';
  }
  if (q.includes('relation') || q.includes('function') || q.includes('cartesian product') || q.includes('domain') || q.includes('range')) {
    return 'Relations and Functions';
  }
  if (q.includes('trigonometry') || q.includes('sin') || q.includes('cos ') || q.includes('radians') || q.includes('degree')) {
    return 'Trigonometric Functions';
  }
  if (q.includes('quadratic') || q.includes('complex number')) {
    return 'Complex Numbers and Quadratic Equations';
  }
  if (q.includes('inequality') || q.includes('linear programming')) {
    return 'Linear Inequalities';
  }
  if (q.includes('permutation') || q.includes('combination') || q.includes('factorial')) {
    return 'Permutations and Combinations';
  }
  if (q.includes('binomial')) {
    return 'Binomial Theorem';
  }
  if (q.includes('sequence') || q.includes('series') || q.includes('progression') || q.includes('arithmetic') || q.includes('geometric')) {
    return 'Sequences and Series';
  }
  if (q.includes('straight line') || q.includes('slope') || q.includes('intercept')) {
    return 'Straight Lines';
  }
  if (q.includes('conic') || q.includes('parabola') || q.includes('ellipse') || q.includes('hyperbola')) {
    return 'Conic Sections';
  }
  if (q.includes('limit') || q.includes('derivative') || q.includes('calculus')) {
    return 'Limits and Derivatives';
  }
  if (q.includes('probability') || q.includes('random') || q.includes('variance') || q.includes('standard deviation')) {
    return 'Probability';
  }
  if (q.includes('statistics') || q.includes('mean') || q.includes('median')) {
    return 'Statistics';
  }
  
  return null;
}
