import { ChatIntent } from './chatTypes';

export function detectIntent(query: string): ChatIntent {
  const lowerQuery = query.toLowerCase();
  
  if (/how many (figures|tables|exercises)|list (exercises|examples|summary)|show summary/i.test(lowerQuery)) {
    return 'structure_query';
  }
  
  if (/(what|explain|how|why).*(figure|fig\.|diagram)/i.test(lowerQuery)) {
    return 'figure_reference';
  }

  if (/(what|explain|how|why).*(table)/i.test(lowerQuery)) {
    return 'table_reference';
  }

  if (/(what|explain|how|why|write).*(formula|equation)/i.test(lowerQuery)) {
    return 'formula_reference';
  }

  if (/(solve|solution|answer|do).*(exercise|question|q\.)/i.test(lowerQuery)) {
    return 'exercise_solution';
  }

  if (/(what|explain|how|why).*(example)/i.test(lowerQuery)) {
    return 'example_query';
  }

  if (/(generate|create|make).*(practice|questions|test)/i.test(lowerQuery)) {
    return 'practice_generation';
  }

  return 'concept_explanation';
}
