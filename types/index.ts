import { z } from 'zod';
import {
  ChapterDocumentSchema,
  ChapterChunkSchema,
  ChapterStructureIndexSchema,
  IngestionJobSchema,
  SubjectEnum,
  ClassLevelEnum
} from '@/lib/validators/models';

export type ChapterDocument = z.infer<typeof ChapterDocumentSchema>;
export type ChapterChunk = z.infer<typeof ChapterChunkSchema>;
export type ChapterStructureIndex = z.infer<typeof ChapterStructureIndexSchema>;
export type IngestionJob = z.infer<typeof IngestionJobSchema>;
export type Subject = z.infer<typeof SubjectEnum>;
export type ClassLevel = z.infer<typeof ClassLevelEnum>;
