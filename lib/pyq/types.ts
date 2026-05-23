import { PyqPaper, PyqQuestion } from './validators';
import { PdfPageData } from '@/lib/ingestion/types';

export interface PyqIngestionContext {
  paperId: string;
  pdfBuffer: Buffer;
  sourceFileName: string;
  metadata: Partial<PyqPaper>;
  pdfPages: PdfPageData[];
  extractedText: string;
  rawQuestions: any[];
  pyqRecords: PyqQuestion[];
}
