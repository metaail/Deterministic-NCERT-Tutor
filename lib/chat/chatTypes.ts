export type ChatIntent =
  | 'concept_explanation'
  | 'structure_query'
  | 'figure_reference'
  | 'table_reference'
  | 'formula_reference'
  | 'exercise_solution'
  | 'example_query'
  | 'practice_generation';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  subjectCode: string;
  classLevel: string;
  chapterKey: string;
  query: string;
  history?: ChatMessage[];
}

export interface ContextPayload {
  intent: ChatIntent;
  textChunks: any[];
  structureIndex?: any;
}

export interface VerificationResult {
  isValid: boolean;
  reason?: string;
  sanitizedResponse?: string;
}
