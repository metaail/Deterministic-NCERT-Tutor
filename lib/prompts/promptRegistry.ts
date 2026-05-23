import { SYSTEM_PROMPT } from './systemPrompt';
import { buildTutorPrompt } from './tutorPrompt';

export const PROMPT_REGISTRY = {
  system: SYSTEM_PROMPT,
  tutor: buildTutorPrompt
};
