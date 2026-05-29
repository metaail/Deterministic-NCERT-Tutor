export type ChatIntent =
  | 'concept_explanation'
  | 'structure_query'
  | 'figure_reference'
  | 'table_reference'
  | 'formula_reference'
  | 'exercise_solution'
  | 'example_query'
  | 'practice_generation'
  | 'simple_math_query'
  | 'definition_query'
  | 'yes_no_query'
  | 'pyq_query';

export type ResponseMode = 'concise' | 'standard' | 'detailed';

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
  forceGeneral?: boolean;
}

export interface ContextPayload {
  intent: ChatIntent;
  responseMode: ResponseMode;
  textChunks: any[];
  structureIndex?: any;
}

export interface VerificationResult {
  isValid: boolean;
  reason?: string;
  sanitizedResponse?: string;
}

export interface StreamMetrics {
  retrievalLatency: number;
  geminiLatency: number;
  verifierLatency: number;
  totalLatency: number;
  timeToFirstToken: number;
  tokensPerSecond: number;
}
