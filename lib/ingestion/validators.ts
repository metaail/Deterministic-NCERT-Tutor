import { z } from 'zod';

export const PdfUploadPayloadSchema = z.object({
  subject: z.string().min(1),
  subjectCode: z.string().min(1),
  classLevel: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  chapterTitle: z.string().min(1),
}).strict();
