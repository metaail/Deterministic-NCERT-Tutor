import { IngestionContext } from '../types';
import { generateContent } from '@/lib/gemini';
import crypto from 'crypto';

export async function validateIdentity(ctx: IngestionContext): Promise<IngestionContext> {
  if (!ctx.extractedText) throw new Error("No extracted text to validate");

  // Generate contentHash
  const hash = crypto.createHash('sha256').update(ctx.pdfBuffer).digest('hex');
  ctx.metadata.contentHash = hash;

  // Use the first 2000 characters to detect identity
  const sampleText = ctx.extractedText.substring(0, 2000);

  const prompt = `
  Analyze the following text sample from a textbook PDF and identify:
  1. The Subject (e.g. Physics, Chemistry, Biology, Mathematics)
  2. The Class Level (e.g. Class 11, Class 12)
  3. The Chapter Number
  4. The Chapter Title

  Text Sample:
  """
  ${sampleText}
  """

  Return the result EXACTLY as a JSON object with the following keys:
  {
    "detectedSubject": "...",
    "detectedClassLevel": "...",
    "detectedChapterNumber": 0,
    "detectedChapterTitle": "..."
  }
  Do not include markdown blocks or any other text.
  `;

  try {
    const rawResponse = await generateContent(prompt, "You are a scientific textbook identity analyzer. Reply with raw JSON only. Do not use code blocks.");
    
    // Clean up potential markdown blocks if model ignored instruction
    const cleanedJSON = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const identity = JSON.parse(cleanedJSON);

    ctx.metadata.detectedSubject = identity.detectedSubject;
    ctx.metadata.detectedClassLevel = identity.detectedClassLevel;
    // ensure number
    ctx.metadata.detectedChapterNumber = Number(identity.detectedChapterNumber);
    ctx.metadata.detectedChapterTitle = identity.detectedChapterTitle;
    
    const intendedSubject = ctx.metadata.subject;
    if (intendedSubject && identity.detectedSubject && intendedSubject.toLowerCase() !== identity.detectedSubject.toLowerCase()) {
      ctx.metadata.subjectMismatchWarning = true;
      console.warn(`[ValidateIdentity] Mismatch! Expected ${intendedSubject}, got ${identity.detectedSubject}`);
    } else {
      ctx.metadata.subjectMismatchWarning = false;
    }
  } catch (error) {
    console.error("[ValidateIdentity] Failed to analyze identity", error);
    // don't break pipeline, just mark flag
    ctx.metadata.subjectMismatchWarning = true;
  }

  return ctx;
}
