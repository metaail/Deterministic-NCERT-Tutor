import { z } from 'zod';

export const PineconeMetadataSchema = z.object({
  chunkId: z.string().min(1),
  chapterKey: z.string().min(1),
  subject: z.string().min(1),
  subjectCode: z.string().min(1),
  classLevel: z.string().min(1),
  chapterNumber: z.number().int(),
  chapterTitle: z.string(),
  sectionTitle: z.string(),
  pageNumber: z.number().int(),

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

  vectorType: z.string().optional(), // concept, definition, formula, example, table, figure, exercise, summary
  prerequisiteConcepts: z.array(z.string()).default([]),
  relatedConcepts: z.array(z.string()).default([]),
  retrievalAliases: z.array(z.string()).default([]),
  headingPath: z.array(z.string()).default([]),
  previousChunkId: z.string().optional(),
  nextChunkId: z.string().optional(),

  contentType: z.string(),
  chunkType: z.string(),
  chunkRole: z.string(),
  chunkIndex: z.number().int(),

  concept: z.string(),
  concepts: z.array(z.string()),
  conceptTags: z.array(z.string()),
  keywords: z.array(z.string()).default([]),

  figureRefs: z.array(z.string()),
  tableRefs: z.array(z.string()),
  formulaRefs: z.array(z.string()),
  exerciseRefs: z.array(z.string()),
  exampleRefs: z.array(z.string()),

  hasFormula: z.boolean(),
  formulaLatexList: z.array(z.string()).default([]),

  sourceType: z.literal("NCERT"),
  status: z.enum(["published", "draft"]),
  embeddingModel: z.string(),
  embeddingStatus: z.string(),

  textPreview: z.string().max(3000), // Max allowed by pinecone text metadata typically or we cap it safely
  contentHash: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadataVersion: z.literal("v1")
}).strict(); // strictly rejects unlisted fields like imageUrl, base64

export type PineconeMetadata = z.infer<typeof PineconeMetadataSchema>;
