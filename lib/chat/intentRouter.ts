import { ChatIntent } from './chatTypes';

export function detectIntent(query: string): ChatIntent {
  const lowerQuery = query.toLowerCase();
  
  if (/(pyq|neet|jee|previous year|asked in|exam relevance)/i.test(lowerQuery)) {
    return 'pyq_query';
  }

  if (/how many (elements|items|members).*(in|are in).*(×|x|cross|\*)/i.test(lowerQuery) || /^what is \d+[\s\+\-\*\/]+\d+/i.test(lowerQuery) || /simple arithmetic/i.test(lowerQuery) || /^[\d\s\+\-\*\/\(\)\^\.]+\??\s*$/.test(query)) {
    return 'simple_math_query';
  }

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

  if (/(what is|define|definition of|meaning of)/i.test(lowerQuery)) {
    return 'definition_query';
  }

  if (/^(is|are|can|does|do|will|would|should|could)\b/i.test(lowerQuery)) {
    return 'yes_no_query';
  }

  if (/(generate|create|make).*(practice|questions|test)/i.test(lowerQuery)) {
    return 'practice_generation';
  }

  return 'concept_explanation';
}

export function getResponseMode(intent: ChatIntent): 'concise' | 'standard' | 'detailed' {
  switch (intent) {
    case 'simple_math_query':
    case 'formula_reference':
    case 'yes_no_query':
    case 'structure_query':
      return 'concise';
    case 'definition_query':
    case 'figure_reference':
    case 'table_reference':
    case 'example_query':
      return 'standard';
    case 'concept_explanation':
    case 'exercise_solution':
    case 'practice_generation':
    case 'pyq_query':
    default:
      return 'detailed';
  }
}
