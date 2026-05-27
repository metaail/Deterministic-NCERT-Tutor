import { z } from 'zod';
import { ChapterDocumentSchema, ChapterChunkSchema } from '@/lib/validators/models';

export type ChapterDocument = z.infer<typeof ChapterDocumentSchema>;
export type ChapterChunk = z.infer<typeof ChapterChunkSchema>;
export type SearchResult = ChapterChunk & { pyqs?: any[] };
export interface RAGEvaluation { score: number; relevance: string; explanation: string; reasoning: string; }
