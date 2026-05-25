import { z } from 'zod';

// ============================================================================
// Core Enums & Base Types
// ============================================================================
export const SubjectEnum = z.enum(['Physics', 'Chemistry', 'Biology', 'Mathematics']);
export const SubjectCodeEnum = z.enum(['042', '043', '044', '041']);
export const ClassLevelEnum = z.enum(['Class 11', 'Class 12']);

export const ChapterStatusEnum = z.enum(['uploaded', 'processing', 'indexed', 'published', 'failed']);
export const ChunkStatusEnum = z.enum(['draft', 'published']);
export const IngestionStatusEnum = z.enum(['uploaded', 'processing', 'indexed', 'failed']); // Legacy/Job status

// ============================================================================
// Chapters Collection Schema
// ============================================================================
export const ChapterDocumentSchema = z.object({
  chapterKey: z.string().min(1),
  subject: SubjectEnum,
  subjectCode: SubjectCodeEnum,
  classLevel: ClassLevelEnum,
  chapterNumber: z.number().int().positive(),
  chapterTitle: z.string().min(1),
  chapterTitleShort: z.string().min(1),
  totalPages: z.number().int().nonnegative(),
  totalChunks: z.number().int().nonnegative(),
  totalFigures: z.number().int().nonnegative(),
  totalTables: z.number().int().nonnegative(),
  totalFormulas: z.number().int().nonnegative(),
  totalExamples: z.number().int().nonnegative(),
  totalExercises: z.number().int().nonnegative(),

  detectedSubject: z.string().optional(),
  detectedClassLevel: z.string().optional(),
  detectedChapterNumber: z.number().int().optional(),
  detectedChapterTitle: z.string().optional(),
  uploadedFileName: z.string().optional(),
  subjectMismatchWarning: z.boolean().default(false),
  contentHash: z.string().optional(),

  status: ChapterStatusEnum,
  createdAt: z.string().datetime(), 
  updatedAt: z.string().datetime(),
}).strict();

// ============================================================================
// Chapter Chunk Schema (Vectors strictly in Pinecone, Metadata in Firestore)
// ============================================================================
export const ChapterChunkSchema = z.object({
  chunkId: z.string().min(1),
  chapterKey: z.string().min(1),
  subject: SubjectEnum,
  subjectCode: SubjectCodeEnum,
  classLevel: ClassLevelEnum,
  chapterTitle: z.string().min(1),
  sectionTitle: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  chunkType: z.string().min(1),
  chunkRole: z.string().min(1),
  contentType: z.string().min(1),
  pageNumber: z.number().int().positive(),
  concept: z.string().min(1),
  concepts: z.array(z.string()),
  conceptTags: z.array(z.string()),

  ncertPageNumber: z.number().int().optional(),
  bookPageNumber: z.number().int().optional(),
  sectionNumber: z.string().optional(),
  subsectionNumber: z.string().optional(),
  exampleNumber: z.string().optional(),
  problemNumber: z.string().optional(),
  exerciseNumber: z.string().optional(),
  tableNumber: z.string().optional(),
  figureNumber: z.string().optional(),

  isDefinition: z.boolean().default(false),
  isLaw: z.boolean().default(false),
  isFormula: z.boolean().default(false),
  isSolvedExample: z.boolean().default(false),
  isExercise: z.boolean().default(false),
  isSummaryPoint: z.boolean().default(false),
  isTable: z.boolean().default(false),
  isFigureCaption: z.boolean().default(false),

  vectorType: z.string().optional(),
  prerequisiteConcepts: z.array(z.string()).default([]),
  relatedConcepts: z.array(z.string()).default([]),
  retrievalAliases: z.array(z.string()).default([]),
  headingPath: z.array(z.string()).default([]),
  previousChunkId: z.string().optional(),
  nextChunkId: z.string().optional(),
  
  // Reference-Only Visual Policy Enforcement
  figureRefs: z.array(z.string()).default([]),
  tableRefs: z.array(z.string()).default([]),
  formulaRefs: z.array(z.string()).default([]),
  exerciseRefs: z.array(z.string()).default([]),
  exampleRefs: z.array(z.string()).default([]),
  
  hasFormula: z.boolean().default(false),
  formulaLatexList: z.array(z.string()).default([]),

  text: z.string().min(1),
  contentHash: z.string().optional(),
  
  // Phase 2 Defualts - Vectors are FORBIDDEN in Firestore
  embeddingId: z.string().default(''),
  embeddingModel: z.string().default('not_generated_phase_2'),
  embeddingStatus: z.string().default('pending'),
  
  status: ChunkStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

// ============================================================================
// Chapter Structure Index Schema
// ============================================================================
export const ChapterStructureIndexSchema = z.object({
  chapterKey: z.string().min(1),
  title: z.string().min(1),
  summaryPoints: z.array(z.string()).min(1), // Mandatory NCERT grounding
  sections: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

// ============================================================================
// Ingestion Job Schema
// ============================================================================
export const IngestionJobSchema = z.object({
  jobId: z.string().min(1),
  chapterKey: z.string().min(1),
  status: IngestionStatusEnum,
  progress: z.number().min(0).max(100),
  logs: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();
