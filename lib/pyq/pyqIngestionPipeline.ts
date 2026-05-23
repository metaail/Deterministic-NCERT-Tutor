import { PyqIngestionContext } from './types';
import { parsePyqPdf } from './stages/01-parsePyqPdf';
import { extractQuestions } from './stages/02-extractQuestions';
import { detectVisualReferences } from './stages/03-detectVisualReferences';
import { buildPyqRecords } from './stages/04-buildPyqRecords';
import { savePyqFirestore } from './stages/05-savePyqFirestore';

export async function runPyqPipeline(initialContext: PyqIngestionContext): Promise<PyqIngestionContext> {
  try {
    let ctx = await parsePyqPdf(initialContext);
    ctx = await extractQuestions(ctx);
    ctx = await detectVisualReferences(ctx);
    ctx = await buildPyqRecords(ctx);
    ctx = await savePyqFirestore(ctx);
    return ctx;
  } catch (error) {
    console.error("PYQ Pipeline failed:", error);
    throw error;
  }
}
