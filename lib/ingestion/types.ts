import { ChapterDocument, ChapterChunk } from '@/types';

export interface PdfTextItem {
  str: string;
  fontName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  transform: number[];
}

export interface PdfPageData {
  pageNumber: number;
  width: number;
  height: number;
  items: PdfTextItem[];
}

export interface IngestionContext {
  jobId: string;
  chapterKey: string;
  metadata: Partial<ChapterDocument>;
  pdfBuffer: Buffer;
  uploadedFileName?: string;
  pdfPages: PdfPageData[];
  extractedText: string;
  normalizedText: string;
  detectedStructure: any; 
  generatedChunks: ChapterChunk[];
}
