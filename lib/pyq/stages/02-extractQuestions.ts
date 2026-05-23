import { PyqIngestionContext } from '../types';
import { generateContent } from '@/lib/gemini';

export async function extractQuestions(ctx: PyqIngestionContext): Promise<PyqIngestionContext> {
  const prompt = `
  You are an expert exam parser. Extract questions from the following exam paper text.
  For each question, extract:
  - questionNumber (e.g. "1", "45")
  - questionText (the actual question)
  - options (array of strings, if it's multiple choice)
  - answer (string, if provided)
  - solutionText (string, if an explanation is provided)
  - chapterKey (best guess for the NCERT chapter, e.g., "chapter_1", "chapter_2" or leave empty)
  - topicTags (array of strings, concepts tested)
  - difficulty (Easy, Medium, Hard)

  Text:
  """
  ${ctx.extractedText.substring(0, 10000)} // Processing first 10000 chars for safety in prompt
  """

  Return the result EXACTLY as a JSON array of objects. Do not use markdown blocks.
  [
    {
      "questionNumber": "1",
      "questionText": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "solutionText": "...",
      "chapterKey": "chapter_1",
      "topicTags": ["kinematics"],
      "difficulty": "Medium"
    }
  ]
  `;

  try {
    const response = await generateContent(prompt, "You are a PYQ parser. Return raw JSON array only.");
    const cleanJson = response.replace(/\\`\\`\\`json/g, '').replace(/\\`\\`\\`/g, '').trim();
    ctx.rawQuestions = JSON.parse(cleanJson);
  } catch (error) {
    console.error("Failed to extract questions:", error);
    ctx.rawQuestions = [];
  }

  return ctx;
}
